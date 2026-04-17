# Backend Stack Decision

## Trạng thái

- Date: `2026-04-13`
- Status: `Accepted`
- Scope: giai đoạn scaffold backend ban đầu cho `journey`

## Các quyết định đã chốt

| Hạng mục | Quyết định |
| --- | --- |
| Backend framework | `NestJS` |
| Database | `PostgreSQL` |
| ORM và migration | `Prisma` |
| API style | REST |
| API prefix | `/api/v1` |
| Auth strategy | `JWT access token + refresh token` |
| Module ưu tiên scaffold | `auth`, `users`, `trips` |
| Hạ tầng database giai đoạn đầu | database đặt cùng VPS |
| Production deployment | `Docker Compose + Nginx + SSL Let's Encrypt` |
| API domain mục tiêu | `api.tenmiencuaban.com` |
| Mức tự động hóa deploy | build/test tự động, deploy production tự động trên `push main` + fallback `workflow_dispatch` |
| API documentation | bật `Swagger / OpenAPI` ngay từ đầu |
| Package manager | `pnpm` |
| Quy ước ngôn ngữ | code tiếng Anh, docs tiếng Việt |

## Ý nghĩa kiến trúc

- `NestJS` phù hợp với hướng module hóa và dependency injection, giúp giữ kỷ luật SOLID ngay từ lúc scaffold.
- `PostgreSQL + Prisma` là bộ đôi đủ ổn định cho MVP, migration rõ ràng, và dễ kiểm thử.
- REST với `/api/v1` giúp contract API nhất quán, dễ versioning, và phù hợp cho frontend web/mobile về sau.
- `JWT access token + refresh token` giúp luồng xác thực thực tế hơn so với chỉ dùng access token.
- Chỉ ưu tiên `auth`, `users`, `trips` trong đợt scaffold đầu giúp kiểm soát phạm vi và tránh dựng khung quá rộng khi chưa có source thật.
- Database colocate cùng VPS giúp đi nhanh trong giai đoạn đầu; khi tải tăng mới cân nhắc tách riêng hoặc dùng managed database.

## Tác động trực tiếp tới Phase 01

- Khởi tạo project backend bằng `pnpm`
- Scaffold `NestJS` app trong `backend/`
- Tạo cấu trúc module theo `app`, `shared`, `modules`
- Bật `Swagger`
- Chuẩn hóa prefix `/api/v1`
- Chuẩn bị `Docker Compose` cho local database
- Ưu tiên dựng vertical slice đầu tiên cho `auth`, `users`, `trips`

## Các quyết định chưa chốt

- Secrets management cụ thể cho production
- Git branching strategy và review flow
- Monitoring stack cụ thể
- Backup/restore automation cho database
- CI provider và cấu trúc pipeline chi tiết
