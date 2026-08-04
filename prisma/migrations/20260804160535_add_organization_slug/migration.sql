/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `organization` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `organization` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "organization_name_key";

-- AlterTable
ALTER TABLE "organization"
ADD COLUMN "slug" TEXT;

UPDATE "organization"
SET "slug" = lower(replace("name", ' ', '-'));

ALTER TABLE "organization"
ALTER COLUMN "slug" SET NOT NULL;

CREATE UNIQUE INDEX "organization_slug_key"
ON "organization"("slug");
