import { Hono } from 'hono'
import * as tools from '../services/tools'
import * as approvals from '../services/approvals'

export const toolsRoutes = new Hono()

toolsRoutes.post('/:id/call', async (c) => {
  const tool = tools.getTool(c.req.param('id'))
  if (!tool) return c.json({ error: 'Tool not found.' }, 404)

  const body = await c.req.json().catch(() => null)
  const argumentsValue = body?.arguments ?? ''
  if (typeof argumentsValue !== 'string' || argumentsValue.trim().length === 0) {
    return c.json({ error: 'Tool call requires non-empty arguments.' }, 400)
  }

  const toolCall = tools.createToolCall(tool.id, argumentsValue)
  return c.json(toolCall, 201)
})

toolsRoutes.post('/tool-calls/:id/approve', (c) => {
  const toolCall = approvals.approveToolCall(c.req.param('id'))
  if (!toolCall) return c.json({ error: 'Tool call not found or not pending.' }, 404)
  return c.json(toolCall)
})

toolsRoutes.post('/tool-calls/:id/deny', (c) => {
  const toolCall = approvals.denyToolCall(c.req.param('id'))
  if (!toolCall) return c.json({ error: 'Tool call not found or not pending.' }, 404)
  return c.json(toolCall)
})
