CREATE TYPE "ConnectionRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

CREATE TABLE "ConnectionRequest" (
  "id" TEXT NOT NULL,
  "status" "ConnectionRequestStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "requesterId" TEXT NOT NULL,
  "recipientId" TEXT NOT NULL,
  CONSTRAINT "ConnectionRequest_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ConnectionRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ConnectionRequest_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ConnectionRequest_requesterId_recipientId_key" ON "ConnectionRequest"("requesterId", "recipientId");
CREATE INDEX "ConnectionRequest_recipientId_status_idx" ON "ConnectionRequest"("recipientId", "status");
CREATE INDEX "ConnectionRequest_requesterId_status_idx" ON "ConnectionRequest"("requesterId", "status");