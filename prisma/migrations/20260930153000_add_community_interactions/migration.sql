ALTER TABLE "CommunityPost"
  ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'General',
  ADD COLUMN IF NOT EXISTS "tags" JSONB,
  ADD COLUMN IF NOT EXISTS "viewCount" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "CommunityPostVote" (
  "id" TEXT NOT NULL,
  "value" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "userId" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  CONSTRAINT "CommunityPostVote_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CommunityPostVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CommunityPostVote_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPost"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "CommunityPostVote_userId_postId_key" ON "CommunityPostVote"("userId", "postId");
CREATE INDEX IF NOT EXISTS "CommunityPostVote_postId_value_idx" ON "CommunityPostVote"("postId", "value");

CREATE TABLE IF NOT EXISTS "CommunityCommentVote" (
  "id" TEXT NOT NULL,
  "value" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "userId" TEXT NOT NULL,
  "commentId" TEXT NOT NULL,
  CONSTRAINT "CommunityCommentVote_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CommunityCommentVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CommunityCommentVote_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "CommunityComment"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "CommunityCommentVote_userId_commentId_key" ON "CommunityCommentVote"("userId", "commentId");
CREATE INDEX IF NOT EXISTS "CommunityCommentVote_commentId_value_idx" ON "CommunityCommentVote"("commentId", "value");

CREATE TABLE IF NOT EXISTS "CommunityFollow" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "followerId" TEXT NOT NULL,
  "followedId" TEXT NOT NULL,
  CONSTRAINT "CommunityFollow_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CommunityFollow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CommunityFollow_followedId_fkey" FOREIGN KEY ("followedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "CommunityFollow_followerId_followedId_key" ON "CommunityFollow"("followerId", "followedId");
CREATE INDEX IF NOT EXISTS "CommunityFollow_followedId_idx" ON "CommunityFollow"("followedId");

CREATE TABLE IF NOT EXISTS "CommunityPostSave" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  CONSTRAINT "CommunityPostSave_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CommunityPostSave_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CommunityPostSave_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPost"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "CommunityPostSave_userId_postId_key" ON "CommunityPostSave"("userId", "postId");
CREATE INDEX IF NOT EXISTS "CommunityPostSave_postId_idx" ON "CommunityPostSave"("postId");