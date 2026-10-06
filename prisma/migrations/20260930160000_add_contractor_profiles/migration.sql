CREATE TABLE IF NOT EXISTS "ContractorProfile" (
  "id" TEXT NOT NULL,
  "businessName" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "services" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "location" TEXT,
  "contactEmail" TEXT,
  "website" TEXT,
  "certifications" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "teamSize" TEXT,
  "foundedYear" INTEGER,
  "isVerified" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "userId" TEXT NOT NULL,
  CONSTRAINT "ContractorProfile_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ContractorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "ContractorProfile_userId_key" ON "ContractorProfile"("userId");
CREATE INDEX IF NOT EXISTS "ContractorProfile_isVerified_createdAt_idx" ON "ContractorProfile"("isVerified", "createdAt");
CREATE INDEX IF NOT EXISTS "ContractorProfile_location_idx" ON "ContractorProfile"("location");

CREATE TABLE IF NOT EXISTS "ContractorReview" (
  "id" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "content" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "contractorId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  CONSTRAINT "ContractorReview_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ContractorReview_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "ContractorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ContractorReview_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "ContractorReview_contractorId_authorId_key" ON "ContractorReview"("contractorId", "authorId");
CREATE INDEX IF NOT EXISTS "ContractorReview_contractorId_createdAt_idx" ON "ContractorReview"("contractorId", "createdAt");