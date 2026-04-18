# Backend Phase 04 Planner Core Backlog

## Mục tiêu

Đóng `Phase 04` của backend để mở planner core dựa trên `PlanNode`, thay cho hướng tiếp tục mở rộng `TripItineraryDay -> TripItineraryActivity`.

Phase này tập trung vào:

- schema `PlanNode`
- module `planning`
- repository và persistence mapping
- planner read API
- node write APIs
- validation và ownership rules cho planner core

Phase này chưa xử lý:

- migrate budget summary sang `PlanNode`
- mixed-currency budget policy cuối cùng
- public trip sharing cho guest
- posts/comments
- reorder nâng cao hoặc drag-and-drop semantics
- migration dữ liệu từ itinerary bridge sang `PlanNode`

## Trạng thái

- Status: `Todo`
- Date: `2026-04-18`
- Owner area: `backend/src/modules/planning`
- Dependency chặn:
  - `Phase 03` đã hoàn tất cho `Trip.visibility` và `Trip.budgetMode`
  - phải chốt planner response shape với frontend trước khi code controller/DTO
- Dependency mở ra sau khi xong:
  - `Phase 04 FE`
  - `Phase 05 BE`
  - `Phase 06 BE`
  - `Phase 08 BE`

## Quyết định rollout cần chốt

## 1. `PlanNode` là planner model mới, itinerary bridge bị freeze

Sau Phase 04:

- feature planner mới đi qua `PlanNode`
- `TripItineraryDay` và `TripItineraryActivity` chỉ còn:
  - bug fix
  - rollback ngắn hạn
  - migration support

Không tiếp tục mở rộng nghiệp vụ planner mới lên module `itineraries`.

## 2. Mở module `planning` riêng, không nhét vào `trips`

`trips` tiếp tục giữ trách nhiệm:

- ownership
- metadata
- visibility
- budget mode

`planning` chịu trách nhiệm:

- tree rules
- `PlanNode` CRUD
- planner read model
- parent/child validation

## 3. Planner read trả full dataset, không paginate

Khuyến nghị endpoint:

- `GET /api/v1/trips/:tripId/planner`

Khuyến nghị response:

```json
{
  "success": true,
  "data": {
    "trip": {
      "id": "trip-id",
      "name": "Da Nang Summer",
      "visibility": "private",
      "budgetMode": "manual",
      "manualBudgetAmount": 12000000,
      "manualBudgetCurrency": "VND"
    },
    "nodes": [
      {
        "id": "node-root",
        "tripId": "trip-id",
        "parentId": null,
        "type": "day",
        "title": "Day 1",
        "notes": null,
        "startAt": "2026-06-01T08:00:00.000Z",
        "endAt": null,
        "costAmount": 500000,
        "costCurrency": "VND",
        "imageUrl": null,
        "sortOrder": 0,
        "depth": 0,
        "createdAt": "2026-04-18T00:00:00.000Z",
        "updatedAt": "2026-04-18T00:00:00.000Z"
      }
    ]
  }
}
```

Khuyến nghị trả `nodes` dạng flat list đã sort ổn định thay vì nested tree JSON.

Lý do:

- DTO đơn giản hơn
- CRUD invalidation rõ hơn
- dễ mapping sang FE recursive render

## 4. Node delete dùng cascade có kiểm soát ở MVP

Nếu xóa một node đang có children, MVP nên:

- delete cascade toàn bộ subtree

Nhưng phải chốt rõ trong:

- service rule
- Swagger
- FE confirmation copy

Không để behavior mơ hồ theo kiểu lúc block lúc cascade.

## 5. Budget summary tạm chưa cutover trong phase này

`GET /api/v1/trips/:id/budget-summary` vẫn có thể tiếp tục đi qua logic hiện tại trong `budgets` cho tới `Phase 05`.

Phase 04 chỉ cần đảm bảo:

- `PlanNode.costAmount/costCurrency` đã đủ dữ liệu cho phase sau
- planner core không khóa cửa migration budget tiếp theo

## Contract backend cần bám sau Phase 04

## PlanNode schema tối thiểu

`PlanNode` phải có:

- `id`
- `tripId`
- `parentId`
- `type`
- `title`
- `notes`
- `startAt`
- `endAt`
- `costAmount`
- `costCurrency`
- `imageUrl`
- `sortOrder`
- `depth`
- `createdAt`
- `updatedAt`

## Node type enum tối thiểu

- `section`
- `day`
- `location`
- `activity`
- `note`

## Rule dữ liệu cần áp dụng ngay

- `title` là bắt buộc
- `costAmount >= 0` nếu có giá trị
- `endAt >= startAt` nếu cả hai cùng có
- `parentId` phải thuộc cùng `tripId`
- không được tạo cycle
- `depth` phải phản ánh đúng quan hệ cha-con
- `sortOrder` phải ổn định trong cùng parent scope

## Slice BE-04A - DB schema và migration

### Việc cần làm

- [ ] Thêm model `PlanNode` vào Prisma schema
- [ ] Thêm enum `PlanNodeType`
- [ ] Tạo migration additive
- [ ] Thêm foreign key:
  - `tripId -> Trip.id`
  - `parentId -> PlanNode.id`
- [ ] Thêm index:
  - `(tripId, parentId, sortOrder)`
  - `(tripId, depth)`
- [ ] Chốt nullable rules cho:
  - `parentId`
  - `notes`
  - `startAt`
  - `endAt`
  - `costAmount`
  - `costCurrency`
  - `imageUrl`

### File dự kiến

- `db/schema.prisma`
- `db/migrations/*`

## Slice BE-04B - Domain, repository port và Prisma repository

### Việc cần làm

- [ ] Tạo entity/domain model `PlanNode`
- [ ] Tạo guard logic cho tree rules
- [ ] Tạo repository port cho planner
- [ ] Tạo Prisma repository đọc/ghi `PlanNode`
- [ ] Tạo in-memory repository hoặc test double tương ứng cho unit/integration tests

### File dự kiến

- `src/modules/planning/domain/plan-node.ts`
- `src/modules/planning/application/ports/plan-node-repository.port.ts`
- `src/modules/planning/infrastructure/prisma/prisma-plan-node.repository.ts`
- `test/support/` file support mới nếu cần

## Slice BE-04C - Planner read API

### Việc cần làm

- [ ] Tạo `GetTripPlannerService`
- [ ] Tạo endpoint `GET /api/v1/trips/:tripId/planner`
- [ ] Trả full planner dataset, không paginate
- [ ] Trả nodes sort ổn định theo tree order
- [ ] Trả trip metadata tối thiểu đủ cho workspace header
- [ ] Chốt error mapping cho:
  - trip không tồn tại
  - trip không thuộc user
  - planner read chưa sẵn

### File dự kiến

- `src/modules/planning/application/services/get-trip-planner.service.ts`
- `src/modules/planning/presentation/planning.controller.ts`
- `src/modules/planning/presentation/dto/trip-planner-response.dto.ts`
- `src/modules/planning/presentation/dto/plan-node-response.dto.ts`

## Slice BE-04D - Node write APIs

### Việc cần làm

- [ ] Tạo `POST /api/v1/nodes`
- [ ] Tạo `PATCH /api/v1/nodes/:id`
- [ ] Tạo `DELETE /api/v1/nodes/:id`
- [ ] Create phải hỗ trợ:
  - root node
  - child node
- [ ] Update phải hỗ trợ metadata cơ bản của node
- [ ] Delete phải cascade toàn subtree theo rule đã chốt
- [ ] Chốt DTO request cho create/update
- [ ] Chốt response shape sau mutation

### File dự kiến

- `src/modules/planning/application/services/create-plan-node.service.ts`
- `src/modules/planning/application/services/update-plan-node.service.ts`
- `src/modules/planning/application/services/delete-plan-node.service.ts`
- `src/modules/planning/presentation/dto/create-plan-node-request.dto.ts`
- `src/modules/planning/presentation/dto/update-plan-node-request.dto.ts`

## Slice BE-04E - Module wiring, ownership và bridge boundary

### Việc cần làm

- [ ] Tạo `PlanningModule`
- [ ] Mount module vào `AppModule`
- [ ] Dùng ownership rule theo `Trip.userId` cho create/update/delete
- [ ] Ghi rõ trong code/doc rằng itinerary module đã bị freeze cho feature mới
- [ ] Không thay budget summary logic trong cùng phase này
- [ ] Không mở guest public read trong cùng phase này

### File dự kiến

- `src/modules/planning/planning.module.ts`
- `src/app/app.module.ts`
- `documents/` note liên quan nếu cần

## Slice BE-04F - Tests, Swagger và rollout note

### Việc cần làm

- [ ] Unit tests cho tree rules:
  - parent cùng trip
  - không cycle
  - depth đúng
  - time range đúng
  - cost non-negative
- [ ] Integration tests cho Prisma mapping và query order
- [ ] Integration tests cho planner read/write endpoints
- [ ] E2E tests cho:
  - create root node
  - create child node
  - update node
  - delete node có children
- [ ] Update Swagger cho planner endpoints
- [ ] Ghi rollback note:
  - rollback chỉ ở mức controller/service wiring nếu cần
  - không drop schema mới trong rollout nóng

### File dự kiến

- `test/unit/modules/planning/**/*.spec.ts`
- `test/integration/planning/**/*.spec.ts`
- `test/e2e/planning/**/*.spec.ts`

## Definition of done cho Phase 04 BE

Phase 04 chỉ được coi là xong khi:

- backend đã có schema `PlanNode` thật
- planner APIs mới chạy end-to-end
- user owner có thể read/create/update/delete planner nodes
- response planner trả full dataset ổn định cho FE workspace
- module `itineraries` không còn là hướng mở rộng chính cho planner
- budget summary hiện tại vẫn chạy bình thường trong lúc chờ `Phase 05`
