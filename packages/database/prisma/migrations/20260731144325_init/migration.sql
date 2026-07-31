-- CreateEnum
CREATE TYPE "public"."ProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."RoastLevel" AS ENUM ('LIGHT', 'MEDIUM', 'DARK');

-- CreateEnum
CREATE TYPE "public"."Grind" AS ENUM ('WHOLE', 'ESPRESSO', 'FILTER', 'FRENCH_PRESS', 'TURKISH');

-- CreateEnum
CREATE TYPE "public"."LeadAudience" AS ENUM ('HOME', 'CAFE', 'RESTAURANT', 'WHOLESALE', 'PRIVATE_LABEL', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."LeadStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'QUALIFIED', 'WON', 'LOST', 'DELETED');

-- CreateEnum
CREATE TYPE "public"."NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ADMIN', 'MANAGER', 'CONTENT_MANAGER', 'WAREHOUSE');

-- CreateEnum
CREATE TYPE "public"."ConsentPurpose" AS ENUM ('LEAD_RESPONSE', 'ORDER_FULFILLMENT', 'MARKETING', 'ANALYTICS');

-- CreateTable
CREATE TABLE "public"."brands" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT,
    "description" TEXT,
    "roast_level" "public"."RoastLevel",
    "audience" TEXT,
    "origins" TEXT[],
    "image_url" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."countries" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT,
    "lead" TEXT,
    "taste_notes" TEXT[],
    "aroma" TEXT[],
    "altitude" TEXT,
    "processing" TEXT,
    "acidity" INTEGER,
    "body" INTEGER,
    "roast_recommendation" TEXT,
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."products" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand_id" UUID NOT NULL,
    "description" TEXT,
    "flavor_descriptors" TEXT[],
    "roast_level" "public"."RoastLevel" NOT NULL,
    "is_decaf" BOOLEAN NOT NULL DEFAULT false,
    "process" TEXT,
    "altitude" TEXT,
    "cupping_score" DECIMAL(4,1),
    "images" TEXT[],
    "status" "public"."ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "seo_title" TEXT,
    "seo_description" TEXT,
    "ingredients" TEXT,
    "manufacturer_name" TEXT,
    "manufacturer_address" TEXT,
    "production_country" TEXT,
    "shelf_life_days" INTEGER,
    "storage_conditions" TEXT,
    "preparation" TEXT,
    "conformity_document" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."product_countries" (
    "product_id" UUID NOT NULL,
    "country_id" UUID NOT NULL,

    CONSTRAINT "product_countries_pkey" PRIMARY KEY ("product_id","country_id")
);

-- CreateTable
CREATE TABLE "public"."product_variants" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "weight_g" INTEGER NOT NULL,
    "grind" "public"."Grind" NOT NULL,
    "sku" TEXT NOT NULL,
    "price_kopecks" INTEGER NOT NULL,
    "compare_at_price_kopecks" INTEGER,
    "stock_qty" INTEGER NOT NULL DEFAULT 0,
    "reserved_qty" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "barcode" TEXT,
    "gtin" TEXT,
    "tn_ved_code" TEXT,
    "okpd2_code" TEXT,
    "marking_required" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."marking_units" (
    "id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "code_hash" TEXT NOT NULL,
    "encrypted_code" BYTEA NOT NULL,
    "status" TEXT NOT NULL,
    "batch_ref" TEXT,
    "introduced_at" TIMESTAMP(3),
    "withdrawn_at" TIMESTAMP(3),
    "withdrawal_ref" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marking_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."roast_batches" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "roasted_at" TIMESTAMP(3) NOT NULL,
    "weight_kg" DECIMAL(8,3) NOT NULL,
    "profile" TEXT,
    "cupping_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roast_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."leads" (
    "id" UUID NOT NULL,
    "public_id" TEXT NOT NULL,
    "audience" "public"."LeadAudience" NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "message" TEXT,
    "source_page" TEXT NOT NULL,
    "utm" JSONB,
    "status" "public"."LeadStatus" NOT NULL DEFAULT 'NEW',
    "assigned_to_id" UUID,
    "next_action_at" TIMESTAMP(3),
    "retention_until" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."lead_notes" (
    "id" UUID NOT NULL,
    "lead_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."lead_notifications" (
    "id" UUID NOT NULL,
    "lead_id" UUID NOT NULL,
    "channel" TEXT NOT NULL,
    "status" "public"."NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."consent_documents" (
    "id" UUID NOT NULL,
    "purpose" "public"."ConsentPurpose" NOT NULL,
    "version" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "published_at" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consent_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."consent_receipts" (
    "id" UUID NOT NULL,
    "document_id" UUID NOT NULL,
    "lead_id" UUID,
    "subject_ref" TEXT NOT NULL,
    "accepted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),
    "ip_hash" TEXT,
    "user_agent" TEXT,
    "source_page" TEXT NOT NULL,
    "collection_form" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consent_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "refresh_token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" UUID NOT NULL,
    "actor_id" UUID,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "changes" JSONB,
    "request_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."settings" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "brands_slug_key" ON "public"."brands"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "countries_slug_key" ON "public"."countries"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "public"."products"("slug");

-- CreateIndex
CREATE INDEX "products_status_sort_order_idx" ON "public"."products"("status", "sort_order");

-- CreateIndex
CREATE INDEX "products_brand_id_status_idx" ON "public"."products"("brand_id", "status");

-- CreateIndex
CREATE INDEX "product_countries_country_id_idx" ON "public"."product_countries"("country_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_sku_key" ON "public"."product_variants"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_gtin_key" ON "public"."product_variants"("gtin");

-- CreateIndex
CREATE INDEX "product_variants_is_active_stock_qty_idx" ON "public"."product_variants"("is_active", "stock_qty");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_product_id_weight_g_grind_key" ON "public"."product_variants"("product_id", "weight_g", "grind");

-- CreateIndex
CREATE UNIQUE INDEX "marking_units_code_hash_key" ON "public"."marking_units"("code_hash");

-- CreateIndex
CREATE INDEX "marking_units_variant_id_status_idx" ON "public"."marking_units"("variant_id", "status");

-- CreateIndex
CREATE INDEX "roast_batches_product_id_roasted_at_idx" ON "public"."roast_batches"("product_id", "roasted_at");

-- CreateIndex
CREATE UNIQUE INDEX "leads_public_id_key" ON "public"."leads"("public_id");

-- CreateIndex
CREATE INDEX "leads_status_created_at_idx" ON "public"."leads"("status", "created_at");

-- CreateIndex
CREATE INDEX "leads_retention_until_idx" ON "public"."leads"("retention_until");

-- CreateIndex
CREATE INDEX "leads_assigned_to_id_next_action_at_idx" ON "public"."leads"("assigned_to_id", "next_action_at");

-- CreateIndex
CREATE INDEX "lead_notes_lead_id_created_at_idx" ON "public"."lead_notes"("lead_id", "created_at");

-- CreateIndex
CREATE INDEX "lead_notifications_status_created_at_idx" ON "public"."lead_notifications"("status", "created_at");

-- CreateIndex
CREATE INDEX "consent_documents_purpose_is_active_idx" ON "public"."consent_documents"("purpose", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "consent_documents_purpose_version_key" ON "public"."consent_documents"("purpose", "version");

-- CreateIndex
CREATE INDEX "consent_receipts_subject_ref_accepted_at_idx" ON "public"."consent_receipts"("subject_ref", "accepted_at");

-- CreateIndex
CREATE INDEX "consent_receipts_lead_id_idx" ON "public"."consent_receipts"("lead_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_refresh_token_hash_key" ON "public"."sessions"("refresh_token_hash");

-- CreateIndex
CREATE INDEX "sessions_user_id_expires_at_idx" ON "public"."sessions"("user_id", "expires_at");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_created_at_idx" ON "public"."audit_logs"("entity_type", "entity_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_created_at_idx" ON "public"."audit_logs"("actor_id", "created_at");

-- AddForeignKey
ALTER TABLE "public"."products" ADD CONSTRAINT "products_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product_countries" ADD CONSTRAINT "product_countries_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product_countries" ADD CONSTRAINT "product_countries_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product_variants" ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."marking_units" ADD CONSTRAINT "marking_units_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."roast_batches" ADD CONSTRAINT "roast_batches_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leads" ADD CONSTRAINT "leads_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lead_notes" ADD CONSTRAINT "lead_notes_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lead_notes" ADD CONSTRAINT "lead_notes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lead_notifications" ADD CONSTRAINT "lead_notifications_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."consent_receipts" ADD CONSTRAINT "consent_receipts_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."consent_documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."consent_receipts" ADD CONSTRAINT "consent_receipts_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
