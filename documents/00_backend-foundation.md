# Backend Foundation

## Mục tiêu

- Xây dựng backend cho `journey` theo hướng dễ mở rộng, dễ kiểm thử, và tách biệt rõ giữa business logic với hạ tầng kỹ thuật.
- Hỗ trợ các nhóm chức năng cốt lõi của sản phẩm:
  - quản lý tài khoản người dùng
  - quản lý chuyến đi
  - quản lý lịch trình chi tiết và planning hierarchy
  - theo dõi ngân sách
  - hiển thị media qua image URL
  - các tính năng cộng đồng
- Giữ khả năng phát triển dần từ giai đoạn MVP đến giai đoạn có nhiều module mà không làm phình controller hoặc service.
- Ưu tiên `modular monolith` trong giai đoạn đầu để giảm độ phức tạp vận hành, nhưng vẫn chuẩn bị sẵn ranh giới để tách module khi cần.

## Phạm vi giai đoạn đầu

- Chưa tách microservice.
- Tập trung dựng khung kiến trúc, convention, và các module đầu tiên.
- Ưu tiên hoàn thiện vertical slice cho `auth`, `users`, `trips`, sau đó mới mở rộng sang `itineraries`, `budgets`, `community`.
- Khi nhu cầu planner vượt khỏi mô hình `trip -> day -> activity`, ưu tiên mở module `planning` additive thay vì vá sâu vào `itineraries` hiện tại.

## Nguyên tắc thiết kế

### 1. SOLID là nguyên tắc nền

#### Single Responsibility Principle

- Controller chỉ xử lý HTTP concerns: nhận request, gọi use case, trả response.
- Use case chỉ điều phối nghiệp vụ.
- Repository chỉ làm việc với persistence.
- Validator, mapper, token service, mail service là các thành phần tách riêng, không nhồi vào service tổng.

#### Open/Closed Principle

- Business logic phụ thuộc vào `port/interface`, không phụ thuộc trực tiếp ORM, database, hoặc third-party SDK.
- Khi thay đổi công nghệ lưu trữ hoặc tích hợp ngoài, ưu tiên thêm adapter mới thay vì sửa use case hiện có.

#### Liskov Substitution Principle

- Tránh tạo base class quá rộng và khó thay thế.
- Mọi implementation của cùng một port phải tuân thủ cùng hợp đồng hành vi và dữ liệu.

#### Interface Segregation Principle

- Tách interface nhỏ theo mục đích sử dụng như `TripReader`, `TripWriter`, `TokenIssuer`, `PasswordHasher`.
- Không để một interface lớn buộc nhiều implementation phải mang các method không dùng đến.

#### Dependency Inversion Principle

- Application layer và domain layer chỉ phụ thuộc vào abstraction.
- Infrastructure layer hiện thực các abstraction đó và được inject vào lúc bootstrap.

### 2. Tách lớp theo trách nhiệm

Mỗi module backend cần ưu tiên cấu trúc theo 4 lớp:

- `presentation`: controller, request DTO, response DTO
- `application`: use case, command/query, orchestration
- `domain`: entity, value object, business rule, domain service
- `infrastructure`: repository adapter, ORM model mapping, external service adapter

### 3. Giữ ranh giới module rõ ràng

- Không truy cập chéo trực tiếp sang persistence của module khác.
- Giao tiếp giữa các module thông qua use case, port, hoặc event nội bộ nếu thực sự cần.
- Không để `community` kéo logic của `trips` hoặc `users` vào cùng một service lớn.
- Khi mở rộng planner nhiều tầng, giữ `planning` như boundary riêng thay vì trộn vào `trips` controller/service hiện có.

### 4. Validation ở boundary, business rule ở domain/application

- Dữ liệu request phải được validate ngay tại điểm vào.
- Business rule như quyền truy cập, giới hạn ngân sách, ngày bắt đầu và ngày kết thúc hợp lệ phải nằm ở application hoặc domain, không nằm trong controller.

### 5. Không leak persistence model ra API

- API chỉ trả DTO hoặc response contract.
- Entity domain và model ORM không trả trực tiếp cho client.

### 6. Cấu hình, bảo mật, quan sát hệ thống

- Toàn bộ cấu hình lấy từ environment.
- Không hardcode secret, token, hoặc URL môi trường.
- Có logging đủ để debug nhưng không lộ dữ liệu nhạy cảm.
- Error response cần nhất quán và có machine-readable code.

### 7. Testing là một phần của kiến trúc

- Unit test tập trung vào domain và application layer.
- Integration test tập trung vào repository, database adapter, external adapter.
- E2E test chỉ giữ các luồng chính như đăng nhập, tạo chuyến đi, lấy chi tiết chuyến đi.

## Bộ công cụ sử dụng

Các mục dưới đây là bộ quyết định đã chốt cho giai đoạn scaffold backend đầu tiên.

### Ngôn ngữ và runtime

- `TypeScript`
- `Node.js LTS`
- Package manager: `pnpm`

### Framework backend

- `NestJS`
- Lý do:
  - hỗ trợ DI rõ ràng
  - phù hợp với cấu trúc module
  - thuận lợi khi giữ kỷ luật SOLID ở giai đoạn đầu

### HTTP và API contract

- REST API với prefix `api/v1`
- `NestJS` controller/module
- `Swagger / OpenAPI` bật ngay từ đầu để mô tả API contract
- Validation ở boundary bằng cơ chế thống nhất của framework

### Dữ liệu và persistence

- `PostgreSQL`
- `Prisma` cho ORM và migration
- Database đặt cùng VPS trong giai đoạn đầu để tối ưu tốc độ triển khai

### Xác thực và phân quyền

- `JWT` với `access token` và `refresh token`
- Password hashing qua thư viện chuyên dụng, không tự cài đặt thủ công

### Kiểm thử

- `Jest` cho unit test và integration test
- `Supertest` cho HTTP/e2e test mức cơ bản

### Chất lượng mã nguồn

- `ESLint`
- `Prettier`

### Môi trường chạy local

- `Docker Compose` cho database và các service phụ trợ cần thiết

### Triển khai production

- Deploy theo hướng `Docker Compose + Nginx + SSL Let's Encrypt`
- API domain mục tiêu: `api.tenmiencuaban.com`
- Giai đoạn đầu build/test tự động, deploy production thủ công qua SSH hoặc quy trình tương đương

### Quy ước ngôn ngữ

- Code, tên class, function, DTO, module dùng tiếng Anh
- Tài liệu nội bộ và planning document dùng tiếng Việt

### Quy ước mã nguồn và vận hành giai đoạn đầu

- Tên file dùng `kebab-case`
- Class, DTO, interface, enum dùng `PascalCase`
- Variable, function, method dùng `camelCase`
- Config theo môi trường tách thành `.env.development`, `.env.test`, `.env.production`
- Validate schema config ngay khi ứng dụng khởi động
- Secret production được quản lý bằng environment variables trên VPS, không commit vào repo
- Git workflow dùng `main` + feature branch + pull request review
- Logging và monitoring phase đầu giữ gọn: health check, application logs, và `Docker logs`

## Cấu trúc thư mục đề xuất

```text
backend/
  src/
    app/
      bootstrap/
      config/
      errors/
      http/
      logging/
    shared/
      application/
      domain/
      infrastructure/
    modules/
      auth/
      users/
      trips/
      planning/
      itineraries/
      budgets/
      community/
  test/
    integration/
    e2e/
  db/
    migrations/
```

## Quy ước triển khai ban đầu

- Mỗi module cần có ít nhất:
  - controller hoặc transport entrypoint
  - use case rõ tên theo hành vi
  - port cho dependency bên ngoài
  - adapter infrastructure
  - DTO/request-response contract
- Không tạo shared utility chung nếu mới chỉ có một nơi dùng.
- Chỉ trích xuất abstraction khi thật sự có ý nghĩa kiến trúc hoặc khả năng thay thế.

## Ghi chú

- Tài liệu này là baseline cho việc scaffold backend.
- Khi bắt đầu dựng source thực tế, cần bổ sung thêm:
  - quy ước đặt tên file và module
  - quy ước error code
  - quy ước versioning API
  - hướng dẫn chạy local và test trong `backend/README.md`
