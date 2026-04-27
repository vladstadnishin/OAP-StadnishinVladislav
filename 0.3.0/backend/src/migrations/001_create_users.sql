-- Base table required by the lab: one users table plus domain tables.
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  fullName TEXT NOT NULL CHECK (length(trim(fullName)) BETWEEN 2 AND 80 AND fullName NOT GLOB '*[0-9]*'),
  email TEXT NOT NULL UNIQUE CHECK (length(trim(email)) BETWEEN 5 AND 120),
  createdAt TEXT NOT NULL
);
