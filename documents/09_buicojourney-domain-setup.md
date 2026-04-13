# Buicojourney Domain Setup

## Trạng thái

- Date: `2026-04-13`
- Status: `Draft`
- Domain: `buicojourney.com`
- Backend subdomain đề xuất: `api.buicojourney.com`

## Kết luận nhanh

- Bạn nên dùng backend tại:
  - `api.buicojourney.com`
- Không nên dùng root domain `buicojourney.com` cho backend nếu sau này còn frontend.
- Hiện tại domain chưa có DNS record public.
- Public IP hiện tại của mạng bạn là:
  - `123.20.233.57`

## DNS nên tạo

### Bắt buộc cho backend

- Type: `A`
- Name: `api`
- Value: `123.20.233.57`
- TTL: `300`

### Tùy chọn cho root domain

Chưa cần tạo cho backend.

Nếu sau này frontend cũng chạy trên máy này thì mới cân nhắc:

- Type: `A`
- Name: `@`
- Value: `123.20.233.57`

## Reverse proxy local đã chuẩn bị

File cấu hình Apache đã điền sẵn domain:

- `deploy/apache/api-buicojourney.com.conf`

Backend local đích:

- `http://127.0.0.1:3001`

## Việc còn thiếu trên máy Windows

### Bật proxy HTTP trong Apache

Trong file:

- `C:\xampp\apache\conf\httpd.conf`

Uncomment dòng:

```apache
LoadModule proxy_http_module modules/mod_proxy_http.so
```

### Nạp virtual host cho backend

Chèn nội dung từ:

- `deploy/apache/api-buicojourney.com.conf`

vào:

- `C:\xampp\apache\conf\extra\httpd-vhosts.conf`

Sau đó reload Apache.

## Blocker mạng hiện tại

Mình đã xác minh:

- `public-ip:80` hiện trả `Server: nginx`
- Apache local trên Windows lại trả `Apache/2.4.58`

Điều đó có nghĩa là cổng `80` từ internet hiện chưa đi đúng vào Apache local trên máy này.

## Bạn cần làm ở router/NAT

Bạn cần đảm bảo:

- public port `80` forward vào đúng máy Windows đang chạy Apache
- sau này nếu làm HTTPS:
  - public port `443` cũng forward vào đúng máy này

Nếu trong mạng đang có thiết bị khác giữ `80`, bạn phải đổi rule NAT hoặc tắt rule cũ đó.

## Cách kiểm tra sau khi chỉnh DNS và NAT

### Local

Từ Windows:

```powershell
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:3001/api/v1/health
Invoke-WebRequest -UseBasicParsing http://127.0.0.1
```

### Public

Từ bên ngoài:

```bash
curl -I http://api.buicojourney.com
curl http://api.buicojourney.com/api/v1/health
```

Kỳ vọng:

- `api.buicojourney.com` trả qua Apache proxy
- `/api/v1/health` trả JSON của backend

## HTTPS

Chưa nên làm ngay khi:

- `443` chưa vào đúng máy
- chưa có certificate

Khi `80` đã chạy đúng, bước tiếp theo mới là:

- tạo certificate cho `api.buicojourney.com`
- mở `443`
- bật block SSL trong file Apache config

## Kết luận

Mình đã chuẩn bị phần cấu hình local cho `api.buicojourney.com`.

Bước bạn cần làm tiếp theo là:

1. tạo record DNS `A` cho `api`
2. chỉnh router/NAT để `80` vào đúng máy Windows này
3. bật `mod_proxy_http`
4. nạp virtual host Apache
