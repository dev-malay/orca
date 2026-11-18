import { Database } from 'bun:sqlite'
import { mkdirSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const dataDir = process.env.ORCA_CHAT_DATA_DIR ?? join(import.meta.dir, '..', 'data')
mkdirSync(dataDir, { recursive: true })

export const chatDb = new Database(join(dataDir, 'chat.db'))

chatDb.run('PRAGMA journal_mode = WAL')
chatDb.run('PRAGMA foreign_keys = ON')


chatDb.run(
  'CREATE TABLE IF NOT EXISTS chat_migrations (name TEXT PRIMARY KEY, applied_at INTEGER NOT NULL)',
)

const migrationsDir = join(import.meta.dir, 'migrations', 'chat')
const applied = new Set(
  (chatDb.query('SELECT name FROM chat_migrations').all() as { name: string }[]).map(
    (row) => row.name)
)

for (const file of readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort()) {
  if (applied.has(file)) continue
  const sql = readFileSync(join(migrationsDir, file), 'utf8')
  chatDb.transaction(() => {
    chatDb.run(sql)
    chatDb.query('INSERT INTO chat_migrations (name, applied_at) VALUES (?, ?)').run(file, Date.now())
  })()
  console.log('[chat-db] applied migration: ' + file)
}
