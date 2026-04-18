# Backend Definition Of Done

## Trạng thái

- Date: `2026-04-18`
- Status: `Updated for DRD alignment`

## Definition of Done mặc định

- [x] `lint` pass
- [x] `test` pass
- [x] `build` pass
- [x] Có migration nếu đổi schema
- [x] Có cập nhật Swagger nếu đổi API contract
- [x] Có cập nhật README hoặc planning docs nếu đổi workflow hoặc contract
- [x] Không commit secret, token, hoặc file env thật

## Điều kiện done bổ sung theo DRD mới

- Một phase không được gọi là done nếu feature vẫn lệch DRD mà không có migration note rõ ràng.
- Nếu source đang dùng bridge tạm như `itinerary`, phase chỉ được đánh dấu:
  - `partial` nếu bridge còn là main flow
  - `done` khi target flow theo DRD đã chạy thật
- Mọi deviation khỏi DRD phải được ghi rõ trong document phase hoặc API plan.

## Quy tắc test theo lớp

- Logic cô lập phải có unit test.
- Wiring thật phải có integration test.
- Flow chính có API contract phải có e2e hoặc smoke test.

## Quy tắc reality-based verification

- Phase chưa đụng DB:
  - app boot thật
  - HTTP contract thật
- Phase có DB:
  - migration chạy được
  - repository mapping chạy với PostgreSQL thật
- Phase có auth:
  - happy path và unauthorized path đều phải có verify
- Phase có planner:
  - create root node
  - create child node
  - read full planner
  - update node
  - delete node
- Phase có public sharing:
  - guest/public path
  - private denied path
- Phase có posts/comments:
  - create/list/detail
  - permission path

## Nghĩa vụ tài liệu

- Mỗi phase phải cập nhật:
  - mục tiêu
  - artifact
  - test đã chạy
  - deferred items nếu có
- Nếu contract thay đổi:
  - cập nhật Swagger
  - cập nhật tài liệu integration plan
  - cập nhật checklist phase

## Điều không được coi là done

- Chỉ có schema nhưng chưa có API
- Chỉ có API nhưng chưa có test permission/validation
- Chỉ giữ bridge cũ rồi gọi đó là aligned với DRD
- Có deferred item nhưng không ghi rõ trong tài liệu
