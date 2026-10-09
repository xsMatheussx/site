/*
  Warnings:

  - You are about to drop the column `programId` on the `AffiliateApplication` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[orderId]` on the table `Access` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[affiliateId,affiliateProgramId]` on the table `AffiliateApplication` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[productId]` on the table `AffiliateProgram` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[saleId]` on the table `Commission` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[providerDisputeId]` on the table `Dispute` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `affiliateProgramId` to the `AffiliateApplication` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productId` to the `AffiliateLink` table without a default value. This is not possible if the table is not empty.
  - Added the required column `saleId` to the `Commission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `producerId` to the `Sale` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "RefundStatus" ADD VALUE 'REFUNDED';

-- DropForeignKey
ALTER TABLE "AffiliateApplication" DROP CONSTRAINT "AffiliateApplication_programId_fkey";

-- DropIndex
DROP INDEX "AffiliateApplication_affiliateId_programId_key";

-- DropIndex
DROP INDEX "AffiliateApplication_programId_idx";

-- AlterTable
ALTER TABLE "Access" ADD COLUMN     "orderId" TEXT;

-- AlterTable
ALTER TABLE "Affiliate" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "AffiliateApplication" DROP COLUMN "programId",
ADD COLUMN     "affiliateProgramId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "AffiliateLink" ADD COLUMN     "productId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "AffiliateProgram" ADD COLUMN     "approvalMode" TEXT NOT NULL DEFAULT 'AUTO',
ADD COLUMN     "enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "rules" TEXT;

-- AlterTable
ALTER TABLE "Commission" ADD COLUMN     "saleId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Dispute" ADD COLUMN     "amount" INTEGER;

-- AlterTable
ALTER TABLE "FinancialEntry" ADD COLUMN     "orderId" TEXT;

-- AlterTable
ALTER TABLE "Offer" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "discount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "subtotal" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "paidAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "coverUrl" TEXT;

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "name" TEXT;

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "producerId" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'APPROVED';

-- CreateIndex
CREATE UNIQUE INDEX "Access_orderId_key" ON "Access"("orderId");

-- CreateIndex
CREATE INDEX "AffiliateApplication_affiliateProgramId_idx" ON "AffiliateApplication"("affiliateProgramId");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateApplication_affiliateId_affiliateProgramId_key" ON "AffiliateApplication"("affiliateId", "affiliateProgramId");

-- CreateIndex
CREATE INDEX "AffiliateLink_productId_idx" ON "AffiliateLink"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateProgram_productId_key" ON "AffiliateProgram"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Commission_saleId_key" ON "Commission"("saleId");

-- CreateIndex
CREATE UNIQUE INDEX "Dispute_providerDisputeId_key" ON "Dispute"("providerDisputeId");

-- CreateIndex
CREATE INDEX "FinancialEntry_orderId_idx" ON "FinancialEntry"("orderId");

-- AddForeignKey
ALTER TABLE "AffiliateApplication" ADD CONSTRAINT "AffiliateApplication_affiliateProgramId_fkey" FOREIGN KEY ("affiliateProgramId") REFERENCES "AffiliateProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateLink" ADD CONSTRAINT "AffiliateLink_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_producerId_fkey" FOREIGN KEY ("producerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Access" ADD CONSTRAINT "Access_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialEntry" ADD CONSTRAINT "FinancialEntry_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
