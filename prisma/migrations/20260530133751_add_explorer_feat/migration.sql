-- CreateEnum
CREATE TYPE "UserTier" AS ENUM ('free', 'premium');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "tier" "UserTier" NOT NULL DEFAULT 'free';

-- CreateTable
CREATE TABLE "tracked_wallets" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "address" TEXT NOT NULL,
    "label" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tracked_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tracked_wallets_user_created_idx" ON "tracked_wallets"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "tracked_wallets_user_address_uniq" ON "tracked_wallets"("user_id", "address");

-- AddForeignKey
ALTER TABLE "tracked_wallets" ADD CONSTRAINT "tracked_wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
