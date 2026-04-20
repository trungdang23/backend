# Backend Phase 07 Community Minimal Backlog

## Mục tiêu

Đóng `Phase 07` của backend để biến `community` từ placeholder thành feature có dữ liệu thật, đồng thời giữ scope đủ nhỏ để không chặn các phase hardening sau đó.

Phase này tập trung vào:

- create post API cho user đã đăng nhập
- public post list API cho guest
- public post detail API cho guest
- optional bridge từ `trip` sang `post` qua `tripId`
- permission rules rõ giữa create và public read
- test cho `create/list/detail/not found`

Phase này chưa xử lý:

- comments
- likes, reactions, bookmark, follow
- edit/delete post
- draft/private post
- search, tag, ranking, moderation
- upload file/media service riêng

## Trạng thái

- Status: `Implemented in source`
- Date: `2026-04-20`
- Owner area:
  - `backend/src/modules/posts`
  - `backend/db/schema.prisma`
- Trạng thái source hiện tại:
  - đã có `posts` module trong backend
  - đã có schema `Post`
  - đã mount create/list/detail APIs cho `posts`
  - public trip sharing đã được reuse làm bridge `tripId` cho community
- Dependency chặn:
  - auth Phase 02 phải giữ ổn định
  - trips/public trip sharing phải giữ contract ổn định
- Dependency mở ra sau khi xong:
  - `Phase 06 FE`
  - `Phase 08 BE`
  - `Phase 07 FE`

## Quyết định rollout cần chốt

## 1. Tách `posts` thành module riêng, không nhét vào `trips`

`posts` có thể tham chiếu `tripId`, nhưng không nên để community logic trộn vào trip service hiện tại.

Lý do:

- boundary rõ hơn giữa planning và publishing
- dễ mở comments/moderation sau này
- giảm nguy cơ controller/service `trips` phình to

## 2. MVP permission là `create auth-only`, `read public`

Phase này khuyến nghị:

- `POST /api/v1/posts`: cần auth
- `GET /api/v1/posts`: public
- `GET /api/v1/posts/:postId`: public

Không mở trong phase này:

- `PATCH /api/v1/posts/:postId`
- `DELETE /api/v1/posts/:postId`

Lý do:

- đủ để unlock community feed thật
- tránh kéo ownership/edit policy vào ngay sprint đầu

## 3. `tripId` là optional bridge, nhưng nếu có thì phải an toàn

Nếu request create post có `tripId`, backend cần validate:

- trip tồn tại
- trip thuộc về current user
- trip đang là `visibility = public`

Khuyến nghị:

- nếu `tripId` không thuộc current user hoặc không tồn tại: trả `404`
- nếu trip thuộc current user nhưng còn `private`: trả `400`

Lý do:

- không leak ownership của trip người khác
- không cho post community trỏ đến trip private

## 4. Read model nên embed author summary và trip summary

Khuyến nghị response read dùng một shape thống nhất cho list/detail:

- field core của post
- `author` summary
- `trip` summary nếu có linked trip

Ví dụ:

- `author.id`
- `author.displayName`
- `trip.id`
- `trip.name`
- `trip.coverImageUrl`

Lý do:

- frontend không cần gọi thêm `users` hoặc `trips` chỉ để render feed
- community card/detail đủ dữ liệu để hiển thị ngay

## 5. Pagination giữ pattern hiện có của app

Khuyến nghị:

- `GET /api/v1/posts?page=0&size=12&sort=createdAt,desc`

Giữ cùng style meta như list trips:

- `page`
- `size`
- `sort`
- `totalElements`
- `totalPages`

Lý do:

- FE reuse list/query handling dễ hơn
- API surface nhất quán hơn

## 6. `comments` phải deferred rõ ràng

Phase này không mở comment API.

Điều này phải được ghi rõ trong docs/test để tránh FE dựng UI nửa vời rồi gọi endpoint chưa tồn tại.

## Contract backend cần bám sau Phase 07

## Create post

### Endpoint

- `POST /api/v1/posts`

### Request shape mục tiêu

```json
{
  "title": "Ba ngày ở Hoi An để đi chậm lại",
  "content": "Mình đi theo nhịp rất nhẹ, giữ mỗi ngày 2-3 điểm chính...",
  "coverImageUrl": "https://example.com/posts/hoi-an-cover.jpg",
  "tripId": "trip-id-or-null"
}
```

### Response shape mục tiêu

```json
{
  "success": true,
  "data": {
    "id": "post-id",
    "userId": "user-id",
    "tripId": "trip-id",
    "title": "Ba ngày ở Hoi An để đi chậm lại",
    "content": "Mình đi theo nhịp rất nhẹ...",
    "coverImageUrl": "https://example.com/posts/hoi-an-cover.jpg",
    "visibility": "public",
    "createdAt": "2026-04-20T00:00:00.000Z",
    "updatedAt": "2026-04-20T00:00:00.000Z",
    "author": {
      "id": "user-id",
      "displayName": "Trung"
    },
    "trip": {
      "id": "trip-id",
      "name": "Hoi An Slow Days",
      "coverImageUrl": null
    }
  }
}
```

## List public posts

### Endpoint

- `GET /api/v1/posts?page=0&size=12&sort=createdAt,desc`

### Response shape mục tiêu

Giữ cùng read model như detail, chỉ khác là trả `data[]` và `meta`.

## Detail post

### Endpoint

- `GET /api/v1/posts/:postId`

### Response shape mục tiêu

Giữ cùng read model như create response để FE reuse component/card/detail dễ hơn.

## Error semantics bắt buộc

- `401`:
  - create post khi chưa đăng nhập
- `404`:
  - post không tồn tại
  - `tripId` không tồn tại hoặc không thuộc current user khi create
- `400`:
  - request invalid
  - linked trip còn `private`
- `200/201`:
  - read/create thành công

Machine-readable error response phải giữ pattern hiện có của app.

## Slice BE-07A - Schema, migration, persistence baseline

### Việc cần làm

- [x] Thêm model `Post` vào Prisma schema
- [x] Chốt field tối thiểu:
  - `id`
  - `userId`
  - `tripId?`
  - `title`
  - `content`
  - `coverImageUrl?`
  - `visibility`
  - `createdAt`
  - `updatedAt`
- [x] Chốt relation:
  - `Post.user -> User`
  - `Post.trip -> Trip?`
- [x] Chốt index:
  - `createdAt`
  - `userId, createdAt`
  - `tripId`
- [x] Tạo migration và Prisma client update

### File dự kiến

- `db/schema.prisma`
- `db/migrations/*`

## Slice BE-07B - Domain contract, repository, services

### Việc cần làm

- [x] Tạo `posts` module với application/domain/infrastructure/presentation
- [x] Tạo repository port cho post
- [x] Tạo Prisma repository cho post
- [x] Tạo service:
  - `create-post`
  - `list-public-posts`
  - `get-post-detail`
- [x] Tạo read model builder để hydrate `author` và `trip`
- [x] Không để controller map trực tiếp từ Prisma entity ra HTTP

### File dự kiến

- `src/modules/posts/posts.module.ts`
- `src/modules/posts/application/ports/post-repository.port.ts`
- `src/modules/posts/application/services/*`
- `src/modules/posts/infrastructure/prisma/prisma-post.repository.ts`
- `src/modules/posts/domain/*`

## Slice BE-07C - HTTP contract và validation

### Việc cần làm

- [x] Mount `POST /api/v1/posts`
- [x] Mount `GET /api/v1/posts`
- [x] Mount `GET /api/v1/posts/:postId`
- [x] DTO validate:
  - `title` required
  - `title` trimmed
  - `content` required
  - `content` trimmed
  - `coverImageUrl` valid URL nếu có
  - `tripId` optional
- [x] Khuyến nghị giới hạn:
  - `title <= 120`
  - `content <= 20000`
- [x] List API nhận `page/size/sort`
- [x] Default sort là `createdAt,desc`
- [x] Swagger tags và response docs rõ ràng

### File dự kiến

- `src/modules/posts/presentation/posts.controller.ts`
- `src/modules/posts/presentation/dto/*`

## Slice BE-07D - Permission, trip bridge, safety rules

### Việc cần làm

- [x] `POST /api/v1/posts` bắt buộc auth
- [x] `GET /api/v1/posts` là public
- [x] `GET /api/v1/posts/:postId` là public
- [x] Nếu có `tripId`:
  - verify trip thuộc current user
  - verify trip đang `public`
- [x] Không cho linked trip private đi vào post read model
- [x] Không mở mutation khác ngoài create

### File dự kiến

- `src/modules/posts/application/services/create-post.service.ts`
- reuse helper/query từ `trips` nếu an toàn

## Slice BE-07E - Tests, docs, release safety

### Unit / service-level

- [x] create post pass khi request hợp lệ
- [x] create post fail `401` khi không auth
- [ ] create post fail `404` khi linked trip không thuộc owner
- [x] create post fail `400` khi linked trip còn private
- [x] list posts chỉ trả post public
- [x] detail post trả đúng author/trip summary

### Integration

- [x] `POST /api/v1/posts` trả đúng shape
- [x] `GET /api/v1/posts` trả list/meta đúng shape
- [x] `GET /api/v1/posts/:postId` trả detail đúng shape
- [x] `404` cho post không tồn tại
- [x] create post không làm regression auth/trips hiện có

### E2E / smoke

- [x] user login -> create post -> guest đọc được ở feed
- [x] guest mở được post detail
- [x] linked trip public render được trong response
- [x] linked trip private bị chặn ở create

### Docs

- [x] Cập nhật checklist phase sau khi merge implementation
- [x] Cập nhật README khi posts contract đã sẵn cho người dùng cuối

### File dự kiến

- `test/unit/modules/posts/*`
- `test/integration/posts/*`
- `test/e2e/posts/*`
- `documents/01_backend-phase-checklist.md`
- `README.md`

## Validation matrix của phase này

- create post cần auth
- list/detail post là public
- `tripId` là optional chứ không bắt buộc
- linked trip phải thuộc owner và phải đang public
- response không leak email hoặc field user nhạy cảm
- list/detail shape không drift quá xa nhau nếu chưa có nhu cầu thật
- community module không làm nở boundary của `trips`

## Deferred rõ ràng sau phase này

- comments
- likes/reactions/bookmarks
- edit/delete post
- private/draft post
- tags/search/filter
- moderation/admin action
- upload media binary
- SEO/Open Graph cho post detail

## Definition of done cho Phase 07

Phase này chỉ được gọi là done khi:

- user đã đăng nhập tạo được post qua `POST /api/v1/posts`
- guest xem được feed community qua `GET /api/v1/posts`
- guest mở được post detail qua `GET /api/v1/posts/:postId`
- linked trip chỉ attach được khi trip thuộc owner và đang public
- read model đã đủ dữ liệu cho FE render author và linked trip mà không cần request phụ
- comments được ghi rõ là deferred
- test đã có cho create/list/detail/not found và linked-trip rules
