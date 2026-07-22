/*
  Warnings:

  - You are about to drop the column `key` on the `api_key` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[keyHash]` on the table `api_key` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `keyHash` to the `api_key` table without a default value. This is not possible if the table is not empty.
  - Added the required column `keyPrefix` to the `api_key` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `api_key` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "api_key_key_key";

-- AlterTable
ALTER TABLE "api_key" DROP COLUMN "key",
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "keyHash" TEXT NOT NULL,
ADD COLUMN     "keyPrefix" TEXT NOT NULL,
ADD COLUMN     "lastUsedAt" TIMESTAMP(3),
ADD COLUMN     "name" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "api_key_keyHash_key" ON "api_key"("keyHash");

-- CreateIndex
CREATE INDEX "api_key_projectId_idx" ON "api_key"("projectId");

-- CreateIndex
CREATE INDEX "api_key_createdById_idx" ON "api_key"("createdById");

-- AddForeignKey
ALTER TABLE "api_key" ADD CONSTRAINT "api_key_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
