CREATE TABLE "posts" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "trip_id" TEXT,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "cover_image_url" TEXT,
  "visibility" TEXT NOT NULL DEFAULT 'public',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "posts_created_at_idx" ON "posts"("created_at");
CREATE INDEX "posts_user_id_created_at_idx" ON "posts"("user_id", "created_at");
CREATE INDEX "posts_trip_id_idx" ON "posts"("trip_id");

ALTER TABLE "posts"
ADD CONSTRAINT "posts_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "posts"
ADD CONSTRAINT "posts_trip_id_fkey"
FOREIGN KEY ("trip_id") REFERENCES "trips"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
