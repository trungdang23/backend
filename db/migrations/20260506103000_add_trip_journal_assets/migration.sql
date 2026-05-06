CREATE TABLE "trip_journal_assets" (
  "id" TEXT NOT NULL,
  "trip_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "file_name" TEXT NOT NULL,
  "content_type" TEXT NOT NULL,
  "byte_size" INTEGER NOT NULL,
  "storage_key" TEXT NOT NULL,
  "public_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "trip_journal_assets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "trip_journal_assets_storage_key_key" ON "trip_journal_assets"("storage_key");
CREATE UNIQUE INDEX "trip_journal_assets_public_id_key" ON "trip_journal_assets"("public_id");
CREATE INDEX "trip_journal_assets_trip_id_created_at_idx" ON "trip_journal_assets"("trip_id", "created_at");
CREATE INDEX "trip_journal_assets_user_id_created_at_idx" ON "trip_journal_assets"("user_id", "created_at");

ALTER TABLE "trip_journal_assets"
  ADD CONSTRAINT "trip_journal_assets_trip_id_fkey"
  FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "trip_journal_assets"
  ADD CONSTRAINT "trip_journal_assets_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
