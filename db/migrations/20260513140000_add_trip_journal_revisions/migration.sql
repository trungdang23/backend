CREATE TABLE "trip_journal_revisions" (
  "id" TEXT NOT NULL,
  "trip_id" TEXT NOT NULL,
  "scene_version" INTEGER NOT NULL DEFAULT 1,
  "page" JSONB NOT NULL,
  "objects" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "trip_journal_revisions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "trip_journal_revisions_trip_id_created_at_idx"
ON "trip_journal_revisions"("trip_id", "created_at");

ALTER TABLE "trip_journal_revisions"
ADD CONSTRAINT "trip_journal_revisions_trip_id_fkey"
FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
