# Backend Phase 02 Auth Completion Backlog

## Mục tiêu

Đóng nốt Phase 02 của backend để auth lifecycle aligned với target contract:

- `register`
- `login`
- `me`
- `refresh`
- `logout`

## Trạng thái

- Status: `Completed`
- Completed at: `2026-04-18`

## Current pass - 2026-04-21

### Trigger

- Production smoke đã xác nhận refresh token cũ vẫn tiếp tục dùng được sau:
  - `POST /api/v1/auth/logout`
  - `POST /api/v1/auth/refresh`
- Vấn đề này làm contract auth nhìn như đủ endpoint nhưng session invalidation chưa đúng kỳ vọng runtime.

### Scope của lượt hardening này

- Giữ nguyên contract HTTP hiện tại cho:
  - `POST /api/v1/auth/refresh`
  - `POST /api/v1/auth/logout`
- Thêm revoke state cho refresh token trên runtime hiện tại mà không kéo thêm DB migration mới.
- Đảm bảo refresh token cũ bị invalidate sau khi refresh thành công.
- Đảm bảo refresh token đã logout không thể dùng lại.
- Bổ sung unit/integration/e2e coverage cho cả hai behavior trên.
- Cập nhật README/runbook để phản ánh nơi runtime lưu revoke state.

### Rollout strategy

- Dùng persisted revoke store theo `jti` của refresh token trên local filesystem.
- State path sẽ bám app state directory hiện tại của máy chạy service, không tạo thêm dependency production mới.
- Giải pháp này được chấp nhận cho deploy model single-machine/single-instance hiện tại.

### Deferred sau lượt này

- Session persistence hoặc multi-device session management trong database.
- Cross-instance revoke propagation cho môi trường nhiều replica.
- Admin/session introspection API.

## Current pass - 2026-05-07 - Profile and avatar completion

### Trigger

- Browser smoke đã pass cho flow hiện tại, nhưng hồ sơ vẫn dùng avatar placeholder chung và chưa có cách cập nhật tên hiển thị.
- Người dùng cần upload avatar khi tạo tài khoản, đổi avatar trong profile, và backend phải dọn file avatar cũ để tránh phình storage local.

### Scope của lượt này

- [x] Thêm metadata avatar vào `users` bằng migration additive.
- [x] Mở auth-only profile update:
  - `PATCH /api/v1/auth/me`
  - `POST /api/v1/auth/me/avatar`
  - `DELETE /api/v1/auth/me/avatar`
- [x] Mở public read cho avatar:
  - `GET /api/v1/user-avatars/:publicId`
- [x] Response user chỉ expose `avatarUrl`, không expose `avatarStorageKey`.
- [x] Avatar lưu local mặc định tại `${XDG_STATE_HOME:-$HOME/.local/state}/${APP_NAME}/user-avatars`, có thể override bằng `USER_AVATAR_STORAGE_DIR`.
- [x] Khi đổi hoặc xóa avatar, backend xóa file cũ best-effort sau khi DB update thành công.

### Deferred sau lượt này

- Crop/resize ảnh phía server.
- CDN/object storage cho avatar.
- Revision/history avatar hoặc moderation pipeline.

## Current pass - 2026-05-08 - Avatar runtime DI hotfix

### Trigger

- Production trả `404 Cannot POST /api/v1/auth/me/avatar` vì runtime vẫn chạy build cũ.
- Khi redeploy lên source mới có avatar route, Nest boot fail do `UsersModule` không resolve được `AppConfigService` cho `LocalUserAvatarStorage`.

### Scope của lượt này

- [x] wire `AppConfigService` vào `UsersModule` để avatar storage boot được trong runtime thật
- [x] thêm test compile nhỏ cho `UsersModule` với `LocalUserAvatarStorage` thật để CI chặn regression DI này
- [x] redeploy backend production và verify lại `POST /api/v1/auth/me/avatar` không còn `NOT_FOUND`

## Trạng thái hiện tại

Đã có:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/refresh`
- access token guard
- JWT issue/verify
- password hashing
- auth e2e baseline

Đã hoàn tất:

- `POST /api/v1/auth/logout`
- contract logout rõ ràng
- tests cho logout
- update docs cho full auth lifecycle

## Quyết định cần chốt trước khi code

## Auth logout strategy

MVP phù hợp nhất hiện tại:

- `stateless logout + clear token phía client`
- backend cung cấp `POST /auth/logout` để đóng contract
- endpoint trả `200`
- backend validate request shape
- backend không bắt buộc revoke refresh token vì hiện flow đang stateless

Lý do:

- bám target contract
- chi phí thấp
- không kéo Phase 02 sang bài toán token revocation store

### Deferred rõ ràng

Token revocation hoặc refresh token persistence sẽ để sang hardening phase sau.

## Scope chi tiết

## Slice BE-02A - Logout contract

### Việc cần làm

- [x] Tạo `LogoutRequestDto`
- [x] Chốt request body:
  - `refreshToken: string`
- [x] Chốt response:
  - `success: true`
  - `data: { loggedOut: true }`
- [x] Thêm app error code nếu cần cho invalid logout payload

### File dự kiến

- `src/modules/auth/presentation/dto/logout-request.dto.ts`
- `src/modules/auth/presentation/dto/logout-response.dto.ts`

## Slice BE-02B - Logout use case

### Việc cần làm

- [x] Tạo `LogoutAuthSessionService`
- [x] Endpoint nhận request và trả success
- [x] Nếu request không hợp lệ thì trả `4xx` đúng contract hiện tại
- [x] Nếu user gửi refresh token rỗng hoặc malformed thì reject đúng contract

### Lưu ý

- Không cần DB write trong MVP stateless logout
- Không cần blacklist token ở phase này
- Service phải có comment hoặc doc note giải thích đây là contract-completion endpoint, chưa phải revoke flow

### File dự kiến

- `src/modules/auth/application/services/logout-auth-session.service.ts`
- `src/modules/auth/presentation/auth.controller.ts`

## Slice BE-02C - Swagger và docs

### Việc cần làm

- [x] Expose `POST /api/v1/auth/logout` trong Swagger
- [x] Update `backend/README.md`
- [x] Update `01_backend-phase-checklist.md` khi xong
- [x] Ghi note deferred token revocation trong docs

## Slice BE-02D - Tests

### Unit

- [x] DTO validation cho logout request
- [x] Service trả success với input hợp lệ

### Integration

- [x] `POST /api/v1/auth/logout` trả `200` với payload hợp lệ
- [x] Request malformed trả `4xx` đúng kỳ vọng

### E2E

- [x] register hoặc login để lấy refresh token
- [x] gọi `POST /api/v1/auth/logout`
- [x] assert response success
- [x] ghi rõ rằng token cũ chưa bị revoke server-side trong phase này

## Acceptance criteria

- Có `POST /api/v1/auth/logout`
- Swagger phản ánh endpoint mới
- Response envelope đúng chuẩn
- Có test unit/integration/e2e cho logout slice
- Docs nêu rõ logout phase này là stateless

## Implementation order đề xuất

1. Tạo DTO request/response
2. Tạo service logout
3. Wire controller + module
4. Thêm tests
5. Cập nhật docs/checklist

## Rủi ro cần tránh

- Không giả vờ revoke token nếu backend chưa có token store
- Không làm logout endpoint mập mờ kiểu `204` không body trong khi app đang bám response envelope chuẩn
- Không để Phase 02 bị kéo sang bài toán session persistence server-side

## Definition of done cho backlog này

- `POST /api/v1/auth/logout` chạy end-to-end
- unit/integration/e2e pass
- docs của backend phản ánh rõ auth lifecycle hiện tại
