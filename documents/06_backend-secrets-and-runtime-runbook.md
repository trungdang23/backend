# Backend Secrets And Runtime Runbook

## Trạng thái

- Date: `2026-04-14`
- Status: `Accepted`
- Scope: quản lý secret và runtime config cho repo `backend`

## Mục tiêu

- Không commit secret thật vào repo backend.
- Tách rõ secret phục vụ Cloudflare Access, secret phục vụ SSH host, và secret phục vụ runtime của ứng dụng.
- Chuẩn hóa cách cấu hình trên GitHub để deploy không phụ thuộc vào SSH tunnel tạm.

## Mô hình bảo mật hiện tại

- GitHub giữ secret để workflow deploy đi qua `Cloudflare Access` và SSH vào máy đích.
- GitHub cũng giữ runtime secrets/variables để workflow render file env production khi deploy.
- Repo chỉ chứa `.env.*.example`, workflow, script, và tài liệu; không chứa env thật.

## Nhóm bí mật và cấu hình

### GitHub Secrets cho repo backend

- `CLOUDFLARE_ACCESS_CLIENT_ID`
- `CLOUDFLARE_ACCESS_CLIENT_SECRET`
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
- Workflow deploy dùng service token Cloudflare chỉ để vào Access app bảo vệ SSH hostname.
- Workflow deploy vẫn dùng SSH private key để xác thực với `sshd` trên máy đích.
- Workflow deploy render `.env.production` từ GitHub configuration, copy lên máy đích, rồi mới source file env đó trước khi chạy `prisma:migrate:deploy`.

## Thiết lập trên GitHub

1. Vào repo `backend` trên GitHub.
2. Mở `Settings` -> `Secrets and variables` -> `Actions`.
3. Thêm các secrets:
   - `CLOUDFLARE_ACCESS_CLIENT_ID`
   - `CLOUDFLARE_ACCESS_CLIENT_SECRET`
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

## Giá trị nên dùng cho máy cá nhân hiện tại

### Secrets

- `SSH_HOST=ssh.buicojourney.com`
- `SSH_PORT=22`
- `SSH_USER=trungdang`

`SSH_KNOWN_HOSTS` nên chứa host key thật của Windows OpenSSH server theo format:

```text
ssh.buicojourney.com ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA...
```

Có thể lấy public host key bằng PowerShell trên máy Windows:

```powershell
Get-Content 'C:\ProgramData\ssh\ssh_host_ed25519_key.pub'
```

Sau đó ghép thêm hostname ở đầu dòng trước khi paste vào GitHub secret `SSH_KNOWN_HOSTS`.

### Variables

- `DEPLOY_PATH=/home/trungdang/apps/journey-backend`
- `RUNTIME_ENV_PATH=/home/trungdang/apps/journey-backend/.env.production`

## Mẫu mapping GitHub configuration

### Secrets

- `RUNTIME_DATABASE_URL=postgresql://journey:strong-password@localhost:5432/journey_prod_local?schema=public`
- `RUNTIME_JWT_ACCESS_TOKEN_SECRET=64-plus-random-characters`
- `RUNTIME_JWT_REFRESH_TOKEN_SECRET=another-64-plus-random-characters`
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

## Thiết lập trên máy đích

1. Đảm bảo Windows OpenSSH Server đang chạy và `StartType` là `Automatic`.
2. Đảm bảo `cloudflared` đang chạy với published route:
   - `ssh.buicojourney.com -> ssh://localhost:22`
   - `api.buicojourney.com -> http://localhost:3001`
3. Đảm bảo Access app của `ssh.buicojourney.com` có policy `Service Auth` cho service token dùng bởi GitHub Actions.
4. Không cần tự tạo sẵn file env thật trên máy đích; workflow sẽ ghi file đó vào `RUNTIME_ENV_PATH`.
5. Đảm bảo user deploy có quyền ghi vào thư mục chứa `RUNTIME_ENV_PATH`.
6. Đảm bảo service restart command của bạn thực sự dùng file env đó.

## Quy trình deploy an toàn

1. Merge code vào `main` của repo backend.
2. Chờ `backend-ci.yml` pass.
3. Kiểm tra local stack bằng `pnpm status`.
4. Xác nhận `cloudflared` config có route SSH ổn định.
5. Vào GitHub Actions của repo backend.
6. Chạy `deploy-backend.yml` bằng `Run workflow`.
7. Workflow dùng `cloudflared access ssh` + service token để vào hostname SSH ổn định.
8. Workflow render `.env.production` từ GitHub Secrets/Variables và copy file đó vào `RUNTIME_ENV_PATH`.
9. Workflow source env từ `RUNTIME_ENV_PATH` rồi mới chạy migration và restart service.

## Kiểm tra sau deploy

- Kiểm tra `/api/v1/health`
- Kiểm tra `pnpm status`
- Kiểm tra log ứng dụng
- Kiểm tra migration đã apply
- Kiểm tra không có file env thật nào bị track bởi git

## Kết luận vận hành

- Merge `main` hiện tại không làm lộ secret production nếu bạn chỉ commit source hiện có.
- GitHub giữ cả deploy secrets lẫn runtime secrets/variables của app.
- Deploy SSH đã chuyển sang hostname ổn định qua Cloudflare Access, nên không còn phải cập nhật `SSH_HOST` hay `SSH_PORT` sau mỗi lần reboot như mô hình Pinggy cũ.
