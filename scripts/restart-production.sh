#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

"${script_dir}/stop-production.sh"
"${script_dir}/start-production.sh"
"${script_dir}/check-production-health.sh"
