-- CreateEnum
CREATE TYPE "CreditType" AS ENUM ('SUBSCRIPTION', 'TOPUP', 'FREE_DAILY');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('BASIC_CHAT', 'ADVANCED_CHAT', 'IMAGE_GENERATION', 'VOICE_GENERATION', 'VIDEO_GENERATION', 'PLAN_ACTIVATION', 'TOPUP_PURCHASE', 'FREE_DAILY_RESET', 'REFUND');

-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'ORDER_REJECTED';
ALTER TYPE "AuditAction" ADD VALUE 'PLAN_ACTIVATED';
ALTER TYPE "AuditAction" ADD VALUE 'TOPUP_PURCHASED';
ALTER TYPE "AuditAction" ADD VALUE 'FREE_CREDITS_RESET';

-- AlterEnum: OrderStatus
BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED');
ALTER TABLE "Order" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "status" TYPE "OrderStatus_new" USING (
  CASE "status"::text
    WHEN 'PAID' THEN 'CONFIRMED'
    WHEN 'CANCELED' THEN 'REJECTED'
    WHEN 'EXPIRED' THEN 'REJECTED'
    ELSE "status"::text
  END
)::"OrderStatus_new";
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "OrderStatus_old" CASCADE;
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum: Plan
BEGIN;
CREATE TYPE "Plan_new" AS ENUM ('FREE', 'STUDENT', 'FREELANCER', 'CREATOR');
ALTER TABLE "Order" ALTER COLUMN "plan" TYPE "Plan_new" USING (
  CASE "plan"::text
    WHEN 'STARTER' THEN 'STUDENT'
    WHEN 'PRO' THEN 'FREELANCER'
    WHEN 'ELITE' THEN 'CREATOR'
    ELSE "plan"::text
  END
)::"Plan_new";
ALTER TYPE "Plan" RENAME TO "Plan_old";
ALTER TYPE "Plan_new" RENAME TO "Plan";
DROP TYPE "Plan_old" CASCADE;
COMMIT;

-- AlterEnum: UsageType
ALTER TYPE "UsageType" ADD VALUE 'VOICE';
ALTER TYPE "UsageType" ADD VALUE 'VIDEO';

-- Drop old Pass table if it still exists
DROP TABLE IF EXISTS "Pass" CASCADE;

-- Drop old Order indexes
DROP INDEX IF EXISTS "Order_agentId_idx";
DROP INDEX IF EXISTS "Order_status_idx";
DROP INDEX IF EXISTS "Order_userId_idx";

-- Drop old FK if exists
ALTER TABLE "Order" DROP CONSTRAINT IF EXISTS "Order_agentId_fkey";

-- AlterTable: Order
ALTER TABLE "Order" DROP COLUMN IF EXISTS "agentId";
ALTER TABLE "Order" DROP COLUMN IF EXISTS "amountSYP";
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "confirmedBy" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "priceSYP" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "topUpPackId" TEXT;
ALTER TABLE "Order" ALTER COLUMN "plan" DROP NOT NULL;

-- AlterTable: UsageLog
ALTER TABLE "UsageLog" ADD COLUMN IF NOT EXISTS "credits" INTEGER NOT NULL DEFAULT 0;

-- CreateTable: TopUpPack
CREATE TABLE "TopUpPack" (
    "id" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "priceSYP" INTEGER NOT NULL,
    "credits" INTEGER NOT NULL,
    "validDays" INTEGER NOT NULL DEFAULT 90,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TopUpPack_pkey" PRIMARY KEY ("id")
);

-- CreateTable: UserSubscription
CREATE TABLE "UserSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "Plan" NOT NULL DEFAULT 'FREE',
    "activatedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "autoRenew" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable: UserCredit
CREATE TABLE "UserCredit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "CreditType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "remaining" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserCredit_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CreditTransaction
CREATE TABLE "CreditTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userCreditId" TEXT,
    "type" "TransactionType" NOT NULL,
    "action" "ActionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "conversationId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CreditTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable: FreeDailyCredit
CREATE TABLE "FreeDailyCredit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedToday" INTEGER NOT NULL DEFAULT 0,
    "dailyCap" INTEGER NOT NULL DEFAULT 10,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FreeDailyCredit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserSubscription_userId_key" ON "UserSubscription"("userId");
CREATE INDEX "UserCredit_userId_expiresAt_idx" ON "UserCredit"("userId", "expiresAt");
CREATE INDEX "UserCredit_userId_type_idx" ON "UserCredit"("userId", "type");
CREATE INDEX "CreditTransaction_userId_createdAt_idx" ON "CreditTransaction"("userId", "createdAt");
CREATE INDEX "CreditTransaction_userCreditId_idx" ON "CreditTransaction"("userCreditId");
CREATE INDEX "CreditTransaction_conversationId_idx" ON "CreditTransaction"("conversationId");
CREATE UNIQUE INDEX "FreeDailyCredit_userId_key" ON "FreeDailyCredit"("userId");
CREATE INDEX "Order_userId_status_idx" ON "Order"("userId", "status");
CREATE INDEX "Order_topUpPackId_idx" ON "Order"("topUpPackId");
CREATE INDEX "Order_confirmedBy_idx" ON "Order"("confirmedBy");
CREATE INDEX "GeneratedImage_userId_createdAt_idx" ON "GeneratedImage"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "UserSubscription" ADD CONSTRAINT "UserSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserCredit" ADD CONSTRAINT "UserCredit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_userCreditId_fkey" FOREIGN KEY ("userCreditId") REFERENCES "UserCredit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_topUpPackId_fkey" FOREIGN KEY ("topUpPackId") REFERENCES "TopUpPack"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_confirmedBy_fkey" FOREIGN KEY ("confirmedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FreeDailyCredit" ADD CONSTRAINT "FreeDailyCredit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;