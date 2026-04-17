# Backend Planning Expansion Plan

## Mục tiêu

Tài liệu này chốt hướng mở rộng backend cho phần `planning` theo yêu cầu mới của sản phẩm:

- một `trip` có thể có nhiều phần kế hoạch
- mỗi phần có thể có thời gian, chi phí, ghi chú
- mỗi phần có thể có ảnh qua `imageUrl`
- một phần lớn có thể chứa phần nhỏ hơn
- chưa làm upload ảnh ở phase này
- chuẩn bị kiến trúc để sau này tích hợp AI mà không phá core model

## Trạng thái backend hiện tại

Backend hiện đã có:

- `auth`
- `users`
- `trips`
- `itineraries`
- `budgets`

Model đang chạy thực tế:

```text
Trip
  -> TripItineraryDay
    -> TripItineraryActivity
```

Model này đủ cho:

- trip cơ bản
- ngày trong lịch trình
- activity trong ngày
- notes/cost ở activity

Model này chưa đủ cho:

- nhiều địa điểm trong một trip theo cấu trúc mở
- node cha/con nhiều tầng
- nhiều ảnh ở nhiều cấp
- ghi chú tổng cho kế hoạch lớn
- planner dạng outline/list có thể flatten

## Quyết định kiến trúc

## 1. Giữ `Trip` làm container cấp cao

`Trip` không bị bỏ đi.

`Trip` vẫn là:

- chủ sở hữu của một kế hoạch lớn
- điểm neo quyền truy cập theo `userId`
- nơi giữ metadata tổng

`Trip` sẽ được mở rộng thêm:

- `summaryNotes nullable`
- `coverImageUrl nullable`

## 2. Bổ sung `planning` như module mới

Không nên vá tiếp `itineraries` hiện tại để gánh toàn bộ yêu cầu mới.

Hướng phù hợp hơn là thêm module mới:

- `planning`

Module này sẽ quản lý:

- cây hoặc outline của kế hoạch
- node cha/con
- thời gian
- chi phí
- ghi chú
- ảnh dạng URL

## 3. Giữ `itineraries` hiện tại song song trong giai đoạn chuyển tiếp

Không xoá ngay:

- `TripItineraryDay`
- `TripItineraryActivity`

Lý do:

- chúng đang là contract đã chạy
- frontend hiện vẫn có thể nối dần theo contract cũ
- migration sang model planner mới nên đi theo hướng additive trước

## 4. Ảnh chỉ là URL trong phase đầu

Backend phase đầu không giải quyết:

- upload binary
- resize
- object storage
- CDN

Backend chỉ cần:

- nhận `imageUrl`
- validate URL hợp lệ
- lưu URL vào database
- trả URL cho frontend

## 5. Chừa seam cho AI từ bây giờ

AI không được ghi trực tiếp vào core planning model.

Phải tách 3 lớp:

- `core planning data`
- `external research data`
- `AI suggestion data`

## Data model mục tiêu

## 1. Mở rộng `Trip`

Đề xuất:

```text
Trip
  id
  userId
  name
  destination
  startDate
  endDate
  timezone
  budgetAmount
  budgetCurrency
  summaryNotes nullable
  coverImageUrl nullable
  createdAt
  updatedAt
```

Giải thích:

- `destination` giữ vai trò summary như hiện tại
- `summaryNotes` là ghi chú tổng của kế hoạch lớn
- `coverImageUrl` là ảnh bìa tổng

## 2. Thêm `PlanNode`

Đề xuất:

```text
PlanNode
  id
  tripId
  parentId nullable
  type
  title
  notes nullable
  locationLabel nullable
  startAt nullable
  endAt nullable
  costAmount nullable
  costCurrency nullable
  coverImageUrl nullable
  sortOrder
  depth
  createdAt
  updatedAt
```

### `type` tối thiểu

- `day`
- `location`
- `activity`
- `note`
- `section`

### Trách nhiệm của `PlanNode`

- biểu diễn một item trong planner
- có thể là node gốc hoặc node con
- có thể render theo tree hoặc flatten

## 3. Thêm `PlanNodeImage`

Đề xuất:

```text
PlanNodeImage
  id
  planNodeId
  imageUrl
  caption nullable
  sortOrder
  createdAt
```

## 4. Có thể thêm `TripImage` nếu cần gallery tổng

Nếu product chốt cần nhiều ảnh ở cấp trip:

```text
TripImage
  id
  tripId
  imageUrl
  caption nullable
  sortOrder
  createdAt
```

Trong phase đầu có thể chỉ cần:

- `Trip.coverImageUrl`

## Module boundary đề xuất

## `trips`

Tiếp tục chịu trách nhiệm:

- CRUD metadata cấp trip
- ownership theo user
- cover image URL cấp trip
- summary notes cấp trip

## `planning`

Chịu trách nhiệm:

- CRUD `PlanNode`
- quan hệ cha/con
- ordering
- image URL ở node
- read model của planning workspace

## `budgets`

Tiếp tục tồn tại, nhưng nên chuẩn bị để:

- tính ngân sách từ `PlanNode.costAmount`
- hoặc gộp cả `PlanNode` và `TripItineraryActivity` trong giai đoạn chuyển tiếp

## `itineraries`

Giữ ổn định trong giai đoạn hiện tại.

Sau này sẽ có quyết định:

- map dần sang `PlanNode type=day/activity`
- hoặc giữ làm read model cũ trong một thời gian

## API roadmap

## Slice 1: mở rộng `trips` với media và notes

### Mục tiêu

- cho frontend hiển thị trip card và trip cover giàu hình ảnh hơn ngay

### Việc cần làm

- thêm field mới vào Prisma schema
- migration
- domain `Trip`
- DTO create/update/response
- service create/update
- repository mapping
- test unit/integration/e2e cho field mới

### Contract additive

Các endpoint cũ giữ nguyên:

- `POST /api/v1/trips`
- `GET /api/v1/trips`
- `GET /api/v1/trips/:tripId`
- `PATCH /api/v1/trips/:tripId`

Chỉ mở rộng payload:

- `summaryNotes?: string`
- `coverImageUrl?: string`

## Slice 2: read API cho planning workspace

### Endpoint đề xuất

- `GET /api/v1/trips/:tripId/planning`

### Response đề xuất

```text
{
  trip: { ...trip metadata... },
  nodes: [ ...tree hoặc flattened tree... ]
}
```

### Yêu cầu

- enforce ownership qua `tripId + userId`
- trả node theo `sortOrder`
- có đủ field để FE render dạng list

## Slice 3: create/update/delete `PlanNode`

### Endpoint đề xuất

- `POST /api/v1/trips/:tripId/planning/nodes`
- `PATCH /api/v1/trips/:tripId/planning/nodes/:nodeId`
- `DELETE /api/v1/trips/:tripId/planning/nodes/:nodeId`

### Input tối thiểu

- `parentId?: string | null`
- `type`
- `title`
- `notes?: string | null`
- `locationLabel?: string | null`
- `startAt?: string | null`
- `endAt?: string | null`
- `costAmount?: number | null`
- `costCurrency?: string | null`
- `coverImageUrl?: string | null`
- `sortOrder?: number`

## Slice 4: quản lý ảnh URL của node

### Endpoint đề xuất

- `POST /api/v1/trips/:tripId/planning/nodes/:nodeId/images`
- `PATCH /api/v1/trips/:tripId/planning/nodes/:nodeId/images/:imageId`
- `DELETE /api/v1/trips/:tripId/planning/nodes/:nodeId/images/:imageId`

### Ghi chú

Phase đầu có thể hoãn slice này nếu product chấp nhận:

- chỉ dùng `coverImageUrl` ở `Trip`
- chỉ dùng `coverImageUrl` ở `PlanNode`

## Slice 5: bridge với `budgets`

### Hướng đi

Trong giai đoạn planner mới, `budgets` nên bắt đầu hỗ trợ:

- tổng chi phí từ `PlanNode`
- đối chiếu với `Trip.budgetAmount`

Có 2 hướng:

### Hướng A

- `budgets` chỉ đọc từ `PlanNode` mới

### Hướng B

- `budgets` đọc cả `TripItineraryActivity` cũ và `PlanNode` mới trong thời gian chuyển tiếp

Khuyến nghị hiện tại:

- nếu planner mới được dùng làm main flow, chuyển dần sang Hướng A

## Slice 6: future AI seam

Chưa implement AI, nhưng nên có plan rõ:

### `PlaceResearch`

```text
PlaceResearch
  id
  sourceName
  sourceUrl
  placeName
  normalizedAddress
  priceReference nullable
  ratingReference nullable
  reviewCount nullable
  fetchedAt
```

### `AiPlanSuggestion`

```text
AiPlanSuggestion
  id
  tripId
  inputContext
  outputDraft
  status
  createdAt
```

### Nguyên tắc

- AI suggestion phải là draft
- chỉ convert thành `PlanNode` khi user xác nhận

## Migration strategy

## Giai đoạn 1

Chỉ mở rộng `Trip`:

- `summaryNotes`
- `coverImageUrl`

Không động vào `itineraries`

## Giai đoạn 2

Thêm mới:

- `PlanNode`
- `PlanNodeImage`

Chưa xoá gì cả

## Giai đoạn 3

Frontend bắt đầu dùng `planning` làm workspace chính.

`itineraries` cũ:

- vẫn giữ để không gãy contract
- nhưng không mở rộng thêm nghiệp vụ lớn mới

## Giai đoạn 4

Khi planner mới ổn định:

- quyết định hợp nhất `itinerary day/activity` vào planning model
- hoặc giữ backward compatibility một thời gian có kiểm soát

## Validation và business rules cần có

## Validation boundary

- URL hợp lệ cho `coverImageUrl` và `imageUrl`
- `title` không rỗng
- `type` thuộc enum được hỗ trợ
- `costAmount` không âm
- `costCurrency` đúng 3 ký tự nếu có
- `startAt <= endAt` nếu cả hai cùng có

## Business rules

- node con phải cùng `tripId` với node cha
- user chỉ thao tác trên trip của mình
- không tạo cycle trong cây cha/con
- `sortOrder` phải ổn định trong cùng parent
- `depth` phải được tính nhất quán

## Test strategy

## Unit

- rule validate node type
- rule validate parent-child
- rule detect cycle
- rule validate thời gian và chi phí

## Integration

- Prisma mapping cho `Trip` mở rộng
- Prisma mapping cho `PlanNode`
- list planning read model
- create/update/delete node

## E2E

- tạo trip với `coverImageUrl`
- lấy trip detail có `coverImageUrl`
- tạo planning node cấp gốc
- tạo planning node cấp con
- list planning workspace

## Định nghĩa hoàn thành

Backend expansion được xem là đúng hướng khi:

- `Trip` support `summaryNotes` và `coverImageUrl`
- có module `planning` độc lập
- planner support nhiều node trong một trip
- node support cha/con
- node support thời gian, chi phí, ghi chú, ảnh URL
- contract additive, không phá flow cũ
- đã có seam rõ cho AI research/suggestion

## Open questions cần chốt trước khi code

1. `destination` có đổi tên ngữ nghĩa thành `destinationSummary` trong API không, hay giữ field cũ để tránh breaking change?
2. `PlanNode` có cần recursive vô hạn thật không, hay giới hạn mềm 3-4 tầng là đủ?
3. `Day` có là node bắt buộc trong planner không?
4. Phase đầu có cần `PlanNodeImage` nhiều ảnh, hay chỉ cần `coverImageUrl` ở `PlanNode`?
5. `budgets` sẽ tính từ planner mới ngay hay bridge với itinerary cũ trong một thời gian?
