# Cloudflare Tunnel Personal Machine Runbook

## Trạng thái

- Date: `2026-04-13`
- Status: `In Progress`
- Domain: `buicojourney.com`
- Backend hostname: `api.buicojourney.com`
- Tunnel name: `journey-backend`
- Tunnel id: `3446e326-9e78-4f9b-aa2a-ea440f2a27fb`

## Khi nào nên dùng hướng này

Hướng này phù hợp khi:

- bạn muốn dùng máy cá nhân làm server
- domain đang quản lý trên Cloudflare
- bạn không muốn mở `80/443` từ router vào máy nhà
- bạn không muốn phụ thuộc vào `Pinggy` hoặc tunnel tạm

## Vì sao hướng này phù hợp hơn

Với `Cloudflare Tunnel`, máy của bạn chỉ cần mở kết nối đi ra ngoài tới Cloudflare. Bạn không cần public IP cố định, không cần mở inbound port trên router, và không cần expose giao diện quản trị mạng ra Internet.

Với backend hiện tại, tunnel có thể route trực tiếp:

- `api.buicojourney.com` -> `http://localhost:3001`

Điều này cũng có nghĩa là backend có thể đi ra public mà không cần `Apache/XAMPP` cho riêng API ở giai đoạn này.

## Kiến trúc đề xuất

```text
Internet
  -> Cloudflare
  -> Cloudflare Tunnel (cloudflared trên máy bạn)
  -> backend NestJS tại http://localhost:3001
```

## Những gì không còn cần cho backend nếu dùng Tunnel

- không cần chỉnh `router/NAT` để mở `80/443`
- không cần trỏ `A` record về IP mạng nhà cho backend
- không cần dùng `Pinggy` để publish HTTP traffic
- không bắt buộc dùng `Apache/XAMPP` để reverse proxy backend

## Những gì vẫn cần

- backend phải chạy ổn tại `http://localhost:3001`
- domain `buicojourney.com` phải nằm trong Cloudflare
- bạn phải tạo và quản lý một `Cloudflare Tunnel`
- máy cá nhân phải online khi muốn phục vụ traffic

## Luồng cấu hình đề xuất

### 1. Tạo tunnel trên Cloudflare

Trong Cloudflare Dashboard:

- vào `Zero Trust`
- vào `Networks` hoặc `Access` rồi tới `Tunnels`
- tạo một tunnel mới

### 2. Tạo published application

Map hostname:

- Hostname: `api.buicojourney.com`
- Service type: `HTTP`
- URL: `http://localhost:3001`

### 3. Cài `cloudflared` trên máy cá nhân

Khuyến nghị cài trên Windows và chạy như service, vì Windows có thể chạm được backend hiện đang lắng nghe tại `localhost:3001`.

### 4. Gắn tunnel token vào máy

Cloudflare sẽ cấp `tunnel token` hoặc hướng dẫn lệnh cài service.

### 5. Kiểm tra public endpoint

Sau khi tunnel chạy:

```bash
curl https://api.buicojourney.com/api/v1/health
```

Kỳ vọng:

- trả `200`
- body chứa health JSON của backend

## Trạng thái triển khai hiện tại trên máy này

Đã hoàn thành:

- login `cloudflared`
- tạo tunnel `journey-backend`
- tạo route DNS cho `api.buicojourney.com`
- tạo file config tại:
  - `C:\Users\dangv\.cloudflared\config.yml`
- xác minh public health:
  - `https://api.buicojourney.com/api/v1/health`
  - trả `200`

File config hiện tại:

```yaml
tunnel: 3446e326-9e78-4f9b-aa2a-ea440f2a27fb
credentials-file: C:\Users\dangv\.cloudflared\3446e326-9e78-4f9b-aa2a-ea440f2a27fb.json

ingress:
  - hostname: api.buicojourney.com
    service: http://localhost:3001
  - service: http_status:404
```

## Bước còn thiếu để ổn định lâu dài

Hiện tại backend public đang hoạt động ổn qua `Cloudflare Tunnel`.

Service `cloudflared` trên máy này từng được cài nhưng đang chưa phải đường ổn định cuối cùng để vận hành cùng backend WSL. Vì vậy hướng đang được dùng là:

- `cloudflared` process đúng cấu hình
- script Windows tự chạy lại sau khi user đăng nhập

## Chạy thủ công bằng một lệnh

Repo có script:

- `scripts/windows/start-personal-server.ps1`
- `scripts/windows/run-personal-server.ps1`
- `scripts/windows/stop-personal-server.ps1`

Chỉ cần chạy một lệnh:

```powershell
pnpm up
```

Script sẽ tự:

- mở `Docker Desktop` nếu cần
- `docker compose up -d postgres`
- restart backend runtime trong WSL
- đảm bảo có `cloudflared` process đúng cấu hình
- chờ tới khi `https://api.buicojourney.com/api/v1/health` trả `200`

Dừng toàn bộ bằng một lệnh:

```powershell
pnpm down
```

Kiểm tra trạng thái nhanh:

```powershell
pnpm status
```

## Ý nghĩa của `reboot`

`Reboot` ở đây nghĩa là:

- tắt máy rồi bật lại
- hoặc chọn `Restart` trong Windows

Với cấu hình hiện tại, sau `reboot` bạn chỉ cần chạy **một lệnh** ở trên để server lên lại.

## Ghi chú về HTTPS

Người dùng ngoài Internet truy cập bằng:

- `https://api.buicojourney.com`

Nhưng tunnel forward vào app local bằng:

- `http://localhost:3001`

Điều này là đúng vì TLS được terminate ở phía Cloudflare edge, còn origin local của bạn hiện đang chạy HTTP thuần.

## Ảnh hưởng tới deploy hiện tại

Workflow deploy GitHub hiện tại có thể giữ nguyên cho backend app.

Chỉ khác ở lớp public ingress:

- trước đây: `Pinggy` hoặc `router/NAT`
- sau khi chuyển: `Cloudflare Tunnel`

Deploy code vẫn là:

- GitHub Actions
- SSH vào máy cá nhân
- `git pull`
- `pnpm install`
- `build`
- `migrate`
- `restart`

## Những gì mình có thể làm tiếp

Mình có thể chuẩn bị và thực hiện phần phía máy của bạn:

- tài liệu hóa cấu hình tunnel
- cấu hình service chạy `cloudflared`
- kiểm tra backend public qua `api.buicojourney.com`

## Những gì bạn cần tự làm

Vì mình không có quyền vào tài khoản Cloudflare của bạn, bạn cần tự làm phần dashboard:

- tạo tunnel
- lấy token hoặc làm bước authorize tunnel
- xác nhận hostname `api.buicojourney.com`

## Kết luận

Nếu mục tiêu là dùng máy cá nhân làm server nhưng vẫn muốn đường vào production ổn định hơn local/public IP trực tiếp, `Cloudflare Tunnel` là hướng phù hợp nhất cho backend của bạn ở giai đoạn này.
