/*
  Warnings:

  - You are about to drop the column `timestamp` on the `log` table. All the data in the column will be lost.
  - Added the required column `occurredAt` to the `log` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "log_projectId_timestamp_idx";

-- DropIndex
DROP INDEX "log_timestamp_idx";

-- AlterTable
ALTER TABLE "log" DROP COLUMN "timestamp",
ADD COLUMN     "occurredAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "log_occurredAt_idx" ON "log"("occurredAt");

-- CreateIndex
CREATE INDEX "log_projectId_occurredAt_idx" ON "log"("projectId", "occurredAt");

-- CreateIndex
CREATE INDEX "log_projectId_level_idx" ON "log"("projectId", "level");
