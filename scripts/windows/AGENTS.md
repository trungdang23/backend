# AGENTS.md

## Scope

- This file applies to Windows-only operational scripts under `backend/scripts/windows/`.
- It extends the repository root `AGENTS.md` and `backend/AGENTS.md`.

## Script Goals

- Keep local personal-machine startup, shutdown, and status checks easy to run after reboot.
- Coordinate Windows services and processes cleanly with the backend runtime running in WSL.
- Preserve the current Cloudflare-backed ingress path for both public API traffic and deploy SSH access.

## Windows Script Rules

- Treat Windows and WSL as separate execution environments; validate assumptions explicitly instead of assuming shared PATH, processes, or service state.
- Preserve the current canonical paths unless the task explicitly migrates them:
  - repo root on Windows: `C:\TrungDang\journey\backend`
  - WSL distro: `Ubuntu-20.04`
  - deploy path in WSL: `/home/trungdang/apps/journey-backend`
  - Cloudflare config: `C:\Users\dangv\.cloudflared\config.yml`
- Keep the stable deploy SSH route intact: `ssh.buicojourney.com -> ssh://localhost:22`.
- Keep scripts idempotent when practical so rerunning `pnpm up` or `pnpm status` is safe.
- Prefer explicit health and status checks over silent assumptions.
- Avoid stopping unrelated processes or changing unrelated Windows services when working on these scripts.
- When changing one of `start-personal-server.ps1`, `stop-personal-server.ps1`, `run-personal-server.ps1`, or `status-personal-server.ps1`, review the others for contract drift.

## Verification

- After changing scripts in this folder, run the smallest relevant command, usually `pnpm status` for read-only/status changes or `pnpm up` then `pnpm status` for startup-flow changes.
- Summarize any operator action required on Windows, WSL, Docker Desktop, OpenSSH, or Cloudflare.
