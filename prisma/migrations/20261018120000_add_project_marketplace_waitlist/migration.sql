CREATE TYPE "ProjectWaitlistStatus" AS ENUM ('JOINED', 'WITHDRAWN');

CREATE TABLE "ProjectWaitlistEntry" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "status" "ProjectWaitlistStatus" NOT NULL DEFAULT 'JOINED',
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "withdrawnAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProjectWaitlistEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProjectWaitlistEvent" (
  "id" TEXT NOT NULL,
  "entryId" TEXT NOT NULL,
  "action" "ProjectWaitlistStatus" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProjectWaitlistEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProjectWaitlistEntry_projectId_userId_key"
  ON "ProjectWaitlistEntry"("projectId", "userId");
CREATE INDEX "ProjectWaitlistEntry_userId_status_idx"
  ON "ProjectWaitlistEntry"("userId", "status");
CREATE INDEX "ProjectWaitlistEntry_projectId_status_idx"
  ON "ProjectWaitlistEntry"("projectId", "status");
CREATE INDEX "ProjectWaitlistEvent_entryId_createdAt_idx"
  ON "ProjectWaitlistEvent"("entryId", "createdAt");

ALTER TABLE "ProjectWaitlistEntry"
  ADD CONSTRAINT "ProjectWaitlistEntry_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "ProjectWaitlistEntry_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProjectWaitlistEvent"
  ADD CONSTRAINT "ProjectWaitlistEvent_entryId_fkey"
  FOREIGN KEY ("entryId") REFERENCES "ProjectWaitlistEntry"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
