ALTER TABLE "users"
  ADD COLUMN "avatar_file_name" TEXT,
  ADD COLUMN "avatar_content_type" TEXT,
  ADD COLUMN "avatar_byte_size" INTEGER,
  ADD COLUMN "avatar_storage_key" TEXT,
  ADD COLUMN "avatar_public_id" TEXT;

CREATE UNIQUE INDEX "users_avatar_storage_key_key" ON "users"("avatar_storage_key");
CREATE UNIQUE INDEX "users_avatar_public_id_key" ON "users"("avatar_public_id");
