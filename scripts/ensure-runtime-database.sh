#!/usr/bin/env bash

set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/common-production.sh"

load_runtime_env

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required to prepare the runtime database." >&2
  exit 1
fi

parse_database_url() {
  node - "${DATABASE_URL}" <<'NODE'
const input = process.argv[2];

try {
  const url = new URL(input);
  const port = url.port || '5432';
  process.stdout.write(`${url.hostname}\n${port}\n`);
} catch (error) {
  console.error(`DATABASE_URL is not a valid URL: ${error.message}`);
  process.exit(1);
}
NODE
}

can_connect_tcp() {
  node - "$1" "$2" <<'NODE'
const net = require('net');

const host = process.argv[2];
const port = Number(process.argv[3]);

if (!host || Number.isNaN(port)) {
  process.exit(1);
}

const socket = net.createConnection({ host, port });
let settled = false;

const finish = (code) => {
  if (settled) {
    return;
  }

  settled = true;
  socket.destroy();
  process.exit(code);
};

socket.setTimeout(1500);
socket.once('connect', () => finish(0));
socket.once('timeout', () => finish(1));
socket.once('error', () => finish(1));
NODE
}

local_database_target() {
  case "${DATABASE_HOST}" in
    localhost | 127.0.0.1 | ::1)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

postgres_container_status() {
  docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' \
    journey-backend-postgres 2>/dev/null || true
}

readarray -t database_endpoint < <(parse_database_url)
readonly DATABASE_HOST="${database_endpoint[0]}"
readonly DATABASE_PORT="${database_endpoint[1]}"

if ! local_database_target; then
  echo "Runtime database host ${DATABASE_HOST} is not local; skipping local PostgreSQL bootstrap."
  exit 0
fi

if can_connect_tcp "${DATABASE_HOST}" "${DATABASE_PORT}"; then
  echo "Runtime database is already reachable at ${DATABASE_HOST}:${DATABASE_PORT}."
  exit 0
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "DATABASE_URL points to ${DATABASE_HOST}:${DATABASE_PORT}, but it is unreachable and docker is not available on PATH." >&2
  echo "Start PostgreSQL before deploy or point RUNTIME_DATABASE_URL at a reachable database." >&2
  exit 1
fi

if [ ! -f "${APP_DIR}/docker-compose.yml" ]; then
  echo "DATABASE_URL points to ${DATABASE_HOST}:${DATABASE_PORT}, but ${APP_DIR}/docker-compose.yml was not found." >&2
  echo "Start PostgreSQL before deploy or point RUNTIME_DATABASE_URL at a reachable database." >&2
  exit 1
fi

echo "Runtime database is unreachable at ${DATABASE_HOST}:${DATABASE_PORT}; attempting docker compose up -d postgres."
(cd "${APP_DIR}" && docker compose up -d postgres)

for _ in $(seq 1 30); do
  container_status="$(postgres_container_status)"

  if can_connect_tcp "${DATABASE_HOST}" "${DATABASE_PORT}" && {
    [ -z "${container_status}" ] || [ "${container_status}" = "healthy" ] || [ "${container_status}" = "running" ];
  }; then
    echo "Runtime database is reachable at ${DATABASE_HOST}:${DATABASE_PORT}."
    exit 0
  fi

  sleep 2
done

container_status="$(postgres_container_status)"
echo "DATABASE_URL points to ${DATABASE_HOST}:${DATABASE_PORT}, but it is still unreachable after starting local PostgreSQL." >&2
echo "Last local postgres container status: ${container_status:-unknown}." >&2
echo "Check docker compose status/logs or update RUNTIME_DATABASE_URL." >&2
exit 1
