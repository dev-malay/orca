import { Hono } from 'hono'
import type { SearchResponse } from '@repo/shared'
import { db } from '../db'
import { toSpace, type SpaceRow } from '../services/spaces'
import { toTreeNode, type PageRow } from '../services/pages'

export const searchRoutes = new Hono()

searchRoutes.get('/', (c) => {
  const raw = c.req.query('q')?.trim() ?? ''
  if (raw.length === 0) {
    return c.json({ spaces: [], pages: [] } satisfies SearchResponse)
  }

  // SQLite treats % _ and \ as wildcards and the escape character inside LIKE
  const term = '%' + raw.replace(/[\\%_]/g, (m) => '\\' + m) + '%'
  const escape = "ESCAPE '\\'"

  const spaceRows = db
    .query(`SELECT * FROM spaces WHERE name LIKE ? ${escape} ORDER BY updated_at DESC LIMIT 25`)
    .all(term) as SpaceRow[]

  const pageRows = db
    .query(
      `SELECT p.*, s.name AS space_name
       FROM pages p
       JOIN spaces s ON s.id = p.space_id
       WHERE p.title LIKE ? ${escape} OR p.content LIKE ? ${escape}
       ORDER BY p.updated_at DESC
       LIMIT 50`,
    )
    .all(term, term) as (PageRow & { space_name: string })[]

  const result: SearchResponse = {
    spaces: spaceRows.map(toSpace),
    pages: pageRows.map((row) => ({ ...toTreeNode(row), spaceName: row.space_name })),
  }
  return c.json(result)
})
