/*
  Warnings:

  - You are about to drop the `log` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "log" DROP CONSTRAINT "log_projectId_fkey";

-- DropTable
DROP TABLE "log";

-- CreateTable
CREATE TABLE "log_event" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "message" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload" JSONB,

    CONSTRAINT "log_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "log_event_projectId_idx" ON "log_event"("projectId");

-- CreateIndex
CREATE INDEX "log_event_occurredAt_idx" ON "log_event"("occurredAt");

-- CreateIndex
CREATE INDEX "log_event_projectId_occurredAt_idx" ON "log_event"("projectId", "occurredAt");

-- CreateIndex
CREATE INDEX "log_event_projectId_level_idx" ON "log_event"("projectId", "level");

-- AddForeignKey
ALTER TABLE "log_event" ADD CONSTRAINT "log_event_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
