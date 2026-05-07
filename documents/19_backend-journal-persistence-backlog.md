# Backend Journal Persistence Backlog

## Trang thai

- Date: `2026-05-03`
- Status: `Active slice`
- Owner area:
  - `backend/src/modules/journal`
  - `backend/db/schema.prisma`

## Muc tieu

Them persistence contract toi gian cho `journal` theo huong `PostgreSQL + JSONB`, de frontend co the load/save scene dau tien truoc khi dung editor day du.

## Scope cua luot trien khai nay

- [x] tao bang `trip_journals` gan 1-1 voi `Trip`
- [x] them endpoint owner-only:
  - `GET /api/v1/journals/mine`
  - `GET /api/v1/trips/:tripId/journal`
  - `PUT /api/v1/trips/:tripId/journal`
  - `DELETE /api/v1/trips/:tripId/journal`
- [x] luu `sceneVersion`, `page`, va `objects` bang JSONB
- [x] tra ve scene rong mac dinh khi trip chua co journal record
- [x] validate base scene object contract o request boundary
- [x] them test HTTP cho load/save journal cua owner

## Deferred

- cloud/object storage provider, asset delete/list UI, va asset lifecycle cleanup
- page-level CRUD, publish snapshot, revision history
- realtime/collaboration/autosave conflict handling

## Follow-up public share read

### Muc tieu

Mo read-only journal route cho guest de frontend co the chia se nhat ky ca nhan bang trang public, dong thoi giu owner mutation trong namespace auth-only hien co. Journal share phai doc lap voi `Trip.visibility` de user co the share nhat ky ma khong share ke hoach.

### Scope cua luot trien khai nay

- [x] them `GET /api/v1/public/trips/:tripId/journal`
- [x] them `visibility: private | public` rieng cho `trip_journals`
- [x] them `PATCH /api/v1/trips/:tripId/journal` de owner doi rieng che do chia se nhat ky
- [x] public journal read chi can journal `visibility = public`
- [x] trip `visibility = private` van co the doc public journal neu journal da duoc share
- [x] them `GET /api/v1/public/journals` cho community discovery, chi list journal `visibility = public`
- [x] journal `visibility = private` tiep tuc tra permission denied
- [x] them integration coverage cho public journal read

## Follow-up two-mode journal visibility

### Muc tieu

Dong bo journal share voi product direction moi: chi co `private` va `public`.

### Scope

- [x] `TripJournal.visibility` chi nhan `private | public`
- [x] public journal read/list chi doc journal `public`
- [x] du lieu journal `unlisted` cu duoc migrate sang `public`
- [x] them DB check constraint cho `trip_journals.visibility`

## Follow-up owner journal asset upload

### Muc tieu

Them asset upload that cho journal editor phase dau, de frontend co the them anh tu file local thay vi bat user dan URL thu cong. Upload phai owner-only theo `Trip.userId`, nhung URL file tra ve dang public/unlisted de browser co the render anh trong editor va public journal bang the `<img>`.

### Scope

- [x] them bang `trip_journal_assets` gan asset voi `trip_id` va `user_id`
- [x] them `POST /api/v1/trips/:tripId/journal/assets` owner-only multipart upload
- [x] chi nhan anh `image/png`, `image/jpeg`, `image/webp`, va `image/gif`
- [x] gioi han file upload phase dau toi 5MB
- [x] luu file local mac dinh vao `${XDG_STATE_HOME:-$HOME/.local/state}/${APP_NAME}/journal-assets`
- [x] them `GET /api/v1/journal-assets/:publicId` de render file bang URL public/unlisted
- [x] them integration coverage cho owner upload, public file read, va non-owner upload denial

### Deferred

- signed/private asset delivery cho journal private
- cloud/object storage provider production-ready

## Follow-up owner journal asset lifecycle

### Muc tieu

Them contract backend toi thieu de owner xem va xoa asset da upload cho mot trip, dong thoi xoa file vat ly khi asset bi xoa qua endpoint owner-only. Slice nay giu UI quan ly asset va cleanup theo trip delete rieng de tranh tron module trip/journal trong cung mot buoc.

### Scope

- [x] them `GET /api/v1/trips/:tripId/journal/assets` owner-only de list asset theo trip
- [x] them `DELETE /api/v1/trips/:tripId/journal/assets/:assetId` owner-only
- [x] delete asset phai xoa DB record va file vat ly trong local storage
- [x] missing file khi delete asset khong lam user bi ket voi DB record khong xoa duoc
- [x] them integration coverage cho owner list/delete, public file read sau upload, va non-owner denial

### Deferred

- delete/list asset management UI
- cleanup file vat ly khi trip bi xoa qua `DELETE /trips/:tripId`
- cleanup orphan asset da upload nhung chua duoc gan vao journal scene da save
- cloud/object storage provider production-ready

## Follow-up signed/private journal asset delivery

Status: `Completed in source`

### Muc tieu

Dong cac journal asset URL dang public/unlisted bang signed URL co TTL, de anh trong journal private/public van render duoc qua the `<img>` nhung khong con bi doc truc tiep neu thieu chu ky hop le. Slice nay uu tien bao ve asset read truoc cleanup orphan/trip delete cleanup vi hien tai visibility cua journal co the bi lo qua duong dan asset.

### Scope

- [x] them runtime config cho journal asset signing secret va signed URL TTL
- [x] `GET /api/v1/journal-assets/:publicId` chi phuc vu file khi query signature hop le va chua het han
- [x] upload/list asset response tra signed URL thay vi public URL tron
- [x] owner journal response (`GET/PUT/PATCH /trips/:tripId/journal`, `GET /journals/mine`) rewrite `imageUrl` cua object anh da gan `assetId`
- [x] public journal response (`GET /public/trips/:tripId/journal`, `GET /public/journals`) rewrite `imageUrl` cua object anh da gan `assetId`
- [x] giu nguyen external image URL khong thuoc asset storage noi bo
- [x] them integration coverage cho signed URL format, unsigned denial, va response rewriting owner/public

### Deferred

- rotate/revoke signed URL theo asset-level key version
- cloud/object storage provider production-ready
- cleanup orphan asset da upload nhung chua duoc gan vao journal scene da save
- cleanup file vat ly khi trip bi xoa qua `DELETE /trips/:tripId`
