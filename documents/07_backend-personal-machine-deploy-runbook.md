# Backend Personal Machine Deploy Runbook

## Trạng thái

- Date: `2026-04-15`
- Status: `Accepted`
- Scope: deploy thủ công repo `backend` từ GitHub Actions vào máy cá nhân bằng self-hosted runner Linux

## Mục tiêu

- Tách thư mục làm việc hằng ngày với thư mục deploy.
- Giữ workflow deploy hiện tại của GitHub Actions.
- Loại bỏ phụ thuộc vào `cloudflared access ssh` và mọi bước SSH trung gian.

## Kiến trúc deploy hiện tại

- Workspace dev:
  - `/mnt/c/TrungDang/journey/backend`
- Runner workspace:
  - thư mục `_work` của GitHub self-hosted runner trên WSL/Linux
- Deploy path:
  - `/home/trungdang/apps/journey-backend`
- Source of truth của code:
  - GitHub repo `trungdang23/backend`
- Source of truth của runtime config:
  - GitHub `Environment secrets` và `Environment variables`
- Database local cho deploy hiện tại:
  - PostgreSQL chạy bằng `docker compose`
- Kiểu deploy:
  - manual qua workflow `deploy-backend.yml`
- Kiểu thực thi deploy:
  - self-hosted runner Linux/X64 chạy trên chính máy đích

## Những gì workflow đang làm

1. Verify repo bằng `lint`, `test`, `build`, `prisma:validate` trên GitHub-hosted runner.
2. Checkout đúng `ref` lên self-hosted runner.
3. Sync source từ workspace checkout vào `DEPLOY_PATH`.
4. Render file env tạm từ GitHub configuration.
5. Ghi file env đó vào `RUNTIME_ENV_PATH`.
6. `pnpm install`, `pnpm prisma:generate`, `pnpm build` trong `DEPLOY_PATH`.
7. Source runtime env vừa ghi.
8. Chạy `pnpm prisma:migrate:deploy`.
9. Chạy `SERVICE_RESTART_COMMAND`.

## Runtime script hiện có trong repo

- `scripts/start-production.sh`
- `scripts/stop-production.sh`
- `scripts/restart-production.sh`
- `scripts/check-production-health.sh`

Các script này:

- tự source file env tại `RUNTIME_ENV_PATH` hoặc `./.env.production`
- ghi PID và log vào `${XDG_STATE_HOME:-$HOME/.local/state}/journey-backend`
- dùng `curl` để xác minh `/api/v1/health` sau khi restart

## Giá trị cốt lõi cần nhớ

- Không deploy vào chính thư mục đang code.
- Không commit `.env.production`.
- `RUNTIME_ENV_PATH` phải là file path, không phải directory path.
- Self-hosted runner phải online trên chính máy deploy.
- Runner user phải có quyền ghi vào `DEPLOY_PATH`, `RUNTIME_ENV_PATH`, và state dir của runtime scripts.
- Merge `main` không tự deploy; bạn vẫn phải bấm `Run workflow`.
- `DATABASE_URL`, `JWT_ISSUER`, `JWT_ACCESS_TOKEN_SECRET`, và `JWT_REFRESH_TOKEN_SECRET` không còn fallback trong source; nếu GitHub Secrets/Variables thiếu hoặc sai, runtime sẽ dùng đúng giá trị GitHub đang cấp hoặc fail sớm khi boot.

## GitHub configuration hiện cần

### Environment secrets

- `RUNTIME_DATABASE_URL`
- `RUNTIME_JWT_ACCESS_TOKEN_SECRET`
- `RUNTIME_JWT_REFRESH_TOKEN_SECRET`
- `RUNTIME_SWAGGER_USERNAME`
- `RUNTIME_SWAGGER_PASSWORD`

### Environment variables

- `DEPLOY_PATH`
- `RUNTIME_ENV_PATH`
- `SERVICE_RESTART_COMMAND`
- `RUNTIME_APP_NAME`
- `RUNTIME_APP_PORT`
- `RUNTIME_GLOBAL_PREFIX`
- `RUNTIME_SWAGGER_ENABLED`
- `RUNTIME_CORS_ALLOWED_ORIGINS`
- `RUNTIME_JWT_ISSUER`
- `RUNTIME_JWT_ACCESS_TOKEN_TTL`
- `RUNTIME_JWT_REFRESH_TOKEN_TTL`
- `RUNTIME_AUTH_RATE_LIMIT_MAX_REQUESTS`
- `RUNTIME_AUTH_RATE_LIMIT_WINDOW_SECONDS`

## Giá trị path và command đã chốt cho máy hiện tại

### Variables

```text
DEPLOY_PATH=/home/trungdang/apps/journey-backend
RUNTIME_ENV_PATH=/home/trungdang/apps/journey-backend/.env.production
SERVICE_RESTART_COMMAND=bash ./scripts/restart-production.sh
```

## Thiết lập self-hosted runner

1. Vào repo `backend` trên GitHub.
2. Mở `Settings -> Actions -> Runners`.
3. Tạo một self-hosted runner Linux/X64 cho repo này hoặc ở mức org.
4. Cài runner trong WSL/Linux trên chính máy deploy.
5. Chạy runner dưới user có quyền ghi vào:
   - `/home/trungdang/apps/journey-backend`
   - `/home/trungdang/apps/journey-backend/.env.production`
   - `${XDG_STATE_HOME:-$HOME/.local/state}/journey-backend`
6. Đảm bảo runner có sẵn:
   - `git`
   - `rsync`
   - `node`
   - `pnpm`
   - Docker/PostgreSQL runtime mà backend cần

## Database local cho deploy

Workflow hiện đang dùng:

```text
RUNTIME_DATABASE_URL=postgresql://journey:journey@localhost:5432/journey_prod_local?schema=public
```

Để URL này dùng được, máy deploy phải có PostgreSQL local đang chạy ở `localhost:5432`.

Trong setup hiện tại, PostgreSQL chạy qua:

```bash
docker compose -f /mnt/c/TrungDang/journey/backend/docker-compose.yml up -d postgres
```

## Quy trình deploy lặp lại

1. Sửa code ở source dev:
   - `/mnt/c/TrungDang/journey/backend`
2. Commit và push lên `main`.
3. Chờ `backend-ci.yml` pass.
4. Chạy `pnpm status` trên máy cá nhân để xác nhận:
   - Docker đang chạy
   - backend runtime healthy
   - runner đang online
5. Bấm `Run workflow` cho `deploy-backend`.

## Lệnh kiểm tra nhanh trước deploy

Kiểm tra local stack:

```bash
pnpm status
```

Kiểm tra deploy path:

```bash
git -C /home/trungdang/apps/journey-backend status --short --branch
```

## Các lỗi có thể gặp và cách xử lý

### Runner ở trạng thái offline

Nguyên nhân thường gặp:

- runner service chưa chạy
- runner cài ở WSL instance chưa được bật
- machine đang sleep hoặc offline

Khắc phục:

- bật lại machine hoặc WSL
- start lại runner service
- xác nhận runner hiện `Idle` hoặc `Online` trong GitHub

### `rsync is required on the self-hosted runner`

Nguyên nhân:

- runner host chưa có `rsync`

Khắc phục:

- cài `rsync` trên WSL/Linux
- chạy lại workflow

### `RUNTIME_ENV_PATH points to a directory`

Nguyên nhân:

- khai báo `RUNTIME_ENV_PATH` sai thành thư mục

Khắc phục:

- sửa về file path thật, ví dụ `/home/trungdang/apps/journey-backend/.env.production`

### `pnpm prisma:migrate:deploy` fail

Nguyên nhân:

- `RUNTIME_DATABASE_URL` sai
- PostgreSQL local chưa chạy
- migration chưa hợp lệ với DB hiện tại

Khắc phục:

- kiểm tra `docker compose ps`
- kiểm tra `RUNTIME_DATABASE_URL`
- chạy lại sau khi DB local khỏe

### `node was not found in PATH`

Nguyên nhân:

- runner user chưa có Node runtime hoặc `nvm` chưa được load

Khắc phục:

- cài Node cho runner
- hoặc đảm bảo `nvm` của user deploy còn dùng được

## Kết luận vận hành

- Deploy không còn phụ thuộc vào Cloudflare SSH.
- Độ ổn định của deploy giờ nằm ở self-hosted runner, runtime stack local, và quyền file đúng trên máy đích.
- Cloudflare Tunnel vẫn hữu ích cho public ingress của API, nhưng không còn là đường bắt buộc của workflow deploy backend.
