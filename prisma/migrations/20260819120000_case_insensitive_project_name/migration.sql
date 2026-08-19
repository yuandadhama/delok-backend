-- Case-insensitive unique constraint on (organizationId, lower(name))

-- First, check for existing case-insensitive duplicates within the same
-- organization. If any exist, this migration will fail with a clear error.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "project"
    GROUP BY "organizationId", lower("name")
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Case-insensitive duplicate project names exist within an organization. Please resolve duplicates before applying this migration.';
  END IF;
END $$;

-- Drop the old case-sensitive unique constraint if it exists.
-- This handles the case where @@unique([organizationId, name]) was previously applied.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'project_organizationId_name_key'
  ) THEN
    ALTER TABLE "project" DROP CONSTRAINT "project_organizationId_name_key";
  END IF;
END $$;

-- Drop the old case-sensitive unique index if it exists (Prisma may have created it).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE indexname = 'project_organizationId_name_key'
  ) THEN
    DROP INDEX "project_organizationId_name_key";
  END IF;
END $$;

-- Create the case-insensitive unique index on (organizationId, lower(name)).
CREATE UNIQUE INDEX "project_organizationId_lower_name_idx"
ON "project" ("organizationId", lower("name"));
