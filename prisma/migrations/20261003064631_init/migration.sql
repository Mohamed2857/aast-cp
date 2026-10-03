-- CreateEnum
CREATE TYPE "Role" AS ENUM ('TRAINEE', 'INSTRUCTOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "XpEventType" AS ENUM ('SESSION_ATTENDANCE', 'CAMP_ATTENDANCE', 'SESSION_ACTIVE', 'SHEET_PROBLEM', 'SHEET_CHALLENGE', 'SHEET_COMPLETE', 'CONTEST_PARTICIPATION', 'CONTEST_SOLVE', 'CONTEST_UPSOLVE', 'CONTEST_FIRST_SOLVE', 'CONTEST_PLACE_1', 'CONTEST_PLACE_2', 'CONTEST_PLACE_3', 'DAILY_PUZZLE', 'MATERIAL_CHECKIN', 'MANUAL_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "SubmissionKind" AS ENUM ('SHEET', 'CONTEST', 'UPSOLVE');

-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('SESSION', 'CAMP');

-- CreateEnum
CREATE TYPE "PuzzleType" AS ENUM ('BUG_HUNT', 'TIME_COMPLEXITY', 'CODE_TRACING', 'ALGORITHM_RIDDLE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'TRAINEE',
    "level" INTEGER,
    "cfHandle" TEXT,
    "cfAvatar" TEXT,
    "cfRank" TEXT,
    "cfRating" INTEGER,
    "totalXp" INTEGER NOT NULL DEFAULT 0,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifyCode" TEXT,
    "verifyCodeExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "XpTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" "XpEventType" NOT NULL,
    "eventKey" TEXT NOT NULL,
    "reason" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "XpTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cfSubmissionId" BIGINT NOT NULL,
    "contestId" INTEGER NOT NULL,
    "problemIndex" TEXT NOT NULL,
    "verdict" TEXT NOT NULL,
    "kind" "SubmissionKind" NOT NULL,
    "createdAtCf" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "SessionType" NOT NULL DEFAULT 'SESSION',
    "level" INTEGER,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "present" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyPuzzle" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "type" "PuzzleType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "correctIndex" INTEGER NOT NULL,
    "explanation" TEXT,
    "xp" INTEGER NOT NULL DEFAULT 10,

    CONSTRAINT "DailyPuzzle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PuzzleSolve" (
    "id" TEXT NOT NULL,
    "puzzleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PuzzleSolve_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "week" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "slidesUrl" TEXT,
    "recordingUrl" TEXT,
    "tips" TEXT,
    "checkQuestion" TEXT NOT NULL,
    "checkOptions" JSONB NOT NULL,
    "checkCorrectIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialCompletion" (
    "id" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaterialCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_cfHandle_key" ON "User"("cfHandle");

-- CreateIndex
CREATE INDEX "User_totalXp_idx" ON "User"("totalXp");

-- CreateIndex
CREATE INDEX "XpTransaction_userId_createdAt_idx" ON "XpTransaction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "XpTransaction_eventKey_idx" ON "XpTransaction"("eventKey");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_cfSubmissionId_key" ON "Submission"("cfSubmissionId");

-- CreateIndex
CREATE INDEX "Submission_userId_contestId_problemIndex_idx" ON "Submission"("userId", "contestId", "problemIndex");

-- CreateIndex
CREATE INDEX "Session_date_idx" ON "Session"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_sessionId_userId_key" ON "Attendance"("sessionId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyPuzzle_date_key" ON "DailyPuzzle"("date");

-- CreateIndex
CREATE UNIQUE INDEX "PuzzleSolve_puzzleId_userId_key" ON "PuzzleSolve"("puzzleId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Material_level_week_title_key" ON "Material"("level", "week", "title");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialCompletion_materialId_userId_key" ON "MaterialCompletion"("materialId", "userId");

-- AddForeignKey
ALTER TABLE "XpTransaction" ADD CONSTRAINT "XpTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "XpTransaction" ADD CONSTRAINT "XpTransaction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PuzzleSolve" ADD CONSTRAINT "PuzzleSolve_puzzleId_fkey" FOREIGN KEY ("puzzleId") REFERENCES "DailyPuzzle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PuzzleSolve" ADD CONSTRAINT "PuzzleSolve_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialCompletion" ADD CONSTRAINT "MaterialCompletion_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialCompletion" ADD CONSTRAINT "MaterialCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
