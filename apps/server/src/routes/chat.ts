import { Hono } from 'hono'
import { CreateThreadInputSchema, SendMessageInputSchema } from '@repo/shared'
import * as threads from '../services/threads'
import * as messages from '../services/messages'

export const chatRoutes = new Hono()


chatRoutes.get('/', (c) => c.json(threads.listThreads()))

chatRoutes.post('/', async (c) => {
  const parsed = CreateThreadInputSchema.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) {
    return c.json({ error: 'A thread needs a valid agent and an optional title.' }, 400)
  }
  const thread = threads.createThread(parsed.data.agentId, parsed.data.title ?? 'New thread')
  return c.json(thread, 201)
})

chatRoutes.get('/:id', (c) => {
  const thread = threads.getThread(c.req.param('id'))
  return thread ? c.json(thread) : c.json({ error: 'thread not found.' }, 404)
});

chatRoutes.delete('/:id', (c) => {
  return threads.deleteThread(c.req.param('id'))
    ? c.body(null, 204)
    : c.json({ error: 'thread not found.' }, 404)
})

chatRoutes.get('/:id/messages', (c) => {
  const thread = threads.getThread(c.req.param('id'))
  if (!thread) return c.json({ error: 'Thread not found.' }, 404)
  return c.json(messages.listMessages(c.req.param('id')))
})

chatRoutes.post('/:id/messages', async (c) => {
  const thread = threads.getThread(c.req.param('id'))
  if (!thread) return c.json({ error: 'Thread not found.' }, 404)

  const parsed = SendMessageInputSchema.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) {
    return c.json({ error: 'a message needs a role and non empty content.' }, 400)
  }
  const message = messages.createMessage(c.req.param('id'), parsed.data.role, parsed.data.content)
  return c.json(message, 201)
});


