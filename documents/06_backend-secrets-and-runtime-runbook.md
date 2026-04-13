# Backend Secrets And Runtime Runbook

## Trạng thái

- Date: `2026-04-13`
- Status: `Accepted`
- Scope: quản lý secret và runtime config cho repo `backend`

## Mục tiêu

- Không commit secret thật vào repo backend.
- Tách rõ secret phục vụ deploy với secret phục vụ runtime của ứng dụng.
- Chuẩn hóa cách cấu hình trên GitHub và trên VPS để merge `main` không vô tình làm lộ khóa.

## Mô hình bảo mật hiện tại

- GitHub giữ secret để workflow deploy truy cập được VPS.
- GitHub cũng giữ runtime secrets/variables để workflow render file env production khi deploy.
- Repo chỉ chứa `.env.*.example`, workflow, và tài liệu; không chứa env thật.

## Nhóm bí mật và cấu hình

### GitHub Secrets cho repo backend

- `SSH_HOST`
- `SSH_PORT`
- `SSH_USER`
- `SSH_PRIVATE_KEY`
- `SSH_KNOWN_HOSTS`
- `RUNTIME_DATABASE_URL`
- `RUNTIME_JWT_ACCESS_TOKEN_SECRET`
- `RUNTIME_JWT_REFRESH_TOKEN_SECRET`

### GitHub Variables cho repo backend

- `DEPLOY_PATH`
- `RUNTIME_ENV_PATH`
- `SERVICE_RESTART_COMMAND`
- `RUNTIME_APP_NAME`
- `RUNTIME_APP_PORT`
- `RUNTIME_GLOBAL_PREFIX`
- `RUNTIME_SWAGGER_ENABLED`
- `RUNTIME_JWT_ISSUER`
- `RUNTIME_JWT_ACCESS_TOKEN_TTL`
- `RUNTIME_JWT_REFRESH_TOKEN_TTL`

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
- Workflow deploy chỉ đọc SSH key từ GitHub Secrets.
- Workflow deploy render `.env.production` từ GitHub configuration, copy lên máy đích, rồi mới source file env đó trước khi chạy `prisma:migrate:deploy`.

## Thiết lập trên GitHub

1. Vào repo `backend` trên GitHub.
2. Mở `Settings` -> `Secrets and variables` -> `Actions`.
3. Thêm các secrets:
   - `SSH_HOST`
   - `SSH_PORT`
   - `SSH_USER`
   - `SSH_PRIVATE_KEY`
   - `SSH_KNOWN_HOSTS`
   - `RUNTIME_DATABASE_URL`
   - `RUNTIME_JWT_ACCESS_TOKEN_SECRET`
   - `RUNTIME_JWT_REFRESH_TOKEN_SECRET`
4. Thêm các variables:
   - `DEPLOY_PATH`
   - `RUNTIME_ENV_PATH`
   - `SERVICE_RESTART_COMMAND`
   - `RUNTIME_APP_NAME`
   - `RUNTIME_APP_PORT`
   - `RUNTIME_GLOBAL_PREFIX`
   - `RUNTIME_SWAGGER_ENABLED`
   - `RUNTIME_JWT_ISSUER`
   - `RUNTIME_JWT_ACCESS_TOKEN_TTL`
   - `RUNTIME_JWT_REFRESH_TOKEN_TTL`

## Thiết lập trên VPS

1. Tạo thư mục deploy, ví dụ `/var/www/journey-backend`.
2. Không cần tự tạo sẵn file env thật trên máy đích; workflow sẽ ghi file đó vào `RUNTIME_ENV_PATH`.
3. Đảm bảo user deploy có quyền ghi vào thư mục chứa `RUNTIME_ENV_PATH`.
4. Đảm bảo service restart command của bạn thực sự dùng file env đó.

## Mẫu mapping GitHub configuration

### Secrets

- `RUNTIME_DATABASE_URL=postgresql://journey:strong-password@db:5432/journey?schema=public`
- `RUNTIME_JWT_ACCESS_TOKEN_SECRET=64-plus-random-characters`
- `RUNTIME_JWT_REFRESH_TOKEN_SECRET=another-64-plus-random-characters`

### Variables

- `RUNTIME_APP_NAME=journey-backend`
- `RUNTIME_APP_PORT=3001`
- `RUNTIME_GLOBAL_PREFIX=api/v1`
- `RUNTIME_SWAGGER_ENABLED=true`
- `RUNTIME_JWT_ISSUER=api.tenmiencuaban.com`
- `RUNTIME_JWT_ACCESS_TOKEN_TTL=15m`
- `RUNTIME_JWT_REFRESH_TOKEN_TTL=7d`

## Quy trình deploy an toàn

1. Merge code vào `main` của repo backend.
2. Chờ `backend-ci.yml` pass.
3. Vào GitHub Actions của repo backend.
4. Chạy `deploy-backend.yml` bằng `Run workflow`.
5. Workflow dùng SSH key từ GitHub để vào VPS.
6. Workflow render `.env.production` từ GitHub Secrets/Variables và copy file đó vào `RUNTIME_ENV_PATH`.
7. Workflow source env từ `RUNTIME_ENV_PATH` rồi mới chạy migration và restart service.

## Kiểm tra sau deploy

- Kiểm tra `/api/v1/health`
- Kiểm tra log ứng dụng
- Kiểm tra migration đã apply
- Kiểm tra không có file env thật nào bị track bởi git

## Kết luận vận hành

- Merge `main` hiện tại không làm lộ secret production nếu bạn chỉ commit source hiện có.
- GitHub giữ cả deploy secrets lẫn runtime secrets/variables của app.
- Repo backend chỉ giữ file example; giá trị thật đi qua GitHub Actions vào máy đích lúc deploy.
