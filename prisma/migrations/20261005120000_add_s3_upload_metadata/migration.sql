ALTER TABLE "User" ADD COLUMN "socialLinks" JSONB;

ALTER TABLE "Project"
ADD COLUMN "pipelineMetadata" JSONB,
ADD COLUMN "attachments" JSONB;

ALTER TABLE "DueDiligenceDocument" ADD COLUMN "storageKey" TEXT;