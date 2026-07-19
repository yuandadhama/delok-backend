-- DropForeignKey
ALTER TABLE "log_event" DROP CONSTRAINT "log_event_projectId_fkey";

-- AddForeignKey
ALTER TABLE "log_event" ADD CONSTRAINT "log_event_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
