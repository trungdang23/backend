UPDATE "trips"
SET "visibility" = 'public'
WHERE "visibility" = 'unlisted';

UPDATE "trip_journals"
SET "visibility" = 'public'
WHERE "visibility" = 'unlisted';

ALTER TABLE "trips"
ADD CONSTRAINT "trips_visibility_check"
CHECK ("visibility" IN ('private', 'public'));

ALTER TABLE "trip_journals"
ADD CONSTRAINT "trip_journals_visibility_check"
CHECK ("visibility" IN ('private', 'public'));
