CREATE TABLE executions (
  id TEXT PRIMARY KEY,
  sandbox_id TEXT NOT NULL REFERENCES sandboxes(id) ON DELETE CASCADE,
  command TEXT NOT NULL,
  stdout TEXT,
  stderr TEXT,
  exit_code INTEGER,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_executions_sandbox_id ON executions(sandbox_id);
