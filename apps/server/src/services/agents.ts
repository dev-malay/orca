import { db } from '../db'
import type { Agent } from '@repo/shared'

export interface AgentRow {
  id: string
  name: string
  instructions: string
  created_at: number
  updated_at: number
}

export function toAgent(row: AgentRow): Agent {
  return {
    id: row.id,
    name: row.name,
    instructions: row.instructions,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export function listAgents(): Agent[] {
  return (db.query('SELECT * FROM agents ORDER BY updated_at DESC').all() as AgentRow[]).map(toAgent)
}

export function getAgent(id: string): Agent | null {
  const row = db.query('SELECT * FROM agents WHERE id = ?').get(id) as AgentRow | null
  return row ? toAgent(row) : null
}

export function createAgent(name: string, instructions: string): Agent {
  const id = crypto.randomUUID()
  const now = Date.now()
  db.run('INSERT INTO agents (id, name, instructions, created_at, updated_at) VALUES (?, ?, ?, ?, ?)', [
    id,
    name,
    instructions,
    now,
    now,
  ])
  return { id, name, instructions, createdAt: now, updatedAt: now }
}

export function updateAgent(id: string, input: { name?: string; instructions?: string }): Agent | null {
  const existing = getAgent(id)
  if (!existing) return null
  const name = input.name ?? existing.name
  const instructions = input.instructions ?? existing.instructions
  db.run('UPDATE agents SET name = ?, instructions = ?, updated_at = ? WHERE id = ?', [
    name,
    instructions,
    Date.now(),
    id,
  ])
  return getAgent(id)
}

export function deleteAgent(id: string): boolean {
  return db.run('DELETE FROM agents WHERE id = ?', [id]).changes > 0
}
