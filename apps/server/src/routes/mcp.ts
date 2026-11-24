import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import * as mcp from '../services/mcp-client'

export const mcpRoutes = new Hono()

const addServerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  command: z.string().min(1),
  args: z.array(z.string()).default([])
})

mcpRoutes.get('/servers', (c) => c.json(mcp.listMcpServers()))

mcpRoutes.post('/servers', zValidator('json', addServerSchema), (c) => {
  const config = c.req.valid('json')
  mcp.addMcpServer(config)
  return c.json(config, 201)
})

mcpRoutes.get('/servers/:id/tools', async (c) => {
  const tools = await mcp.listMcpTools(c.req.param('id'))
  return c.json(tools)
})

mcpRoutes.post('/servers/:id/tools/:toolName/call', async (c) => {
  const body = await c.req.json().catch(() => null)
  const result = await mcp.callMcpTool(c.req.param('id'), c.req.param('toolName'), body ?? {})
  return c.json(result)
})

mcpRoutes.delete('/servers/:id', (c) => {
  mcp.removeMcpServer(c.req.param('id'))
  return c.body(null, 204)
})
