/*
  Warnings:

  - You are about to drop the column `tier` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "tier",
ADD COLUMN     "elite_expires_at" TIMESTAMPTZ(6),
ADD COLUMN     "premium_expires_at" TIMESTAMPTZ(6);

-- DropEnum
DROP TYPE "UserTier";

-- CreateTable
CREATE TABLE "purchases" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "plan" TEXT NOT NULL,
    "stripe_session_id" TEXT NOT NULL,
    "stripe_customer_id" TEXT,
    "amount_cents" INTEGER NOT NULL,
    "period_months" INTEGER NOT NULL,
    "started_at" TIMESTAMPTZ(6) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invite_codes" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "max_redemptions" INTEGER NOT NULL,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invite_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invite_redemptions" (
    "id" UUID NOT NULL,
    "code_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "redeemed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invite_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insider_alerts" (
    "id" UUID NOT NULL,
    "chain" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "tx_hash" TEXT NOT NULL,
    "amount_usd" DOUBLE PRECISION,
    "summary" TEXT NOT NULL,
    "source_url" TEXT,
    "detected_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "insider_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_usages" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "surface" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_usages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "purchases_stripe_session_id_key" ON "purchases"("stripe_session_id");

-- CreateIndex
CREATE INDEX "purchases_user_idx" ON "purchases"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "invite_codes_code_key" ON "invite_codes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "invite_redemption_code_user_uniq" ON "invite_redemptions"("code_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "insider_alerts_tx_hash_key" ON "insider_alerts"("tx_hash");

-- CreateIndex
CREATE INDEX "insider_alerts_detected_idx" ON "insider_alerts"("detected_at" DESC);

-- CreateIndex
CREATE INDEX "message_usages_user_created_idx" ON "message_usages"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invite_redemptions" ADD CONSTRAINT "invite_redemptions_code_id_fkey" FOREIGN KEY ("code_id") REFERENCES "invite_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invite_redemptions" ADD CONSTRAINT "invite_redemptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_usages" ADD CONSTRAINT "message_usages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
