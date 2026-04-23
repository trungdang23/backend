CREATE TABLE "plan_node_stickers" (
  "id" TEXT NOT NULL,
  "node_id" TEXT NOT NULL,
  "sticker_key" TEXT NOT NULL,
  "x" INTEGER NOT NULL,
  "y" INTEGER NOT NULL,
  "rotation" INTEGER NOT NULL DEFAULT 0,
  "scale" INTEGER NOT NULL DEFAULT 100,
  "z_index" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "plan_node_stickers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "plan_node_stickers_node_id_z_index_idx"
ON "plan_node_stickers"("node_id", "z_index");

ALTER TABLE "plan_node_stickers"
ADD CONSTRAINT "plan_node_stickers_node_id_fkey"
FOREIGN KEY ("node_id") REFERENCES "plan_nodes"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
