-- CreateEnum
CREATE TYPE "EvaluationGrade" AS ENUM ('AGAIN', 'HARD', 'GOOD', 'EASY');

-- CreateTable
CREATE TABLE "Semester" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Semester_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lecture" (
    "id" SERIAL NOT NULL,
    "semesterId" INTEGER NOT NULL,
    "lectureNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "numberOfExercises" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lecture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subsection" (
    "id" SERIAL NOT NULL,
    "lectureId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "subsectionOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subsection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exercise" (
    "id" SERIAL NOT NULL,
    "lectureId" INTEGER NOT NULL,
    "subsectionId" INTEGER,
    "exerciseNumber" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseSchedule" (
    "id" SERIAL NOT NULL,
    "exerciseId" INTEGER NOT NULL,
    "lastReviewedAt" TIMESTAMP(3),
    "lastGrade" "EvaluationGrade",
    "nextReviewAt" TIMESTAMP(3) NOT NULL,
    "intervalDays" INTEGER NOT NULL DEFAULT 1,
    "repetition" INTEGER NOT NULL DEFAULT 0,
    "easeFactor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExerciseSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewLog" (
    "id" SERIAL NOT NULL,
    "exerciseId" INTEGER NOT NULL,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grade" "EvaluationGrade" NOT NULL,

    CONSTRAINT "ReviewLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Semester_code_key" ON "Semester"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Semester_order_key" ON "Semester"("order");

-- CreateIndex
CREATE INDEX "Lecture_semesterId_idx" ON "Lecture"("semesterId");

-- CreateIndex
CREATE UNIQUE INDEX "Lecture_semesterId_lectureNumber_key" ON "Lecture"("semesterId", "lectureNumber");

-- CreateIndex
CREATE INDEX "Subsection_lectureId_idx" ON "Subsection"("lectureId");

-- CreateIndex
CREATE UNIQUE INDEX "Subsection_lectureId_subsectionOrder_key" ON "Subsection"("lectureId", "subsectionOrder");

-- CreateIndex
CREATE INDEX "Exercise_lectureId_idx" ON "Exercise"("lectureId");

-- CreateIndex
CREATE INDEX "Exercise_subsectionId_idx" ON "Exercise"("subsectionId");

-- CreateIndex
CREATE UNIQUE INDEX "Exercise_lectureId_exerciseNumber_key" ON "Exercise"("lectureId", "exerciseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ExerciseSchedule_exerciseId_key" ON "ExerciseSchedule"("exerciseId");

-- CreateIndex
CREATE INDEX "ExerciseSchedule_nextReviewAt_idx" ON "ExerciseSchedule"("nextReviewAt");

-- CreateIndex
CREATE INDEX "ReviewLog_exerciseId_reviewedAt_idx" ON "ReviewLog"("exerciseId", "reviewedAt");

-- AddForeignKey
ALTER TABLE "Lecture" ADD CONSTRAINT "Lecture_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subsection" ADD CONSTRAINT "Subsection_lectureId_fkey" FOREIGN KEY ("lectureId") REFERENCES "Lecture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_lectureId_fkey" FOREIGN KEY ("lectureId") REFERENCES "Lecture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_subsectionId_fkey" FOREIGN KEY ("subsectionId") REFERENCES "Subsection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseSchedule" ADD CONSTRAINT "ExerciseSchedule_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewLog" ADD CONSTRAINT "ReviewLog_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;
