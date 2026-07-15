-- Clean break: Stripe → Razorpay (no live Stripe purchases assumed)
DELETE FROM "purchases";

DROP INDEX IF EXISTS "purchases_stripe_session_id_key";

ALTER TABLE "purchases" DROP COLUMN "stripe_session_id",
DROP COLUMN "stripe_customer_id",
DROP COLUMN "amount_cents";

ALTER TABLE "purchases" ADD COLUMN "razorpay_order_id" TEXT NOT NULL,
ADD COLUMN "razorpay_payment_id" TEXT,
ADD COLUMN "amount_paise" INTEGER NOT NULL;

CREATE UNIQUE INDEX "purchases_razorpay_order_id_key" ON "purchases"("razorpay_order_id");
CREATE UNIQUE INDEX "purchases_razorpay_payment_id_key" ON "purchases"("razorpay_payment_id");
