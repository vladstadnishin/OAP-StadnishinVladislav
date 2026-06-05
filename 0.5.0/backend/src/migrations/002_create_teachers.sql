-- Teacher directory used by /api/teachers and synchronized from names.teacher.
CREATE TABLE IF NOT EXISTS teachers (
  id TEXT PRIMARY KEY,
  fullName TEXT NOT NULL CHECK (length(trim(fullName)) BETWEEN 2 AND 80 AND fullName NOT GLOB '*[0-9]*'),
  createdAt TEXT NOT NULL
);

-- Helpful for teacher filtering by full name and sorting by creation date.
CREATE INDEX IF NOT EXISTS idx_teachers_full_name_created_at ON teachers(fullName, createdAt DESC);
