import { Hono } from 'hono'
import * as sandboxes from '../services/sandboxes'
import * as executions from '../services/executions'

export const sandboxesRoutes = new Hono()

sandboxesRoutes.get('/', (c) => c.json(sandboxes.listSandboxes()))

sandboxesRoutes.get('/:id', (c) => {
  const sandbox = sandboxes.getSandbox(c.req.param('id'))
  return sandbox ? c.json(sandbox) : c.json({ error: 'Sandbox not found.' }, 404)
})

sandboxesRoutes.post('/', async (c) => {
  const body = await c.req.json().catch(() => null)
  const name = body?.name
  if (typeof name !== 'string' || name.trim().length === 0) {
    return c.json({ error: 'Sandbox name is required.' }, 400)
  }
  const sandbox = sandboxes.createSandbox(name.trim())
  return c.json(sandbox, 201)
})

sandboxesRoutes.post('/:id/start', (c) => {
  const sandbox = sandboxes.startSandbox(c.req.param('id'))
  if (!sandbox) return c.json({ error: 'Sandbox not found or destroyed.' },404)
  return c.json(sandbox)
})

sandboxesRoutes.post('/:id/stop', (c) => {
  const sandbox = sandboxes.stopSandbox(c.req.param('id'))
  if (!sandbox) return c.json({ error: 'Sandbox not found or destroyed.' }, 404)
  return c.json(sandbox)
})

sandboxesRoutes.delete('/:id', (c) => {
  return sandboxes.deleteSandbox(c.req.param('id'))
    ? c.body(null, 204)
    : c.json({ error: 'Sandbox not found.' }, 404)
})

sandboxesRoutes.post('/:id/exec', async (c) => {
  const sandbox = sandboxes.getSandbox(c.req.param('id'))
  if (!sandbox) return c.json({ error: 'Sandbox not found.' }, 404)
  if (sandbox.status !== 'running') {
    return c.json({ error: 'Sandbox is not running.' }, 400)
  }

  const body = await c.req.json().catch(() => null)
  const command = body?.command
  if (typeof command !== 'string' || command.trim().length === 0) {
    return c.json({ error: 'Command is required.' }, 400)
  }

  const execution = await executions.executeCommand(sandbox.id, command.trim())
  if (!execution) return c.json({ error: 'Sandbox not found or not running.' }, 404)
  return c.json(execution, 201)

})

sandboxesRoutes.get('/:id/executions', (c) => {
  const sandbox = sandboxes.getSandbox(c.req.param('id'))
  if (!sandbox) return c.json({ error: 'Sandbox not found.' }, 404)
  return c.json(executions.listExecutions(sandbox.id))

})

sandboxesRoutes.get('/:id/files', async (c) => {
  const sandbox = sandboxes.getSandbox(c.req.param('id'))
  if (!sandbox) return c.json({ error: 'Sandbox not found.' }, 404)
  if (sandbox.status !== 'running') {
    return c.json({ error: 'Sandbox is not running.' }, 400)
  }
  const path = c.req.query('path')
  const op = c.req.query('op') ?? 'read'
  if (typeof path !== 'string' || path.trim().length === 0) {
    return c.json({ error: 'Path is required.' }, 400)
  }
  if (op === 'list') {
    const result = await executions.listDirectory(sandbox.id, path.trim())
    if (!result) return c.json({ error: 'Sandbox not found or not running.' }, 404)
    return c.json(result)
  }
  const result = await executions.readFile(sandbox.id, path.trim())
  if (!result) return c.json({ error: 'Sandbox not found or not running.' }, 404)
  return c.json(result)
})

sandboxesRoutes.post('/:id/files', async (c) => {
  const sandbox = sandboxes.getSandbox(c.req.param('id'))
  if (!sandbox) return c.json({ error: 'Sandbox not found.' }, 404)
  if (sandbox.status !== 'running') {
    return c.json({ error: 'Sandbox is not running.' }, 400)
  }
  const body = await c.req.json().catch(() => null)
  const path = body?.path
  const content = body?.content

  if (typeof path !== 'string' || path.trim().length === 0) {
    return c.json({ error: 'Path is required.' }, 400)
  }

  if (typeof content !== 'string') {
    return c.json({ error: 'Content is requireed.' }, 400)
  }
  const result = await executions.writeFile(sandbox.id, path.trim(), content)
  if (!result) return c.json({ error: 'Sandbox not found or not running.' }, 404)
  return c.json(result, 201)
})




