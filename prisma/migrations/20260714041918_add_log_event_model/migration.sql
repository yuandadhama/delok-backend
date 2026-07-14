-- CreateTable
CREATE TABLE "log" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "message" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload" JSONB,

    CONSTRAINT "log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "log_projectId_idx" ON "log"("projectId");

-- CreateIndex
CREATE INDEX "log_timestamp_idx" ON "log"("timestamp");

-- CreateIndex
CREATE INDEX "log_projectId_timestamp_idx" ON "log"("projectId", "timestamp");

-- AddForeignKey
ALTER TABLE "log" ADD CONSTRAINT "log_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
