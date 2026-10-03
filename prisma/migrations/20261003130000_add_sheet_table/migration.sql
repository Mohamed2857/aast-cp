-- CreateTable
CREATE TABLE "Sheet" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "level" INTEGER,
    "groupCode" TEXT,
    "contestId" INTEGER NOT NULL,
    "problems" JSONB NOT NULL,
    "challengeIndexes" TEXT[],
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sheet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Sheet_contestId_key" ON "Sheet"("contestId");
