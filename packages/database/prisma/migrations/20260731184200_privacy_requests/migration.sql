CREATE TYPE "PrivacyRequestType" AS ENUM ('ACCESS', 'CORRECTION', 'DELETION', 'RESTRICTION', 'CONSENT_WITHDRAWAL');
CREATE TYPE "PrivacyRequestStatus" AS ENUM ('NEW', 'IDENTITY_CHECK', 'IN_PROGRESS', 'COMPLETED', 'REJECTED');

CREATE TABLE "privacy_requests" (
  "id" UUID NOT NULL,
  "public_id" TEXT NOT NULL,
  "type" "PrivacyRequestType" NOT NULL,
  "status" "PrivacyRequestStatus" NOT NULL DEFAULT 'NEW',
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "details" TEXT,
  "subject_ref" TEXT NOT NULL,
  "retention_until" TIMESTAMP(3) NOT NULL,
  "resolved_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "privacy_requests_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "privacy_requests_public_id_key" ON "privacy_requests"("public_id");
CREATE INDEX "privacy_requests_status_created_at_idx" ON "privacy_requests"("status", "created_at");
CREATE INDEX "privacy_requests_subject_ref_created_at_idx" ON "privacy_requests"("subject_ref", "created_at");
CREATE INDEX "privacy_requests_retention_until_idx" ON "privacy_requests"("retention_until");
