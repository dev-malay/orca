import { db } from '../db'
import type { Sandbox } from '@repo/shared'

export interface SandboxRow {
  id: string
  name: string
  status: string
  created_at: number
  updated_at: number
}

export function toSandbox(row: SandboxRow): Sandbox {
  return {
    id: row.id,
    name: row.name,
    status: row.status as 'created' | 'running' | 'stopped' | 'destroyed',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export function listSandboxes(): Sandbox[] {
  return (db.query('SELECT * FROM sandboxes ORDER BY created_at DESC').all() as SandboxRow[]).map(toSandbox)
}

export function getSandbox(id: string): Sandbox | null {
  const row = db.query('SELECT * FROM sandboxes WHERE id = ?').get(id) as SandboxRow | null
  return row ? toSandbox(row) : null
}

export function createSandbox(name: string): Sandbox {
  const id = crypto.randomUUID()
  const now = Date.now()
  db.run('INSERT INTO sandboxes (id, name, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)', [
    id,
    name,
    'created',
    now,
    now
  ])
  return { id, name, status: 'created', createdAt: now, updatedAt: now }
}

export function startSandbox(id: string): Sandbox | null {
  const existing = getSandbox(id)
  if (!existing) return null
  if (existing.status === 'destroyed') return null
  db.run('UPDATE sandboxes SET status = ?, updated_at = ? WHERE id = ?', ['running', Date.now(), id])
  return getSandbox(id)
}

export function stopSandbox(id: string): Sandbox | null {
  const existing = getSandbox(id)
  if (!existing) return null
  if (existing.status === 'destroyed') return null
  db.run('UPDATE sandboxes SET status = ?, updated_at = ? WHERE id = ?', ['stopped', Date.now(), id])
  return getSandbox(id)
}

export function deleteSandbox(id: string): boolean {
  return db.run('DELETE FROM sandboxes WHERE id = ?', [id]).changes > 0
}
