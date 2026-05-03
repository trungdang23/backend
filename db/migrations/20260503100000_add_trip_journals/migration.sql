CREATE TABLE "trip_journals" (
  "id" TEXT NOT NULL,
  "trip_id" TEXT NOT NULL,
  "scene_version" INTEGER NOT NULL DEFAULT 1,
  "page" JSONB NOT NULL,
  "objects" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "trip_journals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "trip_journals_trip_id_key"
ON "trip_journals"("trip_id");

ALTER TABLE "trip_journals"
ADD CONSTRAINT "trip_journals_trip_id_fkey"
FOREIGN KEY ("trip_id") REFERENCES "trips"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
