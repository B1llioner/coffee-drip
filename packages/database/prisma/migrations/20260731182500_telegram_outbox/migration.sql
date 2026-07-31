ALTER TYPE "NotificationStatus" ADD VALUE IF NOT EXISTS 'PROCESSING';

ALTER TABLE "lead_notifications"
  ADD COLUMN "next_attempt_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "locked_at" TIMESTAMP(3),
  ADD COLUMN "lock_id" TEXT;

DROP INDEX IF EXISTS "lead_notifications_status_created_at_idx";
CREATE INDEX "lead_notifications_status_next_attempt_at_idx"
  ON "lead_notifications"("status", "next_attempt_at");
