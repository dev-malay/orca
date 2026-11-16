import { Hono } from 'hono'
import { UpdatePageContentInputSchema, UpdatePageInputSchema } from '@repo/shared'
import * as service from '../services/pages'

export const pagesRoutes = new Hono()

pagesRoutes.get('/:id', (c) => {
  const page = service.getPage(c.req.param('id'))
  return page ? c.json(page) : c.json({ error: 'Page not found.' }, 404)
})

pagesRoutes.patch('/:id', async (c) => {
  const parsed = UpdatePageInputSchema.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) return c.json({ error: 'Invalid page input.' }, 400)

  const result = service.updatePage(c.req.param('id'), parsed.data)
  if (!result.ok) {
    if (result.reason === 'NOT_FOUND') return c.json({ error: 'Page not found.' }, 404)
    if (result.reason === 'CYCLE') {
      return c.json({ error: 'A page cannot be nested inside itself or its descendants.' }, 400)
    }
    return c.json({ error: 'Parent page not found.' }, 400)
  }
  return c.json(result.page)
})

pagesRoutes.put('/:id/content', async (c) => {
  const parsed = UpdatePageContentInputSchema.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) return c.json({ error: 'Invalid content input.' }, 400)

  const result = service.savePageContent(
    c.req.param('id'),
    parsed.data.content,
    parsed.data.baseRevision,
  )
  if (!result.ok) {
    if (result.reason === 'NOT_FOUND') return c.json({ error: 'Page not found.' }, 404)
    // the editor reads result.page on conflict and offers overwrite with its revision
    return c.json(
      {
        error: 'This page was modified elsewhere. Reload to get the latest version.',
        page: result.page,
      },
      409,
    )
  }
  return c.json(result.page)
})

pagesRoutes.delete('/:id', (c) => {
  return service.deletePage(c.req.param('id'))
    ? c.body(null, 204)
    : c.json({ error: 'Page not found.' }, 404)
})
