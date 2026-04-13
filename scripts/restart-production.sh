#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

bash "${script_dir}/stop-production.sh"
bash "${script_dir}/start-production.sh"
bash "${script_dir}/check-production-health.sh"
