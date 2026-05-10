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
- [x] Budget summary owner flow đã đọc từ `PlanNode`; runtime smoke và cleanup legacy itinerary support đã hoàn tất
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
| 05    | Budget logic và migration khỏi itinerary bridge | Completed |
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
  - refresh token bị revoke server-side khi `refresh` thành công
  - refresh token bị revoke server-side khi `logout` thành công
  - revoke state hiện được persist theo runtime state dir cho deploy model single-instance; DB-backed session store vẫn là bài toán scale phase sau
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

Status: `Completed`

- [x] Chi tiết backlog tại `18_backend-phase-05-budget-alignment-backlog.md`
- [x] Cleanup backlog tại `21_backend-legacy-itinerary-cleanup-backlog.md`
- [x] Chuyển budget summary sang đọc từ `PlanNode`
- [x] Budget summary owner flow không còn đọc từ itinerary bridge
- [x] Hỗ trợ:
  - `auto -> sum(costAmount)`
  - `manual -> manualBudget`
- [x] Có response budget summary `PlanNode`-based cho frontend owner flow, kèm additive mixed-currency breakdown
- [x] Runtime verify:
  - production smoke `budget-summary` pass trên flow `PlanNode`
  - runtime DB check xác nhận không còn dữ liệu legacy cần backfill trước cleanup destructive
- [x] Đã có helper/script migrate dữ liệu từ `TripItineraryDay/Activity` sang `PlanNode` ở bước cutover trước đó
- [x] Đã chốt cutover plan tại `20_backend-itinerary-plan-node-migration-runbook.md`
- [x] Cleanup legacy itinerary support:
  - gỡ backend itinerary endpoints/module/repository/test support
  - drop bảng `trip_itinerary_days` và `trip_itinerary_activities`
  - gỡ helper/script migration khỏi source active
- [x] Budget summary không còn phụ thuộc bất kỳ runtime path nào từ itinerary bridge

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
- [x] Chốt field tối thiểu:
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

Status: `In progress`

### Focused hardening slice 08-A - application error codes

- Scope của lượt này:
  - [x] chuẩn hóa các app error code đã nêu trong checklist cho auth/trips/planner/public permission flow
  - giữ nguyên success envelope, endpoint path, và payload data hiện tại
  - không thay đổi frontend/UI hoặc contract route frontend
- Target code trong lượt này:
  - [x] `AUTH_INVALID_CREDENTIALS`
  - [x] `AUTH_TOKEN_EXPIRED`
  - [x] `TRIP_NOT_FOUND`
  - [x] `NODE_VALIDATION_ERROR`
  - [x] `PERMISSION_DENIED`
- Verification:
  - [x] targeted unit tests cho auth/error filter
  - [x] targeted integration tests cho auth/trips/planning/posts
  - [x] backend lint
  - [x] backend build
  - [x] full backend unit suite
  - [x] Prisma schema validate với `DATABASE_URL` local test
- Deferred rõ:
  - comment endpoints
  - production smoke thật sau deploy

### Focused hardening slice 08-B - ownership and authorization

- Scope của lượt này:
  - [x] chỉ bổ sung backend integration coverage cho owner-only APIs
  - [x] không thay đổi frontend/UI hoặc flow UI hiện tại
  - [x] không thêm yêu cầu sticker vào flow tạo hoạt động; `PlanNodeSticker` chỉ còn là legacy/experimental endpoint cần được giữ an toàn quyền truy cập
- Target cases trong lượt này:
  - [x] non-owner không được update/delete trip của owner khác
  - [x] non-owner không được đọc planner private, tạo node bằng trip của owner khác, update/delete node của owner khác
  - [x] non-owner không được đọc/ghi sticker của node thuộc owner khác khi legacy endpoint còn tồn tại
  - [x] non-owner không được đọc budget summary của trip owner khác
  - [x] non-owner không được tạo post gắn với trip của owner khác, kể cả trip public
- Verification:
  - [x] targeted integration tests cho trips/planning/budgets/posts
  - [x] backend lint
  - [x] backend build
  - [x] full backend unit suite
- Deferred rõ:
  - xóa hẳn legacy sticker endpoints chỉ thực hiện khi FE/contract xác nhận không còn caller
  - comment endpoints
  - production smoke thật sau deploy

### Focused cleanup slice 08-C - remove legacy planner sticker endpoints

- Scope của lượt này:
  - [x] xác nhận frontend/source of truth không còn caller active cho `GET/PUT /api/v1/nodes/:nodeId/stickers`
  - [x] gỡ backend controller/service/provider/test wiring chỉ phục vụ planner sticker legacy path
  - [x] không đổi contract planner tree chính trên `GET /trips/:id/planner`, `POST /nodes`, `PATCH /nodes/:id`, `DELETE /nodes/:id`
- Target cases trong lượt này:
  - [x] Swagger không còn lộ planner sticker endpoints
  - [x] integration/e2e planning suite không còn phụ thuộc sticker API
  - [x] README/checklist/backend docs không còn mô tả sticker API là active contract planner
- Deferred rõ:
  - cleanup persistence/schema cho dữ liệu sticker nếu sau này xác nhận không cần giữ historical artifacts
  - comment endpoints
  - production smoke thật sau deploy

### Focused hardening slice 08-D - Swagger envelope and primary DTO docs

- Scope của lượt này:
  - [x] chuẩn hóa Swagger cho `auth`, `trips`, `planning`, `posts` theo envelope `success/data/meta` đang dùng thật ở runtime
  - [x] bổ sung request/query DTO metadata cho các endpoint chính của 4 nhóm trên
  - [x] không đổi route path hoặc payload runtime hiện tại
- Target cases trong lượt này:
  - [x] public auth endpoints không còn bị Swagger đánh dấu bearer auth sai
  - [x] list endpoints mô tả rõ `meta.page/size/sort/totalElements/totalPages`
  - [x] request/query DTO chính có field docs rõ ràng cho Swagger UI
  - [x] swagger integration test khóa lại các schema chính của `auth/trips/planning/posts`
- Deferred rõ:
  - journal/budgets/public journal/public trips Swagger sweep sâu hơn
  - production smoke thật sau deploy

### Focused hardening slice 08-E - journal, budgets, and public contract sweep

- Scope của lượt này:
  - [x] rà Swagger/envelope/DTO docs cho `journal`, `journal assets`, `budgets`, `public trips`, và `public journals`
  - [x] rà validation DTO chính còn lại trong các module trên
  - [x] bổ sung rollback notes cho các migration/runtime contract đã chạm trong phase 05-07 khi cần
  - [x] không đổi endpoint path hoặc success payload runtime hiện tại, trừ khi fix drift rõ ràng giữa source và docs/test
- Target cases trong lượt này:
  - [x] owner/public journal endpoints có Swagger docs đúng auth requirement và response envelope
  - [x] budget/public trip/public journal list-detail endpoints có DTO/query docs đủ dùng trong Swagger UI
  - [x] swagger integration test khóa lại schema chính của `journal`, `budgets`, `public trips`
  - [x] docs phase/checklist/rollback notes không còn thiếu chỗ dựa vận hành cho các slice đã release
- Verification:
  - [x] targeted `swagger-docs.integration.spec.ts`
  - [x] targeted `journal.integration.spec.ts`
  - [x] backend lint
  - [x] backend build
- Deferred rõ:
  - production smoke thật sau deploy
  - comment endpoints
  - cloud/object storage production-ready cho journal assets

- [ ] Rà lại tất cả response envelopes theo DRD
- [x] Rà app error code:
  - [x] `AUTH_INVALID_CREDENTIALS`
  - [x] `AUTH_TOKEN_EXPIRED`
  - [x] `TRIP_NOT_FOUND`
  - [x] `NODE_VALIDATION_ERROR`
  - [x] `PERMISSION_DENIED`
- [x] Rà ownership và authorization cho auth/trips/planner/posts
- [x] Rà validation toàn bộ DTO chính
- [x] Rà Swagger cho auth/trips/planner/posts
- [x] Rà migration rollback notes
- [ ] Smoke test production sau deploy:
  - auth
  - trips
  - planner
  - budget summary owner flow sau create/update/delete `PlanNode`
  - journal owner save/load, image upload, signed asset read, visibility update
  - public trip
  - public journal
  - posts/community feed

## Checklist giao việc theo slice

### Slice BE-A

- [x] Trip schema alignment
- [x] Trip DTO alignment
- [x] Trip tests alignment

### Slice BE-B

- [x] `PlanNode` schema
- [x] `planning` module
- [x] planner read API

### Slice BE-C

- [x] node create/update/delete APIs
- [x] planner validation rules
- [x] planner permission tests

### Slice BE-D

- [x] budget mode logic
- [x] budget summary alignment
- [x] migration strategy from itinerary

### Slice BE-E

- [x] public trip read
- [x] public planner read
- [x] visibility tests

### Slice BE-F

- [x] posts create/list/detail
- [ ] optional comments
- [x] social tests

## Gợi ý cập nhật trạng thái

- Chỉ tick `[x]` khi có artifact thật trong source hoặc tài liệu hợp đồng tương ứng
- Dùng `[~]` khi source có baseline nhưng vẫn lệch DRD
- Khi phase hoàn tất, cập nhật thêm:
  - artifact
  - test đã chạy
  - điểm deferred nếu có
