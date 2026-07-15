-- AlterTable
ALTER TABLE "chat_sessions" ADD COLUMN "surface" TEXT NOT NULL DEFAULT 'console';
ALTER TABLE "chat_sessions" ADD COLUMN "summary" TEXT;
ALTER TABLE "chat_sessions" ADD COLUMN "summary_updated_at" TIMESTAMPTZ(6);

-- CreateIndex
CREATE INDEX "chat_sessions_user_surface_updated_idx" ON "chat_sessions"("user_id", "surface", "updated_at" DESC);
