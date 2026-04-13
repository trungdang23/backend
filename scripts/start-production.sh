#!/usr/bin/env bash

set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/common-production.sh"

load_runtime_env
ensure_state_dir

if [ ! -f "${APP_DIR}/dist/main.js" ]; then
  echo "dist/main.js was not found. Run pnpm build before starting production runtime." >&2
  exit 1
fi

existing_pid="$(running_pid || true)"

if [ -n "${existing_pid}" ] && kill -0 "${existing_pid}" >/dev/null 2>&1; then
  echo "journey-backend is already running with PID ${existing_pid}." >&2
  exit 1
fi

cd "${APP_DIR}"
nohup node dist/main.js >>"${LOG_FILE}" 2>&1 &
pid="$!"
echo "${pid}" >"${PID_FILE}"

sleep 2

if ! kill -0 "${pid}" >/dev/null 2>&1; then
  echo "journey-backend exited during startup. Check ${LOG_FILE}." >&2
  tail -n 50 "${LOG_FILE}" >&2 || true
  exit 1
fi

echo "journey-backend started with PID ${pid}."
