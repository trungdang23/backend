# Backend Legacy Itinerary Cleanup Backlog

## Mục tiêu

- Gỡ hoàn toàn backend legacy itinerary support sau khi đã xác nhận không còn dữ liệu cần backfill.
- Giữ `PlanNode` là planner model duy nhất còn sống trong source và database contract hiện hành.
- Loại bỏ code, route, test, và schema không còn giá trị vận hành để giảm bề mặt bảo trì.

## Trạng thái

- Status: `Completed`
- Date: `2026-05-08`
- Owner area:
  - `backend/src/app`
  - `backend/src/modules/itineraries`
  - `backend/src/modules/planning`
  - `backend/db`
  - `backend/test`
  - `backend/README.md`

## Điều kiện mở cleanup đã xác nhận

- [x] Budget summary owner flow đã đọc từ `PlanNode`.
- [x] Planner owner/public flow đã đọc từ `PlanNode`.
- [x] Runtime smoke `budget-summary` trên deploy thật đã pass.
- [x] Runtime DB check trước cleanup xác nhận:
  - `trip_itinerary_days = 0`
  - `trip_itinerary_activities = 0`
  - `plan_nodes = 2`
- [x] Không còn trip owner flow phải đọc dữ liệu duy nhất từ `TripItinerary*`.

## Scope của lượt cleanup

- [x] Gỡ `ItinerariesModule` khỏi `AppModule`.
- [x] Xóa controller/service/repository/domain/DTO của legacy itinerary module.
- [x] Xóa helper/script migration đã chỉ còn phục vụ bridge:
  - `scripts/migrate-itinerary-to-plan-nodes.ts`
  - `src/modules/planning/application/migrations/build-plan-nodes-from-legacy-itinerary.ts`
- [x] Xóa test/support chỉ phục vụ itinerary bridge.
- [x] Tạo Prisma migration để drop:
  - `trip_itinerary_days`
  - `trip_itinerary_activities`
- [x] Gỡ `Trip.itineraryDays` khỏi Prisma schema.
- [x] Cập nhật README/checklist/runbook để không còn mô tả itinerary bridge là active path.

## Deferred sau cleanup

- public budget summary endpoint riêng
- currency conversion hoặc exchange-rate logic
- comment endpoints
- cleanup riêng cho các legacy surface khác như `PlanNodeSticker` nếu không còn caller

## Verification

- [x] targeted integration test cho swagger docs để xác nhận legacy itinerary paths không còn trong OpenAPI
- [x] targeted integration test cho repository Prisma còn sống sau cleanup
- [x] backend lint
- [x] backend build
- [x] Prisma schema validate

## Artifact

- `backend/db/schema.prisma`
- `backend/db/migrations/20260508173000_drop_legacy_itinerary_support/migration.sql`
- `backend/src/app/app.module.ts`
- `backend/test/integration/swagger-docs.integration.spec.ts`
- `backend/README.md`
- `backend/documents/01_backend-phase-checklist.md`
- `backend/documents/18_backend-phase-05-budget-alignment-backlog.md`
- `backend/documents/20_backend-itinerary-plan-node-migration-runbook.md`
