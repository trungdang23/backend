CREATE TABLE "trips" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "destination" TEXT NOT NULL,
  "start_date" TEXT NOT NULL,
  "end_date" TEXT NOT NULL,
  "timezone" TEXT NOT NULL,
  "budget_amount" INTEGER NOT NULL,
  "budget_currency" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "trips_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "trips_user_id_fkey"
    FOREIGN KEY ("user_id")
    REFERENCES "users"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE INDEX "trips_user_id_start_date_idx"
  ON "trips"("user_id", "start_date");
