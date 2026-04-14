# Backend Personal Machine Deploy Runbook

## Trạng thái

- Date: `2026-04-14`
- Status: `Accepted`
- Scope: deploy thủ công repo `backend` từ GitHub Actions vào máy cá nhân qua SSH endpoint ổn định bằng `Cloudflare Tunnel`

## Mục tiêu

- Tách thư mục làm việc hằng ngày với thư mục deploy.
- Giữ workflow deploy hiện tại của GitHub Actions.
- Loại bỏ phụ thuộc vào reverse SSH tunnel tạm vốn đổi host hoặc port sau reboot.

## Kiến trúc deploy hiện tại

- Workspace dev:
  - `/mnt/c/TrungDang/journey/backend`
- Deploy path:
  - `/home/trungdang/apps/journey-backend`
- Source of truth của code:
  - GitHub repo `trungdang23/backend`
- Source of truth của runtime config:
  - GitHub `Secrets` và `Variables`
- Database local cho deploy hiện tại:
  - PostgreSQL chạy bằng `docker compose`
- Kiểu deploy:
  - manual qua workflow `deploy-backend.yml`
- Kiểu SSH hiện tại:
  - `Cloudflare Tunnel` published SSH app tại `ssh.buicojourney.com`
- Kiểu xác thực Access cho GitHub Actions:
  - `Service Auth` bằng Cloudflare service token

## Những gì workflow đang làm

1. Verify repo bằng `lint`, `test`, `build`, `prisma:validate`.
2. Cài `cloudflared` client trên GitHub runner.
3. Đọc Cloudflare Access secrets, SSH secrets, và runtime config từ GitHub.
4. Render file env tạm trên GitHub runner.
5. SSH qua `cloudflared access ssh` vào `ssh.buicojourney.com`.
6. Copy file env đó lên máy đích tại `RUNTIME_ENV_PATH`.
7. `git fetch`, `git checkout`, `git pull` trong `DEPLOY_PATH`.
8. `pnpm install`, `pnpm prisma:generate`, `pnpm build`.
9. Source runtime env vừa copy lên.
10. Chạy `pnpm prisma:migrate:deploy`.
11. Chạy `SERVICE_RESTART_COMMAND`.

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
- `SSH_HOST` phải là hostname Access cố định, không phải hostname tunnel tạm.
- `SSH_PORT` nên để `22` trong mô hình Cloudflare SSH hiện tại.
- Merge `main` không tự deploy; bạn vẫn phải bấm `Run workflow`.

## GitHub configuration hiện cần

### Secrets

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

### Variables

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

## Giá trị path và host đã chốt cho máy hiện tại

### Secrets

```text
SSH_HOST=ssh.buicojourney.com
SSH_PORT=22
SSH_USER=trungdang
```

### Variables

```text
DEPLOY_PATH=/home/trungdang/apps/journey-backend
RUNTIME_ENV_PATH=/home/trungdang/apps/journey-backend/.env.production
```

`SERVICE_RESTART_COMMAND` nên dùng:

```text
bash ./scripts/restart-production.sh
```

## Cấu hình Cloudflare cần có

### Published application routes

- `ssh.buicojourney.com -> ssh://localhost:22`
- `api.buicojourney.com -> http://localhost:3001`

Template tham chiếu đã có trong repo:

```text
deploy/cloudflare/journey-backend-config.yml.example
```

### Access policy cho SSH hostname

Tại Access app của `ssh.buicojourney.com`:

- thêm policy `Service Auth`
- cho phép service token mà GitHub Actions dùng
- giữ thêm policy user-based riêng nếu bạn còn muốn SSH thủ công từ máy cá nhân

### Host key secret

GitHub secret `SSH_KNOWN_HOSTS` nên dùng host key thật của Windows OpenSSH server với hostname ổn định:

```text
ssh.buicojourney.com ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA...
```

Lấy public host key trên Windows:

```powershell
Get-Content 'C:\ProgramData\ssh\ssh_host_ed25519_key.pub'
```

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
   - `cloudflared` process có mặt
   - route SSH ổn định đã có trong config
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

Kiểm tra SSH hostname ổn định từ client có `cloudflared`:

```bash
TUNNEL_SERVICE_TOKEN_ID='<client-id>' \
TUNNEL_SERVICE_TOKEN_SECRET='<client-secret>' \
ssh -o ProxyCommand="cloudflared access ssh --hostname %h" trungdang@ssh.buicojourney.com 'echo tunnel_ok'
```

## Các lỗi có thể gặp và cách xử lý

### `ssh: connect to host ... port ...: Connection timed out`

Nguyên nhân thường gặp:

- `cloudflared` trên máy đích chưa chạy
- config tunnel chưa có route `ssh://localhost:22`
- `SSH_HOST` trong GitHub secret vẫn trỏ sai hostname cũ

Khắc phục:

- chạy lại `pnpm up`
- kiểm tra `pnpm status`
- xác nhận `SSH_HOST=ssh.buicojourney.com`

### `Permission denied (publickey)`

Nguyên nhân:

- `SSH_PRIVATE_KEY` không khớp với authorized key trên máy đích
- `SSH_USER` sai

Khắc phục:

- kiểm tra lại private key deploy
- kiểm tra `authorized_keys` của user deploy
- kiểm tra `SSH_USER`

### `Host key verification failed`

Nguyên nhân:

- `SSH_KNOWN_HOSTS` chưa được cập nhật theo hostname ổn định
- secret đang chứa line cho host tạm cũ

Khắc phục:

- lấy lại host key từ `C:\ProgramData\ssh\ssh_host_ed25519_key.pub`
- cập nhật `SSH_KNOWN_HOSTS` theo format `ssh.buicojourney.com <key>`

### `403` hoặc bị Access chặn trước khi vào SSH

Nguyên nhân:

- service token sai
- Access app của `ssh.buicojourney.com` chưa có policy `Service Auth`

Khắc phục:

- tạo mới service token nếu cần
- cập nhật lại `CLOUDFLARE_ACCESS_CLIENT_ID`
- cập nhật lại `CLOUDFLARE_ACCESS_CLIENT_SECRET`
- kiểm tra policy của Access app

### `RUNTIME_ENV_PATH points to a directory`

Nguyên nhân:

- `RUNTIME_ENV_PATH` trỏ vào thư mục repo thay vì file `.env.production`

Giá trị đúng:

```text
/home/trungdang/apps/journey-backend/.env.production
```

## Giới hạn của setup hiện tại

- Chưa phải production-ready.
- Chưa có process manager hoặc container runtime cho chính app backend.
- Máy cá nhân vẫn phải online để nhận traffic và nhận deploy.
- Service token Cloudflare có hạn dùng, nên cần theo dõi ngày hết hạn.

## Bước tiếp theo được khuyến nghị

1. Cho `cloudflared` chạy như Windows service ổn định thay vì chỉ dựa vào process khởi động lại sau login.
2. Đưa backend runtime sang process manager hoặc container runtime thật.
3. Thêm health check riêng cho SSH deploy path nếu cần tự động hóa sâu hơn.
4. Sau khi ổn định, cân nhắc chuyển từ máy cá nhân sang VPS hoặc máy luôn-on.
