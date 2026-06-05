-- Notes mirror the comment text used in names.note and can also be listed separately.
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  content TEXT NOT NULL CHECK (length(trim(content)) BETWEEN 3 AND 200),
  createdAt TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Helpful for user-specific note browsing.
CREATE INDEX IF NOT EXISTS idx_notes_user_created_at ON notes(userId, createdAt DESC);
