-- AlterTable
ALTER TABLE "users" ALTER COLUMN "hashed_password" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN "auth_provider" TEXT NOT NULL DEFAULT 'email';
