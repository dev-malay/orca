import { Hono } from 'hono'
import { spacesRoutes } from './routes/spaces'
import { pagesRoutes } from './routes/pages'
import { searchRoutes } from './routes/search'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/api/health', (c) => {
  return c.json({ status: 'ok' })
})


app.route('/api/spaces', spacesRoutes)
app.route('/api/pages', pagesRoutes)
app.route('/api/search', searchRoutes)

Bun.serve({port: 8787, fetch: app.fetch})
