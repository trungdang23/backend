ALTER TABLE "trip_itinerary_days"
ADD COLUMN "title" TEXT,
ADD COLUMN "starts_at" TEXT,
ADD COLUMN "ends_at" TEXT,
ADD COLUMN "location" TEXT,
ADD COLUMN "notes" TEXT,
ADD COLUMN "cost_amount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "cost_currency" TEXT,
ADD COLUMN "position" INTEGER,
ADD COLUMN "image_urls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

WITH ranked_days AS (
    SELECT
        d."id",
        d."date",
        t."budget_currency" AS "budget_currency",
        ROW_NUMBER() OVER (
            PARTITION BY d."trip_id", d."date"
            ORDER BY d."created_at" ASC, d."id" ASC
        ) AS "position"
    FROM "trip_itinerary_days" d
    INNER JOIN "trips" t ON t."id" = d."trip_id"
)
UPDATE "trip_itinerary_days" d
SET
    "title" = CONCAT('Stop ', ranked_days."date"),
    "cost_currency" = ranked_days."budget_currency",
    "position" = ranked_days."position"
FROM ranked_days
WHERE d."id" = ranked_days."id";

ALTER TABLE "trip_itinerary_days"
ALTER COLUMN "title" SET NOT NULL,
ALTER COLUMN "cost_currency" SET NOT NULL,
ALTER COLUMN "position" SET NOT NULL;

DROP INDEX IF EXISTS "trip_itinerary_days_trip_id_date_key";
DROP INDEX IF EXISTS "trip_itinerary_days_trip_id_date_idx";

CREATE UNIQUE INDEX "trip_itinerary_days_trip_id_date_position_key"
ON "trip_itinerary_days"("trip_id", "date", "position");

CREATE INDEX "trip_itinerary_days_trip_id_date_position_idx"
ON "trip_itinerary_days"("trip_id", "date", "position");

ALTER TABLE "trip_itinerary_activities"
ADD COLUMN "ends_at" TEXT,
ADD COLUMN "image_urls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
