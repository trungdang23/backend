CREATE TYPE "plan_node_type" AS ENUM (
  'section',
  'day',
  'location',
  'activity',
  'note'
);

CREATE TABLE "plan_nodes" (
  "id" TEXT NOT NULL,
  "trip_id" TEXT NOT NULL,
  "parent_id" TEXT,
  "type" "plan_node_type" NOT NULL,
  "title" TEXT NOT NULL,
  "notes" TEXT,
  "start_at" TEXT,
  "end_at" TEXT,
  "cost_amount" INTEGER,
  "cost_currency" TEXT,
  "image_url" TEXT,
  "sort_order" INTEGER NOT NULL,
  "depth" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "plan_nodes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "plan_nodes_trip_id_parent_id_sort_order_idx"
ON "plan_nodes"("trip_id", "parent_id", "sort_order");

CREATE INDEX "plan_nodes_trip_id_depth_idx"
ON "plan_nodes"("trip_id", "depth");

ALTER TABLE "plan_nodes"
ADD CONSTRAINT "plan_nodes_trip_id_fkey"
FOREIGN KEY ("trip_id") REFERENCES "trips"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "plan_nodes"
ADD CONSTRAINT "plan_nodes_parent_id_fkey"
FOREIGN KEY ("parent_id") REFERENCES "plan_nodes"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
