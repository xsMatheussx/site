/*
  Warnings:

  - A unique constraint covering the columns `[accessTokenHash]` on the table `Access` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Access" ADD COLUMN     "accessTokenHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Access_accessTokenHash_key" ON "Access"("accessTokenHash");
