# Cloudflare Tunnel Personal Machine Runbook

## Trạng thái

- Date: `2026-04-14`
- Status: `Accepted`
- Domain: `buicojourney.com`
- Backend hostname: `api.buicojourney.com`
- Tunnel name: `journey-backend`
- Tunnel id: `c3f021f7-a312-4a34-a0bb-cce43946d413`

## Khi nào nên dùng hướng này

Hướng này phù hợp khi:

- bạn muốn dùng máy cá nhân làm server
- domain đang quản lý trên Cloudflare
- bạn không muốn mở `80/443` hoặc `22` từ router vào máy nhà
- bạn muốn public HTTP đi qua một tunnel ổn định

## Vì sao hướng này phù hợp hơn

Với `Cloudflare Tunnel`, máy của bạn chỉ cần mở kết nối đi ra ngoài tới Cloudflare. Bạn không cần public IP cố định, không cần mở inbound port trên router, và không cần phụ thuộc vào tunnel SSH tạm kiểu Pinggy cho public ingress.

Trong setup hiện tại, một tunnel phục vụ các đường public:

- `api.buicojourney.com` -> `http://localhost:3001`
- `buicojourney.com` -> `http://localhost:3000`
- `www.buicojourney.com` -> `http://localhost:3000`

## Kiến trúc hiện tại

```text
Internet
  -> Cloudflare
  -> Cloudflare Tunnel (cloudflared trên Windows)
  -> api.buicojourney.com -> backend NestJS tại http://localhost:3001
  -> buicojourney.com -> frontend runtime tại http://localhost:3000
  -> www.buicojourney.com -> frontend runtime tại http://localhost:3000
```

## Những gì không còn cần

- không cần dùng Pinggy cho deploy
- không cần NAT port forward cho HTTP
- không cần NAT port forward cho SSH

## Những gì vẫn cần

- backend phải chạy ổn tại `http://localhost:3001`
- frontend phải chạy ổn tại `http://localhost:3000`
- domain `buicojourney.com` phải nằm trong Cloudflare
- `cloudflared` phải chạy đúng config
- máy cá nhân phải online khi muốn phục vụ traffic

## File config tham chiếu

Template đã được lưu trong repo:

```text
deploy/cloudflare/journey-backend-config.yml.example
```

Ví dụ:

```yaml
tunnel: c3f021f7-a312-4a34-a0bb-cce43946d413
credentials-file: C:\Users\dangv\.cloudflared\c3f021f7-a312-4a34-a0bb-cce43946d413.json

ingress:
  - hostname: api.buicojourney.com
    service: http://localhost:3001
  - hostname: buicojourney.com
    service: http://localhost:3000
  - hostname: www.buicojourney.com
    service: http://localhost:3000
  - service: http_status:404
```

## Trạng thái triển khai hiện tại trên máy này

Đã hoàn thành:

- login `cloudflared`
- tạo tunnel `journey-backend`
- tạo route DNS cho `api.buicojourney.com`
- tạo route DNS cho `buicojourney.com`
- tạo route DNS cho `www.buicojourney.com`
- xác minh public health:
  - `https://api.buicojourney.com/api/v1/health`
  - trả `200`

## Vai trò hiện tại của tunnel

Tunnel giờ chỉ còn phục vụ public ingress:

- backend API tại `api.buicojourney.com`
- frontend app tại `buicojourney.com` và `www.buicojourney.com`

Workflow deploy của cả backend và frontend đã chuyển sang self-hosted runner, nên tunnel không còn là đường bắt buộc để chép source hoặc env file lên máy deploy.

## Chạy thủ công bằng một lệnh

Repo có script:

- `scripts/windows/start-personal-server.ps1`
- `scripts/windows/run-personal-server.ps1`
- `scripts/windows/stop-personal-server.ps1`
- `scripts/windows/status-personal-server.ps1`

Chỉ cần chạy:

```powershell
pnpm up
```

Script sẽ tự:

- mở `Docker Desktop` nếu cần
- `docker compose up -d postgres`
- restart backend runtime trong WSL
- xác minh tunnel `journey-backend` có active connection; nếu process `cloudflared` còn treo nhưng tunnel đã rơi thì script sẽ tự restart tunnel
- chờ tới khi `https://api.buicojourney.com/api/v1/health` trả `200`

Kiểm tra trạng thái:

```powershell
pnpm status
```

Status script hiện nên được hiểu là kiểm tra tunnel/public ingress, không phải deploy transport.

Nếu domain public trả `1033` hoặc `The origin has been unregistered from Argo Tunnel`, hãy hiểu đây là lỗi `cloudflared` không còn active connection với tunnel, không phải backend runtime tại `localhost:3001`.

## Checklist sự cố `cloudflared` warning làm hỏng startup

- [x] Không để warning version cũ từ `cloudflared tunnel info` trên stderr làm PowerShell abort script.
- [x] Giữ `pnpm status` idempotent: backend local, tunnel, deploy SSH route, và public health phải được report độc lập.
- [x] Giữ `pnpm up` tự phục hồi tunnel khi `cloudflared tunnel info journey-backend` báo không có active connection.
- [x] Chỉ coi tunnel là đủ khỏe khi có cả active connection và local process đúng tunnel trên Windows.
- [x] Verify lại bằng `pnpm run status`, `pnpm run up`, và public health cho backend/frontend.

## Ý nghĩa của `reboot`

`Reboot` ở đây nghĩa là:

- tắt máy rồi bật lại
- hoặc chọn `Restart` trong Windows

Với setup hiện tại, reboot không làm đổi public hostname. Điều bạn vẫn phải đảm bảo là `cloudflared`, Docker, backend runtime, frontend runtime, và self-hosted runner đều lên lại bình thường.

## Ảnh hưởng tới deploy hiện tại

Workflow deploy GitHub hiện tại vẫn là:

- GitHub Actions
- sync source vào `DEPLOY_PATH`
- `pnpm install`
- `build`
- `migrate`
- `restart`

Điểm khác là deploy transport:

- trước đây: tunnel SSH tạm rồi `cloudflared access ssh`
- hiện tại: self-hosted runner chạy trực tiếp trên máy đích

## Bắt buộc trước khi test trên domain thật

Mỗi khi bạn merge code mới lên `main`, nếu muốn kiểm thử trên domain thật
(`https://api.buicojourney.com/...`) thì **bạn phải deploy lại thủ công trước**.
