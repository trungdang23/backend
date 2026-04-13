# Backend Definition Of Done

## Trạng thái

- Date: `2026-04-13`
- Status: `Accepted`

## Definition of Done mặc định

- [x] `lint` pass
- [x] `test` pass
- [x] `build` pass
- [x] Có cập nhật `README` nếu thêm script, cách chạy, hoặc dependency quan trọng
- [x] Có cập nhật Swagger nếu đổi API contract
- [x] Có migration nếu thay đổi schema database
- [x] Không commit secret, token, hoặc file env thật

## Quy tắc test theo phase

- Mỗi bước trong phase phải có ít nhất một hình thức kiểm chứng tương ứng.
- Với logic cô lập, bắt buộc có unit test.
- Với wiring thật của ứng dụng, bắt buộc có integration test.
- Một phase chỉ được đánh dấu hoàn thành khi cả hai lớp kiểm chứng cùng pass:
  - mock-based verification: unit test với dependency giả lập hoặc stub phù hợp
  - reality-based verification: integration test hoặc smoke test trên wiring thật, và khi phase có database hoặc hạ tầng thật thì phải chạy với thành phần thật đó

## Cách diễn giải theo mức hạ tầng

- Phase chưa đụng database:
  - reality pass = app boot thật, HTTP contract thật, không mock controller hoặc module wiring
- Phase đã đụng database:
  - reality pass = repository và migration chạy với PostgreSQL thật ở local/test environment
- Phase deploy:
  - reality pass = smoke test trên môi trường gần production hoặc production sau deploy

## Nghĩa vụ tài liệu

- Mỗi phase phải có cập nhật vào file log thực hiện phase trong `backend/documents`
- Mỗi lần hoàn thành một phase cần ghi rõ:
  - mục tiêu phase
  - artifact đã tạo hoặc đã sửa
  - test đã chạy
  - kết quả pass/fail
  - việc còn nợ nếu có
