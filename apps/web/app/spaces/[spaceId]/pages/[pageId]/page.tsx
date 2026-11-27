'use client'

import { useEffect, useRef, useState } from 'react'
import type { Page, Space } from '@repo/shared'
import { api } from '@/lib/api'
import { TipTapEditor } from '@/components/TipTapEditor'

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

interface PageEditorPageProps {
  params: { spaceId: string; pageId: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export default function PageEditorPage({ params }: PageEditorPageProps) {
  const [page, setPage] = useState<Page | null>(null)
  const [space, setSpace] = useState<Space | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [conflictPage, setConflictPage] = useState<Page | null>(null)
  const [deleting, setDeleting] = useState(false)

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

  const setSave = (state: SaveState) => {
    saveStateRef.current = state
    setSaveState(state)
  }

  const finishSave = () => {
    if (pendingRef.current) {
      pendingRef.current = false
      window.setTimeout(() => void saveRef.current(), 50)
    } else {
      setSave('saved')
      if (savedTimerRef.current) window.clearTimeout(savedTimerRef.current)
      savedTimerRef.current = window.setTimeout(() => setSave('idle'), 1600)
    }
  }

  const save = async (overrideRevision?: number) => {
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
      nextTitle = savedTitleRef.current
      setTitle(nextTitle)
    }
    const titleChanged = nextTitle !== savedTitleRef.current

    setSave('saving')
    try {
      if (titleChanged) {
        const updated = await api.updatePage(params.pageId, { title: nextTitle })
        savedTitleRef.current = updated.title
        setPage(updated)
      }
      const result = await api.savePageContent(params.pageId, contentRef.current, overrideRevision ?? baseRevisionRef.current)
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
  }

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
    api.getPage(params.pageId).then((fresh) => {
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
  }

  const handleDelete = () => {
    if (!page || deleting) return
    if (!window.confirm(`Delete "${page.title}" and its subpages? This cannot be undone.`)) return
    setDeleting(true)
    api.deletePage(params.pageId).then(() => {
      // navigate back handled by parent or redirect
    })
  }

  useEffect(() => {
    let cancelled = false
    api.getPage(params.pageId).then((loaded) => {
      if (cancelled) return
      setPage(loaded)
      setTitle(loaded.title)
      titleRef.current = loaded.title
      savedTitleRef.current = loaded.title
      setContent(loaded.content)
      contentRef.current = loaded.content
      baseRevisionRef.current = loaded.revision
    }).catch(() => setLoadError('Failed to load page.'))
    return () => { cancelled = true }
  }, [params.pageId])

  useEffect(() => {
    const flush = () => {
      if (saveStateRef.current !== 'dirty') return
      void fetch(`/api/pages/${params.pageId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title: titleRef.current.trim() }),
        keepalive: true,
      })
      void fetch(`/api/pages/${params.pageId}/content`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content: contentRef.current, baseRevision: baseRevisionRef.current }),
        keepalive: true,
      })
    }
    window.addEventListener('pagehide', flush)
    return () => window.removeEventListener('pagehide', flush)
  }, [params.pageId])

  useEffect(() => {
    return () => {
      for (const timer of [titleTimerRef, contentTimerRef, savedTimerRef]) {
        if (timer.current) window.clearTimeout(timer.current)
      }
    }
  }, [])

  const goBack = () => {
    if (saveStateRef.current === 'dirty') void save()
    window.history.back()
  }

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-white/[0.08] px-5 py-3">
        <button
          type="button"
          onClick={goBack}
          className="shrink-0 rounded-md px-2 py-1 text-sm text-zinc-500 transition-colors duration-[140ms] hover:bg-white/[0.05] hover:text-zinc-300"
        >
          Back to {space?.name ?? 'Space'}
        </button>
        <input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Untitled"
          className="min-w-0 flex-1 truncate bg-transparent text-base font-medium text-zinc-100 outline-none placeholder:text-zinc-600"
        />
        <span className={`shrink-0 text-xs transition-colors duration-[140ms] ${STATUS[saveState].className}`}>
          {STATUS[saveState].label}
        </span>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          title="Delete page"
          className="shrink-0 rounded-md px-2 py-1 text-sm text-zinc-600 transition-colors duration-[140ms] hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
        >
          Delete
        </button>
      </header>

      {saveState === 'conflict' && conflictPage && (
        <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.2] bg-white/[0.07] px-5 py-2.5 text-sm text-zinc-100">
          <span className="flex-1">This page was modified in another window.</span>
          <button
            type="button"
            onClick={reloadPage}
            className="rounded-md border border-white/[0.4] px-2.5 py-1 text-xs text-zinc-100 transition-colors duration-[140ms] hover:bg-white/[0.05]"
          >
            Load server version
          </button>
          <button
            type="button"
            onClick={() => void save(conflictPage.revision)}
            className="rounded-full bg-f54e00 px-3 py-1 text-xs text-[#0a0a0a] transition-colors duration-[140ms] hover:bg-f54e00/90"
          >
            Overwrite with mine
          </button>
        </div>
      )}

      {saveState === 'error' && (
        <div className="flex items-center gap-3 border-b border-white/[0.2] bg-white/[0.07] px-5 py-2.5 text-sm text-red-400">
          <span className="flex-1">Saving failed, your draft is kept locally.</span>
          <button
            type="button"
            onClick={() => void save()}
            className="rounded-md border border-white/[0.4] px-2.5 py-1 text-xs text-zinc-100 transition-colors duration-[140ms] hover:bg-white/[0.05]"
          >
            Try again
          </button>
        </div>
      )}

      {loadError ? (
        <div className="p-6 text-sm text-red-400">{loadError}</div>
      ) : page === null ? (
        <div className="p-6 text-sm text-zinc-600">Loading page...</div>
      ) : (
        <TipTapEditor value={content} onChange={onContentChange} />
      )}

      <footer className="flex items-center gap-3 border-t border-white/[0.08] px-5 py-2 text-xs text-zinc-600">
        <span>{wordCount} words</span>
        <span>Revision {page?.revision ?? 0}</span>
      </footer>
    </div>
  )
}
