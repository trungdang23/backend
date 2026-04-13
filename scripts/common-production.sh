#!/usr/bin/env bash

set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly APP_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
readonly STATE_DIR="${XDG_STATE_HOME:-$HOME/.local/state}/journey-backend"
readonly PID_FILE="${STATE_DIR}/journey-backend.pid"
readonly LOG_FILE="${STATE_DIR}/journey-backend.log"
readonly RUNTIME_ENV_FILE="${RUNTIME_ENV_PATH:-${APP_DIR}/.env.production}"

load_runtime_env() {
  if [ -f "${RUNTIME_ENV_FILE}" ]; then
    set -a
    . "${RUNTIME_ENV_FILE}"
    set +a
  fi
}

ensure_state_dir() {
  mkdir -p "${STATE_DIR}"
}

health_url() {
  local prefix

  prefix="${GLOBAL_PREFIX:-api/v1}"
  prefix="${prefix#/}"

  printf 'http://127.0.0.1:%s/%s/health' "${APP_PORT:-3001}" "${prefix}"
}

running_pid() {
  if [ -f "${PID_FILE}" ]; then
    cat "${PID_FILE}"
  fi
}

ensure_node_runtime() {
  if command -v node >/dev/null 2>&1; then
    return
  fi

  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"

  if [ -s "${NVM_DIR}/nvm.sh" ]; then
    . "${NVM_DIR}/nvm.sh"
    nvm use 20.20.2 >/dev/null 2>&1 || nvm use default >/dev/null 2>&1 || true
  fi

  if ! command -v node >/dev/null 2>&1; then
    echo "node was not found in PATH. Ensure nvm or Node.js runtime is available on the deploy machine." >&2
    exit 1
  fi
}
