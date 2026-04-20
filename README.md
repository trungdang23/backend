# Journey Backend

Backend service for the `journey` product, scaffolded with `NestJS`, `PostgreSQL`, and `Prisma`.

## Stack

- `NestJS`
- `PostgreSQL`
- `Prisma`
- `pnpm`
- REST API with prefix `/api/v1`
- Swagger at `/api/v1/docs`

## Target Implementation Snapshot

Backend package này là nơi giữ source of truth triển khai cho backend của Journey.

### Nghiệp vụ mục tiêu

- `planner-first`
- trip có `visibility: private | public`
- trip có `budgetMode: auto | manual`
- planner dùng `PlanNode` tree
- social tối thiểu gồm `posts` và có thể mở `comments` ngay sau đó

### Contract mục tiêu

- Auth:
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/login`
  - `GET /api/v1/auth/me`
  - `POST /api/v1/auth/refresh`
  - `POST /api/v1/auth/logout`
- Trips:
  - `GET /api/v1/trips?page=&size=`
  - `POST /api/v1/trips`
  - `GET /api/v1/trips/:id`
  - `PATCH /api/v1/trips/:id`
  - `DELETE /api/v1/trips/:id`
- Public trips:
  - `GET /api/v1/public/trips?page=&size=`
  - `GET /api/v1/public/trips/:id`
  - `GET /api/v1/public/trips/:id/planner`
- Posts:
  - `POST /api/v1/posts`
  - `GET /api/v1/posts?page=&size=`
  - `GET /api/v1/posts/:id`
- Planner:
  - `GET /api/v1/trips/:id/planner`
  - `POST /api/v1/nodes`
  - `PATCH /api/v1/nodes/:id`
  - `DELETE /api/v1/nodes/:id`
- Posts:
  - `POST /api/v1/posts`
  - `GET /api/v1/posts`

### Trạng thái migration hiện tại

- Source hiện đã có `auth`, `trips` aligned với `visibility/budgetMode/manualBudget`, `planning` trên `PlanNode`, `itinerary bridge`, và `budget-summary`.
- `TripItineraryDay -> TripItineraryActivity` không còn là flow planner chính; budget summary owner flow hiện đã đọc từ `PlanNode`, còn bridge giữ lại chủ yếu cho legacy endpoints và migration support.
- Khi triển khai tiếp, ưu tiên:
  1. hoàn tất runtime verification cho budget summary `PlanNode`-based và mixed-currency breakdown
  2. chốt migration/cleanup plan cho legacy itinerary support
  3. hoàn tất hardening và release safety cho public/community flows

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
pnpm test:e2e
pnpm build
pnpm prisma:validate
```

`pnpm test`, `pnpm test:integration`, và `pnpm test:e2e` hiện sẽ tự chạy `pnpm prisma:migrate:deploy` vào test database trước khi vào Jest. Nếu `DATABASE_URL` chưa được set, package sẽ mặc định dùng `journey_test` trên `localhost:5432`.

## Operational Foundation

- Mỗi request đều có correlation id. Header `X-Correlation-Id` được giữ nguyên nếu client gửi lên; nếu không có, backend sẽ tự tạo và phản hồi lại cùng header này.
- `/api/v1/health` hiện kiểm tra cả khả năng chạm PostgreSQL thật; khi DB sống, response sẽ có `checks.database.status = "up"`.
- Structured logging đã có redaction cho dữ liệu nhạy cảm như `authorization`, `cookie`, `password`, `token`, và các trường chứa `secret`.
- Repo `backend` có workflow CI riêng tại `.github/workflows/backend-ci.yml`; merge vào repo backend sẽ chạy `pnpm prisma:generate`, `pnpm lint`, `pnpm test`, `pnpm build`, và `pnpm prisma:validate`.
- Repo `backend` chạy thêm secret scan trong CI bằng `scripts/check-secrets.sh` để chặn file env thật hoặc các key pattern phổ biến trước khi merge.
- Repo `backend` có workflow deploy tại `.github/workflows/deploy-backend.yml`; workflow này tự chạy khi `push` vào `main` và vẫn hỗ trợ `Run workflow` để redeploy thủ công khi cần. Workflow render `.env.production` từ GitHub Secrets/Variables, rồi mới copy sang máy đích trước khi migrate và restart service.
- `DATABASE_URL`, `JWT_ISSUER`, `JWT_ACCESS_TOKEN_SECRET`, và `JWT_REFRESH_TOKEN_SECRET` là runtime config bắt buộc; backend không còn fallback các giá trị này trong source, nên giá trị production phải đến từ GitHub Secrets/Variables.
- CORS cho frontend tách origin được điều khiển bằng `CORS_ALLOWED_ORIGINS`; các endpoint public của auth hiện có rate limiting theo IP với `AUTH_RATE_LIMIT_MAX_REQUESTS` và `AUTH_RATE_LIMIT_WINDOW_SECONDS`.
- Swagger docs có thể được bảo vệ bằng `Basic Auth` qua `SWAGGER_USERNAME` và `SWAGGER_PASSWORD`; trên production, nếu `SWAGGER_ENABLED=true` nhưng thiếu credential thì `/api/v1/docs` và `/api/v1/docs-json` sẽ không được mount.
- Workflow deploy hiện giữ bước verify trên GitHub-hosted runner, nhưng chạy bước deploy thật trên self-hosted runner Linux của chính máy đích; vì vậy deploy không còn phụ thuộc vào `cloudflared access ssh` hay lớp SSH trung gian.
- Phase auth/users hiện đã có `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`, `AccessTokenAuthGuard`, `@Public()`, `@CurrentUser()`, password hashing, và JWT access/refresh token flow thật.
- Phase trips hiện đã có `POST /api/v1/trips`, `GET /api/v1/trips`, `GET /api/v1/trips/:tripId`, `PATCH /api/v1/trips/:tripId`, `DELETE /api/v1/trips/:tripId`, pagination/sort, Prisma-backed persistence, và trip-specific unit/integration/e2e coverage.
- Phase itineraries/budgets hiện đã có `GET /api/v1/trips/:tripId/itinerary`, `POST /api/v1/trips/:tripId/itinerary/days`, `POST /api/v1/trips/:tripId/itinerary/days/:dayId/activities`, `PATCH /api/v1/trips/:tripId/itinerary/days/:dayId/activities/:activityId`, `GET /api/v1/trips/:tripId/budget-summary`, cùng Prisma-backed persistence và itinerary/budget-specific test coverage.
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
- `deploy-backend.yml` là workflow deploy production cho repo backend riêng; mặc định tự chạy khi `push` vào `main` và vẫn giữ `workflow_dispatch` để chạy tay khi cần.
- `backend-ci.yml` và `deploy-backend.yml` đều gọi `bash ./scripts/check-secrets.sh` trước các bước build/test chính.
- Để workflow deploy hoạt động, repo backend cần một self-hosted runner Linux/X64 online trên chính máy deploy.
- Repo backend cần các GitHub secrets runtime:
  - `RUNTIME_DATABASE_URL`
  - `RUNTIME_JWT_ACCESS_TOKEN_SECRET`
  - `RUNTIME_JWT_REFRESH_TOKEN_SECRET`
  - `RUNTIME_SWAGGER_USERNAME`
  - `RUNTIME_SWAGGER_PASSWORD`
- Repo backend cũng cần các GitHub variables:
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
- `RUNTIME_ENV_PATH` là path đích của file env production sẽ được workflow tạo ra trên máy deploy, ví dụ `/var/www/journey-backend/.env.production`.
- Self-hosted runner phải chạy dưới user có quyền ghi vào `DEPLOY_PATH`, `RUNTIME_ENV_PATH`, và chạy được `SERVICE_RESTART_COMMAND`.
- Với hướng Docker Compose trên VPS, `SERVICE_RESTART_COMMAND` thường sẽ là dạng `docker compose -f docker-compose.prod.yml up -d --build`, sau khi file production đã được chuẩn hóa trong các phase deploy.
- Với setup máy cá nhân hiện tại, giá trị phù hợp cho `SERVICE_RESTART_COMMAND` là `bash ./scripts/restart-production.sh`.
- Runbook secrets/runtime nằm tại `documents/06_backend-secrets-and-runtime-runbook.md`.
- Runbook deploy hiện tại trên máy cá nhân nằm tại `documents/07_backend-personal-machine-deploy-runbook.md`.
- Runbook domain/reverse proxy trên máy cá nhân nằm tại `documents/08_backend-personal-machine-domain-runbook.md`.
- Runbook domain thật cho `buicojourney.com` nằm tại `documents/09_buicojourney-domain-setup.md`.
- Runbook `Cloudflare Tunnel` cho máy cá nhân nằm tại `documents/10_cloudflare-tunnel-personal-machine-runbook.md`.
- Template `cloudflared` config cho HTTP + SSH nằm tại `deploy/cloudflare/journey-backend-config.yml.example`.

## Personal Machine Short Commands (Windows)

```powershell
pnpm run up
pnpm run down
pnpm run status
pnpm run u
pnpm run d
pnpm run s
```

WSL helper cho cả backend + frontend production runtime:

```bash
pnpm run stack:up
pnpm run stack:down
pnpm run stack:status
```

Alias ngắn tương ứng:

```powershell
pnpm run ua
pnpm run da
pnpm run sa
```

Các lệnh này sẽ:

- chạy `pnpm run up` để bật backend, PostgreSQL, và backend tunnel
- restart frontend production tại `/home/trungdang/apps/journey-frontend`
- kiểm tra `https://buicojourney.com/health`
- dừng frontend production rồi dừng backend stack khi dùng `pnpm run stack:down`
- gom trạng thái backend + frontend local runtime + frontend public health khi dùng `pnpm run stack:status`

## Test Strategy

- Unit tests validate isolated logic with mocked or in-memory dependencies.
- Integration tests boot the real Nest application wiring and exercise HTTP contracts without controller mocks.
- Database-backed modules như `trips` hiện đã có repository integration chạy với `Prisma` và PostgreSQL thật; full `pnpm test` sẽ apply migration test DB trước khi chạy suite liên quan.
