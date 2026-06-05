import fs from "node:fs";
import path from "node:path";
import BetterSqlite3 from "better-sqlite3";

type SQLiteDatabase = InstanceType<typeof BetterSqlite3>;
type SqlParam = string | number | bigint | Buffer | null;

interface RunResult {
  changes: number;
  lastInsertRowid: number | bigint;
}

let database: SQLiteDatabase | null = null;

function ensureDataDirectory(): string {
  // SQLite is stored as a local file inside backend/data, exactly as required by the lab.
  const dataDirectoryPath = path.join(process.cwd(), "data");

  if (!fs.existsSync(dataDirectoryPath)) {
    fs.mkdirSync(dataDirectoryPath, { recursive: true });
  }

  return dataDirectoryPath;
}

export function getDbPath(): string {
  return path.join(ensureDataDirectory(), "app.db");
}

function logSql(sql: string, params: SqlParam[] = []): void {
  //  SQL-код і значення параметрів розділені.
  if (process.env.NODE_ENV !== "production") {
    console.log(`[SQL] ${sql.trim()}`);

    if (params.length > 0) {
      console.log(`[SQL params] ${JSON.stringify(params)}`);
    }
  }
}

export function getDatabase(): SQLiteDatabase {
  if (!database) {
    const dbPath = getDbPath();

    database = new BetterSqlite3(dbPath);
    // SQLite can have foreign keys disabled by default, so we enable them explicitly.
    database.pragma("foreign_keys = ON");

    console.log(`SQLite DB opened: ${dbPath}`);
    console.log("SQLite foreign_keys pragma enabled");
  }

  return database;
}

export function all<T>(sql: string, params: SqlParam[] = []): T[] {
  // SELECT із параметрами не дає вводу користувача змінити структуру SQL-запиту.
  logSql(sql, params);
  return getDatabase().prepare(sql).all(...params) as T[];
}

export function get<T>(sql: string, params: SqlParam[] = []): T | undefined {
  // Один запис читаємо тим самим безпечним шляхом, що й списки.
  logSql(sql, params);
  return getDatabase().prepare(sql).get(...params) as T | undefined;
}

export function run(sql: string, params: SqlParam[] = []): RunResult {
  // INSERT / UPDATE / DELETE також можуть приймати параметри для захисту від SQLi.
  logSql(sql, params);

  const info = getDatabase().prepare(sql).run(...params);

  return {
    changes: info.changes,
    lastInsertRowid: info.lastInsertRowid
  };
}

export function exec(sql: string): void {
  // Used for migration files or schema creation statements that can contain DDL.
  logSql(sql);
  getDatabase().exec(sql);
}
