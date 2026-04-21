# Backend Personal Machine Deploy Runbook

## Trạng thái

- Date: `2026-04-15`
- Status: `Accepted`
- Scope: deploy repo `backend` từ GitHub Actions vào máy cá nhân bằng self-hosted runner Linux

## Mục tiêu

- Tách thư mục làm việc hằng ngày với thư mục deploy.
- Giữ workflow deploy hiện tại của GitHub Actions.
- Loại bỏ phụ thuộc vào `cloudflared access ssh` và mọi bước SSH trung gian.

## Checklist hardening deploy `localhost`

- [x] Xác định runtime database hiện tại có trỏ về `localhost` hay không từ chính `DATABASE_URL` đã render.
- [x] Nếu `localhost:<port>` chưa mở, thử bật lại PostgreSQL local qua `docker compose up -d postgres` trước khi chạy migration.
- [x] Không ép dùng Docker Compose khi `DATABASE_URL` đã reachable sẵn hoặc đang trỏ sang host khác.
- [x] Fail sớm với thông báo vận hành rõ ràng nếu `DATABASE_URL` trỏ về `localhost` nhưng runner không thể làm DB sống lại.

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
  - tự động khi `push` vào `main`
  - manual qua `workflow_dispatch` khi cần redeploy
- Kiểu thực thi deploy:
  - self-hosted runner Linux/X64 chạy trên chính máy đích

## Những gì workflow đang làm

1. Verify repo bằng `lint`, `test`, `build`, `prisma:validate` trên GitHub-hosted runner.
2. Checkout đúng `ref` lên self-hosted runner.
3. Sync source từ workspace checkout vào `DEPLOY_PATH`.
4. Render file env tạm từ GitHub configuration.
5. Ghi file env đó vào `RUNTIME_ENV_PATH`.
6. Chạy `bash ./scripts/ensure-runtime-database.sh` trong `DEPLOY_PATH` để preflight `DATABASE_URL`; nếu đang trỏ về `localhost` nhưng chưa reachable, workflow sẽ thử `docker compose up -d postgres`.
7. `pnpm install`, `pnpm prisma:generate`, `pnpm build` trong `DEPLOY_PATH`.
8. Source runtime env vừa ghi.
9. Chạy `pnpm prisma:migrate:deploy`.
10. Chạy `SERVICE_RESTART_COMMAND`.

## Runtime script hiện có trong repo

- `scripts/start-production.sh`
- `scripts/stop-production.sh`
- `scripts/restart-production.sh`
- `scripts/check-production-health.sh`
- `scripts/ensure-runtime-database.sh`

Các script này:

- tự source file env tại `RUNTIME_ENV_PATH` hoặc `./.env.production`
- ghi PID và log vào `${XDG_STATE_HOME:-$HOME/.local/state}/journey-backend`
- clear `RUNNER_TRACKING_ID` trước khi detach backend runtime để process không bị self-hosted runner cleanup sau khi workflow kết thúc
- dùng `curl` để xác minh `/api/v1/health` sau khi restart

## Giá trị cốt lõi cần nhớ

- Không deploy vào chính thư mục đang code.
- Không commit `.env.production`.
- `RUNTIME_ENV_PATH` phải là file path, không phải directory path.
- Self-hosted runner phải online trên chính máy deploy.
- Runner user phải có quyền ghi vào `DEPLOY_PATH`, `RUNTIME_ENV_PATH`, và state dir của runtime scripts.
- `push` vào `main` sẽ tự kích hoạt deploy; `Run workflow` vẫn được giữ để redeploy thủ công khi cần.
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

Để URL này dùng được, máy deploy phải có PostgreSQL local chạy ở `localhost:5432`.
Workflow hiện sẽ tự kiểm tra port này trước migration; nếu port đang down nhưng `DATABASE_URL` vẫn là local, workflow sẽ thử bật lại service `postgres` bằng Docker Compose trong `DEPLOY_PATH`.

Trong setup hiện tại, PostgreSQL chạy qua:

```bash
docker compose -f /mnt/c/TrungDang/journey/backend/docker-compose.yml up -d postgres
```

## Quy trình deploy lặp lại

1. Sửa code ở source dev:
   - `/mnt/c/TrungDang/journey/backend`
2. Commit và push lên `main`.
3. GitHub Actions sẽ tự chạy `deploy-backend.yml`, trong đó đã có bước verify riêng trước khi deploy thật.
4. Chạy `pnpm status` trên máy cá nhân để xác nhận:
   - Docker đang chạy
   - backend runtime healthy
   - runner đang online
5. Nếu cần redeploy lại cùng ref hoặc chạy lại sau khi runner lỗi, dùng `Run workflow` cho `deploy-backend`.

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
- runner không chạy được `docker compose`
- migration chưa hợp lệ với DB hiện tại

Khắc phục:

- kiểm tra `docker compose ps`
- kiểm tra workflow log của `scripts/ensure-runtime-database.sh`
- kiểm tra `RUNTIME_DATABASE_URL`
- chạy lại sau khi DB local khỏe

### Push `main` nhưng deploy không tự chạy

Nguyên nhân:

- workflow đang bị disable
- push không vào đúng branch `main`
- self-hosted runner đang offline nên job không được nhận

Khắc phục:

- kiểm tra tab `Actions`
- xác nhận commit đã vào `main`
- xác nhận self-hosted runner online
- dùng `Run workflow` để redeploy thủ công nếu cần

### `node was not found in PATH`

Nguyên nhân:

- runner user chưa có Node runtime hoặc `nvm` chưa được load

### Deploy báo xanh nhưng public API trả `502`

Nguyên nhân hay gặp:

- backend process được start từ self-hosted runner nhưng bị runner cleanup sau khi job kết thúc
- backend runtime chết sau restart nên `cloudflared` vẫn sống nhưng không còn origin ở `127.0.0.1:3001`

Khắc phục:

- chạy `pnpm run status` trong `backend/` để xác nhận local health tại `http://127.0.0.1:3001/api/v1/health`
- nếu local health fail, chạy `pnpm run up` hoặc `bash ./scripts/restart-production.sh`
- xem log tại `${XDG_STATE_HOME:-$HOME/.local/state}/journey-backend/journey-backend.log`

Khắc phục:

- cài Node cho runner
- hoặc đảm bảo `nvm` của user deploy còn dùng được

## Kết luận vận hành

- Deploy không còn phụ thuộc vào Cloudflare SSH.
- Độ ổn định của deploy giờ nằm ở self-hosted runner, runtime stack local, và quyền file đúng trên máy đích.
- Cloudflare Tunnel vẫn hữu ích cho public ingress của API, nhưng không còn là đường bắt buộc của workflow deploy backend.
