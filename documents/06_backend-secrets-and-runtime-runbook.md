# Backend Secrets And Runtime Runbook

## Trạng thái

- Date: `2026-04-21`
- Status: `Accepted`
- Scope: quản lý secret và runtime config cho repo `backend`

## Mục tiêu

- Không commit secret thật vào repo backend.
- Tách rõ runtime secret của ứng dụng với deploy variable của self-hosted runner.
- Chuẩn hóa cách cấu hình trên GitHub để deploy không còn phụ thuộc vào SSH trung gian.

## Mô hình bảo mật hiện tại

- GitHub giữ runtime secrets/variables để workflow render file env production khi deploy.
- Job deploy chạy trên self-hosted runner Linux của chính máy đích, nên workflow không còn cần Cloudflare Access token hay SSH key để chui qua mạng.
- Repo chỉ chứa `.env.*.example`, workflow, script, và tài liệu; không chứa env thật.

## Nhóm bí mật và cấu hình

### GitHub Secrets cho repo backend

- `RUNTIME_DATABASE_URL`
- `RUNTIME_JWT_ACCESS_TOKEN_SECRET`
- `RUNTIME_JWT_REFRESH_TOKEN_SECRET`
- `RUNTIME_JOURNAL_ASSET_SIGNING_SECRET`
- `RUNTIME_SWAGGER_USERNAME`
- `RUNTIME_SWAGGER_PASSWORD`

### GitHub Variables cho repo backend

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
- `RUNTIME_JOURNAL_ASSET_SIGNED_URL_TTL_SECONDS`

### Runtime env workflow sẽ render ra máy đích

- `NODE_ENV`
- `APP_NAME`
- `APP_PORT`
- `GLOBAL_PREFIX`
- `SWAGGER_ENABLED`
- `DATABASE_URL`
- `JWT_ISSUER`
- `JWT_ACCESS_TOKEN_TTL`
- `JWT_REFRESH_TOKEN_TTL`
- `JWT_ACCESS_TOKEN_SECRET`
- `JWT_REFRESH_TOKEN_SECRET`
- `JOURNAL_ASSET_SIGNING_SECRET`
- `JOURNAL_ASSET_SIGNED_URL_TTL_SECONDS`

## Những gì đang được bảo vệ ở mức workflow

- CI của repo backend chạy secret scan bằng `scripts/check-secrets.sh`.
- Secret scan sẽ fail nếu có:
  - file env runtime bị track trong git
  - private key material
  - GitHub token
  - AWS access key id
  - Google API key
  - OpenAI API key
  - Slack token
- Workflow deploy render `.env.production` từ GitHub configuration, ghi file đó trực tiếp vào `RUNTIME_ENV_PATH`, rồi mới source file env đó trước khi chạy `prisma:migrate:deploy`.
- Khi `DATABASE_URL` trong env vừa render trỏ về `localhost` nhưng port chưa mở, workflow sẽ gọi `scripts/ensure-runtime-database.sh` để thử bật `docker compose up -d postgres` trước khi chạy migration.
- Backend runtime hiện lưu refresh-token revoke state tại `${XDG_STATE_HOME:-$HOME/.local/state}/${APP_NAME}/auth/revoked-refresh-tokens.json`; state này phải survive restart để `logout` và `refresh` không cho reuse token cũ sau deploy/restart.
- Quyền truy cập vào máy deploy được chuyển từ mạng/SSH sang quyền của self-hosted runner service. Runner user vì vậy phải được coi như tài khoản production operator.

## Thiết lập trên GitHub

1. Vào repo `backend` trên GitHub.
2. Mở `Settings` -> `Secrets and variables` -> `Actions`.
3. Thêm các secrets:
   - `RUNTIME_DATABASE_URL`
   - `RUNTIME_JWT_ACCESS_TOKEN_SECRET`
   - `RUNTIME_JWT_REFRESH_TOKEN_SECRET`
   - `RUNTIME_JOURNAL_ASSET_SIGNING_SECRET`
   - `RUNTIME_SWAGGER_USERNAME`
   - `RUNTIME_SWAGGER_PASSWORD`
4. Thêm các variables:
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
   - `RUNTIME_JOURNAL_ASSET_SIGNED_URL_TTL_SECONDS`

## Giá trị nên dùng cho máy cá nhân hiện tại

### Variables

- `DEPLOY_PATH=/home/trungdang/apps/journey-backend`
- `RUNTIME_ENV_PATH=/home/trungdang/apps/journey-backend/.env.production`

## Mẫu mapping GitHub configuration

### Secrets

- `RUNTIME_DATABASE_URL=postgresql://journey:strong-password@localhost:5432/journey_prod_local?schema=public`
- `RUNTIME_JWT_ACCESS_TOKEN_SECRET=64-plus-random-characters`
- `RUNTIME_JWT_REFRESH_TOKEN_SECRET=another-64-plus-random-characters`
- `RUNTIME_JOURNAL_ASSET_SIGNING_SECRET=another-64-plus-random-characters-for-journal-assets`
- `RUNTIME_SWAGGER_USERNAME=<set-in-github-secret>`
- `RUNTIME_SWAGGER_PASSWORD=<set-in-github-secret>`

### Variables

- `RUNTIME_APP_NAME=journey-backend`
- `RUNTIME_APP_PORT=3001`
- `RUNTIME_GLOBAL_PREFIX=api/v1`
- `RUNTIME_SWAGGER_ENABLED=true`
- `RUNTIME_CORS_ALLOWED_ORIGINS=https://buicojourney.com,https://www.buicojourney.com`
- `RUNTIME_JWT_ISSUER=api.buicojourney.com`
- `RUNTIME_JWT_ACCESS_TOKEN_TTL=15m`
- `RUNTIME_JWT_REFRESH_TOKEN_TTL=7d`
- `RUNTIME_AUTH_RATE_LIMIT_MAX_REQUESTS=10`
- `RUNTIME_AUTH_RATE_LIMIT_WINDOW_SECONDS=60`
- `RUNTIME_JOURNAL_ASSET_SIGNED_URL_TTL_SECONDS=900`

## Thiết lập trên máy đích

1. Đảm bảo self-hosted runner Linux/X64 của GitHub đang online trên chính máy deploy.
2. Runner nên chạy dưới user có quyền ghi vào:
   - `DEPLOY_PATH`
   - thư mục cha của `RUNTIME_ENV_PATH`
   - state/log path mà `scripts/restart-production.sh` dùng
   - file auth revoke state dưới `${XDG_STATE_HOME:-$HOME/.local/state}/${APP_NAME}/auth/`
3. Đảm bảo máy đích đã có `git`, `rsync`, `node`, `pnpm`, Docker/PostgreSQL runtime, và mọi phụ thuộc hệ thống cần cho build.
4. Không cần tự tạo sẵn file env thật trên máy đích; workflow sẽ ghi file đó vào `RUNTIME_ENV_PATH`.
5. Đảm bảo service restart command của bạn thực sự dùng file env đó.
6. Nếu `RUNTIME_DATABASE_URL` đang dùng `localhost`, đảm bảo runner user chạy được `docker compose` trong repo deploy path để workflow có thể tự kéo PostgreSQL local lên lại khi cần.

## Quy trình deploy an toàn

1. Merge code vào `main` của repo backend.
2. GitHub Actions sẽ tự chạy `deploy-backend.yml`, trong đó đã có bước verify riêng trước khi deploy.
3. Kiểm tra local stack bằng `pnpm status`.
4. Xác nhận self-hosted runner đang online.
5. Nếu cần redeploy lại một ref cũ hoặc chạy lại sau khi runner lỗi, vào GitHub Actions của repo backend và dùng `Run workflow`.
6. Workflow sync source từ workspace checkout vào `DEPLOY_PATH`.
7. Workflow render `.env.production` từ GitHub Secrets/Variables và ghi file đó vào `RUNTIME_ENV_PATH`.
8. Workflow chạy `scripts/ensure-runtime-database.sh`; nếu runtime DB đang là `localhost` nhưng chưa reachable, workflow sẽ thử bật `postgres` bằng Docker Compose.
9. Workflow source env từ `RUNTIME_ENV_PATH` rồi mới chạy migration và restart service.

## Kiểm tra sau deploy

- Kiểm tra `/api/v1/health`
- Kiểm tra `pnpm status`
- Kiểm tra log ứng dụng
- Kiểm tra `logout` và `refresh` không cho reuse refresh token cũ nếu vừa chạy smoke auth
- Kiểm tra migration đã apply
- Kiểm tra không có file env thật nào bị track bởi git

## Kết luận vận hành

- Merge `main` hiện tại không làm lộ secret production nếu bạn chỉ commit source hiện có.
- GitHub giữ cả deploy secrets lẫn runtime secrets/variables của app.
- Deploy không còn phụ thuộc vào `cloudflared access ssh`; độ ổn định giờ nằm ở self-hosted runner, runtime stack local, và quyền file trên máy đích.
