#!/usr/bin/env bash

set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly REPO_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
readonly FRONTEND_DEPLOY_DIR="${FRONTEND_DEPLOY_DIR:-/home/trungdang/apps/journey-frontend}"

print_section() {
  printf '\n======== %s ========\n' "$1"
}

print_section 'Frontend'
if [ -d "${FRONTEND_DEPLOY_DIR}" ]; then
  (cd "${FRONTEND_DEPLOY_DIR}" && bash ./scripts/stop-production.sh)
else
  printf 'Frontend deploy directory was not found at %s. Skipping frontend shutdown.\n' "${FRONTEND_DEPLOY_DIR}"
fi

print_section 'Backend'
(cd "${REPO_DIR}" && pnpm run down)

print_section 'Done'
printf 'Frontend runtime and backend stack have been stopped.\n'
