# Backend Personal Machine Deploy Runbook

## Trạng thái

- Date: `2026-04-13`
- Status: `Accepted`
- Scope: deploy thủ công repo `backend` từ GitHub Actions vào máy cá nhân thông qua SSH tunnel tạm thời

## Mục tiêu

- Tách thư mục làm việc hằng ngày với thư mục deploy.
- Cho phép GitHub Actions pull code mới nhất từ `main`, render runtime env, chạy migration, và chuẩn bị restart app.
- Ghi lại đầy đủ các bước đã dùng cho máy cá nhân hiện tại để có thể lặp lại mà không cần dò lại log cũ.

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
  - reverse tunnel tạm thời qua Pinggy

## Những gì workflow đang làm

1. Verify repo bằng `lint`, `test`, `build`, `prisma:validate`.
2. Đọc SSH secrets và runtime config từ GitHub.
3. Render file env tạm trên GitHub runner.
4. Copy file env đó lên máy đích tại `RUNTIME_ENV_PATH`.
5. SSH vào máy đích.
6. `git fetch`, `git checkout`, `git pull` trong `DEPLOY_PATH`.
7. `pnpm install`, `pnpm prisma:generate`, `pnpm build`.
8. Source runtime env vừa copy lên.
9. Chạy `pnpm prisma:migrate:deploy`.
10. Chạy `SERVICE_RESTART_COMMAND`.

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
- Với tunnel Pinggy, `SSH_HOST`, `SSH_PORT`, và `SSH_KNOWN_HOSTS` sẽ đổi khi tunnel đổi.
- Merge `main` không tự deploy; bạn vẫn phải bấm `Run workflow`.

## Thư mục deploy riêng

Đã tạo:

```text
/home/trungdang/apps/journey-backend
```

Lý do:

- tránh làm dirty working tree ở source dev
- tránh build và runtime artifact chen vào thư mục đang code
- để workflow có working copy riêng chỉ phục vụ deploy

## GitHub configuration hiện cần

### Secrets

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

## Giá trị path đã chốt cho máy hiện tại

### Variables

```text
DEPLOY_PATH=/home/trungdang/apps/journey-backend
RUNTIME_ENV_PATH=/home/trungdang/apps/journey-backend/.env.production
```

`SERVICE_RESTART_COMMAND` hiện tại mới chỉ dùng để xác minh deploy flow. Nó chưa chạy backend như một service production thật.

Giá trị nên dùng cho bước tiếp theo:

```text
bash ./scripts/restart-production.sh
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
4. Kiểm tra tunnel SSH tạm còn sống.
5. Nếu tunnel đã đổi, cập nhật lại:
   - `SSH_HOST`
   - `SSH_PORT`
   - `SSH_KNOWN_HOSTS`
6. Kiểm tra PostgreSQL local đang chạy.
7. Bấm `Run workflow` cho `deploy-backend`.

Khi đã đổi `SERVICE_RESTART_COMMAND` sang `bash ./scripts/restart-production.sh`, workflow sẽ không chỉ build và migrate mà còn khởi động backend thật và chờ health check pass.

## Lệnh kiểm tra nhanh trước deploy

Kiểm tra PostgreSQL local:

```bash
timeout 3 bash -lc 'cat < /dev/null > /dev/tcp/127.0.0.1/5432' && echo open || echo closed
```

Kiểm tra deploy path:

```bash
git -C /home/trungdang/apps/journey-backend status --short --branch
```

Kiểm tra SSH tunnel hiện tại:

```bash
ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 -i /home/trungdang/.ssh/id_ed25519_github_actions_deploy -p <SSH_PORT> trungdang@<SSH_HOST> 'echo tunnel_ok'
```

## Các lỗi đã gặp và cách xử lý

### `SSH_PRIVATE_KEY is malformed`

Nguyên nhân:

- secret bị paste sai format

Khắc phục:

```powershell
wsl base64 -w 0 /home/trungdang/.ssh/id_ed25519_github_actions_deploy | clip.exe
```

Paste chuỗi đó vào `SSH_PRIVATE_KEY`.

### `Potential private key material detected`

Nguyên nhân:

- secret scan bắt nhầm pattern trong workflow

Khắc phục:

- workflow đã được sửa để không chứa nguyên văn pattern gây false positive

### `P1001: Can't reach database server at localhost:5432`

Nguyên nhân:

- PostgreSQL local chưa chạy

Khắc phục:

```powershell
& 'C:\Program Files\Docker\Docker\resources\bin\docker.exe' compose -f 'C:\TrungDang\journey\backend\docker-compose.yml' up -d postgres
```

### `RUNTIME_ENV_PATH points to a directory`

Nguyên nhân:

- `RUNTIME_ENV_PATH` trỏ vào thư mục repo thay vì file `.env.production`

Giá trị đúng:

```text
/home/trungdang/apps/journey-backend/.env.production
```

### `Permission denied` khi `cd /home/trungdang/apps/journey-backend`

Nguyên nhân:

- trước đó workflow đã `chmod 600` nhầm lên thư mục repo do `RUNTIME_ENV_PATH` sai

Khắc phục:

```bash
chmod 755 /home/trungdang/apps/journey-backend
```

### `git status` ở deploy clone bị dirty vì `.deploy-runtime.env`

Nguyên nhân:

- trước đó `RUNTIME_ENV_PATH` trỏ sai, khiến file env tạm bị copy nhầm vào thư mục repo

Khắc phục:

```bash
rm -f /home/trungdang/apps/journey-backend/.deploy-runtime.env
```

### `ssh: Could not resolve hostname ...`

Nguyên nhân:

- host tunnel Pinggy đã hết hạn

Khắc phục:

- mở lại tunnel mới
- cập nhật lại `SSH_HOST`, `SSH_PORT`, `SSH_KNOWN_HOSTS`

## Giới hạn của setup hiện tại

- Chưa phải production-ready.
- Chưa có reverse proxy và SSL.
- Chưa có domain thật trỏ vào backend runtime.
- Chưa có process manager hoặc container runtime cho chính app backend.
- `SERVICE_RESTART_COMMAND` chưa chạy backend như service thật.
- SSH đang phụ thuộc tunnel tạm, không phù hợp cho auto deploy lâu dài.

## Bước tiếp theo được khuyến nghị

1. Cho backend chạy thật bằng `Docker Compose` hoặc `pm2`.
2. Đổi `SERVICE_RESTART_COMMAND` từ `echo "Deploy completed"` sang lệnh restart thật.
3. Thêm health check sau deploy.
4. Sau khi ổn định, cân nhắc chuyển từ máy cá nhân sang VPS hoặc SSH endpoint ổn định.
