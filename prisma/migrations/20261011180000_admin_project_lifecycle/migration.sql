ALTER TABLE "Project"
  ADD COLUMN "contactEmail" TEXT,
  ADD COLUMN "reviewerId" TEXT;

CREATE INDEX "Project_reviewerId_idx" ON "Project"("reviewerId");

ALTER TABLE "Project"
  ADD CONSTRAINT "Project_reviewerId_fkey"
  FOREIGN KEY ("reviewerId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DueDiligence"
  ADD COLUMN "projectId" TEXT;

CREATE INDEX "DueDiligence_projectId_idx" ON "DueDiligence"("projectId");

ALTER TABLE "DueDiligence"
  ADD CONSTRAINT "DueDiligence_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "ProjectAuditLog" (
  "id" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "oldValue" JSONB,
  "newValue" JSONB,
  "reason" TEXT,
  "actorId" TEXT,
  "projectId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProjectAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProjectAuditLog_projectId_createdAt_idx" ON "ProjectAuditLog"("projectId", "createdAt");
CREATE INDEX "ProjectAuditLog_actorId_idx" ON "ProjectAuditLog"("actorId");
CREATE INDEX "ProjectAuditLog_action_idx" ON "ProjectAuditLog"("action");

ALTER TABLE "ProjectAuditLog"
  ADD CONSTRAINT "ProjectAuditLog_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ProjectAuditLog"
  ADD CONSTRAINT "ProjectAuditLog_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "AdminAuditLog" (
  "id" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "oldValue" JSONB,
  "newValue" JSONB,
  "reason" TEXT,
  "actorId" TEXT,
  "subjectUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdminAuditLog_subjectUserId_createdAt_idx" ON "AdminAuditLog"("subjectUserId", "createdAt");
CREATE INDEX "AdminAuditLog_actorId_idx" ON "AdminAuditLog"("actorId");
CREATE INDEX "AdminAuditLog_action_idx" ON "AdminAuditLog"("action");

ALTER TABLE "AdminAuditLog"
  ADD CONSTRAINT "AdminAuditLog_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "AdminAuditLog_subjectUserId_fkey"
  FOREIGN KEY ("subjectUserId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
