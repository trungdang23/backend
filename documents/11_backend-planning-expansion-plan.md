# Backend Planning Expansion Plan

## Mục tiêu

Tài liệu này chốt hướng triển khai backend để bám DRD và user stories mới, với nguyên tắc:

- `PlanNode` là target planning model
- `Trip` vẫn là container cấp cao
- `itinerary` hiện tại chỉ là bridge tạm thời
- rollout phải additive, không big-bang rewrite

## Target product snapshot

### Trip

```text
Trip
- id
- userId
- name
- startDate
- endDate
- budgetMode            // auto | manual
- manualBudgetAmount?
- manualBudgetCurrency?
- visibility            // private | public
- createdAt
- updatedAt
```

### PlanNode

```text
PlanNode
- id
- tripId
- parentId?
- type                  // section | day | location | activity | note
- title
- notes?
- startAt?
- endAt?
- costAmount?
- costCurrency?
- imageUrl?
- sortOrder
- depth
- createdAt
- updatedAt
```

### Post

```text
Post
- id
- userId
- tripId?
- title
- content
- coverImageUrl?
- visibility            // public
- createdAt
- updatedAt
```

### Comment

```text
Comment
- id
- postId
- userId
- content
- createdAt
- updatedAt
```

## Trạng thái source hiện tại

Source backend đang có:

- `auth`
- `users`
- `trips`
- `itineraries`
- `budgets`

Planner hiện tại đang đi qua:

```text
Trip
  -> TripItineraryDay
    -> TripItineraryActivity
```

Mô hình này usable cho planner 2 cấp, nhưng không aligned với DRD mới ở các điểm:

- không recursive
- không có `PlanNode`
- chưa có `visibility`
- chưa có `budgetMode/manualBudget`
- chưa có `posts/comments`

## Quyết định kiến trúc

## 1. `PlanNode` là source of truth mục tiêu cho planning

Sau khi phase alignment hoàn tất, mọi logic planner mới phải đi qua `PlanNode`.

Không mở thêm capability lớn mới lên `TripItineraryDay` và `TripItineraryActivity`, trừ:

- bug fix
- migration support
- fallback ngắn hạn

## 2. `Trip` chỉ giữ metadata cấp cao

`Trip` nên giữ:

- ownership
- tên chuyến đi
- date range
- budget mode
- manual budget
- visibility

Không đưa chi tiết planner về lại `Trip`.

## 3. Budget đọc theo rule của DRD

- `auto -> sum(PlanNode.costAmount)`
- `manual -> manualBudget`
- không conversion currency ở MVP

Nếu nhiều currency cùng tồn tại trong `auto`, backend chỉ trả raw totals theo currency hoặc chốt một response rõ ràng, không tự conversion ngầm.

## 4. Public trip và Post là hai lớp khác nhau

- `Trip.visibility` quyết định khả năng public read của trip/planner
- `Post` là social surface riêng, mặc định public

Không dùng `Post` để thay thế public trip detail.

## 5. Migration phải additive

Trình tự đúng:

1. Align trip contract
2. Add `PlanNode`
3. Add planner APIs
4. FE chuyển sang planner APIs
5. Freeze itinerary bridge
6. Sau cùng mới cân nhắc cleanup

## Module boundary mục tiêu

## `auth`

Chịu trách nhiệm:

- register
- login
- refresh
- logout
- me

## `trips`

Chịu trách nhiệm:

- trip CRUD
- trip visibility
- trip budget mode
- ownership

## `planning`

Chịu trách nhiệm:

- `PlanNode` CRUD
- tree rules
- planner read model
- ordering
- validation parent/child

## `budgets`

Chịu trách nhiệm:

- budget summary cho trip
- tổng hợp cost từ `PlanNode`
- resolve logic `auto/manual`

## `posts`

Chịu trách nhiệm:

- create post
- list public posts
- detail post
- bridge optional từ trip sang post

## `comments`

Chịu trách nhiệm:

- create/list comment theo post

Nếu sprint đầu của community thiếu năng lực, `comments` có thể là slice sau `posts`, nhưng phải được ghi rõ là deferred chứ không bỏ quên.

## API roadmap mục tiêu

## Auth

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`

## Trips

- `GET /api/v1/trips?page=&size=`
- `POST /api/v1/trips`
- `GET /api/v1/trips/:id`
- `PATCH /api/v1/trips/:id`
- `DELETE /api/v1/trips/:id`

## Planner

- `GET /api/v1/trips/:id/planner`
- `POST /api/v1/nodes`
- `PATCH /api/v1/nodes/:id`
- `DELETE /api/v1/nodes/:id`

## Posts

- `POST /api/v1/posts`
- `GET /api/v1/posts`
- khuyến nghị thêm `GET /api/v1/posts/:postId`

## Comments

- khuyến nghị thêm:
  - `GET /api/v1/posts/:postId/comments`
  - `POST /api/v1/posts/:postId/comments`

## Slice roadmap chi tiết

## Slice 1 - Align `Trip` contract

### Mục tiêu

Đưa `Trip` về đúng contract của DRD trước khi mở planner mới.

### DB

- thêm `visibility`
- thêm `budgetMode`
- thêm `manualBudgetAmount`
- thêm `manualBudgetCurrency`
- review lại `budgetAmount/budgetCurrency` cũ:
  - giữ tạm cho compatibility
  - hoặc migrate và deprecate có kiểm soát

### Application

- update create trip
- update list/detail trip
- update patch trip
- validate `manualBudget` theo `budgetMode`

### HTTP

- update DTO request/response
- update Swagger

### Test

- unit rules cho trip budget mode
- integration persistence cho trip fields mới
- e2e create/update/list/detail aligned với contract mới

## Slice 2 - Add `PlanNode` schema và repository

### Mục tiêu

Đặt foundation cho planner recursive.

### DB

- tạo bảng `plan_nodes`
- index:
  - `(trip_id, parent_id, sort_order)`
  - `(trip_id, depth)`
- foreign key:
  - `trip_id -> trips.id`
  - `parent_id -> plan_nodes.id`

### Application

- entity `PlanNode`
- repository port
- Prisma repository

### Validation

- `title` required
- `costAmount >= 0`
- `endAt >= startAt`
- parent cùng trip
- không cycle

### Test

- unit tests cho tree rules
- integration tests cho Prisma mapping

## Slice 3 - Planner read API

### Endpoint

- `GET /api/v1/trips/:id/planner`

### Response khuyến nghị

```json
{
  "success": true,
  "data": {
    "trip": {},
    "nodes": []
  }
}
```

### Yêu cầu

- trả full tree
- không paginate
- sắp theo `sortOrder`
- private/public read bám `Trip.visibility`

### Test

- owner read private trip planner
- guest không read private planner
- guest read public planner

## Slice 4 - Planner write APIs

### Endpoints

- `POST /api/v1/nodes`
- `PATCH /api/v1/nodes/:id`
- `DELETE /api/v1/nodes/:id`

### Input tối thiểu

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

### Rule

- chỉ owner của trip được mutate
- `sortOrder` ổn định trong cùng parent
- delete node phải chốt rõ:
  - cascade children
  - hoặc block khi có children

Khuyến nghị MVP:

- delete cascade có kiểm soát, nhưng phải ghi rõ trong API docs

### Test

- create root node
- create child node
- update node
- delete node có children
- forbidden mutation trên trip không thuộc user

## Slice 5 - Budget summary aligned với planner

### Mục tiêu

Không để budget tiếp tục phụ thuộc dài hạn vào itinerary bridge.

### Logic

- `auto`: sum `PlanNode.costAmount`
- `manual`: dùng `Trip.manualBudgetAmount`

### Quyết định cần chốt

- response trả tổng theo từng currency hay chỉ một currency
- nếu mixed currency trong `auto`, không conversion

Khuyến nghị MVP:

- trả per-currency breakdown và total display hints

### Test

- auto budget từ planner nodes
- manual budget override
- mixed currency case không conversion

## Slice 6 - Migration strategy từ itinerary bridge

### Nguyên tắc

- additive first
- không xóa bảng cũ sớm
- không để FE gọi song song hai nguồn planner quá lâu

### Step

1. Giữ `itinerary` để source hiện tại tiếp tục chạy
2. Build `PlanNode` APIs hoàn chỉnh
3. FE chuyển route `/app/trips/:tripId` sang planner APIs
4. Freeze itinerary endpoints về bugfix-only
5. Nếu cần, chạy data migration từ itinerary cũ sang plan nodes
6. Chỉ cleanup khi production đã ổn định

### Cần có

- migration script hoặc one-off job
- rollback plan nếu planner read/write có lỗi
- checklist đối chiếu dữ liệu trước và sau migrate

## Slice 7 - Public trip sharing

### Mục tiêu

Cho guest xem trip public và planner public.

### Scope

- public trip detail
- public planner read
- không cho guest mutate

### Test

- private denied
- public accessible
- owner vẫn edit được

## Slice 8 - Posts và comments

### Mục tiêu

Mở lớp social tối thiểu sau khi trip/planner đã ổn.

### Posts

- create post
- list posts
- detail post
- optional bridge từ trip sang post

### Comments

- create comment
- list comments theo post
- authenticated-only

### Test

- post create/list/detail
- comment create/list
- permission rules

## Validation matrix bắt buộc

- `Trip.name` required
- `Trip.startDate <= Trip.endDate`
- `Trip.visibility` thuộc enum
- `Trip.manualBudget >= 0`
- `PlanNode.title` required
- `PlanNode.type` thuộc enum
- `PlanNode.parentId` cùng trip
- `PlanNode.endAt >= PlanNode.startAt`
- `PlanNode.costAmount >= 0`
- `Post.content` required
- `Comment.content` required

## Definition of done cho planning expansion

Một backend phase planner chỉ được coi là aligned khi:

- schema `PlanNode` đã có
- trip contract đã có `visibility`, `budgetMode`, `manualBudget`
- planner read/write APIs chạy end-to-end
- budget summary đọc đúng theo rule DRD
- FE có thể dùng planner APIs mà không cần dependency vào itinerary bridge cho flow chính
- tests đã có ở mức unit, integration, và e2e cho flow chính
