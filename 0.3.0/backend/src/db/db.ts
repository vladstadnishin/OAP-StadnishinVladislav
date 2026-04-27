import fs from "node:fs";
import path from "node:path";
import BetterSqlite3 from "better-sqlite3";

type SQLiteDatabase = InstanceType<typeof BetterSqlite3>;

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

function logSql(sql: string): void {
  // Seeing the generated SQL is useful in development and when explaining the lab.
  if (process.env.NODE_ENV !== "production") {
    console.log(`[SQL] ${sql.trim()}`);
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

export function all<T>(sql: string): T[] {
  // Wrapper for SELECT queries that return multiple rows.
  logSql(sql);
  return getDatabase().prepare(sql).all() as T[];
}

export function get<T>(sql: string): T | undefined {
  // Wrapper for SELECT queries that return one row or undefined.
  logSql(sql);
  return getDatabase().prepare(sql).get() as T | undefined;
}

export function run(sql: string): RunResult {
  // Wrapper for INSERT / UPDATE / DELETE statements.
  logSql(sql);

  const info = getDatabase().prepare(sql).run();

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
