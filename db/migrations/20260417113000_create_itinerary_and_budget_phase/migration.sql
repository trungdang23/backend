CREATE TABLE "trip_itinerary_days" (
    "id" TEXT NOT NULL,
    "trip_id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trip_itinerary_days_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "trip_itinerary_activities" (
    "id" TEXT NOT NULL,
    "itinerary_day_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "starts_at" TEXT,
    "location" TEXT,
    "notes" TEXT,
    "cost_amount" INTEGER NOT NULL DEFAULT 0,
    "cost_currency" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trip_itinerary_activities_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "trip_itinerary_days_trip_id_date_key" ON "trip_itinerary_days"("trip_id", "date");
CREATE INDEX "trip_itinerary_days_trip_id_date_idx" ON "trip_itinerary_days"("trip_id", "date");
CREATE UNIQUE INDEX "trip_itinerary_activities_itinerary_day_id_position_key" ON "trip_itinerary_activities"("itinerary_day_id", "position");
CREATE INDEX "trip_itinerary_activities_itinerary_day_id_position_idx" ON "trip_itinerary_activities"("itinerary_day_id", "position");

ALTER TABLE "trip_itinerary_days"
ADD CONSTRAINT "trip_itinerary_days_trip_id_fkey"
FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "trip_itinerary_activities"
ADD CONSTRAINT "trip_itinerary_activities_itinerary_day_id_fkey"
FOREIGN KEY ("itinerary_day_id") REFERENCES "trip_itinerary_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;
