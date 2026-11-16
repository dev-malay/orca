import { Hono } from 'hono'
import { CreatePageInputSchema, CreateSpaceInputSchema } from '@repo/shared'
import * as spaces from '../services/spaces'
import * as pages from '../services/pages'

export const spacesRoutes = new Hono()

spacesRoutes.get('/', (c) => c.json(spaces.listSpaces()))

spacesRoutes.post('/', async (c) => {
  const parsed = CreateSpaceInputSchema.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) {
    return c.json({ error: 'A space name of 1 to 200 characters is required.' }, 400)
  }
  return c.json(spaces.createSpace(parsed.data.name), 201)
})

spacesRoutes.get('/:id', (c) => {
  const space = spaces.getSpace(c.req.param('id'))
  return space ? c.json(space) : c.json({ error: 'Space not found.' }, 404)
})

spacesRoutes.patch('/:id', async (c) => {
  const parsed = CreateSpaceInputSchema.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) {
    return c.json({ error: 'A space name of 1 to 200 characters is required.' }, 400)
  }
  const space = spaces.renameSpace(c.req.param('id'), parsed.data.name)
  return space ? c.json(space) : c.json({ error: 'Space not found.' }, 404)
})

spacesRoutes.delete('/:id', (c) => {
  return spaces.deleteSpace(c.req.param('id'))
    ? c.body(null, 204)
    : c.json({ error: 'Space not found.' }, 404)
})

spacesRoutes.get('/:id/pages', (c) => {
  const space = spaces.getSpace(c.req.param('id'))
  if (!space) return c.json({ error: 'Space not found.' }, 404)
  return c.json(pages.listPages(c.req.param('id')))
})

spacesRoutes.post('/:id/pages', async (c) => {
  const spaceId = c.req.param('id')
  if (!spaces.getSpace(spaceId)) return c.json({ error: 'Space not found.' }, 404)

  const parsed = CreatePageInputSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) return c.json({ error: 'Invalid page input.' }, 400)

  const result = pages.createPage(spaceId, parsed.data)
  if (!result.ok) {
    return result.reason === 'SPACE_NOT_FOUND'
      ? c.json({ error: 'Space not found.' }, 404)
      : c.json({ error: 'Parent page not found.' }, 400)
  }
  return c.json(result.page, 201)
})
