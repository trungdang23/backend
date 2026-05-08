#!/usr/bin/env bash

set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/common-production.sh"

load_runtime_env

expected_release_sha="${1:-}"
url="$(health_url)"

if [ -z "${expected_release_sha}" ]; then
  echo "Usage: bash ./scripts/verify-production-release.sh <expected-release-sha>" >&2
  exit 1
fi

health_json="$(curl --fail --silent --show-error "${url}")"

HEALTH_JSON="${health_json}" EXPECTED_RELEASE_SHA="${expected_release_sha}" node <<'EOF'
const payload = JSON.parse(process.env.HEALTH_JSON ?? '{}');
const expectedReleaseSha = process.env.EXPECTED_RELEASE_SHA ?? '';
const actualReleaseSha = payload?.data?.releaseSha ?? null;

if (payload?.success !== true) {
  console.error('Health endpoint did not return a success envelope.');
  process.exit(1);
}

if (actualReleaseSha !== expectedReleaseSha) {
  console.error(
    `Release SHA mismatch. Expected ${expectedReleaseSha}, got ${String(actualReleaseSha)}.`,
  );
  process.exit(1);
}

console.log(
  `journey-backend release verification passed at ${payload?.data?.timestamp ?? 'unknown time'} for ${actualReleaseSha}.`,
);
EOF
