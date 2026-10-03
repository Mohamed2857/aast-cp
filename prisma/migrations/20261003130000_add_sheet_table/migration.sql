-- CreateTable
CREATE TABLE "Sheet" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "level" INTEGER,
    "url" TEXT NOT NULL,
    "groupCode" TEXT,
    "contestId" INTEGER NOT NULL,
    "problems" JSONB NOT NULL,
    "challengeIndices" TEXT[],
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sheet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Sheet_contestId_key" ON "Sheet"("contestId");

-- CreateIndex
CREATE INDEX "Sheet_createdAt_idx" ON "Sheet"("createdAt");
