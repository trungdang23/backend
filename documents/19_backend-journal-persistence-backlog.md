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

- upload asset that va asset ownership
- page-level CRUD, publish snapshot, revision history
- realtime/collaboration/autosave conflict handling

## Follow-up public share read

### Muc tieu

Mo read-only journal route cho guest de frontend co the chia se nhat ky ca nhan bang link public/unlisted, dong thoi giu owner mutation trong namespace auth-only hien co.

### Scope cua luot trien khai nay

- [x] them `GET /api/v1/public/trips/:tripId/journal`
- [x] public journal read chi cho phep trip `visibility = public | unlisted`
- [x] trip `visibility = private` tiep tuc tra permission denied
- [x] neu trip duoc share nhung chua co journal record, tra scene rong mac dinh nhu owner read
- [x] them integration coverage cho public journal read
