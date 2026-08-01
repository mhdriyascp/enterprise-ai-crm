-- CreateEnum
CREATE TYPE "WorkflowTrigger" AS ENUM ('manual', 'event', 'schedule');

-- CreateEnum
CREATE TYPE "WorkflowDefinitionStatus" AS ENUM ('draft', 'active', 'inactive');

-- CreateEnum
CREATE TYPE "WorkflowRunStatus" AS ENUM ('pending', 'running', 'waiting_approval', 'completed', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "workflow_definitions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "trigger" "WorkflowTrigger" NOT NULL DEFAULT 'manual',
    "trigger_config" JSONB NOT NULL DEFAULT '{}',
    "steps" JSONB NOT NULL DEFAULT '[]',
    "status" "WorkflowDefinitionStatus" NOT NULL DEFAULT 'draft',
    "version" INTEGER NOT NULL DEFAULT 1,
    "owner_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "workflow_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_runs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "workflow_id" UUID NOT NULL,
    "status" "WorkflowRunStatus" NOT NULL DEFAULT 'pending',
    "input" JSONB NOT NULL DEFAULT '{}',
    "output" JSONB,
    "step_results" JSONB NOT NULL DEFAULT '[]',
    "current_step" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "triggered_by" UUID,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approvals" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "run_id" UUID NOT NULL,
    "step_index" INTEGER NOT NULL,
    "step_name" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'pending',
    "decided_by" UUID,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decided_at" TIMESTAMP(3),

    CONSTRAINT "approvals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "workflow_definitions_tenant_id_idx" ON "workflow_definitions"("tenant_id");

-- CreateIndex
CREATE INDEX "workflow_definitions_tenant_id_status_idx" ON "workflow_definitions"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "workflow_definitions_tenant_id_trigger_idx" ON "workflow_definitions"("tenant_id", "trigger");

-- CreateIndex
CREATE INDEX "workflow_runs_tenant_id_idx" ON "workflow_runs"("tenant_id");

-- CreateIndex
CREATE INDEX "workflow_runs_tenant_id_status_idx" ON "workflow_runs"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "workflow_runs_workflow_id_idx" ON "workflow_runs"("workflow_id");

-- CreateIndex
CREATE INDEX "approvals_tenant_id_idx" ON "approvals"("tenant_id");

-- CreateIndex
CREATE INDEX "approvals_tenant_id_status_idx" ON "approvals"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "approvals_run_id_idx" ON "approvals"("run_id");

-- AddForeignKey
ALTER TABLE "workflow_runs" ADD CONSTRAINT "workflow_runs_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "workflow_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "workflow_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
