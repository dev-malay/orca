import { Hono } from 'hono'
import { CreateAgentInputSchema, UpdateAgentInputSchema } from '@repo/shared'
import * as agents from '../services/agents'

export const agentsRoutes = new Hono()

agentsRoutes.get('/', (c) => c.json(agents.listAgents()))

agentsRoutes.post('/', async (c) => {
  const parsed = CreateAgentInputSchema.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) {
    return c.json({ error: 'An agent name of 1 to 200 characters is required.' }, 400)
  }
  return c.json(agents.createAgent(parsed.data.name, parsed.data.instructions ?? ''), 201)
})

agentsRoutes.get('/:id', (c) => {
  const agent = agents.getAgent(c.req.param('id'))
  return agent ? c.json(agent) : c.json({ error: 'Agent not found.' }, 404)
})

agentsRoutes.patch('/:id', async (c) => {
  const parsed = UpdateAgentInputSchema.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) {
    return c.json({ error: 'An agent name must be 1 to 200 characters.' }, 400)
  }
  const agent = agents.updateAgent(c.req.param('id'), parsed.data)
  return agent ? c.json(agent) : c.json({ error: 'Agent not found.' }, 404)
})

agentsRoutes.delete('/:id', (c) => {
  return agents.deleteAgent(c.req.param('id'))
    ? c.body(null, 204)
    : c.json({ error: 'Agent not found.' }, 404)
})
