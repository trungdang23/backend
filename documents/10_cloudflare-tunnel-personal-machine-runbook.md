# Cloudflare Tunnel Personal Machine Runbook

## Trạng thái

- Date: `2026-04-14`
- Status: `Accepted`
- Domain: `buicojourney.com`
- Backend hostname: `api.buicojourney.com`
- Deploy SSH hostname: `ssh.buicojourney.com`
- Tunnel name: `journey-backend`
- Tunnel id: `3446e326-9e78-4f9b-aa2a-ea440f2a27fb`

## Khi nào nên dùng hướng này

Hướng này phù hợp khi:

- bạn muốn dùng máy cá nhân làm server
- domain đang quản lý trên Cloudflare
- bạn không muốn mở `80/443` hoặc `22` từ router vào máy nhà
- bạn muốn cả public HTTP và deploy SSH đi qua một tunnel ổn định

## Vì sao hướng này phù hợp hơn

Với `Cloudflare Tunnel`, máy của bạn chỉ cần mở kết nối đi ra ngoài tới Cloudflare. Bạn không cần public IP cố định, không cần mở inbound port trên router, và không cần phụ thuộc vào tunnel SSH tạm kiểu Pinggy cho deploy.

Trong setup hiện tại, một tunnel phục vụ cả hai đường:

- `api.buicojourney.com` -> `http://localhost:3001`
- `ssh.buicojourney.com` -> `ssh://localhost:22`

## Kiến trúc hiện tại

```text
Internet
  -> Cloudflare
  -> Cloudflare Tunnel (cloudflared trên Windows)
  -> api.buicojourney.com -> backend NestJS tại http://localhost:3001
  -> ssh.buicojourney.com -> Windows OpenSSH tại localhost:22
```

## Những gì không còn cần

- không cần dùng Pinggy cho deploy
- không cần NAT port forward cho HTTP
- không cần NAT port forward cho SSH

## Những gì vẫn cần

- backend phải chạy ổn tại `http://localhost:3001`
- Windows OpenSSH Server phải chạy tại `localhost:22`
- domain `buicojourney.com` phải nằm trong Cloudflare
- `cloudflared` phải chạy đúng config
- máy cá nhân phải online khi muốn phục vụ traffic hoặc nhận deploy

## File config tham chiếu

Template đã được lưu trong repo:

```text
deploy/cloudflare/journey-backend-config.yml.example
```

Ví dụ:

```yaml
tunnel: 3446e326-9e78-4f9b-aa2a-ea440f2a27fb
credentials-file: C:\Users\dangv\.cloudflared\3446e326-9e78-4f9b-aa2a-ea440f2a27fb.json

ingress:
  - hostname: ssh.buicojourney.com
    service: ssh://localhost:22
  - hostname: api.buicojourney.com
    service: http://localhost:3001
  - service: http_status:404
```

## Trạng thái triển khai hiện tại trên máy này

Đã hoàn thành:

- login `cloudflared`
- tạo tunnel `journey-backend`
- tạo route DNS cho `api.buicojourney.com`
- tạo route DNS cho `ssh.buicojourney.com`
- xác minh public health:
  - `https://api.buicojourney.com/api/v1/health`
  - trả `200`

## Access cho deploy SSH

Deploy SSH không nên để public trần.

Tại Access app của `ssh.buicojourney.com`:

- tạo policy `Service Auth`
- gắn service token dành riêng cho GitHub Actions
- nếu cần SSH thủ công, thêm policy user-based riêng

Workflow deploy trong repo sẽ dùng:

- `CLOUDFLARE_ACCESS_CLIENT_ID`
- `CLOUDFLARE_ACCESS_CLIENT_SECRET`
- `cloudflared access ssh --hostname %h --service-token-id ... --service-token-secret ...`

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
- đảm bảo có `cloudflared` process đúng cấu hình
- chờ tới khi `https://api.buicojourney.com/api/v1/health` trả `200`

Kiểm tra trạng thái:

```powershell
pnpm status
```

Từ `2026-04-14`, status script cũng kiểm tra việc config có route SSH ổn định hay chưa.

## Ý nghĩa của `reboot`

`Reboot` ở đây nghĩa là:

- tắt máy rồi bật lại
- hoặc chọn `Restart` trong Windows

Với setup hiện tại, reboot không còn làm đổi `SSH_HOST` hoặc `SSH_PORT` của workflow deploy. Điều bạn vẫn phải đảm bảo là `cloudflared`, Docker, backend runtime, và OpenSSH đều lên lại bình thường.

## Ảnh hưởng tới deploy hiện tại

Workflow deploy GitHub hiện tại vẫn là:

- GitHub Actions
- `git pull`
- `pnpm install`
- `build`
- `migrate`
- `restart`

Điểm đổi chính là lớp SSH:

- trước đây: reverse tunnel tạm
- hiện tại: `ssh.buicojourney.com` qua `Cloudflare Tunnel` + `Service Auth`

## Bắt buộc trước khi test trên domain thật

Mỗi khi bạn merge code mới lên `main`, nếu muốn kiểm thử trên domain thật
(`https://api.buicojourney.com/...`) thì **bạn phải deploy lại thủ công trước**.
