-- Create LocationType enum
CREATE TYPE "LocationType" AS ENUM ('HOME', 'OFFICE', 'SCHOOL', 'FARM', 'PARENTS_HOME', 'CUSTOM');

-- Alter Location table: drop unique constraint, rename column, add type and updatedAt
DROP INDEX IF EXISTS "Location_userId_key";

ALTER TABLE "Location" RENAME COLUMN "locationName" TO "name";
ALTER TABLE "Location" ADD COLUMN "type" "LocationType" NOT NULL DEFAULT 'HOME';
ALTER TABLE "Location" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Alter RainAlert table: add locationId column
ALTER TABLE "RainAlert" ADD COLUMN "locationId" TEXT;

-- Backfill locationId for existing RainAlert records
-- Match by userId, picking the user's first location
UPDATE "RainAlert" ra
SET "locationId" = (
  SELECT l.id FROM "Location" l
  WHERE l."userId" = ra."userId"
  ORDER BY l."createdAt" ASC
  LIMIT 1
);

-- Make locationId NOT NULL after backfill
ALTER TABLE "RainAlert" ALTER COLUMN "locationId" SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE "RainAlert" ADD CONSTRAINT "RainAlert_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;
