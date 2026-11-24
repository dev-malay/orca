import { Hono } from 'hono'
import { spacesRoutes } from './routes/spaces'
import { pagesRoutes } from './routes/pages'
import { agentsRoutes } from './routes/agents'
import { searchRoutes } from './routes/search'
import { toolsRoutes } from './routes/tools'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/api/health', (c) => {
  return c.json({ status: 'ok' })
})


app.route('/api/spaces', spacesRoutes)
app.route('/api/pages', pagesRoutes)
app.route('/api/agents', agentsRoutes)
app.route('/api/search', searchRoutes)
app.route('/api/tools', toolsRoutes)

Bun.serve({port: 8787, fetch: app.fetch})
