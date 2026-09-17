-- Persist each live Socket.IO connection so presence works across app instances and tabs.
CREATE TABLE IF NOT EXISTS "MessagingPresenceSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "socketId" TEXT NOT NULL,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MessagingPresenceSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MessagingPresenceSession_socketId_key"
    ON "MessagingPresenceSession"("socketId");
CREATE INDEX IF NOT EXISTS "MessagingPresenceSession_userId_idx"
    ON "MessagingPresenceSession"("userId");
CREATE INDEX IF NOT EXISTS "MessagingPresenceSession_updatedAt_idx"
    ON "MessagingPresenceSession"("updatedAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'MessagingPresenceSession_userId_fkey'
  ) THEN
    ALTER TABLE "MessagingPresenceSession"
      ADD CONSTRAINT "MessagingPresenceSession_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
