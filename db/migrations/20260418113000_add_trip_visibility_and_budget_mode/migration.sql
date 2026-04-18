ALTER TABLE "trips"
ADD COLUMN "budget_mode" TEXT NOT NULL DEFAULT 'manual',
ADD COLUMN "manual_budget_amount" INTEGER,
ADD COLUMN "manual_budget_currency" TEXT,
ADD COLUMN "visibility" TEXT NOT NULL DEFAULT 'private';

UPDATE "trips"
SET
  "manual_budget_amount" = "budget_amount",
  "manual_budget_currency" = "budget_currency"
WHERE
  "manual_budget_amount" IS NULL
  AND "manual_budget_currency" IS NULL;
