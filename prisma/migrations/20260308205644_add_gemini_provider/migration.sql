-- AlterEnum
ALTER TYPE "AiProvider" ADD VALUE 'GEMINI';

-- AlterTable
ALTER TABLE "Conversation" ALTER COLUMN "model" SET DEFAULT 'claude-haiku-4-5-20251001';
