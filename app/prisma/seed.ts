import "dotenv/config";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

type CsvRow = {
  lectureNumber: number;
  lectureTitle: string;
  semesterOrder: number;
  subsectionNumber: number | null;
  subsectionName: string | null;
  numberOfExercises: number;
};

type SubsectionSeed = {
  subsectionOrder: number;
  name: string;
  numberOfExercises: number;
};

type LectureSeed = {
  lectureNumber: number;
  name: string;
  numberOfExercises: number;
  subsections: SubsectionSeed[];
};

if (!process.env.DATABASE_URL || process.env.DATABASE_URL.trim() === "") {
  throw new Error("DATABASE_URL is not set. Prisma seed requires a valid database URL.");
}

const adapter = new PrismaPg(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      const nextChar = line[i + 1];
      if (inQuotes && nextChar === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current.trim());
  return result;
}

function parseOptionalInt(value: string | undefined): number | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseRequiredInt(value: string | undefined, fieldName: string, lineNumber: number): number {
  const parsed = parseOptionalInt(value);
  if (parsed === null) {
    throw new Error(`Invalid ${fieldName} at CSV line ${lineNumber}`);
  }
  return parsed;
}

function parseRows(csvContent: string): CsvRow[] {
  const lines = csvContent
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim() !== "");

  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map(normalizeHeader);

  const findIndex = (headerName: string): number => headers.findIndex((h) => h === headerName);

  const lectureNumberIndex = findIndex("lecture number");
  const lectureTitleIndex = findIndex("lecture title");
  const semesterIndex = findIndex("semester");
  const subsectionNumberIndex = findIndex("subsection number");
  const subsectionNameIndex = findIndex("subsection");
  const numberOfExercisesIndex = findIndex("number of exercises");

  if (
    lectureNumberIndex === -1 ||
    lectureTitleIndex === -1 ||
    semesterIndex === -1 ||
    subsectionNumberIndex === -1 ||
    subsectionNameIndex === -1 ||
    numberOfExercisesIndex === -1
  ) {
    throw new Error("CSV headers do not match expected schema.");
  }

  const rows: CsvRow[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const columns = parseCsvLine(lines[i]);
    const lineNumber = i + 1;

    const lectureNumber = parseRequiredInt(columns[lectureNumberIndex], "lecture number", lineNumber);
    const lectureTitle = (columns[lectureTitleIndex] ?? "").trim();
    const semesterOrder = parseRequiredInt(columns[semesterIndex], "semester", lineNumber);
    const subsectionNumber = parseOptionalInt(columns[subsectionNumberIndex]);
    const subsectionNameRaw = (columns[subsectionNameIndex] ?? "").trim();
    const subsectionName = subsectionNameRaw.length > 0 ? subsectionNameRaw : null;
    const numberOfExercises = parseRequiredInt(columns[numberOfExercisesIndex], "number of exercises", lineNumber);

    rows.push({
      lectureNumber,
      lectureTitle,
      semesterOrder,
      subsectionNumber,
      subsectionName,
      numberOfExercises,
    });
  }

  return rows;
}

function groupCurriculum(rows: CsvRow[]): Map<number, Map<number, LectureSeed>> {
  const bySemester = new Map<number, Map<number, LectureSeed>>();

  for (const row of rows) {
    if (!bySemester.has(row.semesterOrder)) {
      bySemester.set(row.semesterOrder, new Map<number, LectureSeed>());
    }

    const lectures = bySemester.get(row.semesterOrder)!;

    if (!lectures.has(row.lectureNumber)) {
      lectures.set(row.lectureNumber, {
        lectureNumber: row.lectureNumber,
        name: row.lectureTitle || `Lecture ${row.lectureNumber}`,
        numberOfExercises: row.numberOfExercises,
        subsections: [],
      });
    }

    const lecture = lectures.get(row.lectureNumber)!;

    if (lecture.name.trim() === "" && row.lectureTitle.trim() !== "") {
      lecture.name = row.lectureTitle.trim();
    }

    if (row.subsectionNumber !== null || row.subsectionName) {
      lecture.subsections.push({
        subsectionOrder: row.subsectionNumber ?? lecture.subsections.length + 1,
        name: row.subsectionName ?? `Subsection ${row.subsectionNumber ?? lecture.subsections.length + 1}`,
        numberOfExercises: row.numberOfExercises,
      });

      // Ensure lecture-level count is at least the total subsection-defined exercises.
      const subsectionTotal = lecture.subsections.reduce((sum, s) => sum + s.numberOfExercises, 0);
      if (subsectionTotal > lecture.numberOfExercises) {
        lecture.numberOfExercises = subsectionTotal;
      }
    }
  }

  return bySemester;
}

async function seed(): Promise<void> {
  const csvPath = resolve(process.cwd(), "..", "db-seed", "Zad_Arabic_exercises_db.csv");
  const csvContent = readFileSync(csvPath, "utf8");
  const rows = parseRows(csvContent);
  const grouped = groupCurriculum(rows);

  await prisma.reviewLog.deleteMany();
  await prisma.exerciseSchedule.deleteMany();
  await prisma.exercise.deleteMany();
  await prisma.subsection.deleteMany();
  await prisma.lecture.deleteMany();
  await prisma.semester.deleteMany();

  const semesterOrders = Array.from(grouped.keys()).sort((a, b) => a - b);

  for (const semesterOrder of semesterOrders) {
    const semester = await prisma.semester.create({
      data: {
        order: semesterOrder,
        code: `S${semesterOrder}`,
      },
    });

    const lectureMap = grouped.get(semesterOrder)!;
    const lectureNumbers = Array.from(lectureMap.keys()).sort((a, b) => a - b);

    for (const lectureNumber of lectureNumbers) {
      const lectureSeed = lectureMap.get(lectureNumber)!;

      const lecture = await prisma.lecture.create({
        data: {
          semesterId: semester.id,
          lectureNumber: lectureSeed.lectureNumber,
          name: lectureSeed.name || `Lecture ${lectureSeed.lectureNumber}`,
          numberOfExercises: lectureSeed.numberOfExercises,
        },
      });

      let subsectionAllocations: Array<{ subsectionId: number; start: number; end: number }> = [];

      if (lectureSeed.subsections.length > 0) {
        const orderedSubsections = [...lectureSeed.subsections].sort(
          (a, b) => a.subsectionOrder - b.subsectionOrder
        );

        let cursor = 1;
        for (const subsectionSeed of orderedSubsections) {
          const subsection = await prisma.subsection.create({
            data: {
              lectureId: lecture.id,
              name: subsectionSeed.name,
              subsectionOrder: subsectionSeed.subsectionOrder,
            },
          });

          const start = cursor;
          const end = Math.min(
            lectureSeed.numberOfExercises,
            cursor + subsectionSeed.numberOfExercises - 1
          );
          subsectionAllocations.push({ subsectionId: subsection.id, start, end });
          cursor = end + 1;
          if (cursor > lectureSeed.numberOfExercises) break;
        }
      }

      for (let exerciseNumber = 1; exerciseNumber <= lectureSeed.numberOfExercises; exerciseNumber += 1) {
        const owningSubsection = subsectionAllocations.find(
          (range) => exerciseNumber >= range.start && exerciseNumber <= range.end
        );

        await prisma.exercise.create({
          data: {
            lectureId: lecture.id,
            subsectionId: owningSubsection?.subsectionId ?? null,
            exerciseNumber,
          },
        });
      }
    }
  }
}

seed()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Arabic curriculum seeded successfully.");
  })
  .catch(async (error) => {
    await prisma.$disconnect();
    console.error("Seeding failed:", error);
    process.exit(1);
  });
