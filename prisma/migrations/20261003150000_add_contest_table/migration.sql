-- CreateTable
CREATE TABLE "Contest" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "level" INTEGER,
    "url" TEXT NOT NULL,
    "groupCode" TEXT,
    "contestId" INTEGER NOT NULL,
    "problems" JSONB NOT NULL,
    "startTime" TIMESTAMP(3),
    "phase" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Contest_contestId_key" ON "Contest"("contestId");

-- CreateIndex
CREATE INDEX "Contest_createdAt_idx" ON "Contest"("createdAt");
