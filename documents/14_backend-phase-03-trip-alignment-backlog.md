# Backend Phase 03 Trip Alignment Backlog

## Mục tiêu

Đóng `Phase 03` của backend để `Trip` aligned với contract mới trước khi mở `PlanNode`.

Phase này chỉ xử lý:

- `visibility`
- `budgetMode`
- `manualBudgetAmount`
- `manualBudgetCurrency`
- DTO/API contract mới của `Trip`
- test và rollout cho contract mới

Phase này chưa xử lý:

- `PlanNode`
- planner APIs mới
- public read cho guest
- migrate budget summary sang `PlanNode`

## Trạng thái

- Status: `Completed`
- Completed at: `2026-04-18`
- Owner area: `backend/src/modules/trips`
- Dependency chặn: không có
- Dependency mở ra sau khi xong:
  - `Phase 03 FE`
  - `Phase 04 BE`
  - `Phase 05 BE`
  - `Phase 06 BE`

## Quyết định triển khai cần chốt

## 1. Contract mới của `Trip`

Public API của `Trip` phải có thêm:

- `visibility: private | unlisted | public`
- `budgetMode: auto | manual`
- `manualBudgetAmount: number | null`
- `manualBudgetCurrency: string | null`

Các field hiện có vẫn giữ ở phase này nếu đang phục vụ UX/source hiện tại:

- `destination`
- `summaryNotes`
- `coverImageUrl`
- `timezone`

Lý do:

- source FE hiện đang dùng các field này
- DRD mới không bắt buộc phải loại bỏ ngay
- bỏ sớm sẽ tạo breaking change không cần thiết

## 2. Strategy với `budgetAmount/budgetCurrency` cũ

Không cố xóa vội cặp field cũ khỏi DB trong Phase 03.

Cách đi phù hợp nhất:

- thêm field mới cho contract đúng DRD
- giữ `budgetAmount/budgetCurrency` trong persistence để không phá bridge hiện tại
- public API chuyển sang ưu tiên `budgetMode/manualBudget*`
- ghi rõ `budgetAmount/budgetCurrency` là compatibility fields nội bộ, không tiếp tục mở rộng nghiệp vụ mới lên đó

## 3. Rule dữ liệu cần áp dụng ngay

- `name` là bắt buộc
- `startDate <= endDate`
- `visibility` chỉ nhận `private | unlisted | public`
- `budgetMode` chỉ nhận `auto | manual`
- `manualBudgetAmount >= 0` nếu có giá trị
- `manualBudgetAmount` và `manualBudgetCurrency` bắt buộc khi `budgetMode = manual`
- `manualBudgetAmount` và `manualBudgetCurrency` phải là `null` khi `budgetMode = auto`

## 4. Scope rollback an toàn

Phase này là additive ở DB.

Không làm trong cùng backlog này:

- drop column cũ
- destructive migration
- rewrite budget summary logic sang contract mới

## Contract mục tiêu sau Phase 03

## Create trip request

```json
{
  "name": "Da Nang Summer",
  "destination": "Da Nang",
  "summaryNotes": "4 days by the sea",
  "coverImageUrl": "https://...",
  "startDate": "2026-06-01",
  "endDate": "2026-06-04",
  "timezone": "Asia/Ho_Chi_Minh",
  "visibility": "private",
  "budgetMode": "manual",
  "manualBudgetAmount": 12000000,
  "manualBudgetCurrency": "VND"
}
```

## Update trip request

- cùng shape với create
- partial update được phép
- nếu đổi `budgetMode` sang `auto` thì phải clear manual budget về `null`

## Trip response

```json
{
  "id": "trip-id",
  "userId": "user-id",
  "name": "Da Nang Summer",
  "destination": "Da Nang",
  "summaryNotes": "4 days by the sea",
  "coverImageUrl": "https://...",
  "startDate": "2026-06-01",
  "endDate": "2026-06-04",
  "timezone": "Asia/Ho_Chi_Minh",
  "visibility": "private",
  "budgetMode": "manual",
  "manualBudgetAmount": 12000000,
  "manualBudgetCurrency": "VND",
  "createdAt": "2026-04-18T00:00:00.000Z",
  "updatedAt": "2026-04-18T00:00:00.000Z"
}
```

## Slice BE-03A - DB schema alignment

### Việc cần làm

- [x] Thêm enum hoặc strategy tương đương cho `Trip.visibility`
- [x] Thêm enum hoặc strategy tương đương cho `Trip.budgetMode`
- [x] Thêm `manualBudgetAmount`
- [x] Thêm `manualBudgetCurrency`
- [x] Sinh migration additive
- [x] Prisma schema reflect đầy đủ field mới
- [x] Chốt default an toàn cho dữ liệu cũ:
  - `visibility = private`
  - `budgetMode = manual` để tương thích với budget cũ đã tồn tại
- [x] Ghi migration note cho dữ liệu đang có trong DB local/prod

### File dự kiến

- `db/schema.prisma`
- `prisma/migrations/*`

### Lưu ý

- Không drop `budgetAmount/budgetCurrency` trong slice này
- Không đổi shape bảng `TripItinerary*` trong slice này

## Slice BE-03B - Domain alignment

### Việc cần làm

- [x] Mở rộng domain `Trip`
- [x] Tạo value object hoặc guard logic cho `visibility`
- [x] Tạo value object hoặc guard logic cho `budgetMode/manualBudget`
- [x] Rà `Trip.create`
- [x] Rà `Trip.update`
- [x] Đảm bảo rule manual budget được enforce ở domain thay vì chỉ ở DTO

### File dự kiến

- `src/modules/trips/domain/trip.ts`
- `src/modules/trips/domain/trip-budget.ts`
- file domain mới nếu cần:
  - `trip-visibility.ts`
  - `trip-budget-mode.ts`

## Slice BE-03C - Repository và persistence mapping

### Việc cần làm

- [x] Cập nhật `TripRepository` contract
- [x] Cập nhật Prisma mapper đọc/ghi field mới
- [x] Chốt rõ mapping với field cũ:
  - field cũ còn dùng nội bộ chỗ nào
  - field mới là source of truth ở public DTO
- [x] Đảm bảo list/detail/create/update không làm mất dữ liệu cũ

### File dự kiến

- `src/modules/trips/application/ports/trip-repository.port.ts`
- `src/modules/trips/infrastructure/prisma/prisma-trip.repository.ts`
- `test/support/in-memory-trip-repository.ts`

## Slice BE-03D - Application services

### Việc cần làm

- [x] Cập nhật `CreateTripService`
- [x] Cập nhật `UpdateTripService`
- [x] Cập nhật `GetTripDetailService`
- [x] Cập nhật `ListTripsService`
- [x] Rà `DeleteTripService` nếu response/meta bị ảnh hưởng

### File dự kiến

- `src/modules/trips/application/services/create-trip.service.ts`
- `src/modules/trips/application/services/update-trip.service.ts`
- `src/modules/trips/application/services/get-trip-detail.service.ts`
- `src/modules/trips/application/services/list-trips.service.ts`

## Slice BE-03E - DTO, controller, Swagger

### Việc cần làm

- [x] Cập nhật `CreateTripRequestDto`
- [x] Cập nhật `UpdateTripRequestDto`
- [x] Cập nhật `TripResponseDto`
- [x] Rà `ListTripsQueryDto` nếu cần filter/sort thêm
- [x] Rà `TripsController`
- [x] Cập nhật Swagger examples
- [x] Đảm bảo response envelope không đổi

### File dự kiến

- `src/modules/trips/presentation/dto/create-trip-request.dto.ts`
- `src/modules/trips/presentation/dto/update-trip-request.dto.ts`
- `src/modules/trips/presentation/dto/trip-response.dto.ts`
- `src/modules/trips/presentation/trips.controller.ts`

## Slice BE-03F - Tests

### Unit

- [x] `Trip` create với `budgetMode = auto`
- [x] `Trip` create với `budgetMode = manual`
- [x] reject manual budget âm
- [x] reject manual budget thiếu currency khi `manual`
- [x] reject manual budget còn giá trị khi `auto`
- [x] reject `startDate > endDate`

### Integration

- [x] Prisma repository persist/read field mới đúng
- [x] `POST /trips` với `manual`
- [x] `POST /trips` với `auto`
- [x] `PATCH /trips/:id` đổi `manual -> auto`
- [x] `PATCH /trips/:id` đổi `private -> public`
- [x] `GET /trips`
- [x] `GET /trips/:id`
- [x] Swagger docs reflect field mới

### E2E

- [x] register/login
- [x] create trip `manual/private`
- [x] update sang `auto/public`
- [x] list và detail phản ánh đúng contract mới
- [x] delete trip vẫn chạy bình thường

### File test dự kiến

- `test/unit/modules/trips/domain/trip.spec.ts`
- `test/integration/trips/prisma-trip.repository.integration.spec.ts`
- `test/integration/trips/trips.integration.spec.ts`
- `test/integration/swagger-docs.integration.spec.ts`
- `test/e2e/trips/trips.e2e.spec.ts`

## Slice BE-03G - Docs và phase tracking

### Việc cần làm

- [x] Cập nhật `01_backend-phase-checklist.md`
- [x] Cập nhật `11_backend-planning-expansion-plan.md` nếu contract thay đổi nhỏ
- [x] Cập nhật `README.md` phần current capabilities
- [x] Ghi rõ field cũ nào còn giữ tạm vì compatibility
- [x] Ghi rõ Phase 04 chỉ được bắt đầu sau khi contract mới pass test

## Thứ tự triển khai đề xuất

1. DB schema + migration
2. Domain rules
3. Repository mapping
4. Service layer
5. DTO/controller/Swagger
6. Unit tests
7. Integration tests
8. E2E tests
9. Docs/checklist

## Rủi ro cần tránh

- Không dùng DTO validation để thay thế domain validation
- Không bỏ qua chiến lược migration cho dữ liệu trip cũ
- Không xóa sớm `budgetAmount/budgetCurrency` khi budgets/itinerary bridge còn đọc
- Không để `manualBudgetCurrency` tồn tại khi `manualBudgetAmount = null`
- Không để list/detail trả shape khác nhau

## Acceptance criteria

- `Trip` API có `visibility`, `budgetMode`, `manualBudgetAmount`, `manualBudgetCurrency`
- create/update/list/detail cùng một contract mới
- dữ liệu cũ vẫn đọc được sau migration
- unit/integration/e2e pass cho trip contract mới
- Swagger và checklist backend phản ánh đúng trạng thái Phase 03

## Definition of done

- backend có thể merge độc lập mà không phá auth/trips hiện tại
- FE có thể bắt đầu `Phase 03` mà không cần guess contract
- không còn điểm mơ hồ về manual budget rule ở backend
