import fs from "node:fs";
import path from "node:path";
import { all, exec, run } from "./db";
import { quoteSqlText } from "./sql";

interface MigrationRow {
  filename: string;
}

function getMigrationsDirectoryPath(): string {
  // Migrations live next to the backend source so schema changes are tracked in code.
  return path.join(__dirname, "..", "migrations");
}

export function migrate(): void {
  console.log("Starting DB migrations");

  // The migration journal lets us apply only new SQL files on each start.
  exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      appliedAt TEXT NOT NULL
    );
  `);

  const migrationsDirectoryPath = getMigrationsDirectoryPath();
  const migrationFiles = fs
    .readdirSync(migrationsDirectoryPath)
    .filter(fileName => /^\d+_.+\.sql$/.test(fileName))
    .sort();

  // Read the already-applied list before running anything else.
  const appliedRows = all<MigrationRow>(
    "SELECT filename FROM schema_migrations ORDER BY filename ASC;"
  );
  const appliedMigrations = new Set(appliedRows.map(row => row.filename));

  migrationFiles.forEach(fileName => {
    if (appliedMigrations.has(fileName)) {
      return;
    }

    // Each lab migration file contains one logical SQL step and is executed once.
    const migrationFilePath = path.join(migrationsDirectoryPath, fileName);
    const sql = fs.readFileSync(migrationFilePath, "utf8").trim();

    if (!sql) {
      return;
    }

    exec(sql);

    // We record the migration only after its SQL finished successfully.
    run(`
      INSERT INTO schema_migrations (filename, appliedAt)
      VALUES (${quoteSqlText(fileName)}, ${quoteSqlText(new Date().toISOString())});
    `);

    console.log(`Migration applied: ${fileName}`);
  });

  console.log("DB schema initialized");
}
