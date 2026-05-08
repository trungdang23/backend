# Backend Phase Execution Log

## Re-baseline Note

- Log này giữ lịch sử triển khai theo thứ tự implementation thật trong repo backend.
- Sau lần re-baseline ngày `2026-04-20`, phase numbering hiện hành cho DRD-aligned roadmap phải bám `01_backend-phase-checklist.md`.
- Từ mốc này:
  - execution `Phase 04` tương ứng với checklist `Phase 03` (`trips`)
  - execution `Phase 05` là bridge `itineraries/budgets`
  - execution `Phase 06` tương ứng với checklist `Phase 04` (`planning` trên `PlanNode`)

## Documentation Sync

Status: `Completed`

### Checklist

- [x] Đồng bộ root product docs với current source snapshot và package README
- [x] Tách rõ `PlanNode` primary contract với itinerary compatibility bridge
- [x] Chốt lại `comments` là deferred, chưa thuộc current implementation snapshot
- [x] Dọn `backend/README.md` để tránh trùng lặp contract và giảm hiểu nhầm khi handoff

### Nhật ký

- `2026-04-21`: Đồng bộ lại `journey_drd.md`, `journey_drd_detail.md`, `journey_user_stories.md`, `journey_user_stories_detail.md`, `journey_data_model_markdown.md`, và `backend/README.md` để bám source hiện tại.

## Phase 00

Status: `Completed`

### Tóm tắt

- Đã chốt mục tiêu backend, nguyên tắc SOLID, stack, convention, config strategy, secrets strategy, workflow, và definition of done.

### Artifact

- `00_backend-foundation.md`
- `01_backend-phase-checklist.md`
- `02_backend-stack-decision.md`
- `03_backend-conventions-and-ops-decision.md`
- `04_backend-definition-of-done.md`

### Verification

- File review

## Phase 01

Status: `Completed`

### Mục tiêu

- Scaffold backend theo `NestJS`
- Chuẩn hóa cấu trúc thư mục
- Thiết lập config, response envelope, error filter, logging, test layout, Prisma baseline, Docker Compose, và README

### Nhật ký

- `2026-04-13`: Khởi tạo cây thư mục source, test, db, và documents
- `2026-04-13`: Bắt đầu thêm package manifest, config files, source bootstrap, health module, unit test, integration test, và README
- `2026-04-13`: Cài dependencies bằng `pnpm`, generate Prisma client, và xác minh build/test thật
- `2026-04-13`: Điều chỉnh integration test để chạy qua Express/Nest wiring thực mà không cần bind port, do sandbox không cho listen socket

### Verification

- `pnpm lint` pass
- `pnpm test` pass
- `pnpm build` pass
- `DATABASE_URL=postgresql://journey:journey@localhost:5432/journey?schema=public pnpm prisma:validate` pass

### Artifact

- `backend/package.json`
- `backend/tsconfig.json`
- `backend/tsconfig.build.json`
- `backend/nest-cli.json`
- `backend/eslint.config.mjs`
- `backend/.prettierrc`
- `backend/.gitignore`
- `backend/.env.development.example`
- `backend/.env.test.example`
- `backend/.env.production.example`
- `backend/docker-compose.yml`
- `backend/db/schema.prisma`
- `backend/src/**`
- `backend/test/**`
- `backend/README.md`

### Ghi chú

- Unit test đang đóng vai trò mock-based verification cho phase scaffold.
- Integration test đang chạy qua Express instance của Nest để giữ wiring thực trong điều kiện sandbox hiện tại không cho bind cổng mạng.

## Phase 02

Status: `Completed`

### Mục tiêu

- Hoàn thiện technical foundation để các phase nghiệp vụ không phải quay lại cắm tracing, logging, auth guard, và CI ở giữa chừng.
- Đảm bảo mỗi bước đều có mock-based verification và reality-based verification theo nguyên tắc đã chốt.

### Nhật ký

- `2026-04-13`: Loại bỏ `baseUrl` và `types` tường minh khỏi `tsconfig.json`, đồng thời bỏ `moduleResolution` deprecated để tránh cảnh báo TS 6 trong editor.
- `2026-04-13`: Thêm request context foundation gồm correlation id resolver, middleware, context service, và module dùng chung toàn app.
- `2026-04-13`: Chuẩn hóa structured logging với metadata theo request, đồng thời redaction các trường nhạy cảm như `authorization`, `cookie`, `password`, `token`, và `secret`.
- `2026-04-13`: Bổ sung auth foundation ở mức technical scaffold gồm `AuthModule`, `Public` decorator, `CurrentUser` decorator, access token guard, và access token verifier port với implementation mặc định dạng unconfigured.
- `2026-04-13`: Thêm backend CI workflow để chạy `prisma:generate`, `lint`, `test`, `build`, và `prisma:validate` khi backend thay đổi.
- `2026-04-13`: Bổ sung unit test và integration test cho request context, auth guard, và logging policy; cập nhật health integration để xác nhận propagation của `X-Correlation-Id`.

### Verification

- `pnpm lint` pass
- `pnpm exec tsc -p tsconfig.json --noEmit` pass
- `pnpm test` pass (`11` suites, `21` tests)
- `pnpm build` pass
- `DATABASE_URL=postgresql://journey:journey@localhost:5432/journey?schema=public pnpm prisma:validate` pass

### Artifact

- `backend/src/app/request-context/**`
- `backend/src/app/logging/sanitize-log-data.ts`
- `backend/src/app/logging/build-http-request-log-metadata.ts`
- `backend/src/modules/auth/**`
- `backend/test/support/dispatch-request.ts`
- `backend/test/unit/app/logging/sanitize-log-data.spec.ts`
- `backend/test/unit/app/request-context/*.spec.ts`
- `backend/test/unit/modules/auth/presentation/guards/access-token-auth.guard.spec.ts`
- `backend/test/integration/auth/access-token-auth.guard.integration.spec.ts`
- `backend/test/integration/logging/logging-policy.integration.spec.ts`
- `.github/workflows/backend-ci.yml`

### Ghi chú

- Mock-based verification của phase này đến từ unit tests cho middleware, request context service, sanitize logging, và auth guard.
- Reality-based verification đến từ integration tests boot app Nest thật, đi qua middleware, guard, filter, interceptor, và HTTP contract thật mà không mock controller.
- `AccessTokenVerifierPort` hiện mới dừng ở port và implementation mặc định dạng unconfigured; JWT adapter thực tế sẽ được hoàn thiện trong Phase 03.

## Phase 03

Status: `Completed`

### Mục tiêu

- Bắt đầu phase `auth` và `users` theo hướng vertical slice, nhưng đi từ nền tảng persistence và observability để các use case sau có chỗ bám rõ ràng.
- Nâng health endpoint từ app liveness lên DB-backed health check để biết backend đã chạm được PostgreSQL thật hay chưa.

### Nhật ký

- `2026-04-13`: Thêm `PrismaModule` dạng global để các module nghiệp vụ có thể inject `PrismaService` mà không phải khai báo lặp provider.
- `2026-04-13`: Tạo `UsersModule` skeleton và import vào `AppModule` để bắt đầu slice `users`.
- `2026-04-13`: Nâng `HealthService` sang async DB-backed health check bằng `PrismaService.$queryRaw`, trả `database: up` khi kết nối được PostgreSQL.
- `2026-04-13`: Mở rộng unit test cho `HealthService` với cả success path và failure path; cập nhật integration test để xác nhận `/api/v1/health` trả database status thật.
- `2026-04-13`: Thêm init script cho PostgreSQL local để tạo thêm `journey_test` và `journey_ci` trên fresh volume.
- `2026-04-13`: Tạo migration đầu tiên cho `users` tại `db/migrations/20260413114500_create_users/migration.sql`.
- `2026-04-13`: Xác minh migration SQL trên PostgreSQL thật bằng database tạm `journey_verify`, kiểm tra bảng `users` và index `users_email_key`, rồi dùng Prisma introspect lại schema.
- `2026-04-13`: Chuyển GitHub Actions về đúng repo `backend`, đồng thời thêm workflow deploy thủ công riêng cho backend để tách vòng đời deploy khỏi frontend.
- `2026-04-13`: Bổ sung secret scan cho repo backend bằng script nội bộ, đồng thời viết runbook tách rõ GitHub deploy secrets với runtime env trên VPS.
- `2026-04-13`: Chuyển deploy workflow sang mô hình GitHub giữ runtime secrets/variables, render `.env.production` trên runner, rồi copy sang máy đích trước khi migrate và restart service.
- `2026-04-13`: Hoàn tất manual deploy đầu tiên vào máy cá nhân qua GitHub Actions, dùng deploy clone riêng tại `/home/trungdang/apps/journey-backend` thay vì deploy thẳng vào thư mục dev.
- `2026-04-13`: Ghi nhận và xử lý các lỗi vận hành thực tế gồm SSH key formatting, secret scan false positive, PostgreSQL chưa chạy, tunnel Pinggy hết hạn, và `RUNTIME_ENV_PATH` trỏ sai vào thư mục.
- `2026-04-13`: Viết runbook riêng cho manual deploy trên máy cá nhân để chuẩn hóa lại toàn bộ bước deploy đã xác minh thành công.
- `2026-04-13`: Bổ sung bộ script host runtime (`start`, `stop`, `restart`, `health`) để bước kế tiếp có thể đổi từ `echo "Deploy completed"` sang chạy backend thật sau deploy mà không cần thêm dependency mới.
- `2026-04-13`: Xác minh Windows đang có sẵn Apache/XAMPP chạy local, backend host runtime reachable từ Windows qua `localhost:3001`, đồng thời ghi nhận blocker mạng hiện tại là public `80` trả `nginx` chứ chưa đi vào Apache local.
- `2026-04-13`: Tạo template Apache reverse proxy và runbook riêng cho bước đưa backend trên máy cá nhân ra domain thật.
- `2026-04-13`: Điền sẵn cấu hình và runbook riêng cho domain thật `buicojourney.com`, chốt subdomain backend là `api.buicojourney.com`, đồng thời xác minh DNS hiện chưa trỏ và public `80` vẫn chưa vào đúng máy Windows.
- `2026-04-13`: Chốt hướng ingress phù hợp hơn cho máy cá nhân + Cloudflare là `Cloudflare Tunnel`, nhằm bỏ phụ thuộc vào router/NAT và tránh phải public dịch vụ mạng nội bộ trực tiếp ra Internet.
- `2026-04-13`: Login `cloudflared`, tạo tunnel `journey-backend`, route DNS `api.buicojourney.com`, ghi config local cho `localhost:3001`, và xác minh public health endpoint qua `https://api.buicojourney.com/api/v1/health` trả `200`.
- `2026-04-13`: Thêm bộ script Windows để khởi động lại toàn bộ stack bằng một lệnh duy nhất, thay vì cần chạy nhiều lệnh thủ công.
- `2026-04-14`: Bổ sung script dừng toàn bộ stack bằng một lệnh và thêm shortcut `pnpm up` / `pnpm down`.
- `2026-04-14`: Thêm lệnh `pnpm status` để kiểm tra nhanh Docker, backend WSL, tunnel và public health.
- `2026-04-14`: Chuyển deploy SSH từ tunnel tạm sang hostname ổn định `ssh.buicojourney.com` qua `Cloudflare Tunnel` + `Service Auth`, đồng thời cập nhật workflow deploy, runbook secrets/deploy, template `cloudflared` config, và status script để kiểm tra route SSH.
- `2026-04-21`: Hardening deploy production để preflight `DATABASE_URL` trên self-hosted runner; nếu runtime DB local ở `localhost` đang down thì workflow sẽ thử bật `docker compose up -d postgres` trước khi chạy Prisma migration, còn remote DB hoặc local DB đã reachable thì được giữ nguyên flow cũ.
- `2026-04-14`: Bắt đầu phase auth/users: thêm User repository + password hasher, use case register, endpoint `POST /api/v1/auth/register`, unit tests và integration tests.
- `2026-04-14`: Hoàn thiện auth/users bằng JWT service thật với `access token + refresh token`, login flow, refresh flow, endpoint `GET /api/v1/auth/me`, DTO response riêng cho auth/user profile, và E2E test chạy qua HTTP thật với `supertest`.
- `2026-04-14`: Chuẩn hóa auth token bằng claim `jti` để mỗi lần issue token là duy nhất, tránh va chạm token khi refresh xảy ra trong cùng giây.
- `2026-04-14`: Ghi rõ yêu cầu deploy thủ công trước khi test trên domain thật.

### Verification

- `pnpm test:unit` pass (`14` suites, `28` tests)
- `pnpm test:integration` pass (`4` suites, `15` tests)
- `pnpm test:e2e` pass (`1` suite, `1` test)
- `pnpm lint` pass
- `pnpm build` pass
- `DATABASE_URL=postgresql://journey:journey@localhost:5432/journey?schema=public node ./node_modules/prisma/build/index.js validate --schema db/schema.prisma` pass
- Apply `db/migrations/20260413114500_create_users/migration.sql` trên PostgreSQL thật vào database tạm `journey_verify` pass
- `DATABASE_URL=postgresql://journey:journey@localhost:5432/journey_verify?schema=public node ./node_modules/prisma/build/index.js db pull --print --schema db/schema.prisma` pass

### Artifact

- `backend/src/shared/infrastructure/prisma/prisma.module.ts`
- `backend/src/modules/users/users.module.ts`
- `backend/src/modules/health/**`
- `backend/docker/postgres/init/00-create-databases.sql`
- `backend/docker-compose.yml`
- `backend/db/schema.prisma`
- `backend/db/migrations/migration_lock.toml`
- `backend/db/migrations/20260413114500_create_users/migration.sql`
- `backend/test/unit/modules/health/application/health.service.spec.ts`
- `backend/test/integration/health.integration.spec.ts`
- `backend/scripts/check-secrets.sh`
- `backend/documents/06_backend-secrets-and-runtime-runbook.md`
- `.github/workflows/backend-ci.yml`
- `.github/workflows/deploy-backend.yml`
- `backend/.env.production.example`
- `backend/documents/07_backend-personal-machine-deploy-runbook.md`
- `backend/scripts/common-production.sh`
- `backend/scripts/start-production.sh`
- `backend/scripts/stop-production.sh`
- `backend/scripts/restart-production.sh`
- `backend/scripts/check-production-health.sh`
- `backend/scripts/ensure-runtime-database.sh`
- `backend/deploy/apache/api-backend-vhost.conf.example`
- `backend/documents/08_backend-personal-machine-domain-runbook.md`
- `backend/deploy/apache/api-buicojourney.com.conf`
- `backend/documents/09_buicojourney-domain-setup.md`
- `backend/documents/10_cloudflare-tunnel-personal-machine-runbook.md`
- `backend/deploy/cloudflare/journey-backend-config.yml.example`
- `backend/scripts/windows/start-personal-server.ps1`
- `backend/scripts/windows/status-personal-server.ps1`
- `backend/scripts/windows/register-personal-server-startup-task.ps1`
- `backend/src/modules/auth/application/auth-session.ts`
- `backend/src/modules/auth/application/auth-tokens.ts`
- `backend/src/modules/auth/application/build-authenticated-user.ts`
- `backend/src/modules/auth/application/ports/auth-token-service.port.ts`
- `backend/src/modules/auth/application/services/login-user.service.ts`
- `backend/src/modules/auth/application/services/refresh-auth-session.service.ts`
- `backend/src/modules/auth/application/services/register-auth-session.service.ts`
- `backend/src/modules/auth/infrastructure/security/jwt-auth-token.service.ts`
- `backend/src/modules/auth/presentation/dto/*.ts`
- `backend/src/modules/users/application/services/get-user-profile.service.ts`
- `backend/src/modules/users/application/user-profile.ts`
- `backend/test/support/in-memory-user-repository.ts`
- `backend/test/integration/auth/auth-session.integration.spec.ts`
- `backend/test/e2e/auth/auth-session.e2e.spec.ts`
- `backend/test/jest.e2e.config.ts`

### Ghi chú

- Reality-based verification của migration đang được thực hiện bằng PostgreSQL thật + SQL apply + Prisma introspection trên database tạm, thay vì chỉ dựa vào file review.
- Trên máy hiện tại, local runtime ổn định hơn khi chạy verify bằng Node `20.20.2`; CI vẫn giữ Node `22`, là runtime mục tiêu của pipeline.
- Từ mốc này, file env production thật không còn là prerequisite trên máy đích; nguồn sự thật của runtime config được chuyển sang GitHub Secrets/Variables.
- Auth flow hiện dùng JWT stateless với `jti` để đảm bảo token mới được issue khác token cũ ngay cả khi refresh diễn ra trong cùng giây; chiến lược revoke/blacklist vẫn là phạm vi cho phase hardening sau.

## Phase 04

Status: `Completed`

### Mục tiêu

- Hoàn thiện slice `trips` end-to-end để frontend có thể dùng contract thật thay cho placeholder.
- Giữ đúng hướng module-driven: domain rule nằm trong `trips`, persistence qua Prisma repository, và HTTP contract tách khỏi persistence model.

### Nhật ký

- `2026-04-17`: Đồng bộ lại execution log cho phase `trips` theo artifact hiện có trong repo, vì checklist phase trước đó chưa phản ánh đúng trạng thái code.
- `2026-04-17`: Ghi nhận `TripsModule` đã được mount vào `AppModule`, có đủ `CreateTripService`, `ListTripsService`, `GetTripDetailService`, `UpdateTripService`, và `DeleteTripService`.
- `2026-04-17`: Ghi nhận domain `Trip`, `TripDateRange`, `TripBudget`, trip sort, repository port, và Prisma repository đã sẵn.
- `2026-04-17`: Ghi nhận contract HTTP thật cho `POST /api/v1/trips`, `GET /api/v1/trips`, `GET /api/v1/trips/:tripId`, `PATCH /api/v1/trips/:tripId`, và `DELETE /api/v1/trips/:tripId`.
- `2026-04-17`: Ghi nhận migration `db/migrations/20260415093000_create_trips/migration.sql` cùng unit, integration, và e2e coverage cho phase này.

### Verification

- File review đối chiếu `backend/src/modules/trips/**` với `backend/src/app/app.module.ts`
- File review đối chiếu migration `backend/db/migrations/20260415093000_create_trips/migration.sql`
- File review đối chiếu coverage hiện có:
  - `backend/test/unit/modules/trips/domain/trip.spec.ts`
  - `backend/test/integration/trips/prisma-trip.repository.integration.spec.ts`
  - `backend/test/integration/trips/trips.integration.spec.ts`
  - `backend/test/e2e/trips/trips.e2e.spec.ts`

### Artifact

- `backend/src/modules/trips/**`
- `backend/db/migrations/20260415093000_create_trips/migration.sql`
- `backend/test/support/in-memory-trip-repository.ts`
- `backend/test/unit/modules/trips/domain/trip.spec.ts`
- `backend/test/integration/trips/prisma-trip.repository.integration.spec.ts`
- `backend/test/integration/trips/trips.integration.spec.ts`
- `backend/test/e2e/trips/trips.e2e.spec.ts`

### Ghi chú

- Từ trạng thái hiện tại, frontend Phase 05 đã có thể bám contract `trips` thật thay vì tiếp tục giữ placeholder.
- Theo lịch sử implementation ngay sau mốc này, backend tiếp tục mở bridge `itineraries/budgets`; còn ưu tiên DRD-aligned hiện hành phải bám `01_backend-phase-checklist.md`.

## Phase 05

Status: `Completed`

### Mục tiêu

- Mở `itineraries` và `budgets` bằng contract backend thật để frontend Phase 06 không còn bị block bởi planning cũ.
- Giữ scope nhỏ nhưng end-to-end: thêm ngày, thêm activity, cập nhật activity, xem itinerary, và tính budget summary theo trip.

### Nhật ký

- `2026-04-17`: Thêm persistence Prisma cho `trip_itinerary_days` và `trip_itinerary_activities`, cùng migration `20260417113000_create_itinerary_and_budget_phase`.
- `2026-04-17`: Tạo `ItinerariesModule` với repository port + Prisma adapter, `AddItineraryDayService`, `AddItineraryActivityService`, `UpdateItineraryActivityService`, và `GetTripItineraryService`.
- `2026-04-17`: Tạo `BudgetsModule` với `GetTripBudgetSummaryService`, tính tổng planned cost từ itinerary activities so với `trip.budgetAmount`.
- `2026-04-17`: Mount `ItinerariesModule` và `BudgetsModule` vào `AppModule`, mở các endpoint:
  - `GET /api/v1/trips/:tripId/itinerary`
  - `POST /api/v1/trips/:tripId/itinerary/days`
  - `POST /api/v1/trips/:tripId/itinerary/days/:dayId/activities`
  - `PATCH /api/v1/trips/:tripId/itinerary/days/:dayId/activities/:activityId`
  - `GET /api/v1/trips/:tripId/budget-summary`
- `2026-04-17`: Bổ sung in-memory itinerary repository cho test app pipeline, unit test cho budget summary rule, Prisma repository integration, HTTP integration, và e2e cho itinerary/budget flow.
- `2026-04-20`: Cutover `GetTripBudgetSummaryService` sang đọc `PlanNode`, đếm `day/activity` từ planner tree, và thêm additive mixed-currency breakdown qua `hasMixedCurrencies` + `totalsByCurrency`.
- `2026-04-20`: Tách budget verification thành suite riêng ở `test/unit/modules/budgets`, `test/integration/budgets`, và `test/e2e/budgets`, đồng thời gỡ assertion budget khỏi suite `itineraries` để legacy bridge test quay về đúng scope.

### Verification

- `pnpm prisma:generate` pass
- `pnpm exec tsc -p tsconfig.json --noEmit --pretty false` pass
- `pnpm build` pass
- `DATABASE_URL=postgresql://journey:journey@localhost:5432/journey_test?schema=public pnpm prisma:validate` pass
- `pnpm exec jest --config ./test/jest.unit.config.ts test/unit/modules/budgets/domain/trip-budget-summary.spec.ts --runInBand` pass
- `pnpm test:prepare-db` pass
- `pnpm exec jest --config ./test/jest.integration.config.ts test/integration/itineraries/prisma-itinerary.repository.integration.spec.ts test/integration/itineraries/itineraries.integration.spec.ts --runInBand` pass
- `pnpm exec jest --config ./test/jest.e2e.config.ts test/e2e/itineraries/itineraries.e2e.spec.ts --runInBand` pass
- `pnpm lint` pass
- `2026-04-20`: File review cho follow-up cutover `PlanNode` và budget-specific suites pass
- `2026-04-20`: Runtime verify follow-up bị chặn vì shell hiện tại không có `node/pnpm` tương thích với `pnpm`-linked `node_modules`, nên chưa thể xác nhận lại `jest`/`nest build` trong session này

### Artifact

- `backend/db/schema.prisma`
- `backend/db/migrations/20260417113000_create_itinerary_and_budget_phase/migration.sql`
- `backend/src/modules/itineraries/**`
- `backend/src/modules/budgets/**`
- `backend/test/support/in-memory-itinerary.repository.ts`
- `backend/test/unit/modules/budgets/domain/trip-budget-summary.spec.ts`
- `backend/test/unit/modules/budgets/application/services/get-trip-budget-summary.service.spec.ts`
- `backend/test/integration/budgets/budgets.integration.spec.ts`
- `backend/test/e2e/budgets/budgets.e2e.spec.ts`
- `backend/test/integration/itineraries/prisma-itinerary.repository.integration.spec.ts`
- `backend/test/integration/itineraries/itineraries.integration.spec.ts`
- `backend/test/e2e/itineraries/itineraries.e2e.spec.ts`

### Ghi chú

- Budget summary owner flow hiện đã đọc từ `PlanNode` thay vì itinerary bridge; top-level summary fields vẫn được giữ như compatibility layer cho frontend hiện tại.
- Mixed-currency hiện không conversion ngầm; source đã trả additive breakdown theo từng currency, còn policy sâu hơn cho transaction ledger hoặc FX vẫn là phase sau.
- Từ trạng thái này, frontend phase bridge có thể nối API thật cho timeline/day planner và budget summary mà không cần giữ placeholder backend-blocked nữa.
- Source hiện tại đã đi xa hơn phase bridge này: planner core và budget summary owner flow đều đã chạy trên `PlanNode`, còn phần việc mở của checklist `Phase 05` là runtime verify, migration strategy, và cleanup legacy support.

## Phase 06

Status: `Completed`

### Mục tiêu

- Hoàn thiện planner core trên `PlanNode` để flow planner chính không còn phụ thuộc `TripItineraryDay -> TripItineraryActivity`.
- Mở planning module riêng với full read/write contract cho owner qua auth routes.

### Nhật ký

- `2026-04-18`: Bổ sung `PlanNodeType` và model `PlanNode` vào Prisma schema, cùng migration `20260418153000_add_plan_nodes`.
- `2026-04-18`: Tạo `PlanningModule`, `PlanNode` domain model, repository port, Prisma repository, và `PlanningController`.
- `2026-04-18`: Mở các endpoint `GET /api/v1/trips/:tripId/planner`, `POST /api/v1/nodes`, `PATCH /api/v1/nodes/:nodeId`, và `DELETE /api/v1/nodes/:nodeId`.
- `2026-04-18`: Bổ sung service `GetTripPlannerService`, `CreatePlanNodeService`, `UpdatePlanNodeService`, `DeletePlanNodeService`, và in-memory repository cho test pipeline.
- `2026-04-18`: Ghi nhận unit, integration, repository integration, và e2e coverage cho planner flow trên `PlanNode`.

### Verification

- File review đối chiếu `backend/db/schema.prisma` và migration `backend/db/migrations/20260418153000_add_plan_nodes/migration.sql`
- File review đối chiếu `backend/src/modules/planning/**` với `backend/src/app/app.module.ts`
- File review đối chiếu coverage hiện có:
  - `backend/test/unit/modules/planning/domain/plan-node.spec.ts`
  - `backend/test/integration/planning/prisma-plan-node.repository.integration.spec.ts`
  - `backend/test/integration/planning/planning.integration.spec.ts`
  - `backend/test/e2e/planning/planning.e2e.spec.ts`

### Artifact

- `backend/db/schema.prisma`
- `backend/db/migrations/20260418153000_add_plan_nodes/migration.sql`
- `backend/src/modules/planning/**`
- `backend/test/support/in-memory-plan-node-repository.ts`
- `backend/test/unit/modules/planning/domain/plan-node.spec.ts`
- `backend/test/integration/planning/prisma-plan-node.repository.integration.spec.ts`
- `backend/test/integration/planning/planning.integration.spec.ts`
- `backend/test/e2e/planning/planning.e2e.spec.ts`

### Ghi chú

- Phase này tương ứng với checklist `Phase 04` sau re-baseline DRD.
- Planner read/write owner flow hiện đã dùng `PlanNode` thật.

## Post Phase 06 Re-baseline Additions

Status: `Completed through Phase 08-A/08-B hardening slices`

### Tóm tắt

- Source hiện đã đi qua các mốc sau checklist hiện hành:
  - `Phase 05`: budget summary cutover sang `PlanNode`
  - `Phase 06`: public trip sharing
  - `Phase 07`: community minimal với `posts`
  - `Phase 08-A/08-B`: focused hardening cho app error codes và ownership/authorization

### Nhật ký đồng bộ

- `2026-04-20`: Budget summary owner flow đã chuyển sang đọc `PlanNode`, có `hasMixedCurrencies` và `totalsByCurrency`, đồng thời tách budget suite khỏi itinerary suite.
- `2026-04-20`: Mở public trip list/detail và public planner read dưới namespace `/api/v1/public/trips`.
- `2026-04-20`: Mở module `posts` với create auth-only, public list/detail, và owner list `GET /api/v1/posts/mine` cho profile.
- `2026-04-21`: Hardening app error codes cho auth/trips/planning/public permission flow.
- `2026-04-21`: Bổ sung ownership/authorization coverage cho trips, planning, sticker legacy endpoint, budgets, và posts.

### Verification gần nhất trong lượt sync này

- `2026-05-03`: `pnpm lint` pass.
- `2026-05-03`: `pnpm test:unit` pass (`21` suites, `52` tests).

### Deferred còn đúng

- Quyết định xóa hoặc giữ legacy `PlanNodeSticker` endpoints sau khi frontend/journal contract chốt.
- Comment endpoints.
- Production smoke thật cho auth/trips/planner/public trip/posts sau deploy.

### Bổ sung `2026-05-08`

- Runtime DB `journey_prod_local` được kiểm tra trực tiếp trước destructive cleanup:
  - `trip_itinerary_days = 0`
  - `trip_itinerary_activities = 0`
  - `plan_nodes = 2`
- Từ trạng thái đó, backend đã mở cleanup phase cho legacy itinerary support:
  - gỡ `ItinerariesModule` và toàn bộ route/service/repository/domain test support liên quan
  - drop bảng `trip_itinerary_days` và `trip_itinerary_activities`
  - gỡ helper/script migration khỏi source active
