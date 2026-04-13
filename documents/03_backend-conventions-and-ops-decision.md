# Backend Conventions And Ops Decision

## Trạng thái

- Date: `2026-04-13`
- Status: `Accepted`
- Scope: convention mã nguồn, config, secrets, workflow, logging cho backend `journey`

## Các quyết định đã chốt

| Hạng mục | Quyết định |
| --- | --- |
| File naming | `kebab-case` |
| Class / DTO / interface / enum | `PascalCase` |
| Variable / function / method | `camelCase` |
| Environment config | `.env.development`, `.env.test`, `.env.production` |
| Config validation | validate schema khi boot app |
| Production secrets | environment variables trên VPS, không commit repo |
| Git workflow | `main` + feature branch + PR review |
| Logging / monitoring phase đầu | health check + application logs + Docker logs |

## Tác động trực tiếp tới scaffold

- Khi tạo source, toàn bộ file và thư mục con sẽ theo chuẩn `kebab-case`
- DTO, entity, use case, controller sẽ dùng kiểu đặt tên rõ ràng theo convention tiếng Anh
- App bootstrap cần có bước validate config ngay lúc khởi động
- Cần chuẩn bị file mẫu env cho development, test, production
- Không tạo file chứa secret thật trong repo; chỉ cung cấp `.env.example` hoặc tài liệu hướng dẫn
- README backend cần mô tả workflow chạy local, biến môi trường, và cách review/merge cơ bản

## Những gì chưa cần làm ngay

- Chưa cần cài monitoring stack riêng như Prometheus hoặc Grafana ở phase đầu
- Chưa cần secret manager riêng nếu environment variables trên VPS vẫn đáp ứng được nhu cầu hiện tại
