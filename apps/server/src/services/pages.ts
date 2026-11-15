import { db } from '../db'
import type { Page, PageTreeNode } from '@repo/shared'

interface PageRow {
  id: string
  space_id: string
  parent_id: string | null
  title: string
  content: string
  revision: number
  created_at: number
  updated_at: number
}

function toTreeNode(row: PageRow): PageTreeNode {
  return {
    id: row.id,
    spaceId: row.space_id,
    parentId: row.parent_id,
    title: row.title,
    updatedAt: row.updated_at
  }
}

function toPage(row: PageRow): Page {
  return {...toTreeNode(row),
    content: row.content,
    revision: row.revision,
    createdAt: row.created_at
  }
}

function getRow(id: string): PageRow | null {
  return db.query('SELECT * FROM pages WHERE id = ?').get(id) as PageRow | null
}

export function getPage(id: string): Page | null {
  const row = getRow(id)
  return row ? toPage(row) : null
}

export function listPages(spaceId: string): PageTreeNode[] {
  return (
    db.query('SELECT * FROM pages WHERE space_id = ? ORDER BY created_at ASC').all(spaceId) as PageRow[]).map(toTreeNode)

}

export type CreatePageResult =
  | { ok: true; page: Page }
  | { ok: false; reason: 'SPACE_NOT_FOUND' | 'PARENT_NOT_FOUND' }

export function createPage(
  spaceId: string,
  input: { parentId?: string | null; title?: string },
): CreatePageResult {
  const spaceExists = db.query('SELECT 1 AS ok FROM spaces WHERE id = ?').get(spaceId)
  if (!spaceExists) return { ok: false, reason: 'SPACE_NOT_FOUND' }

  const parentId = input.parentId ?? null
  if (parentId) {
    const parent = getRow(parentId)
    if (!parent || parent.space_id !== spaceId) return { ok: false, reason: 'PARENT_NOT_FOUND' }
  }

  const id = crypto.randomUUID()
  const now = Date.now()
  const title = input.title?.trim() || 'Untitled'
  db.run(
    'INSERT INTO pages (id, space_id, parent_id, title, content, revision, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?)',
    [id, spaceId, parentId, title, '', now, now])
  return { ok: true, page: toPage(getRow(id)!) }
}

export type UpdatePageResult =
  | { ok: true; page: Page }
  | { ok: false; reason: 'NOT_FOUND' | 'PARENT_NOT_FOUND' | 'CYCLE' }

export function updatePage(
  id: string,
  input: { title?: string; parentId?: string | null },
): UpdatePageResult {
  const row = getRow(id)
  if (!row) return { ok: false, reason: 'NOT_FOUND' }

  let parentId = row.parent_id
  if (input.parentId !== undefined) {
    const next = input.parentId
    if (next !== null) {
      if (next === id) return { ok: false, reason: 'CYCLE' }
      const parent = getRow(next)
      if (!parent || parent.space_id !== row.space_id) {
        return { ok: false, reason: 'PARENT_NOT_FOUND' }
      }
      // moving a page under one of its own descendants would detach it from
      // the tree, so walk the candidate parent's ancestors and refuse on a cycle
      let cursor = parent.parent_id
      while (cursor !== null) {
        if (cursor === id) return { ok: false, reason: 'CYCLE' }
        cursor = getRow(cursor)?.parent_id ?? null
      }
    }
    parentId = next
  }

  const title = input.title !== undefined ? input.title.trim() || 'Untitled' : row.title
  db.run('UPDATE pages SET title = ?, parent_id = ?, updated_at = ? WHERE id = ?', [
    title,
    parentId,
    Date.now(),
    id,
  ])
  return { ok: true, page: toPage(getRow(id)!) }
}

export type SaveContentResult =
  | { ok: true; page: Page }
  | { ok: false; reason: 'NOT_FOUND' }
  | { ok: false; reason: 'CONFLICT'; page: Page }

export function savePageContent(id: string, content: string, baseRevision: number): SaveContentResult {
  const row = getRow(id)
  if (!row) return { ok: false, reason: 'NOT_FOUND' }

  // baseRevision is what the client last saw; a mismatch means another writer
  // got there first, so refuse instead of silently overwriting their save
  if (row.revision !== baseRevision) {
    return { ok: false, reason: 'CONFLICT', page: toPage(row) }
  }

  db.run('UPDATE pages SET content = ?, revision = revision + 1, updated_at = ? WHERE id = ?', [
    content,
    Date.now(),
    id,
  ])
  return { ok: true, page: toPage(getRow(id)!) }
}

export function deletePage(id: string): boolean {
  return db.run('DELETE FROM pages WHERE id = ?', [id]).changes > 0
}
