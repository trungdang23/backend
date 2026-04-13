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
- Backend CI được định nghĩa tại `.github/workflows/backend-ci.yml` và chạy `pnpm prisma:generate`, `pnpm lint`, `pnpm test`, `pnpm build`, và `pnpm prisma:validate` cho thay đổi trong `backend/`.
- Nền tảng auth đã có `AuthModule`, `AccessTokenAuthGuard`, `@Public()`, và `@CurrentUser()`. JWT verification adapter thực tế sẽ được hoàn thiện ở Phase 03.

## Test Strategy

- Unit tests validate isolated logic with mocked or in-memory dependencies.
- Integration tests boot the real Nest application wiring and exercise HTTP contracts without controller mocks.
- As database-backed modules are added, integration tests must move to real Prisma repositories against a disposable PostgreSQL instance.
