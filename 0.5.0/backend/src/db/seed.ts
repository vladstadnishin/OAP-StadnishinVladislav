import { get, run } from "./db";
import { migrate } from "./migrate";
import { quoteSqlText } from "./sql";

const seedUsers = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    fullName: "Ірина Бондар",
    email: "iryna.bondar@example.com",
    createdAt: "2026-04-10T09:00:00.000Z"
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    fullName: "Тарас Клименко",
    email: "taras.klymenko@example.com",
    createdAt: "2026-04-10T09:30:00.000Z"
  }
] as const;

const seedTeachers = [
  {
    id: "33333333-3333-4333-8333-333333333333",
    fullName: "Ольга Коваль",
    createdAt: "2026-04-10T10:00:00.000Z"
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    fullName: "Роман Мельник",
    createdAt: "2026-04-10T10:15:00.000Z"
  }
] as const;

const seedNames = [
  {
    id: "55555555-5555-4555-8555-555555555555",
    userId: seedUsers[0].id,
    title: "Алгоритмізація",
    teacher: seedTeachers[0].fullName,
    course: "2",
    priority: "Високий",
    note: "Підготуйтеся до тесту.",
    createdAt: "2026-04-11T08:00:00.000Z"
  },
  {
    id: "66666666-6666-4666-8666-666666666666",
    userId: seedUsers[0].id,
    title: "Бази даних",
    teacher: seedTeachers[1].fullName,
    course: "3",
    priority: "Середній",
    note: "Повторіть тему про об'єднання та індекси.",
    createdAt: "2026-04-12T08:00:00.000Z"
  },
  {
    id: "77777777-7777-4777-8777-777777777777",
    userId: seedUsers[1].id,
    title: "Дискретна математика",
    teacher: seedTeachers[1].fullName,
    course: "1",
    priority: "Низький",
    note: "Здайте домашню роботу.",
    createdAt: "2026-04-13T08:00:00.000Z"
  }
] as const;

const seedNotes = [
  {
    id: seedNames[0].id,
    userId: seedNames[0].userId,
    content: seedNames[0].note,
    createdAt: seedNames[0].createdAt
  },
  {
    id: seedNames[1].id,
    userId: seedNames[1].userId,
    content: seedNames[1].note,
    createdAt: seedNames[1].createdAt
  },
  {
    id: seedNames[2].id,
    userId: seedNames[2].userId,
    content: seedNames[2].note,
    createdAt: seedNames[2].createdAt
  }
] as const;

interface CountRow {
  total: number;
}

function insertUser(user: (typeof seedUsers)[number]): void {
  // Seed data gives us 5-20 demo rows for manual testing, as recommended in the lab.
  run(`
    INSERT INTO users (id, fullName, email, createdAt)
    VALUES (
      ${quoteSqlText(user.id)},
      ${quoteSqlText(user.fullName)},
      ${quoteSqlText(user.email)},
      ${quoteSqlText(user.createdAt)}
    );
  `);
}

function insertTeacher(teacher: (typeof seedTeachers)[number]): void {
  run(`
    INSERT INTO teachers (id, fullName, createdAt)
    VALUES (
      ${quoteSqlText(teacher.id)},
      ${quoteSqlText(teacher.fullName)},
      ${quoteSqlText(teacher.createdAt)}
    );
  `);
}

function insertName(name: (typeof seedNames)[number]): void {
  run(`
    INSERT INTO names (id, userId, title, teacher, course, priority, note, createdAt)
    VALUES (
      ${quoteSqlText(name.id)},
      ${quoteSqlText(name.userId)},
      ${quoteSqlText(name.title)},
      ${quoteSqlText(name.teacher)},
      ${quoteSqlText(name.course)},
      ${quoteSqlText(name.priority)},
      ${quoteSqlText(name.note)},
      ${quoteSqlText(name.createdAt)}
    );
  `);
}

function insertNote(note: (typeof seedNotes)[number]): void {
  run(`
    INSERT INTO notes (id, userId, content, createdAt)
    VALUES (
      ${quoteSqlText(note.id)},
      ${quoteSqlText(note.userId)},
      ${quoteSqlText(note.content)},
      ${quoteSqlText(note.createdAt)}
    );
  `);
}

export function seedDatabase(): void {
  // We keep seed idempotent enough for local use: if users already exist, skip it.
  const existingUsersCount =
    get<CountRow>("SELECT COUNT(*) as total FROM users;")?.total ?? 0;

  if (existingUsersCount > 0) {
    console.log("Seed skipped: users table already contains data");
    return;
  }

  console.log("Seeding SQLite database");

  seedUsers.forEach(insertUser);
  seedTeachers.forEach(insertTeacher);
  seedNames.forEach(insertName);
  seedNotes.forEach(insertNote);

  console.log("Seed data inserted");
}

function bootstrapSeed(): void {
  // The seed script can be run independently, so it also ensures the schema exists first.
  migrate();
  seedDatabase();
}

if (require.main === module) {
  try {
    bootstrapSeed();
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
}
