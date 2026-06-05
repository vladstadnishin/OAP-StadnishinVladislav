-- Main entity used by the frontend; linked to users through a 1:N foreign key.
CREATE TABLE IF NOT EXISTS names (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  title TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 2 AND 80 AND title NOT GLOB '*[0-9]*'),
  teacher TEXT NOT NULL CHECK (length(trim(teacher)) BETWEEN 2 AND 80 AND teacher NOT GLOB '*[0-9]*'),
  course TEXT NOT NULL CHECK (course IN ('1', '2', '3', '4', '5', '6')),
  priority TEXT NOT NULL CHECK (priority IN ('Низький', 'Середній', 'Високий')),
  note TEXT NOT NULL CHECK (length(trim(note)) BETWEEN 3 AND 200),
  createdAt TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
-- Speeds up filtered list requests by user with sorting by creation date.
CREATE INDEX IF NOT EXISTS idx_names_user_created_at ON names(userId, createdAt DESC);
-- Speeds up the WHERE + ORDER BY + LIMIT pattern required in the lab.
CREATE INDEX IF NOT EXISTS idx_names_priority_created_at ON names(priority, createdAt DESC);
