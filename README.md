# Journey Backend

Backend service for the `journey` product, scaffolded with `NestJS`, `PostgreSQL`, and `Prisma`.

## Stack

- `NestJS`
- `PostgreSQL`
- `Prisma`
- `pnpm`
- REST API with prefix `/api/v1`
- Swagger at `/api/v1/docs`

## Run Local

1. Copy one of the env examples to a real env file:

```bash
cp .env.development.example .env.development
```

2. Start local PostgreSQL:

```bash
docker compose up -d
```

Fresh PostgreSQL volumes will bootstrap `journey`, `journey_test`, and `journey_ci`.

3. Install dependencies:

```bash
pnpm install
```

4. Generate Prisma client:

```bash
pnpm prisma:generate
```

5. Start the API in watch mode:

```bash
pnpm start:dev
```

## Quality Checks

```bash
pnpm lint
pnpm test
pnpm build
pnpm prisma:validate
```

## Operational Foundation

- Mỗi request đều có correlation id. Header `X-Correlation-Id` được giữ nguyên nếu client gửi lên; nếu không có, backend sẽ tự tạo và phản hồi lại cùng header này.
- `/api/v1/health` hiện kiểm tra cả khả năng chạm PostgreSQL thật; khi DB sống, response sẽ có `checks.database.status = "up"`.
- Structured logging đã có redaction cho dữ liệu nhạy cảm như `authorization`, `cookie`, `password`, `token`, và các trường chứa `secret`.
- Repo `backend` có workflow CI riêng tại `.github/workflows/backend-ci.yml`; merge vào repo backend sẽ chạy `pnpm prisma:generate`, `pnpm lint`, `pnpm test`, `pnpm build`, và `pnpm prisma:validate`.
- Repo `backend` chạy thêm secret scan trong CI bằng `scripts/check-secrets.sh` để chặn file env thật hoặc các key pattern phổ biến trước khi merge.
- Repo `backend` có workflow deploy thủ công tại `.github/workflows/deploy-backend.yml`; workflow này chỉ chạy khi bạn bấm `Run workflow`, render `.env.production` từ GitHub Secrets/Variables, rồi mới copy sang máy đích trước khi migrate và restart service.
- Nền tảng auth đã có `AuthModule`, `AccessTokenAuthGuard`, `@Public()`, và `@CurrentUser()`. JWT verification adapter thực tế sẽ được hoàn thiện ở Phase 03.
- Repo đã có bộ script runtime trên host:
  - `scripts/start-production.sh`
  - `scripts/stop-production.sh`
  - `scripts/restart-production.sh`
  - `scripts/check-production-health.sh`
- Repo đã có bộ script Windows để start personal-machine server bằng một lệnh:
  - `scripts/windows/run-personal-server.ps1`
  - `scripts/windows/start-personal-server.ps1`
  - `scripts/windows/stop-personal-server.ps1`

## Deployment Workflow

- `backend-ci.yml` là workflow verify cho repo backend riêng.
- `deploy-backend.yml` là workflow deploy thủ công cho repo backend riêng, không tự chạy khi merge `main`.
- `backend-ci.yml` và `deploy-backend.yml` đều gọi `bash ./scripts/check-secrets.sh` trước các bước build/test chính.
- Để workflow deploy hoạt động, repo backend cần các GitHub secrets:
  - `SSH_HOST`
  - `SSH_PORT`
  - `SSH_USER`
  - `SSH_PRIVATE_KEY`
  - `SSH_KNOWN_HOSTS`
  - `RUNTIME_DATABASE_URL`
  - `RUNTIME_JWT_ACCESS_TOKEN_SECRET`
  - `RUNTIME_JWT_REFRESH_TOKEN_SECRET`
- Repo backend cũng cần các GitHub variables:
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
- `RUNTIME_ENV_PATH` là path đích của file env production sẽ được workflow tạo ra trên máy deploy, ví dụ `/var/www/journey-backend/.env.production`.
- Với hướng Docker Compose trên VPS, `SERVICE_RESTART_COMMAND` thường sẽ là dạng `docker compose -f docker-compose.prod.yml up -d --build`, sau khi file production đã được chuẩn hóa trong các phase deploy.
- Với setup máy cá nhân hiện tại, giá trị phù hợp cho `SERVICE_RESTART_COMMAND` là `bash ./scripts/restart-production.sh`.
- Runbook secrets/runtime nằm tại `documents/06_backend-secrets-and-runtime-runbook.md`.
- Runbook deploy hiện tại trên máy cá nhân nằm tại `documents/07_backend-personal-machine-deploy-runbook.md`.
- Runbook domain/reverse proxy trên máy cá nhân nằm tại `documents/08_backend-personal-machine-domain-runbook.md`.
- Runbook domain thật cho `buicojourney.com` nằm tại `documents/09_buicojourney-domain-setup.md`.
- Runbook `Cloudflare Tunnel` cho máy cá nhân nằm tại `documents/10_cloudflare-tunnel-personal-machine-runbook.md`.

## Personal Machine Short Commands (Windows)

```powershell
pnpm up
pnpm down
pnpm status
pnpm run u
pnpm run d
pnpm run s
```

## Test Strategy

- Unit tests validate isolated logic with mocked or in-memory dependencies.
- Integration tests boot the real Nest application wiring and exercise HTTP contracts without controller mocks.
- As database-backed modules are added, integration tests must move to real Prisma repositories against a disposable PostgreSQL instance.
