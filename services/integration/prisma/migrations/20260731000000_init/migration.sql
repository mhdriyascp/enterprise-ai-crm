-- CreateEnum
CREATE TYPE "IntegrationProvider" AS ENUM ('slack', 'google_workspace', 'microsoft365', 'stripe', 'hubspot', 'salesforce', 'zapier', 'webhook');

-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('connected', 'disconnected', 'error');

-- CreateEnum
CREATE TYPE "IntegrationEventType" AS ENUM ('connected', 'disconnected', 'test', 'sync', 'webhook');

-- CreateEnum
CREATE TYPE "IntegrationEventStatus" AS ENUM ('success', 'failure');

-- CreateTable
CREATE TABLE "integrations" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "provider" "IntegrationProvider" NOT NULL,
    "name" TEXT NOT NULL,
    "status" "IntegrationStatus" NOT NULL DEFAULT 'disconnected',
    "config" JSONB NOT NULL DEFAULT '{}',
    "credentials_ref" TEXT,
    "last_error" TEXT,
    "last_synced_at" TIMESTAMP(3),
    "owner_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_events" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "integration_id" UUID NOT NULL,
    "type" "IntegrationEventType" NOT NULL,
    "status" "IntegrationEventStatus" NOT NULL DEFAULT 'success',
    "payload" JSONB NOT NULL DEFAULT '{}',
    "message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integration_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "integrations_tenant_id_idx" ON "integrations"("tenant_id");

-- CreateIndex
CREATE INDEX "integrations_tenant_id_status_idx" ON "integrations"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "integrations_tenant_id_provider_idx" ON "integrations"("tenant_id", "provider");

-- CreateIndex
CREATE INDEX "integration_events_tenant_id_idx" ON "integration_events"("tenant_id");

-- CreateIndex
CREATE INDEX "integration_events_integration_id_idx" ON "integration_events"("integration_id");

-- CreateIndex
CREATE INDEX "integration_events_integration_id_type_idx" ON "integration_events"("integration_id", "type");

-- AddForeignKey
ALTER TABLE "integration_events" ADD CONSTRAINT "integration_events_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
