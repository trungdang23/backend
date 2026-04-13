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
- VPS giữ runtime env để backend chạy production.
- Repo chỉ chứa `.env.*.example`, workflow, và tài liệu; không chứa env thật.

## Nhóm bí mật và cấu hình

### GitHub Secrets cho repo backend

- `SSH_HOST`
- `SSH_PORT`
- `SSH_USER`
- `SSH_PRIVATE_KEY`
- `SSH_KNOWN_HOSTS`

### GitHub Variables cho repo backend

- `DEPLOY_PATH`
- `RUNTIME_ENV_PATH`
- `SERVICE_RESTART_COMMAND`

### Runtime env hiện đang cần trên VPS

- `NODE_ENV`
- `APP_NAME`
- `APP_PORT`
- `GLOBAL_PREFIX`
- `SWAGGER_ENABLED`
- `DATABASE_URL`
- `JWT_ISSUER`
- `JWT_ACCESS_TOKEN_TTL`
- `JWT_REFRESH_TOKEN_TTL`

### Runtime secret sẽ cần thêm khi hoàn thiện auth signing

- `JWT_ACCESS_TOKEN_SECRET`
- `JWT_REFRESH_TOKEN_SECRET`

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
- Workflow deploy kiểm tra `RUNTIME_ENV_PATH` và source file env trên VPS trước khi chạy `prisma:migrate:deploy`.

## Thiết lập trên GitHub

1. Vào repo `backend` trên GitHub.
2. Mở `Settings` -> `Secrets and variables` -> `Actions`.
3. Thêm các secrets:
   - `SSH_HOST`
   - `SSH_PORT`
   - `SSH_USER`
   - `SSH_PRIVATE_KEY`
   - `SSH_KNOWN_HOSTS`
4. Thêm các variables:
   - `DEPLOY_PATH`
   - `RUNTIME_ENV_PATH`
   - `SERVICE_RESTART_COMMAND`

## Thiết lập trên VPS

1. Tạo thư mục deploy, ví dụ `/var/www/journey-backend`.
2. Đặt file runtime env thật tại path sẽ map vào `RUNTIME_ENV_PATH`, ví dụ `/var/www/journey-backend/.env.production`.
3. Phân quyền chặt cho file env:
   - owner là user deploy
   - mode đề xuất: `chmod 600 .env.production`
4. Không commit file env này lên git.
5. Đảm bảo service restart command của bạn thực sự dùng file env đó.

## Mẫu cấu hình biến trên VPS

```env
NODE_ENV=production
APP_NAME=journey-backend
APP_PORT=3001
GLOBAL_PREFIX=api/v1
SWAGGER_ENABLED=true
DATABASE_URL=postgresql://journey:strong-password@db:5432/journey?schema=public
JWT_ISSUER=api.tenmiencuaban.com
JWT_ACCESS_TOKEN_TTL=15m
JWT_REFRESH_TOKEN_TTL=7d
```

## Quy trình deploy an toàn

1. Merge code vào `main` của repo backend.
2. Chờ `backend-ci.yml` pass.
3. Vào GitHub Actions của repo backend.
4. Chạy `deploy-backend.yml` bằng `Run workflow`.
5. Workflow dùng SSH key từ GitHub để vào VPS.
6. Workflow source env từ `RUNTIME_ENV_PATH` trên VPS rồi mới chạy migration và restart service.

## Kiểm tra sau deploy

- Kiểm tra `/api/v1/health`
- Kiểm tra log ứng dụng
- Kiểm tra migration đã apply
- Kiểm tra không có file env thật nào bị track bởi git

## Kết luận vận hành

- Merge `main` hiện tại không làm lộ secret production nếu bạn chỉ commit source hiện có.
- GitHub không giữ runtime secret của app; runtime secret vẫn nằm trên VPS.
- GitHub chỉ giữ deploy secret để vào VPS.
