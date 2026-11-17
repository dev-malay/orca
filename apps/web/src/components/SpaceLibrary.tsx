import { useEffect, useMemo, useState } from 'react'
import type { PageTreeNode, Space } from '@repo/shared'
import { api } from '../api'

interface SpaceLibraryProps {
  space: Space
  onOpenPage: (pageId: string) => void
}

type ViewMode = 'grid' | 'list'

const VIEW_KEY = 'orca.libraryView'

function formatRelative(timestamp: number): string {
  const diff = Date.now() - timestamp
  const minute = 60_000
  const hour = 3_600_000
  const day = 86_400_000
  if (diff < minute) return 'just now'
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`
  if (diff < day) return `${Math.floor(diff / hour)}h ago`
  return `${Math.floor(diff / day)}d ago`
}

interface PageRowsProps {
  nodes: PageTreeNode[]
  childrenOf: Map<string | null, PageTreeNode[]>
  depth: number
  onOpenPage: (pageId: string) => void
  onCreateChild: (parentId: string) => void
}

function PageRows({ nodes, childrenOf, depth, onOpenPage, onCreateChild }: PageRowsProps) {
  return (
    <>
      {nodes.map((node) => {
        const children = childrenOf.get(node.id) ?? []
        return (
          <div key={node.id}>
            <div
              className="group flex items-center gap-1 rounded-md"
              style={{ paddingLeft: depth * 16 }}
            >
              <button
                type="button"
                onClick={() => onOpenPage(node.id)}
                className="flex min-w-0 flex-1 items-baseline justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm text-sec transition-colors duration-[140ms] ease-spring hover:bg-panel hover:text-fg"
              >
                <span className="truncate">
                  {depth > 0 && <span className="mr-1 text-ter">↳</span>}
                  {node.title}
                </span>
                <span className="shrink-0 text-xs text-ter">
                  {formatRelative(node.updatedAt)}
                </span>
              </button>
              <button
                type="button"
                title="New subpage"
                onClick={() => onCreateChild(node.id)}
                className="hidden rounded px-1 text-xs text-ter transition-colors duration-[140ms] ease-spring hover:text-fg group-hover:block"
              >
                + subpage
              </button>
            </div>
            {children.length > 0 && (
              <PageRows
                nodes={children}
                childrenOf={childrenOf}
                depth={depth + 1}
                onOpenPage={onOpenPage}
                onCreateChild={onCreateChild}
              />
            )}
          </div>
        )
      })}
    </>
  )
}

export function SpaceLibrary({ space, onOpenPage }: SpaceLibraryProps) {
  const [pages, setPages] = useState<PageTreeNode[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'grid',
  )

  useEffect(() => {
    let cancelled = false
    api
      .listPages(space.id)
      .then((list) => {
        if (!cancelled) setPages(list)
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load pages.')
      })
    return () => {
      cancelled = true
    }
  }, [space.id])

  const setMode = (mode: ViewMode) => {
    setViewMode(mode)
    localStorage.setItem(VIEW_KEY, mode)
  }

  const filtered = useMemo(() => {
    if (!pages) return null
    const q = query.trim().toLowerCase()
    if (!q) return pages
    return pages.filter((page) => page.title.toLowerCase().includes(q))
  }, [pages, query])

  const childrenOf = useMemo(() => {
    const map = new Map<string | null, PageTreeNode[]>()
    for (const page of filtered ?? []) {
      const siblings = map.get(page.parentId) ?? []
      siblings.push(page)
      map.set(page.parentId, siblings)
    }
    for (const siblings of map.values()) {
      siblings.sort((a, b) => a.title.localeCompare(b.title))
    }
    return map
  }, [filtered])

  const createPage = (parentId?: string) => {
    if (creating) return
    setCreating(true)
    api
      .createPage(space.id, parentId ? { parentId } : {})
      .then((page) => onOpenPage(page.id))
      .catch(() => setError('Failed to create page.'))
      .finally(() => setCreating(false))
  }

  const roots = childrenOf.get(null) ?? []

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-line bg-app/90 px-6 py-4 backdrop-blur">
        <h1 className="truncate text-base font-medium text-fg">{space.name}</h1>
        <div className="flex-1" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter pages"
          className="w-56 rounded-md border border-line bg-panel-01 px-2.5 py-1.5 text-sm text-fg outline-none transition-[background-color,border-color] duration-[140ms] ease-spring placeholder:text-ter focus:border-line-strong"
        />
        <div className="flex overflow-hidden rounded-md border border-line">
          {(['grid', 'list'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setMode(mode)}
              className={`px-2.5 py-1.5 text-xs capitalize transition-colors duration-[140ms] ease-spring ${
                viewMode === mode ? 'bg-panel-02 text-fg' : 'text-sec hover:text-fg'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => createPage()}
          disabled={creating}
          className="rounded-full bg-fg px-4 py-1.5 text-sm text-app transition-colors duration-[140ms] ease-spring hover:bg-fg-02 disabled:opacity-50"
        >
          New page
        </button>
      </header>

      <div className="px-6 py-5">
        {error && (
          <p className="mb-4 rounded-md border border-line bg-panel-01 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        {!pages && !error && <p className="text-sm text-ter">Loading pages...</p>}

        {pages && filtered?.length === 0 && (
          <div className="mt-16 text-center">
            <p className="text-sm text-sec">
              {query ? 'No pages match your filter.' : 'No pages yet.'}
            </p>
            {!query && (
              <button
                type="button"
                onClick={() => createPage()}
                className="mt-3 rounded-full border border-line-strong px-3.5 py-1.5 text-sm text-fg transition-colors duration-[140ms] ease-spring hover:bg-panel-02"
              >
                Create your first page
              </button>
            )}
          </div>
        )}

        {viewMode === 'grid' && roots.length > 0 && (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-2.5">
            {roots.map((page) => (
              <button
                key={page.id}
                type="button"
                onClick={() => onOpenPage(page.id)}
                className="rounded-lg border border-line bg-panel p-4 text-left transition-colors duration-[140ms] ease-spring hover:bg-panel-02"
              >
                <div className="truncate text-sm font-medium text-fg">{page.title}</div>
                <div className="mt-1 text-xs text-ter">
                  Edited {formatRelative(page.updatedAt)}
                </div>
              </button>
            ))}
          </div>
        )}

        {viewMode === 'list' && filtered && filtered.length > 0 && (
          <div className="space-y-0.5">
            <PageRows
              nodes={childrenOf.get(null) ?? []}
              childrenOf={childrenOf}
              depth={0}
              onOpenPage={onOpenPage}
              onCreateChild={(parentId) => createPage(parentId)}
            />
          </div>
        )}
      </div>
    </div>
  )
}
