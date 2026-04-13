#!/usr/bin/env bash

set -euo pipefail

if ! command -v git >/dev/null 2>&1; then
  echo "git is required for secret scanning." >&2
  exit 1
fi

if ! command -v grep >/dev/null 2>&1; then
  echo "grep is required for secret scanning." >&2
  exit 1
fi

mapfile -t tracked_files < <(git ls-files)

if [ "${#tracked_files[@]}" -eq 0 ]; then
  echo "No tracked files found."
  exit 0
fi

failures=0

report_tracked_env_files() {
  local tracked_env_files

  tracked_env_files="$(
    printf '%s\n' "${tracked_files[@]}" \
      | grep -E '(^|/)\.env($|(\.[^.]+)+$)' \
      | grep -Ev '\.example$' \
      || true
  )"

  if [ -n "${tracked_env_files}" ]; then
    echo "Tracked runtime env files are not allowed:" >&2
    printf '%s\n' "${tracked_env_files}" >&2
    failures=1
  fi
}

scan_pattern() {
  local label="$1"
  local pattern="$2"
  local output_file

  output_file="$(mktemp)"

  if grep -nE -H --binary-files=without-match -- "${pattern}" "${tracked_files[@]}" >"${output_file}" 2>/dev/null; then
    echo "Potential ${label} detected:" >&2
    cat "${output_file}" >&2
    failures=1
  fi

  rm -f "${output_file}"
}

report_tracked_env_files

scan_pattern 'private key material' 'BEGIN (OPENSSH|RSA|EC|DSA|PGP) PRIVATE KEY'
scan_pattern 'GitHub personal access token' 'gh[pousr]_[A-Za-z0-9_]{20,}'
scan_pattern 'GitHub fine-grained token' 'github_pat_[A-Za-z0-9_]{20,}'
scan_pattern 'AWS access key id' 'AKIA[0-9A-Z]{16}'
scan_pattern 'Google API key' 'AIza[0-9A-Za-z\-_]{20,}'
scan_pattern 'OpenAI API key' 'sk-[A-Za-z0-9]{20,}'
scan_pattern 'Slack token' 'xox[baprs]-[A-Za-z0-9-]{10,}'

if [ "${failures}" -ne 0 ]; then
  echo "Secret scan failed." >&2
  exit 1
fi

echo "Secret scan passed: no tracked runtime env files or known key patterns found."
