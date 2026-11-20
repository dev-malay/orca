import { chatDb } from '../db-chat'
import type { Message } from '@repo/shared'

export interface MessageRow {
  id: string
  thread_id: string
  role: string
  content: string
  created_at: number
}

export function toMessage(row: MessageRow): Message {
  return {
    id: row.id,
    threadId: row.thread_id,
    role: row.role as 'user' | 'assistant' | 'system',
    content: row.content,
    createdAt: row.created_at
  }
}

export function listMessages(threadId: string): Message[] {
  return (
    chatDb.query('SELECT * FROM messages WHERE thread_id = ? ORDER BY created_at ASC').all(threadId) as MessageRow[]
  ).map(toMessage)
}

export function createMessage(threadId: string, role: 'user' | 'assistant' | 'system', content: string): Message {
  const id = crypto.randomUUID()
  const now = Date.now()
  chatDb.run(
    'INSERT INTO messages (id, thread_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)', [id, threadId, role, content, now])
  return { id, threadId, role, content, createdAt: now }
}
