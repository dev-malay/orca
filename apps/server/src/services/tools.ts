import { db } from '../db'
import type { Tool, ToolCall } from '@repo/shared'

export interface ToolRow {
  id: string
  name: string
  description: string | null
  command: string
  args: string | null
  created_at: number
  updated_at: number
}

export function toTool(row: ToolRow): Tool {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    command: row.command,
    args: row.args ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export function listTools(): Tool[] {
  return (db.query('SELECT * FROM tools ORDER BY created_at DESC').all() as ToolRow[]).map(toTool)
}

export function getTool(id: string): Tool | null {
  const row = db.query('SELECT * FROM tools WHERE id = ?').get(id) as ToolRow | null
  return row ? toTool(row) : null
}

export function createTool(name: string, command: string, description?: string, args?: string): Tool {
  const id = crypto.randomUUID()
  const now = Date.now()
  db.run('INSERT INTO tools (id, name, description, command, args, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)', [
    id,
    name,
    description ?? '',
    command,
    args ?? '',
    now,
    now
  ])
  return { id, name, description: description ?? '', command, args: args ?? '', createdAt: now, updatedAt: now }
}

export function updateTool(id: string, input: { name?: string; description?: string; command?: string; args?: string }): Tool | null {
  const existing = getTool(id)
  if (!existing) return null
  const name = input.name ?? existing.name
  const description = input.description ?? existing.description ?? ''
  const command = input.command ?? existing.command
  const args = input.args ?? existing.args ?? ''
  db.run('UPDATE tools SET name = ?, description = ?, command = ?, args = ?, updated_at = ? WHERE id = ?', [
    name,
    description,
    command,
    args,
    Date.now(),
    id
  ])
  return getTool(id)
}

export function deleteTool(id: string): boolean {
  return db.run('DELETE FROM tools WHERE id = ?', [id]).changes > 0
}

export interface ToolCallRow {
  id: string
  tool_id: string
  arguments: string
  status: string
  result: string | null
  error: string | null
  created_at: number
  updated_at: number
}

export function toToolCall(row: ToolCallRow): ToolCall {
  return {
    id: row.id,
    toolId: row.tool_id,
    arguments: row.arguments,
    status: row.status as 'pending' | 'approved' | 'denied' | 'executed' | 'failed',
    result: row.result ?? undefined,
    error: row.error ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export function listToolCalls(): ToolCall[] {
  return (db.query('SELECT * FROM tool_calls ORDER BY created_at DESC').all() as ToolCallRow[]).map(toToolCall)
}

export function getToolCall(id: string): ToolCall | null {
  const row = db.query('SELECT * FROM tool_calls WHERE id = ?').get(id) as ToolCallRow | null
  return row ? toToolCall(row) : null
}

export function createToolCall(toolId: string, argumentsValue: string): ToolCall {
  const id = crypto.randomUUID()
  const now = Date.now()
  db.run('INSERT INTO tool_calls (id, tool_id, arguments, status, result, error, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [
    id,
    toolId,
    argumentsValue,
    'pending',
    null,
    null,
    now,
    now
  ])
  return { id, toolId, arguments: argumentsValue, status: 'pending', createdAt: now, updatedAt: now }
}

export function updateToolCallStatus(id: string, status: ToolCall['status'], result?: string, error?: string): ToolCall | null {
  const existing = getToolCall(id)
  if (!existing) return null
  db.run('UPDATE tool_calls SET status = ?, result = ?, error = ?, updated_at = ? WHERE id = ?', [
    status,
    result ?? null,
    error ?? null,
    Date.now(),
    id
  ])
  return getToolCall(id)
}
