# Backend Phase Execution Log

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

Status: `In Progress`

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
- `2026-04-14`: Bắt đầu phase auth/users: thêm User repository + password hasher, use case register, endpoint `POST /api/v1/auth/register`, unit tests và integration tests.

### Verification

- `node ./node_modules/jest/bin/jest.js --config ./test/jest.config.ts --runInBand` pass (`11` suites, `22` tests) với `PATH` trỏ Node `20.20.2`
- `node ./node_modules/eslint/bin/eslint.js "{src,test}/**/*.ts" --max-warnings=0` pass
- `node ./node_modules/typescript/bin/tsc -p tsconfig.json --noEmit` pass
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
- `backend/deploy/apache/api-backend-vhost.conf.example`
- `backend/documents/08_backend-personal-machine-domain-runbook.md`
- `backend/deploy/apache/api-buicojourney.com.conf`
- `backend/documents/09_buicojourney-domain-setup.md`
- `backend/documents/10_cloudflare-tunnel-personal-machine-runbook.md`
- `backend/scripts/windows/start-personal-server.ps1`
- `backend/scripts/windows/register-personal-server-startup-task.ps1`

### Ghi chú

- Reality-based verification của migration đang được thực hiện bằng PostgreSQL thật + SQL apply + Prisma introspection trên database tạm, thay vì chỉ dựa vào file review.
- Trên máy hiện tại, local runtime ổn định hơn khi chạy verify bằng Node `20.20.2`; CI vẫn giữ Node `22`, là runtime mục tiêu của pipeline.
- Từ mốc này, file env production thật không còn là prerequisite trên máy đích; nguồn sự thật của runtime config được chuyển sang GitHub Secrets/Variables.
