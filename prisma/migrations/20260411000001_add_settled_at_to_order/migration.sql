-- AlterTable: add settledAt to Order for agent settlement tracking
ALTER TABLE "Order" ADD COLUMN "settledAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Order_settledAt_idx" ON "Order"("settledAt");
