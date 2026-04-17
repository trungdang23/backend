# Backend Phase Checklist

## Quy ước trạng thái

- `[x]` hoàn thành
- `[ ]` chưa hoàn thành
- `Status` của phase được cập nhật thủ công theo tiến độ thực tế

## Giả định hiện tại

- [x] Đã có domain
- [x] Đã có VPS
- [x] Đã chốt stack backend chính thức
- [x] Đã scaffold source backend

## Tổng quan phase

| Phase | Mục tiêu | Status |
| --- | --- | --- |
| 00 | Chuẩn bị nền tảng dự án và môi trường | Completed |
| 01 | Scaffold backend và chuẩn hóa kiến trúc | Completed |
| 02 | Hoàn thiện core technical foundation | Completed |
| 03 | Xây dựng `auth` và `users` | Completed |
| 04 | Xây dựng `trips` | Completed |
| 05 | Xây dựng `itineraries` và `budgets` | Completed |
| 06 | Xây dựng `community` | Todo |
| 07 | Kiểm thử, hardening, và tài liệu vận hành | Todo |
| 08 | Chuẩn bị môi trường production | Todo |
| 09 | Deploy production và hậu kiểm | Todo |

## Phase 00 - Chuẩn bị nền tảng dự án và môi trường

Status: `Completed`

- [x] Xác nhận mục tiêu backend và nguyên tắc thiết kế tổng thể
- [x] Xác nhận đã có domain
- [x] Xác nhận đã có VPS
- [x] Chốt framework backend
- [x] Chốt ORM và migration tool
- [x] Chốt chuẩn version API
- [x] Chốt convention đặt tên module, DTO, use case, repository port
- [x] Chốt chiến lược quản lý cấu hình theo môi trường
- [x] Chốt chiến lược secrets management
- [x] Chốt nhánh git và workflow review
- [x] Chốt definition of done cho backend

## Phase 01 - Scaffold backend và chuẩn hóa kiến trúc

Status: `Completed`

- [x] Khởi tạo project backend trong `backend/`
- [x] Tạo cấu trúc thư mục theo module và layer
- [x] Tạo module `app`, `shared`, và `modules`
- [x] Tạo bootstrap cho HTTP server
- [x] Tạo cấu hình environment cơ bản
- [x] Tạo chuẩn response success và error
- [x] Tạo global exception handling
- [x] Tạo logging cơ bản
- [x] Tạo lint, format, và script chạy local
- [x] Tạo `backend/README.md` mô tả cách chạy và kiểm tra

## Phase 02 - Hoàn thiện core technical foundation

Status: `Completed`

- [x] Tạo base abstraction cho `Entity`, `ValueObject`, `UseCase`, `DomainError`
- [x] Tạo validation strategy ở boundary
- [x] Tạo health check endpoint
- [x] Tạo database connection và migration baseline
- [x] Tạo authentication guard hoặc middleware nền
- [x] Tạo request tracing hoặc correlation id
- [x] Tạo logging policy không lộ dữ liệu nhạy cảm
- [x] Tạo cấu trúc test cho unit, integration, e2e
- [x] Tạo CI check tối thiểu cho lint, test, build

## Phase 03 - Xây dựng `auth` và `users`

Status: `Completed`

- [x] Tạo module `auth`
- [x] Tạo module `users`
- [x] Tạo use case đăng ký tài khoản
- [x] Tạo use case đăng nhập
- [x] Tạo access token flow
- [x] Tạo password hashing service qua adapter riêng
- [x] Tạo endpoint lấy thông tin người dùng hiện tại
- [x] Tạo DTO input/output rõ ràng cho auth và user profile
- [x] Tạo unit test cho use case auth
- [x] Tạo e2e test cho luồng đăng ký và đăng nhập

## Phase 04 - Xây dựng `trips`

Status: `Completed`

- [x] Tạo module `trips`
- [x] Tạo entity và value object cho chuyến đi
- [x] Tạo use case tạo chuyến đi
- [x] Tạo use case danh sách chuyến đi theo người dùng
- [x] Tạo use case lấy chi tiết chuyến đi
- [x] Tạo use case cập nhật thông tin chuyến đi
- [x] Tạo use case xóa hoặc archive chuyến đi
- [x] Tạo contract API cho create/list/detail/update/delete
- [x] Tạo integration test cho repository của `trips`
- [x] Tạo e2e test cho flow tạo và xem chi tiết chuyến đi

## Phase 05 - Xây dựng `itineraries` và `budgets`

Status: `Completed`

- [x] Tạo module `itineraries`
- [x] Tạo module `budgets`
- [x] Tạo use case thêm ngày vào lịch trình
- [x] Tạo use case thêm hoạt động vào một ngày
- [x] Tạo use case cập nhật hoạt động và ghi chú
- [x] Tạo use case tính tổng chi phí chuyến đi
- [x] Tạo rule kiểm tra ngày bắt đầu và ngày kết thúc hợp lệ
- [x] Tạo DTO và response contract cho lịch trình và ngân sách
- [x] Tạo unit test cho rule tính ngân sách
- [x] Tạo integration test cho persistence của lịch trình

## Phase 06 - Xây dựng `community`

Status: `Todo`

- [ ] Tạo module `community`
- [ ] Tạo use case tạo bài viết từ trải nghiệm chuyến đi
- [ ] Tạo use case lấy feed cộng đồng
- [ ] Tạo use case like và comment
- [ ] Tạo use case follow người dùng
- [ ] Tạo boundary rõ giữa `community` với `users` và `trips`
- [ ] Tạo DTO cho feed, post detail, comment, follow
- [ ] Tạo unit test cho permission và business rule chính
- [ ] Tạo integration test cho repository liên quan

## Phase 07 - Kiểm thử, hardening, và tài liệu vận hành

Status: `Todo`

- [ ] Bổ sung test coverage cho domain và application layer trọng yếu
- [ ] Kiểm tra consistency của error code và response envelope
- [ ] Kiểm tra validation toàn bộ endpoint chính
- [ ] Kiểm tra logging, audit trail, và masking dữ liệu nhạy cảm
- [ ] Kiểm tra timeout, retry, và fallback cho external adapter nếu có
- [ ] Bổ sung tài liệu API bằng OpenAPI hoặc Swagger
- [ ] Hoàn thiện `backend/README.md`
- [ ] Hoàn thiện tài liệu cấu hình môi trường
- [ ] Hoàn thiện runbook deploy và rollback

## Phase 08 - Chuẩn bị môi trường production

Status: `Todo`

- [ ] Cấu hình server runtime trên VPS
- [ ] Cấu hình reverse proxy
- [ ] Cấu hình DNS trỏ domain về VPS
- [ ] Cấu hình SSL
- [ ] Cấu hình firewall và các port cần thiết
- [ ] Cấu hình biến môi trường production
- [ ] Cấu hình database production
- [ ] Cấu hình backup database
- [ ] Cấu hình process manager hoặc container runtime
- [ ] Cấu hình monitoring và log retention

## Phase 09 - Deploy production và hậu kiểm

Status: `Todo`

- [ ] Chạy build production
- [ ] Chạy migration trên production
- [ ] Deploy backend lên VPS
- [ ] Kiểm tra health check sau deploy
- [ ] Kiểm tra luồng đăng nhập trên production
- [ ] Kiểm tra luồng tạo chuyến đi trên production
- [ ] Kiểm tra log và resource usage sau deploy
- [ ] Xác nhận domain, SSL, và reverse proxy hoạt động đúng
- [ ] Chuẩn bị phương án rollback
- [ ] Chốt biên bản go-live và backlog sau production

## Gợi ý cập nhật trạng thái

- Cập nhật `Status` của phase ngay khi bắt đầu thực hiện phase đó
- Tick checklist ngay sau khi hoàn thành đầu việc tương ứng
- Không tick theo cảm tính; chỉ tick khi đã có artifact, cấu hình, hoặc kết quả kiểm thử tương ứng
