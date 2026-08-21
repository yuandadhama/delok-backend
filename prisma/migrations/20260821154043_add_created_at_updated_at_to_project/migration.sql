/*
  Added createdAt and updatedAt columns to the project table.
  Existing rows are backfilled with CURRENT_TIMESTAMP.
*/
-- AlterTable
ALTER TABLE "project" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
