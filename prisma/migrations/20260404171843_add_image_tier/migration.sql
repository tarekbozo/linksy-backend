-- AlterTable
ALTER TABLE "GeneratedImage" ADD COLUMN     "isOverride" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tier" TEXT NOT NULL DEFAULT 'HIGH';
