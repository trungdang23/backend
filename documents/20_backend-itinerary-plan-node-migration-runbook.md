# Backend Legacy Itinerary -> PlanNode Migration Runbook

Status hiện tại: `Archived for historical reference`

- `2026-05-08`: runtime DB check xác nhận không còn row ở `trip_itinerary_days` và `trip_itinerary_activities`, sau đó source đã cleanup legacy itinerary support và gỡ CLI/helper migration khỏi source active.
- Tài liệu này được giữ lại để lưu mapping rule và cutover reasoning đã dùng trước cleanup.

## Mục tiêu

- Chuyển dữ liệu lịch sử từ `TripItineraryDay` / `TripItineraryActivity` sang `PlanNode`.
- Giữ `PlanNode` là source of truth duy nhất cho planner-first flow và budget summary owner flow.
- Giảm rủi ro rollout bằng helper migration an toàn, `dry-run` mặc định, và skip trip đã có planner data.

## Trạng thái source tại thời điểm cleanup

- Budget summary owner flow đã đọc từ `PlanNode`.
- Runtime DB check trước cleanup xác nhận không còn dữ liệu legacy cần backfill.
- Legacy itinerary endpoints/module/tables đã bị gỡ khỏi source active sau cleanup.
- CLI `migrate:itinerary-to-plan-nodes` chỉ còn là artifact lịch sử và đã bị xóa khỏi source active.

## Historical command note

Các command migration trong tài liệu này không còn tồn tại trong source sau cleanup `2026-05-08`. Phần còn lại được giữ lại để tham chiếu mapping rule và tiêu chí cutover đã dùng.

## Mapping rule đã chốt

### 1. Day root node

Mỗi `TripItineraryDay` tạo một `PlanNode` root:

- `id = itinerary-day-<dayId>`
- `type = day`
- `parentId = null`
- `sortOrder` theo thứ tự day sau khi sort `date -> position -> createdAt -> id`
- `depth = 0`
- `title = day.title`
- `notes = day.notes`
- `startAt/endAt = <day.date>T<HH:MM>` khi itinerary có time
- `imageUrl = imageUrls[0]` nếu có
- `costAmount/costCurrency = null`

### 2. Day location child

Nếu `TripItineraryDay.location` có giá trị, tạo child node:

- `id = itinerary-day-location-<dayId>`
- `type = location`
- `title = day.location`
- `parentId = itinerary-day-<dayId>`
- `depth = 1`

### 3. Day-level cost child

Nếu `TripItineraryDay.costAmount > 0`, tạo child node:

- `id = itinerary-day-cost-<dayId>`
- `type = note`
- `title = Chi phí ngày`
- `parentId = itinerary-day-<dayId>`
- `depth = 1`
- `costAmount = day.costAmount`
- `costCurrency = day.costCurrency`

Lý do: day root node nên giữ vai trò timeline/day container; cost ngày được tách ra để không trộn ngữ nghĩa vào day root.

### 4. Activity child

Mỗi `TripItineraryActivity` tạo một child node dưới day root:

- `id = itinerary-activity-<activityId>`
- `type = activity`
- `title = activity.title`
- `parentId = itinerary-day-<dayId>`
- `depth = 1`
- `startAt/endAt = <day.date>T<HH:MM>` khi activity có time
- `costAmount/costCurrency` chỉ giữ khi `costAmount > 0`
- `imageUrl = imageUrls[0]` nếu có
- `notes` merge theo rule:
  - nếu có `location` và `notes`: `Địa điểm: <location>\n\n<notes>`
  - nếu chỉ có `location`: `Địa điểm: <location>`
  - nếu chỉ có `notes`: giữ nguyên `notes`

### 5. Zero-cost normalization

Legacy itinerary bắt buộc có `costCurrency` kể cả khi `costAmount = 0`. Khi migrate sang `PlanNode`:

- `costAmount = 0` sẽ được coi là không có planned cost
- helper map cặp cost đó thành `null/null`
- mục tiêu là không làm bẩn `totalsByCurrency[].nodeCount` trong budget summary

### 6. Image fidelity

`PlanNode` chỉ có một `imageUrl`, trong khi itinerary có `imageUrls[]`.

- helper chỉ giữ `imageUrls[0]`
- image còn lại không bị cố nhét vào field khác
- script trả warning để operator biết có field bị giảm fidelity

## Rollout order

1. Chạy `dry-run` cho từng trip mẫu hoặc `--all` trên đúng environment dữ liệu cần migrate.
2. Review report:
   - trip nào `skipped-existing-plan-nodes`
   - trip nào có warning do nhiều ảnh
   - trip nào thực sự còn legacy-only data
3. Chạy `--apply` cho các trip legacy-only đã xác nhận an toàn.
4. Verify tối thiểu trên sample trip:
   - `GET /api/v1/trips/:id/planner`
   - `GET /api/v1/trips/:id/budget-summary`
   - owner flow trên frontend nếu trip đó còn được dùng
5. Khi số trip legacy-only đã về `0`, bắt đầu plan cleanup endpoint/table.

## Rollback note

- Script hiện atomic theo từng trip, không phải toàn batch.
- Vì trip đã có `PlanNode` bị skip, rollback chỉ nên áp dụng cho trip mà planner trước migration còn rỗng.
- Nếu cần rollback một trip vừa migrate và planner trước đó rỗng, có thể xóa `plan_nodes` của trip đó rồi tiếp tục dùng legacy itinerary data làm nguồn tham chiếu tạm thời.
- Không rollback kiểu merge một phần vào trip đã có planner data.

## Tiêu chí cho cleanup legacy itinerary support

Chỉ cleanup endpoint/bảng legacy khi đồng thời thỏa:

- helper migration đã chạy xong cho toàn bộ trip còn dữ liệu lịch sử cần giữ
- không còn trip owner flow phải đọc dữ liệu duy nhất từ `TripItinerary*`
- sample verify cho planner + budget summary pass sau migration
- có snapshot/backup trước thay đổi destructive
- đã ghi rõ phase tách riêng cho:
  - gỡ route `/api/v1/trips/:id/itinerary...`
  - gỡ repository/service `itineraries`
  - drop bảng `trip_itinerary_days` và `trip_itinerary_activities`

## Deferred

- chưa có mode merge/overwrite vào trip đã có planner data
- chưa có rollback CLI tự động
- chưa drop legacy tables/endpoints trong cùng lượt này
