# Backend Phase 06 Public Trip Sharing Backlog

## Mục tiêu

Đóng `Phase 06` của backend để mở public read cho trip và planner, dựa trên `Trip.visibility` đã có sẵn trong source hiện tại.

Phase này tập trung vào:

- public trip list API
- public trip detail API
- public planner read API
- permission rules cho `public/private`
- tách rõ owner-only APIs với guest read APIs
- test cho `public available`, `private denied`, `not found`

Phase này chưa xử lý:

- share token hoặc signed URL
- slug/human-readable public URL
- public budget summary endpoint riêng
- SEO/Open Graph metadata chuyên sâu
- posts/comments
- bất kỳ public mutation nào

## Trạng thái

- Status: `Implemented in source`
- Date: `2026-04-20`
- Owner area:
  - `backend/src/modules/trips`
  - `backend/src/modules/planning`
- Trạng thái source hiện tại:
  - trip detail hiện chỉ đọc được qua auth route `GET /api/v1/trips/:tripId`
  - planner read hiện chỉ đọc được qua auth route `GET /api/v1/trips/:tripId/planner`
  - `Trip.visibility` đã tồn tại trong contract và persistence
  - chưa có controller/service public read riêng cho guest
- Dependency chặn:
  - trip contract Phase 03 phải giữ ổn định
  - planner read Phase 04 phải giữ response shape ổn định
- Dependency mở ra sau khi xong:
  - `Phase 05 FE`
  - `Phase 07 BE`
  - `Phase 07 FE`

## Quyết định rollout cần chốt

## 1. Public APIs đi qua namespace riêng `/public`

Khuyến nghị endpoint:

- `GET /api/v1/public/trips/:tripId`
- `GET /api/v1/public/trips/:tripId/planner`

Lý do:

- không phải trộn optional-auth vào controller owner hiện tại
- route permission rõ ràng hơn trong Swagger và test
- giảm nguy cơ vô tình nới auth rule cho CRUD nội bộ

## 2. Public read bám chặt `Trip.visibility`

Rule phase này:

- `visibility = public`:
  - guest đọc được trip detail
  - guest đọc được planner
- `visibility = private`:
  - guest bị chặn
- trip không tồn tại:
  - trả `404`

Khuyến nghị trả `403` cho case trip tồn tại nhưng private để frontend có thể hiển thị state `private denied` rõ ràng.

Tradeoff này là có chủ đích trong phase hiện tại và phải được ghi rõ trong docs/test, thay vì che toàn bộ private trip thành `404`.

## 3. Response shape giữ tương đương owner read

Public read không nên tạo DTO shape riêng nếu chưa có nhu cầu thật.

Khuyến nghị:

- public trip detail dùng cùng shape với `TripResponseDto`
- public planner read dùng cùng shape với `TripPlannerResponseDto`

Lý do:

- frontend reuse presenter/query state dễ hơn
- Swagger và integration contract ít bị drift
- giảm mapper duplication

## 4. Public sharing là read-only tuyệt đối

Phase này không mở:

- create trip public
- update trip public
- delete trip public
- create/update/delete planner node public

Mọi mutation tiếp tục đi qua auth routes hiện có.

## 5. Không mở public budget summary endpoint trong cùng phase

Public page có thể dùng:

- trip metadata hiện có
- planner nodes hiện có

để render mức thông tin đủ cho share flow ban đầu.

`GET /api/v1/trips/:tripId/budget-summary` vẫn là owner/auth contract ở phase này, tránh kéo thêm permission matrix vào cùng lúc.

## Contract backend cần bám sau Phase 06

## Public trip list

### Endpoint

- `GET /api/v1/public/trips?page=0&size=20&sort=startDate,asc`

### Response shape mục tiêu

Giữ cùng shape list/meta hiện tại nhưng chỉ trả `visibility = public`.

## Public trip detail

### Endpoint

- `GET /api/v1/public/trips/:tripId`

### Response shape mục tiêu

Giữ cùng shape với owner detail:

```json
{
  "success": true,
  "data": {
    "id": "trip-id",
    "userId": "user-id",
    "name": "Da Nang Summer",
    "destination": null,
    "summaryNotes": "Three relaxed coastal days.",
    "coverImageUrl": null,
    "startDate": "2026-07-12",
    "endDate": "2026-07-15",
    "timezone": null,
    "budgetMode": "manual",
    "manualBudgetAmount": 5000000,
    "manualBudgetCurrency": "VND",
    "visibility": "public",
    "budgetAmount": 5000000,
    "budgetCurrency": "VND",
    "createdAt": "2026-04-20T00:00:00.000Z",
    "updatedAt": "2026-04-20T00:00:00.000Z"
  }
}
```

## Public planner read

### Endpoint

- `GET /api/v1/public/trips/:tripId/planner`

### Response shape mục tiêu

Giữ cùng shape với owner planner read:

```json
{
  "success": true,
  "data": {
    "trip": {
      "id": "trip-id",
      "name": "Da Nang Summer",
      "visibility": "public",
      "budgetMode": "manual",
      "manualBudgetAmount": 5000000,
      "manualBudgetCurrency": "VND"
    },
    "nodes": [
      {
        "id": "node-root",
        "tripId": "trip-id",
        "parentId": null,
        "type": "day",
        "title": "Arrival day",
        "notes": null,
        "startAt": "2026-07-12T09:00:00.000Z",
        "endAt": "2026-07-12T21:00:00.000Z",
        "costAmount": 150000,
        "costCurrency": "VND",
        "imageUrl": null,
        "sortOrder": 0,
        "depth": 0,
        "createdAt": "2026-04-20T00:00:00.000Z",
        "updatedAt": "2026-04-20T00:00:00.000Z"
      }
    ]
  }
}
```

## Error semantics bắt buộc

- `404`:
  - trip không tồn tại
- `403`:
  - trip tồn tại nhưng `visibility = private`
- `200`:
  - trip public đọc thành công

Machine-readable error response phải giữ pattern hiện có của app.

## Slice BE-06A - Permission policy và service boundaries

### Việc cần làm

- [x] Chốt rõ public read policy theo `Trip.visibility`
- [x] Không sửa semantics của owner-only services hiện có ngoài phần reuse an toàn
- [x] Tạo service riêng cho public trip detail
- [x] Tạo service riêng cho public planner read
- [x] Tách rule `not found` với `private denied`
- [x] Ghi rõ trong code/comment rằng public flow không được cấp quyền mutate

### File dự kiến

- `src/modules/trips/application/services/get-public-trip-detail.service.ts`
- `src/modules/planning/application/services/get-public-trip-planner.service.ts`
- helper/guard nội bộ mới nếu cần ở `trips` hoặc `planning`

## Slice BE-06B - Public trip detail API

### Việc cần làm

- [x] Tạo controller public cho trip list
- [x] Mount `GET /api/v1/public/trips`
- [x] Tạo controller public cho trip detail
- [x] Mount `GET /api/v1/public/trips/:tripId`
- [x] Reuse `TripResponseDto` nếu không có blocker contract
- [x] Không gắn `AccessTokenAuthGuard`
- [x] Map `private` thành `403`
- [x] Map `missing` thành `404`
- [x] Giữ success envelope nhất quán với phần còn lại của app

### File dự kiến

- `src/modules/trips/presentation/public-trips.controller.ts`
- `src/modules/trips/trips.module.ts`

## Slice BE-06C - Public planner read API

### Việc cần làm

- [x] Tạo controller public cho planner read
- [x] Mount `GET /api/v1/public/trips/:tripId/planner`
- [x] Reuse `TripPlannerResponseDto`
- [x] Giữ sorting ổn định cho `nodes`
- [x] Không lộ mutation route mới ở public namespace
- [x] Bảo toàn planner read contract để frontend read-only tree có thể dùng trực tiếp

### File dự kiến

- `src/modules/planning/presentation/public-planning.controller.ts`
- `src/modules/planning/planning.module.ts`

## Slice BE-06D - Swagger, docs, logging, error contract

### Việc cần làm

- [x] Gắn Swagger tags rõ cho public endpoints
- [x] Không yêu cầu bearer auth trong Swagger cho public routes
- [x] Thêm mô tả rõ `403 private denied`
- [x] Đảm bảo correlation id và response envelope vẫn giữ nguyên
- [x] Cập nhật checklist/tài liệu phase sau khi merge implementation

### File dự kiến

- `src/modules/trips/presentation/public-trips.controller.ts`
- `src/modules/planning/presentation/public-planning.controller.ts`
- `documents/01_backend-phase-checklist.md`
- `README.md` nếu contract public được coi là mốc người dùng cuối

## Slice BE-06E - Tests và release safety

### Unit / service-level

- [x] public trip detail pass khi `visibility = public`
- [x] public trip detail fail `403` khi `visibility = private`
- [x] public planner read pass khi `visibility = public`
- [x] public planner read fail `403` khi `visibility = private`

### Integration

- [x] `GET /api/v1/public/trips` trả list đúng shape
- [x] `GET /api/v1/public/trips/:tripId` trả detail đúng shape
- [x] `GET /api/v1/public/trips/:tripId/planner` trả planner đúng shape
- [x] `404` khi trip không tồn tại
- [x] `403` khi trip private

### E2E / smoke

- [x] guest đọc được public trip
- [x] guest đọc được public planner
- [x] guest không đọc được private trip
- [x] guest không đọc được private planner
- [x] owner auth CRUD hiện tại không bị regression

### File dự kiến

- `test/unit/modules/trips/*`
- `test/unit/modules/planning/*`
- `test/integration/trips/*`
- `test/integration/planning/*`
- `test/e2e/trips/*`
- `test/e2e/planning/*`

## Validation matrix của phase này

- `Trip.visibility` phải thuộc enum hợp lệ
- public detail chỉ đọc được khi `visibility = public`
- public planner chỉ đọc được khi `visibility = public`
- owner auth routes hiện có không bị nới quyền ngoài ý muốn
- public route không được mutate state hệ thống
- response shape của public read không drift khỏi owner read nếu chưa có quyết định explicit

## Deferred rõ ràng sau phase này

- public budget summary endpoint
- share token/signed URL
- public analytics/view counter
- Open Graph image/meta
- slug URL theo `name`
- public posts/comments bridge

## Definition of done cho Phase 06

Phase này chỉ được gọi là done khi:

- guest có thể đọc `trip detail` của trip public qua public endpoint
- guest có thể đọc `planner` của trip public qua public endpoint
- guest có thể discovery trip public qua public list endpoint
- guest nhận `403` rõ ràng cho trip private
- guest nhận `404` rõ ràng cho trip không tồn tại
- owner-only CRUD routes hiện tại vẫn giữ nguyên auth boundary
- Swagger và docs mô tả đúng contract public
- test đã có cho `public available`, `private denied`, `not found`, và `owner unaffected`
