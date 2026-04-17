#!/usr/bin/env bash

set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly REPO_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
readonly FRONTEND_DEPLOY_DIR="${FRONTEND_DEPLOY_DIR:-/home/trungdang/apps/journey-frontend}"
readonly FRONTEND_PUBLIC_HEALTH_URL="${FRONTEND_PUBLIC_HEALTH_URL:-https://buicojourney.com/health}"

print_section() {
  printf '\n======== %s ========\n' "$1"
}

print_section 'Backend'
(cd "${REPO_DIR}" && pnpm run status)

print_section 'Frontend (Local Runtime)'
if [ -d "${FRONTEND_DEPLOY_DIR}" ]; then
  (
    cd "${FRONTEND_DEPLOY_DIR}" &&
      bash ./scripts/check-production-health.sh
  ) || printf 'Frontend local runtime is not healthy.\n'
else
  printf 'Frontend deploy directory was not found at %s\n' "${FRONTEND_DEPLOY_DIR}"
fi

print_section 'Frontend (Public Health)'
if curl --fail --silent --show-error --head "${FRONTEND_PUBLIC_HEALTH_URL}" >/dev/null; then
  printf 'Frontend public health passed at %s\n' "${FRONTEND_PUBLIC_HEALTH_URL}"
else
  printf 'Frontend public health failed at %s\n' "${FRONTEND_PUBLIC_HEALTH_URL}"
fi
