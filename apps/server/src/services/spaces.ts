import { db } from '../db'
import type { Space } from '@repo/shared'

interface SpaceRow {
  id: string
  name: string
  created_at: number
  updated_at: number
}

function toSpace(row: SpaceRow): Space {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export function listSpaces(): Space[] {
  return (db.query('SELECT * FROM spaces ORDER BY updated_at DESC').all() as SpaceRow[]).map(toSpace)
}

export function getSpace(id: string): Space | null {
  const row = db.query('SELECT * FROM spaces WHERE id = ?').get(id) as SpaceRow | null
  return row ? toSpace(row) : null
}

export function createSpace(name: string): Space {
  const id = crypto.randomUUID()
  const now = Date.now()
  db.run('INSERT INTO spaces (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)',[id, name, now, now])
  return { id, name, createdAt: now, updatedAt: now }
}

export function renameSpace(id: string, name: string): Space | null {
  if (!getSpace(id)) return null
  db.run('UPDATE spaces SET name = ?, updated_at = ? WHERE id = ?', [name, Date.now(), id])
  return getSpace(id)
}


export function deleteSpace(id: string): boolean {
  return db.run('DELETE FROM spaces WHERE id = ?', [id]).changes > 0
}

