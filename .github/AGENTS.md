# AGENTS.md

## Scope

- This file applies to GitHub workflow and automation files under `backend/.github/`.
- It extends the repository root `AGENTS.md` and `backend/AGENTS.md`.

## Workflow Goals

- Keep CI predictable for backend contributors.
- Keep deploy automation aligned with the current personal-machine production path.
- Prevent regressions that silently break secrets handling, runtime env rendering, or remote connectivity.

## Workflow Rules

- Keep `backend-ci.yml` focused on deterministic verification for the backend package: install, secret scan, Prisma generation, lint, test, build, and Prisma validation.
- Keep `deploy-backend.yml` manual by default unless the task explicitly changes release strategy.
- Preserve the current deploy transport: `Cloudflare Tunnel` plus `cloudflared access ssh` to the stable hostname in `SSH_HOST`.
- Do not reintroduce temporary reverse-tunnel workflows such as Pinggy unless the task explicitly calls for a rollback or comparison.
- Keep runtime config sourced from GitHub `Secrets` and `Variables`, rendered into a temporary env file on the runner, and copied to `RUNTIME_ENV_PATH` on the target machine.
- Never hardcode real secret values, host keys, private keys, or environment-specific credentials in workflow files.
- When changing deploy expectations, update the backend README and the relevant runbooks in `documents/`.

## Verification

- After changing workflow files, run the smallest practical validation available locally, such as `git diff --check` and targeted formatting checks.
- If you change deploy behavior, summarize which GitHub secrets, variables, or Cloudflare settings must be updated by operators.
