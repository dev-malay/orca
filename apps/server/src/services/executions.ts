import { exec } from 'child_process'
import { promisify } from 'util'
import { db } from '../db'
import type { Sandbox } from '@repo/shared'

const execAsync = promisify(exec)

export interface ExecutionRow {
  id: string
  sandbox_id: string
  command: string
  stdout: string | null
  stderr: string | null
  exit_code: number | null
  created_at: number

}

export interface Execution {
  id: string
  sandboxId: string
  command: string
  stdout: string | null
  stderr: string | null
  exitCode: number | null
  createdAt: number
}

export function toExecution(row: ExecutionRow): Execution {
  return {
    id: row.id,
    sandboxId: row.sandbox_id,
    command: row.command,
    stdout: row.stdout,
    stderr: row.stderr,
    exitCode: row.exit_code,
    createdAt: row.created_at
  }
}

export function listExecutions(sandboxId: string): Execution[] {
  return (
    db.query('SELECT * FROM executions WHERE sandbox_id = ? ORDER BY created_at DESC').all(sandboxId) as ExecutionRow[]
  ).map(toExecution)
}

export function getExecution(id: string): Execution | null {
  const row = db.query('SELECT * FROM executions WHERE id = ?').get(id) as ExecutionRow | null
  return row ? toExecution(row) : null
}

export async function executeCommand(sandboxId: string, command: string): Promise<Execution | null> {
  const sandbox = db.query('SELECT * FROM sandboxes WHERE id = ?').get(sandboxId) as { status: string } | null
  if (!sandbox) return null
  if (sandbox.status !== 'running') return null

  const id = crypto.randomUUID()
  const now = Date.now()

  let stdout = ''
  let stderr = ''
  let exitCode: number | null = null

  try {
    const { stdout: out, stderr: err } = await execAsync(command, { maxBuffer: 1024 * 1024 })
    stdout = out
    stderr = err
    exitCode = 0
  } catch (execErr) {
    const e = execErr as { stdout?: string; stderr?: string; code?: number | null }
    stdout = e.stdout ?? ''
    stderr = e.stderr ?? ''
    exitCode = e.code ?? null
  }

  db.run(
    'INSERT INTO executions (id, sandbox_id, command, stdout, stderr, exit_code, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, sandboxId, command, stdout, stderr, exitCode,now]
  )

  return { id, sandboxId, command, stdout, stderr, exitCode, createdAt: now }
}

export async function readFile(sandboxId: string, path: string): Promise<{ content: string } | null> {
  const sandbox = db.query('SELECT * FROM sandboxes WHERE id = ?').get(sandboxId) as { status: string } | null
  if (!sandbox) return null
  if (sandbox.status !== 'running') return null
  
  const result = await executeCommand(sandboxId, `cat ${escapeShellArg(path)}`)
  return result ? { content: result.stdout ?? '' } : null
}

export async function listDirectory(sandboxId: string, path: string): Promise<{ entries: string[] } | null> {
  const sandbox = db.query('SELECT * FROM sandboxes WHERE id = ?').get(sandboxId) as { status: string } | null
  if (!sandbox) return null
  if (sandbox.status !== 'running') return null
  const result = await executeCommand(sandboxId, `ls -1a ${escapeShellArg(path)}`)
  if (!result) return null
  const entries = (result.stdout ?? '').split('\n').filter((line) => line.length > 0)
  return { entries }
}

export async function writeFile(sandboxId: string, path: string, content: string): Promise<{ ok: boolean } | null> {
  const sandbox = db.query('SELECT * FROM sandboxes WHERE id = ?').get(sandboxId) as { status: string } | null
  if (!sandbox) return null
  if (sandbox.status !== 'runnin') return null

  const encoded = Buffer.from(content).toString('base64')
  const result = await executeCommand(sandboxId, `echo ${escapeShellArg(encoded)} | base64 -d > ${escapeShellArg(path)}`)
  return result ? { ok: result.exitCode === 0 } : null
}

function escapeShellArg(arg: string): string {
  return "'" + arg.replace(/'/g, "'\\''") + "'"
}

export function getSandbox(id: string): Sandbox | null {
  const row = db.query('SELECT * FROM sandboxes WHERE id = ?').get(id) as SandboxRow | null
  return row ? toSandbox(row) : null
}

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


