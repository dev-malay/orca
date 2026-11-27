'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { SpacePage } from '@/lib/api'
import { api } from '@/lib/api'

export default function SpacePage({ params }: { params: { spaceId: string } }) {
  const [pages, setPages] = useState<SpacePage[] | null>(null)
  const [spaceName, setSpaceName] = useState('')

  useEffect(() => {
    api.listPages(params.spaceId).then((list) => {
      setPages(list)
      setSpaceName(list.length > 0 ? list[0].spaceName : 'Space')
    }).catch(() => setSpaceName('Space'))
  }, [params.spaceId])

  const createPage = () => {
    const name = window.prompt('Page title')
    if (!name) return
    api.createPage(params.spaceId, { title: name }).then(() => {
      api.listPages(params.spaceId).then(setPages)
    })
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center gap-3 border-b border-white/[0.08] bg-[#0a0a0a]/90 backdrop-blur px-6 py-4 sticky top-0 z-10">
        <h1 className="text-base font-medium text-zinc-100">{spaceName}</h1>
        <div className="flex-1" />
        <input placeholder="Filter pages" className="w-56 rounded-md border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-sm text-zinc-200 outline-none placeholder:text-zinc-600" />
        <div className="flex overflow-hidden rounded-md border border-white/[0.08]">
          <button className="px-2.5 py-1.5 text-xs text-zinc-100 bg-white/[0.05]">Grid</button>
          <button className="px-2.5 py-1.5 text-xs text-zinc-500 hover:text-zinc-300">List</button>
        </div>
        <button
          onClick={createPage}
          className="rounded-full bg-f54e00 px-4 py-1.5 text-sm text-[#0a0a0a] hover:bg-f54e00/90"
        >
          New page
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {!pages && <p className="text-sm text-zinc-600">Loading pages...</p>}
        {pages && pages.length === 0 && (
          <div className="mt-20 text-center">
            <p className="text-sm text-zinc-500">No pages yet.</p>
            <button
              onClick={createPage}
              className="mt-3 rounded-full border border-white/[0.3] px-3.5 py-1.5 text-sm text-zinc-200 transition-colors hover:bg-white/[0.05]"
            >
              Create your first page
            </button>
          </div>
        )}
        {pages && pages.length > 0 && (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-2.5">
            {pages.map((page) => (
              <button
                key={page.id}
                onClick={() => {}}
                className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-4 text-left transition-colors hover:bg-white/[0.05]"
              >
                <div className="truncate text-sm font-medium text-zinc-200">{page.title}</div>
                <div className="mt-1 text-xs text-zinc-600">Edited just now</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
