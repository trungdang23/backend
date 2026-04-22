# Backend Phase 05 Budget Alignment Backlog

## Mục tiêu

Đóng `Phase 05` của backend để `GET /api/v1/trips/:tripId/budget-summary` không còn phụ thuộc `TripItineraryDay -> TripItineraryActivity`, và aligned với planner-first model trên `PlanNode`.

Phase này tập trung vào:

- cutover budget summary từ itinerary bridge sang `PlanNode`
- chốt lại rule `auto/manual` cho summary contract hiện tại
- chốt policy mixed-currency ở mức MVP, không conversion ngầm
- giữ endpoint và response envelope đủ ổn định để frontend không phải đổi route/query wiring
- tách budget verification khỏi suite `itineraries` để phase này có test surface riêng
- ghi rõ strategy legacy support và cleanup sau cutover

Phase này chưa xử lý:

- public budget summary endpoint riêng
- currency conversion hoặc exchange-rate logic
- redesign UI budget metrics ở frontend
- drop bảng `TripItinerary*` hoặc destructive cleanup
- full historical migration dữ liệu itinerary sang `PlanNode` trong cùng backlog này

## Trạng thái

- Status: `Implemented in source`
- Date: `2026-04-20`
- Owner area:
  - `backend/src/modules/budgets`
  - `backend/src/modules/planning`
  - `backend/test`
- Trạng thái source hiện tại:
  - planner owner/public flow đã đọc từ `PlanNode`
  - `GET /api/v1/trips/:tripId/budget-summary` đã đọc từ `PlanNode`
  - `TripBudgetSummary` hiện đã có additive mixed-currency breakdown qua `hasMixedCurrencies` và `totalsByCurrency`
  - budget summary đã có suite riêng ở `test/unit`, `test/integration`, và `test/e2e`
  - assertion budget cũ đã được tách khỏi suite `itineraries`
  - runtime verification còn bị chặn bởi shell hiện tại chưa có `node/pnpm` tương thích với `pnpm`-linked `node_modules`
- Dependency chặn:
  - `Phase 03` đã chốt `Trip.budgetMode/manualBudget`
  - `Phase 04` đã chốt `PlanNode.costAmount/costCurrency`
  - frontend hiện đang dùng endpoint budget summary cũ tại route `/app/trips/:tripId`
- Dependency mở ra sau khi xong:
  - `Phase 07 FE`
  - `Phase 08 BE`
  - cleanup quyết đoán hơn cho itinerary bridge

## Focused hardening sub-slice - 2026-04-21

- Scope của lượt này:
  - khóa regression `budget-summary` sau planner mutation thật
  - verify summary recompute đúng sau `PATCH /api/v1/nodes/:nodeId`
  - verify summary recompute đúng sau `DELETE /api/v1/nodes/:nodeId`
  - giữ mixed-currency/additive breakdown không drift khi mutation làm đổi currency set
- File owner của lượt này:
  - `test/integration/budgets/budgets.integration.spec.ts`
  - `test/e2e/budgets/budgets.e2e.spec.ts`
- Deferred rõ trong lượt này:
  - public budget summary endpoint riêng
  - browser/runtime verify trên deploy thật
  - cleanup legacy itinerary bridge

## Quyết định rollout cần chốt

## 1. Giữ nguyên endpoint, đổi source of truth phía sau

Phase này không đổi route:

- `GET /api/v1/trips/:tripId/budget-summary`

Điều cần đổi là nguồn dữ liệu:

- bỏ phụ thuộc vào `ItineraryRepositoryPort`
- đọc từ `PlanNode`
- giữ response envelope tương thích để frontend không phải đổi URL hay query key

## 2. `PlanNode` là source of truth duy nhất cho phần planned cost

Sau Phase 05:

- `totalPlannedAmount` phải được tính từ `PlanNode.costAmount`
- `totalDays` phải được tính từ số node `type = day`
- `totalActivities` phải được tính từ số node `type = activity`
- node không có đủ cặp `costAmount + costCurrency` không tham gia aggregate tiền

`TripItineraryDay` và `TripItineraryActivity` không còn là nguồn budget summary hợp lệ cho flow planner chính.

## 3. Rule `manual` và `auto` phải rõ ở summary contract

### `manual`

- `currency = Trip.manualBudgetCurrency`
- `totalBudgetAmount = Trip.manualBudgetAmount`
- `totalPlannedAmount = tổng planned cost theo currency summary`
- `remainingAmount = totalBudgetAmount - totalPlannedAmount`
- `isOverBudget = totalPlannedAmount > totalBudgetAmount`

### `auto`

- `totalPlannedAmount = tổng planned cost theo currency summary`
- `totalBudgetAmount = totalPlannedAmount`
- `remainingAmount = 0`
- `isOverBudget = false`

Lý do:

- checklist hiện tại đã chốt `auto -> sum(node.costAmount)`
- frontend hiện hiển thị label riêng cho `budgetMode = auto`, nên phase này không cần dựng thêm một ceiling budget giả

## 4. Mixed currency không được conversion ngầm

Phase này không tự quy đổi tiền tệ.

Khuyến nghị contract additive cho response:

- giữ các field hiện có:
  - `currency`
  - `totalBudgetAmount`
  - `totalPlannedAmount`
  - `remainingAmount`
  - `totalDays`
  - `totalActivities`
  - `isOverBudget`
- bổ sung:
  - `hasMixedCurrencies`
  - `totalsByCurrency[]`

Khuyến nghị shape:

```json
{
  "tripId": "trip-id",
  "currency": "VND",
  "totalBudgetAmount": 5000000,
  "totalPlannedAmount": 1750000,
  "remainingAmount": 3250000,
  "totalDays": 2,
  "totalActivities": 3,
  "isOverBudget": false,
  "hasMixedCurrencies": false,
  "totalsByCurrency": [
    {
      "currency": "VND",
      "plannedAmount": 1750000,
      "nodeCount": 4
    }
  ]
}
```

MVP recommendation:

- `totalsByCurrency` là source of truth cho case mixed currency
- top-level single-currency fields là compatibility layer cho frontend hiện tại
- nếu mixed currency xảy ra, implementation phải chọn `currency` theo rule deterministic và ghi rõ trong test/code comment
- fallback được khuyến nghị cho compatibility fields là `Trip.budgetCurrency`

## 5. Phase này phải cắt budget ra khỏi suite itinerary

Budget summary hiện đang được chứng minh chủ yếu qua:

- `backend/test/integration/itineraries/itineraries.integration.spec.ts`
- `backend/test/e2e/itineraries/itineraries.e2e.spec.ts`

Sau Phase 05, budget cần có test surface riêng:

- unit cho domain/service budget
- integration cho HTTP contract budget dựa trên `PlanNode`
- e2e hoặc integration đủ mạnh để chứng minh cutover khỏi itinerary bridge

## 6. Legacy bridge được freeze, chưa cleanup ngay

Phase này chỉ cắt dependency budget khỏi itinerary bridge.

Không làm trong cùng backlog này:

- xóa itinerary tables
- xóa itinerary endpoints
- rewrite dữ liệu lịch sử hàng loạt nếu chưa có plan rollback

Nhưng phải chốt:

- rollback plan nếu budget summary mới lệch số
- migration note cho dữ liệu cũ đang còn ở itinerary bridge
- tiêu chí nào cho phép cleanup legacy ở phase sau

## Contract backend cần bám sau Phase 05

## Endpoint

- `GET /api/v1/trips/:tripId/budget-summary`

## Response semantics mục tiêu

- response envelope giữ như hiện tại
- `currency` là display currency cho compatibility fields
- `totalsByCurrency[]` là additive breakdown cho case mixed currency
- `totalDays` đếm node `type = day`
- `totalActivities` đếm node `type = activity`

## Manual mode example

```json
{
  "success": true,
  "data": {
    "tripId": "trip-id",
    "currency": "VND",
    "totalBudgetAmount": 5000000,
    "totalPlannedAmount": 1750000,
    "remainingAmount": 3250000,
    "totalDays": 2,
    "totalActivities": 3,
    "isOverBudget": false,
    "hasMixedCurrencies": false,
    "totalsByCurrency": [
      {
        "currency": "VND",
        "plannedAmount": 1750000,
        "nodeCount": 4
      }
    ]
  }
}
```

## Auto mode example

```json
{
  "success": true,
  "data": {
    "tripId": "trip-id",
    "currency": "VND",
    "totalBudgetAmount": 1750000,
    "totalPlannedAmount": 1750000,
    "remainingAmount": 0,
    "totalDays": 2,
    "totalActivities": 3,
    "isOverBudget": false,
    "hasMixedCurrencies": false,
    "totalsByCurrency": [
      {
        "currency": "VND",
        "plannedAmount": 1750000,
        "nodeCount": 4
      }
    ]
  }
}
```

## Mixed currency expectations

- không conversion
- `totalsByCurrency[]` phải phản ánh đầy đủ currency có mặt trong planner costed nodes
- top-level fields được xem là compatibility fields cho FE hiện tại
- implementation phải có test riêng cho mixed currency thay vì để behavior ngầm

## Slice BE-05A - Contract và domain alignment

### Việc cần làm

- [x] Chốt lại semantics của `TripBudgetSummary` theo `PlanNode`
- [x] Bổ sung additive fields cho mixed currency:
  - `hasMixedCurrencies`
  - `totalsByCurrency`
- [x] Chốt rule `manual` vs `auto` cho top-level summary fields
- [x] Chốt rule tính:
  - `totalDays`
  - `totalActivities`
  - `nodeCount` trong breakdown
- [x] Ghi rõ deterministic fallback cho `currency` compatibility field

### File dự kiến

- `src/modules/budgets/domain/trip-budget-summary.ts`
- `src/modules/budgets/presentation/dto/budget-summary-response.dto.ts`

## Slice BE-05B - Service cutover sang `PlanNode`

### Việc cần làm

- [x] Bỏ dependency `ITINERARY_REPOSITORY` khỏi `GetTripBudgetSummaryService`
- [x] Inject `PLAN_NODE_REPOSITORY` hoặc abstraction aggregate phù hợp
- [x] Aggregate planned cost từ `PlanNode[]`
- [x] Đếm node `day/activity`
- [x] Giữ semantics `trip not found` và ownership như hiện tại
- [x] Không làm controller route đổi path hoặc auth policy

### File dự kiến

- `src/modules/budgets/application/services/get-trip-budget-summary.service.ts`
- `src/modules/budgets/budgets.module.ts`
- nếu cần tối ưu query:
  - `src/modules/planning/application/ports/plan-node-repository.port.ts`
  - `src/modules/planning/infrastructure/prisma/prisma-plan-node.repository.ts`

## Slice BE-05C - HTTP contract, Swagger và frontend compatibility

### Việc cần làm

- [x] Giữ success envelope của budget summary không đổi
- [x] Cập nhật Swagger example cho:
  - manual
  - auto
  - mixed currency
- [x] Giữ frontend route hiện tại không phải đổi URL/query key
- [x] Ghi rõ additive fields mới là optional-compatible cho FE hiện tại

### File dự kiến

- `src/modules/budgets/presentation/budgets.controller.ts`
- `src/modules/budgets/presentation/dto/budget-summary-response.dto.ts`

## Slice BE-05D - Tests và regression safety

### Unit

- [x] `TripBudgetSummary` tạo được summary manual hợp lệ
- [x] `TripBudgetSummary` tạo được summary auto với `remainingAmount = 0`
- [x] mixed currency breakdown không conversion
- [x] currency normalization vẫn đúng
- [x] over-budget chỉ xảy ra ở manual mode

### Integration

- [x] budget summary đọc từ `PlanNode`, không đọc itinerary bridge
- [x] `totalDays` đếm đúng node `day`
- [x] `totalActivities` đếm đúng node `activity`
- [x] manual mode trả `remainingAmount` đúng
- [x] auto mode trả `totalBudgetAmount = totalPlannedAmount`
- [x] mixed currency có `totalsByCurrency`

### E2E / HTTP contract

- [x] owner đọc được budget summary theo planner mới
- [x] trip không tồn tại trả đúng lỗi hiện tại
- [x] update planner node cost làm budget summary đổi theo
- [x] itinerary thay đổi không còn là nguồn làm budget summary đổi

### File dự kiến

- `test/unit/modules/budgets/domain/trip-budget-summary.spec.ts`
- `test/unit/modules/budgets/application/get-trip-budget-summary.service.spec.ts`
- `test/integration/budgets/budgets.integration.spec.ts`
- `test/e2e/budgets/budgets.e2e.spec.ts`

## Slice BE-05E - Legacy bridge strategy và cleanup note

### Việc cần làm

- [x] Ghi rõ itinerary bridge sau phase này chỉ còn:
  - legacy endpoints
  - migration support
  - rollback ngắn hạn
- [x] Chốt rollback plan nếu budget cutover lệch số
- [x] Chốt migration note cho dữ liệu lịch sử chưa có `PlanNode` đủ cost
- [x] Chốt tiêu chí mở cleanup phase:
  - FE đã không còn coi budget summary là bridge dependency
  - budget tests tách riêng đã ổn định
  - smoke deploy không còn lệch số

### File dự kiến

- `documents/01_backend-phase-checklist.md`
- `documents/05_backend-phase-execution-log.md`
- runbook hoặc migration note mới nếu cần ở `documents/`

### Current note after re-baseline

- Itinerary bridge sau `Phase 05` chỉ còn hợp lệ cho legacy endpoints, migration support, và rollback ngắn hạn.
- Rollback plan hiện tại:
  - không drop `TripItinerary*` tables hoặc endpoints trong phase này
  - nếu budget summary lệch số trên deploy thật, ưu tiên rollback ở mức service/controller wiring thay vì sửa dữ liệu nóng
  - so sánh lại `totalsByCurrency` và node cost trong planner trước khi mở cleanup phase
- Migration note hiện tại:
  - trip lịch sử chưa có `PlanNode` đủ `costAmount/costCurrency` sẽ chưa phản ánh đầy đủ budget summary mới
  - cleanup legacy chỉ nên mở sau khi có migration helper hoặc runbook rõ ràng cho dữ liệu cũ
- Tiêu chí mở cleanup phase:
  - frontend owner/public flows không còn phụ thuộc itinerary bridge cho planner/budget semantics
  - budget suite riêng ổn định ở unit/integration/e2e và smoke deploy
  - đã có migration strategy hoặc runbook đủ an toàn cho trip lịch sử

## Definition of done cho Phase 05

- `GET /api/v1/trips/:tripId/budget-summary` đọc từ `PlanNode`
- `manual` và `auto` bám đúng rule trong checklist
- mixed currency không conversion ngầm
- budget summary có test surface riêng ngoài suite itinerary
- frontend route hiện tại không cần đổi endpoint để nhận contract mới
- itinerary bridge không còn là source of truth cho budget summary
