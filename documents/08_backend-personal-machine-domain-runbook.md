# Backend Personal Machine Domain And Reverse Proxy Runbook

## Trạng thái

- Date: `2026-04-13`
- Status: `Draft`
- Scope: đưa backend trên máy cá nhân ra domain ổn định hơn bằng Apache đang có sẵn trên Windows

## Mục tiêu

- Tận dụng Apache/XAMPP đã có sẵn trên Windows thay vì thêm reverse proxy mới.
- Chuẩn bị sẵn cấu hình để `api.<domain>` reverse proxy vào backend đang chạy ở `127.0.0.1:3001`.
- Ghi rõ blocker mạng hiện tại để biết bước nào mình làm được và bước nào cần bạn thao tác ở DNS/router.

## Những gì đã xác minh trên máy hiện tại

- Public IP hiện tại: `123.20.233.57`
- Windows đang chạy service `Apache2.4` từ:
  - `C:\xampp\apache\bin\httpd.exe`
- Windows Apache đang giữ cổng local:
  - `80`
  - `443`
- Apache local từ Windows tự trả header:
  - `Apache/2.4.58 (Win64) OpenSSL/3.1.3 PHP/8.2.12`
- Backend runtime trên máy hiện tại trả được:
  - `http://127.0.0.1:3001/api/v1/health`
  - `http://localhost:3001/api/v1/health`

## Phát hiện quan trọng về mạng hiện tại

- `public-ip:80` hiện mở nhưng response đang là `Server: nginx`, không phải Apache local.
- `public-ip:443` hiện chưa mở từ bên ngoài.
- `public-ip:22` hiện chưa mở từ bên ngoài.

## Ý nghĩa của phát hiện này

- Public traffic HTTP hiện chưa đi đúng vào Apache local trên máy này.
- Nếu muốn domain thật trỏ vào backend trên máy cá nhân, bạn vẫn phải xử lý một trong các hướng sau:
  - chỉnh router/NAT để `80` và `443` đi vào đúng máy này
  - chỉnh thiết bị/ngateway hiện đang trả `nginx`
  - hoặc dùng giải pháp tunnel/domain manager ổn định hơn thay cho Pinggy

## Hướng local đã chuẩn bị

Mình đã chuẩn bị template reverse proxy Apache tại:

- `deploy/apache/api-backend-vhost.conf.example`

Template này proxy:

- `api.example.com`
- tới backend host runtime:
  - `http://127.0.0.1:3001`

## Điều kiện để Apache proxy được

Trong `C:\xampp\apache\conf\httpd.conf`, các module sau cần có:

- `mod_proxy`
- `mod_proxy_http`
- `mod_headers`
- `mod_rewrite`
- `mod_ssl` nếu muốn HTTPS

Hiện mình đã xác nhận:

- `mod_proxy` đã load
- `mod_ssl` đã load
- `mod_proxy_http` hiện đang bị comment

Nghĩa là trước khi bật reverse proxy thật, Apache cần bật thêm:

```apache
LoadModule proxy_http_module modules/mod_proxy_http.so
```

## Cách cắm domain vào Apache

1. Lấy domain thật bạn muốn dùng cho backend, ví dụ:
   - `api.yourdomain.com`
2. Dùng template:
   - `deploy/apache/api-backend-vhost.conf.example`
3. Thay `api.example.com` thành domain thật.
4. Chèn block này vào:
   - `C:\xampp\apache\conf\extra\httpd-vhosts.conf`
   - hoặc include từ file riêng trong `conf/extra`
5. Reload Apache.

## HTTPS

Template đã có block `:443` ở dạng comment để dùng khi:

- port `443` thực sự đi vào máy này
- bạn có certificate hợp lệ

Hiện tại mình chưa cấu hình HTTPS vì:

- `public-ip:443` chưa mở ổn định từ bên ngoài
- chưa có certificate/domain thật để gắn

## Việc mình đã làm được

- Xác minh backend local trên host đã chạy được và health pass.
- Xác minh Windows có sẵn Apache/XAMPP.
- Xác minh Apache local có thể là reverse proxy candidate phù hợp.
- Tạo sẵn template cấu hình Apache để bạn không phải viết tay từ đầu.

## Việc bạn cần cung cấp hoặc tự thao tác

### Thông tin cần cung cấp cho mình

- domain hoặc subdomain thật bạn muốn dùng cho backend
  - ví dụ `api.example.com`

### Thao tác bạn cần có quyền làm

- chỉnh DNS của domain
- chỉnh router/NAT hoặc thiết bị mạng đang giữ cổng `80/443`
- nếu muốn HTTPS thật:
  - cấp certificate
  - mở `443`
  - reload Apache bằng quyền phù hợp trên Windows

## Kịch bản tối ưu tiếp theo

1. Bạn gửi mình domain thật muốn dùng cho backend.
2. Mình sẽ điền sẵn template Apache thành config cụ thể cho domain đó.
3. Mình sẽ chỉ ra chính xác record DNS nào bạn cần tạo.
4. Sau khi bạn xử lý router/DNS, mình sẽ test lại:
   - `http://api.<domain>`
   - `https://api.<domain>` nếu đã có SSL

## Kết luận hiện tại

- Hạ tầng local cho reverse proxy đã có ứng viên tốt là Apache/XAMPP.
- Backend local đã sẵn sàng nhận reverse proxy từ Windows.
- Blocker lớn nhất lúc này không còn nằm ở source code, mà nằm ở:
  - domain thật
  - DNS
  - router/NAT
  - và đường `80/443` từ internet vào đúng máy này
