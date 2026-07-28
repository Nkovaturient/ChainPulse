-- AlterTable
ALTER TABLE "insider_alerts" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'other';
ALTER TABLE "insider_alerts" ADD COLUMN "metadata" JSONB;

-- CreateIndex
CREATE INDEX "insider_alerts_category_detected_idx" ON "insider_alerts"("category", "detected_at" DESC);
