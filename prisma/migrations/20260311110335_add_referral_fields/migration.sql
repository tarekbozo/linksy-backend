/*
  Warnings:

  - A unique constraint covering the columns `[referralCode]` on the table `WaitlistEntry` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "WaitlistEntry" ADD COLUMN     "referralCode" TEXT,
ADD COLUMN     "referredBy" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistEntry_referralCode_key" ON "WaitlistEntry"("referralCode");
