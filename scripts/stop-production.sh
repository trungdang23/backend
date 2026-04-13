#!/usr/bin/env bash

set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/common-production.sh"

pid="$(running_pid || true)"

if [ -z "${pid}" ]; then
  echo "journey-backend is not running."
  exit 0
fi

if ! kill -0 "${pid}" >/dev/null 2>&1; then
  rm -f "${PID_FILE}"
  echo "Removed stale PID file for journey-backend."
  exit 0
fi

kill "${pid}"

for _ in $(seq 1 20); do
  if ! kill -0 "${pid}" >/dev/null 2>&1; then
    rm -f "${PID_FILE}"
    echo "journey-backend stopped."
    exit 0
  fi

  sleep 1
done

kill -9 "${pid}" >/dev/null 2>&1 || true
rm -f "${PID_FILE}"
echo "journey-backend was force stopped."
