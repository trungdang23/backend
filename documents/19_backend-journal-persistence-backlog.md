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
  - `GET /api/v1/trips/:tripId/journal`
  - `PUT /api/v1/trips/:tripId/journal`
- [x] luu `sceneVersion`, `page`, va `objects` bang JSONB
- [x] tra ve scene rong mac dinh khi trip chua co journal record
- [x] validate base scene object contract o request boundary
- [x] them test HTTP cho load/save journal cua owner

## Deferred

- upload asset that va asset ownership
- page-level CRUD, publish snapshot, revision history
- public journal route
- realtime/collaboration/autosave conflict handling
