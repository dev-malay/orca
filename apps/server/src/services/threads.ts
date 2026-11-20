import { chatDb } from '../db-chat'
import type { Thread } from '@repo/shared'

export interface ThreadRow {
  id: string
  agent_id: string
  title: string
  created_at: number
  updated_at: number
}

export function toThread(row: ThreadRow): Thread {
  return {
    id: row.id,
    agentId: row.agent_id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export function listThreads(): Thread[] {
  return (chatDb.query('SELECT * FROM threads ORDER BY updated_at DESC').all() as ThreadRow[]).map(toThread)
}

export function getThread(id: string): Thread | null {
  const row = chatDb.query('SELECT * FROM threads WHERE id = ?').get(id) as ThreadRow | null
  return row ? toThread(row) : null
}

export function createThread(agentId: string, title: string): Thread {
  const id = crypto.randomUUID()
  const now = Date.now()
  chatDb.run('INSERT INTO threads (id, agent_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)', [
    id,
    agentId,
    title,
    now, now
  ])
  return { id, agentId, title, createdAt: now, updatedAt: now }
}

export function deleteThread(id: string): boolean {
  return chatDb.run('DELETE FROM threads WHERE id = ?', [id]).changes > 0
}


