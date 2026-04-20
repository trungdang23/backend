# Backend Phase Checklist

## Scope

- Checklist này tự chứa target contract backend cần đạt cho sản phẩm hiện tại.
- Ngày chốt lại target contract: `2026-04-20`
- `Status` phản ánh mức độ aligned với DRD mới, không chỉ phản ánh việc source đã có code.

## Quy ước trạng thái

- `[x]` hoàn thành và đã aligned với target contract
- `[~]` đã có baseline hoặc giải pháp tạm, nhưng chưa aligned hoàn toàn
- `[ ]` chưa hoàn thành

## Target product contract cần đạt

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
- Planner:
  - `GET /api/v1/trips/:id/planner`
  - `POST /api/v1/nodes`
  - `PATCH /api/v1/nodes/:id`
  - `DELETE /api/v1/nodes/:id`
- Posts:
  - `POST /api/v1/posts`
  - `GET /api/v1/posts`
- Budget:
  - `auto = sum(node.costAmount)`
  - `manual = Trip.manualBudget`
  - không currency conversion ở MVP

## Khoảng cách chính của source hiện tại

- [x] Có auth baseline thật
- [x] Có trips CRUD baseline thật
- [x] Có planner core thật trên `PlanNode`
- [x] Đã có `Trip.visibility`
- [x] Đã có `budgetMode/manualBudget`
- [~] Budget summary vẫn còn đọc từ itinerary bridge
- [x] Đã có public trip read
- [x] Đã có `posts`
- [x] Đã có `logout` endpoint đúng target

## Tổng quan phase

| Phase | Mục tiêu                                        | Status    |
| ----- | ----------------------------------------------- | --------- |
| 00    | Re-baseline tài liệu và contract theo DRD mới   | Completed |
| 01    | Foundation, ops, CI, deploy baseline            | Completed |
| 02    | Auth và session aligned với DRD                 | Completed |
| 03    | Trips aligned với DRD                           | Completed |
| 04    | Planner core trên `PlanNode`                    | Completed |
| 05    | Budget logic và migration khỏi itinerary bridge | Partial   |
| 06    | Public trip sharing                             | Completed |
| 07    | Community minimal                               | Completed |
| 08    | Hardening, test, release readiness              | Todo      |

## Phase 00 - Re-baseline tài liệu và contract theo DRD mới

Status: `Completed`

- [x] Chốt lại target contract từ DRD và user stories mới
- [x] Ghi rõ source hiện tại đang lệch ở đâu
- [x] Ghi rõ `PlanNode` là target planning model
- [x] Ghi rõ `itinerary` chỉ là baseline tạm thời, không còn là hướng mở rộng dài hạn
- [x] Ghi rõ `posts/comments` chưa có source thật và là phase sau

## Phase 01 - Foundation, ops, CI, deploy baseline

Status: `Completed`

- [x] Scaffold backend trong `backend/`
- [x] Có `NestJS`, `Prisma`, `PostgreSQL`
- [x] Có `health` endpoint
- [x] Có migration baseline
- [x] Có CI cho lint, test, build, prisma validate
- [x] Có deploy workflow và runtime scripts
- [x] Có README và runbook nền

## Phase 02 - Auth và session aligned với DRD

Status: `Completed`

- [x] `POST /api/v1/auth/register`
- [x] `POST /api/v1/auth/login`
- [x] `GET /api/v1/auth/me`
- [x] `POST /api/v1/auth/refresh`
- [x] `POST /api/v1/auth/logout`
- [x] Password hashing
- [x] JWT access token validation
- [x] Refresh token flow
- [x] Rate limit cho public auth endpoints
- [x] DTO và response envelope nhất quán
- [x] Xác nhận contract logout:
  - xóa refresh token ở phía server nếu có persistence
  - hoặc chốt rõ MVP là stateless logout + clear token phía client
- [x] Bổ sung e2e test cho `logout`

## Phase 03 - Trips aligned với DRD

Status: `Completed`

- [x] Trips CRUD baseline đã có
- [x] Thêm `visibility` vào `Trip`
- [x] Thêm `budgetMode: auto | manual`
- [x] Thêm `manualBudget`
- [x] Chốt schema thực tế cho manual budget:
  - `manualBudgetAmount`
  - `manualBudgetCurrency`
- [x] Cập nhật DTO create/update/detail/list cho trip
- [x] Validate:
  - `name` required
  - `startDate <= endDate`
  - `manualBudget >= 0`
  - `manualBudget` required nếu `budgetMode = manual`
- [x] Chốt backward compatibility với `budgetAmount/budgetCurrency` cũ
- [x] Cập nhật Swagger cho contract mới
- [x] Bổ sung integration/e2e tests cho trip contract mới

## Phase 04 - Planner core trên `PlanNode`

Status: `Completed`

- [x] Thêm schema `PlanNode`
- [x] Chốt field tối thiểu của `PlanNode`:
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
- [x] Chốt enum `type` tối thiểu:
  - `section`
  - `day`
  - `location`
  - `activity`
  - `note`
- [x] Tạo module `planning`
- [x] Tạo repository port + Prisma repository cho `PlanNode`
- [x] Tạo `GET /api/v1/trips/:id/planner`
- [x] Tạo `POST /api/v1/nodes`
- [x] Tạo `PATCH /api/v1/nodes/:id`
- [x] Tạo `DELETE /api/v1/nodes/:id`
- [x] Planner read model phải trả full tree, không paginate
- [x] Validate:
  - `title` required
  - `costAmount >= 0`
  - `sortOrder` required
  - `endAt >= startAt`
  - `parentId` cùng `tripId`
  - không tạo cycle
- [x] Permission:
  - owner-only cho create/update/delete
  - auth read cho owner trên planner route hiện tại
- [x] Bổ sung unit/integration/e2e tests cho planner
- [~] Public planner read theo `Trip.visibility` được tách riêng sang `Phase 06`

## Phase 05 - Budget logic và migration khỏi itinerary bridge

Status: `Partial`

- [ ] Chuyển budget summary sang đọc từ `PlanNode`
- [~] Budget summary baseline đã có, nhưng vẫn đang đọc từ itinerary bridge
- [ ] Hỗ trợ:
  - `auto -> sum(costAmount)`
  - `manual -> manualBudget`
- [~] Có response budget summary cho frontend, nhưng chưa phải contract `PlanNode`-based cuối cùng
- [~] Chiến lược chuyển tiếp hiện tại:
  - flow planner chính đã freeze khỏi itinerary bridge
  - `itinerary` còn giữ cho budget/migration support
- [ ] Thiết kế script hoặc strategy migrate dữ liệu từ `TripItineraryDay/Activity` sang `PlanNode`
- [ ] Chốt cutover plan:
  - thời điểm backend ngừng đọc budget từ itinerary bridge
  - thời điểm có thể cleanup legacy itinerary support
- [ ] Bổ sung test đảm bảo budget không lệch sau migration

## Phase 06 - Public trip sharing

Status: `Completed`

- [x] Chi tiết backlog tại `16_backend-phase-06-public-trip-sharing-backlog.md`
- [x] Guest có public trip list để discovery
- [x] Public read cho trip có `visibility = public`
- [x] Guest đọc được trip public
- [x] Guest đọc được planner của trip public
- [x] Guest không đọc được trip private
- [x] Owner vẫn có full CRUD trên trip của mình
- [x] Có test permission cho public/private trip

## Phase 07 - Community minimal

Status: `Completed`

- [x] Chi tiết backlog tại `17_backend-phase-07-community-minimal-backlog.md`
- [x] Tạo schema `Post`
- [ ] Chốt field tối thiểu:
  - `userId`
  - `tripId?`
  - `title`
  - `content`
  - `coverImageUrl?`
  - `visibility = public`
- [x] `POST /api/v1/posts`
- [x] `GET /api/v1/posts`
- [x] Khuyến nghị thêm `GET /api/v1/posts/:postId` dù DRD ngắn chưa ghi rõ
- [ ] Nếu mở comment trong cùng epic:
  - create comment
  - list comments theo post
  - validate authenticated-only
- [x] Nếu comment chưa làm kịp:
  - ghi rõ deferred item trong phase log và roadmap
- [x] Bổ sung unit/integration tests cho posts

## Phase 08 - Hardening, test, release readiness

Status: `Todo`

- [ ] Rà lại tất cả response envelopes theo DRD
- [ ] Rà app error code:
  - `AUTH_INVALID_CREDENTIALS`
  - `AUTH_TOKEN_EXPIRED`
  - `TRIP_NOT_FOUND`
  - `NODE_VALIDATION_ERROR`
  - `PERMISSION_DENIED`
- [ ] Rà ownership và authorization cho auth/trips/planner/posts
- [ ] Rà validation toàn bộ DTO chính
- [ ] Rà Swagger cho auth/trips/planner/posts
- [ ] Rà migration rollback notes
- [ ] Smoke test production sau deploy:
  - auth
  - trips
  - planner
  - public trip
  - posts

## Checklist giao việc theo slice

### Slice BE-A

- [ ] Trip schema alignment
- [ ] Trip DTO alignment
- [ ] Trip tests alignment

### Slice BE-B

- [x] `PlanNode` schema
- [x] `planning` module
- [x] planner read API

### Slice BE-C

- [x] node create/update/delete APIs
- [x] planner validation rules
- [x] planner permission tests

### Slice BE-D

- [~] budget mode logic
- [~] budget summary alignment
- [ ] migration strategy from itinerary

### Slice BE-E

- [ ] public trip read
- [ ] public planner read
- [ ] visibility tests

### Slice BE-F

- [ ] posts create/list/detail
- [ ] optional comments
- [ ] social tests

## Gợi ý cập nhật trạng thái

- Chỉ tick `[x]` khi có artifact thật trong source hoặc tài liệu hợp đồng tương ứng
- Dùng `[~]` khi source có baseline nhưng vẫn lệch DRD
- Khi phase hoàn tất, cập nhật thêm:
  - artifact
  - test đã chạy
  - điểm deferred nếu có
