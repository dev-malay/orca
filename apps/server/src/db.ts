import { Database } from 'bun:sqlite'
import { mkdirSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const dataDir = process.env.ORCA_DATA_DIR ?? join(import.meta.dir, '..', 'data')
mkdirSync(dataDir, { recursive: true })

export const db = new Database(join(dataDir, 'orca.db'))

db.run('PRAGMA journal_mode = WAL')
db.run('PRAGMA foreign_keys = ON')

db.run(
  'CREATE TABLE IF NOT EXISTS migrations (name TEXT PRIMARY KEY, applied_at INTEGER NOT NULL)',
)

const migrationsDir = join(import.meta.dir, 'migrations')
const applied = new Set(
  (db.query('SELECT name FROM migrations').all() as { name: string }[]).map((row) => row.name),
)

for (const file of readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort()) {
  if (applied.has(file)) continue
  const sql = readFileSync(join(migrationsDir, file), 'utf8')
  db.transaction(() => {
    db.run(sql)
    db.query('INSERT INTO migrations (name, applied_at) VALUES (?, ?)').run(file, Date.now())
  })()
  console.log(`[db] applied migration: ${file}`)
}
