import { db } from '../db'
import { getToolCall } from './tools'
import type { ToolCall } from '@repo/shared'

export interface ApprovalRow {
  id: string
  tool_call_id: string
  approved: number
  created_at: number
}

export function toApproval(row: ApprovalRow) {
  return {
    id: row.id,
    toolCallId: row.tool_call_id,
    approved: row.approved === 1,
    createdAt: row.created_at
  }
}

export function getApproval(toolCallId: string): ApprovalRow | null {
  return db.query('SELECT * FROM approvals WHERE tool_call_id = ?').get(toolCallId) as ApprovalRow | null
}

export function approveToolCall(id: string): ToolCall | null {
  const existing = getToolCall(id)
  if (!existing) return null
  if (existing.status !== 'pending') return null
  const approvalId = crypto.randomUUID()
  const now = Date.now()
  db.transaction(() => {
    db.run('INSERT INTO approvals (id, tool_call_id, approved, created_at) VALUES (?, ?, ?, ?)', [
      approvalId,
      id,
      1,
      now
    ])
    db.run('UPDATE tool_calls SET status = ?, updated_at = ? WHERE id = ?', ['approved', now, id])
  })()
  return getToolCall(id)
}

export function denyToolCall(id: string): ToolCall | null {
  const existing = getToolCall(id)
  if (!existing) return null
  if (existing.status !== 'pending') return null
  const approvalId = crypto.randomUUID()
  const now = Date.now()
  db.transaction(() => {
    db.run('INSERT INTO approvals (id, tool_call_id, approved, created_at) VALUES (?, ?, ?, ?)', [
      approvalId,
      id,
      0,
      now
    ])
    db.run('UPDATE tool_calls SET status = ?, updated_at = ? WHERE id = ?', ['denied', now, id])
  })()
  return getToolCall(id)
}
