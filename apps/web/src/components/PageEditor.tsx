import { useCallback, useEffect, useRef, useState } from 'react'
import type { Page, Space } from '@repo/shared'
import { api } from '../api'

type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error' | 'conflict'

const AUTOSAVE_DELAY_MS = 800

const STATUS: Record<SaveState, { label: string; className: string }> = {
  idle: { label: 'Saved', className: 'text-ter' },
  dirty: { label: 'Unsaved changes', className: 'text-mid' },
  saving: { label: 'Saving', className: 'text-mid' },
  saved: { label: 'Saved', className: 'text-ter' },
  error: { label: 'Save failed', className: 'text-danger' },
  conflict: { label: 'Conflict', className: 'text-fg' },
}

interface PageEditorProps {
  space: Space
  pageId: string
  onBack: () => void
}

export function PageEditor({ space, pageId, onBack }: PageEditorProps) {
  const [page, setPage] = useState<Page | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [conflictPage, setConflictPage] = useState<Page | null>(null)
  const [deleting, setDeleting] = useState(false)

  // refs hold the latest values so debounced saves never read stale closures
  const baseRevisionRef = useRef(0)
  const titleRef = useRef('')
  const savedTitleRef = useRef('')
  const contentRef = useRef('')
  const saveStateRef = useRef<SaveState>('idle')
  const pendingRef = useRef(false)
  const titleTimerRef = useRef<number | null>(null)
  const contentTimerRef = useRef<number | null>(null)
  const savedTimerRef = useRef<number | null>(null)
  const saveRef = useRef<(overrideRevision?: number) => Promise<void>>(async () => {})

  const setSave = useCallback((state: SaveState) => {
    saveStateRef.current = state
    setSaveState(state)
  }, [])

  const finishSave = useCallback(() => {
    if (pendingRef.current) {
      // a change arrived while the request was in flight, run one more save
      pendingRef.current = false
      window.setTimeout(() => void saveRef.current(), 50)
    } else {
      setSave('saved')
      if (savedTimerRef.current) window.clearTimeout(savedTimerRef.current)
      savedTimerRef.current = window.setTimeout(() => setSave('idle'), 1600)
    }
  }, [setSave])

  const save = useCallback(
    async (overrideRevision?: number) => {
      if (titleTimerRef.current) {
        window.clearTimeout(titleTimerRef.current)
        titleTimerRef.current = null
      }
      if (contentTimerRef.current) {
        window.clearTimeout(contentTimerRef.current)
        contentTimerRef.current = null
      }

      let nextTitle = titleRef.current.trim()
      if (nextTitle.length === 0) {
        // never persist an empty title, fall back to the last known one
        nextTitle = savedTitleRef.current
        setTitle(nextTitle)
      }
      const titleChanged = nextTitle !== savedTitleRef.current

      setSave('saving')
      try {
        if (titleChanged) {
          const updated = await api.updatePage(pageId, { title: nextTitle })
          savedTitleRef.current = updated.title
          setPage(updated)
        }
        const result = await api.savePageContent(pageId, {
          content: contentRef.current,
          baseRevision: overrideRevision ?? baseRevisionRef.current,
        })
        if (result.ok) {
          baseRevisionRef.current = result.page.revision
          setPage(result.page)
          setConflictPage(null)
          finishSave()
        } else if ('conflict' in result) {
          setConflictPage(result.conflict)
          setSave('conflict')
        } else {
          setSave('error')
        }
      } catch {
        setSave('error')
      }
    },
    [pageId, finishSave, setSave],
  )

  useEffect(() => {
    saveRef.current = save
  }, [save])

  const scheduleSave = (which: 'title' | 'content') => {
    const timerRef = which === 'title' ? titleTimerRef : contentTimerRef
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => void save(), AUTOSAVE_DELAY_MS)
  }

  const onContentChange = (value: string) => {
    setContent(value)
    contentRef.current = value
    if (saveStateRef.current === 'saving') {
      pendingRef.current = true
      return
    }
    setSave('dirty')
    scheduleSave('content')
  }

  const onTitleChange = (value: string) => {
    setTitle(value)
    titleRef.current = value
    if (saveStateRef.current === 'saving') {
      pendingRef.current = true
      return
    }
    setSave('dirty')
    scheduleSave('title')
  }

  const reloadPage = () => {
    api
      .getPage(pageId)
      .then((fresh) => {
        setPage(fresh)
        setTitle(fresh.title)
        titleRef.current = fresh.title
        savedTitleRef.current = fresh.title
        setContent(fresh.content)
        contentRef.current = fresh.content
        baseRevisionRef.current = fresh.revision
        setConflictPage(null)
        setSave('idle')
      })
      .catch(() => setSave('error'))
  }

  const handleDelete = () => {
    if (!page || deleting) return
    if (!window.confirm(`Delete "${page.title}" and its subpages? This cannot be undone.`)) return
    setDeleting(true)
    api
      .deletePage(pageId)
      .then(onBack)
      .catch(() => {
        setDeleting(false)
        setSave('error')
      })
  }

  useEffect(() => {
    let cancelled = false
    api
      .getPage(pageId)
      .then((loaded) => {
        if (cancelled) return
        setPage(loaded)
        setTitle(loaded.title)
        titleRef.current = loaded.title
        savedTitleRef.current = loaded.title
        setContent(loaded.content)
        contentRef.current = loaded.content
        baseRevisionRef.current = loaded.revision
      })
      .catch(() => {
        if (!cancelled) setLoadError('Failed to load page.')
      })
    return () => {
      cancelled = true
    }
  }, [pageId])

  // a closed tab still flushes the draft with keepalive requests
  useEffect(() => {
    const flush = () => {
      if (saveStateRef.current !== 'dirty') return
      const nextTitle = titleRef.current.trim()
      if (nextTitle && nextTitle !== savedTitleRef.current) {
        void fetch(`/api/pages/${pageId}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ title: nextTitle }),
          keepalive: true,
        })
      }
      void fetch(`/api/pages/${pageId}/content`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          content: contentRef.current,
          baseRevision: baseRevisionRef.current,
        }),
        keepalive: true,
      })
    }
    window.addEventListener('pagehide', flush)
    return () => window.removeEventListener('pagehide', flush)
  }, [pageId])

  useEffect(
    () => () => {
      for (const timer of [titleTimerRef, contentTimerRef, savedTimerRef]) {
        if (timer.current) window.clearTimeout(timer.current)
      }
    },
    [],
  )

  const goBack = () => {
    // flush pending edits now, the library refetches so it picks them up
    if (saveStateRef.current === 'dirty') void save()
    onBack()
  }

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-line px-5 py-3">
        <button
          type="button"
          onClick={goBack}
          className="shrink-0 rounded-md px-2 py-1 text-sm text-sec transition-colors duration-[140ms] ease-spring hover:bg-panel hover:text-fg"
        >
          Back to {space.name}
        </button>
        <input
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="Untitled"
          className="min-w-0 flex-1 truncate bg-transparent text-base font-medium text-fg outline-none placeholder:text-ter"
        />
        <span className={`shrink-0 text-xs transition-colors duration-[140ms] ease-spring ${STATUS[saveState].className}`}>
          {STATUS[saveState].label}
        </span>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          title="Delete page"
          className="shrink-0 rounded-md px-2 py-1 text-sm text-ter transition-colors duration-[140ms] ease-spring hover:bg-panel hover:text-danger disabled:opacity-50"
        >
          Delete
        </button>
      </header>

      {saveState === 'conflict' && conflictPage && (
        <div className="flex flex-wrap items-center gap-3 border-b border-line bg-panel-01 px-5 py-2.5 text-sm text-fg">
          <span className="flex-1">This page was modified in another window.</span>
          <button
            type="button"
            onClick={reloadPage}
            className="rounded-md border border-line-strong px-2.5 py-1 text-xs text-fg transition-colors duration-[140ms] ease-spring hover:bg-panel-02"
          >
            Load server version
          </button>
          <button
            type="button"
            onClick={() => void save(conflictPage.revision)}
            className="rounded-full bg-fg px-3 py-1 text-xs text-app transition-colors duration-[140ms] ease-spring hover:bg-fg-02"
          >
            Overwrite with mine
          </button>
        </div>
      )}

      {saveState === 'error' && (
        <div className="flex items-center gap-3 border-b border-line bg-panel-01 px-5 py-2.5 text-sm text-danger">
          <span className="flex-1">Saving failed, your draft is kept locally.</span>
          <button
            type="button"
            onClick={() => void save()}
            className="rounded-md border border-line-strong px-2.5 py-1 text-xs text-fg transition-colors duration-[140ms] ease-spring hover:bg-panel-02"
          >
            Try again
          </button>
        </div>
      )}

      {loadError ? (
        <div className="p-6 text-sm text-danger">{loadError}</div>
      ) : page === null ? (
        <div className="p-6 text-sm text-ter">Loading page...</div>
      ) : (
        <textarea
          value={content}
          onChange={(event) => onContentChange(event.target.value)}
          spellCheck={false}
          placeholder="Write in Markdown, the rich editor arrives in Phase 2"
          className="min-h-0 w-full flex-1 resize-none bg-transparent p-6 font-mono text-sm leading-relaxed text-fg outline-none placeholder:text-ter"
        />
      )}

      <footer className="flex items-center gap-3 border-t border-line px-5 py-2 text-xs text-ter">
        <span>{wordCount} words</span>
        <span>Revision {page?.revision ?? 0}</span>
      </footer>
    </div>
  )
}
