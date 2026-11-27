'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'

export default function Home() {
  const [spaces, setSpaces] = useState<{ id: string; name: string }[]>([])
  const [newName, setNewName] = useState('')

  useEffect(() => {
    api.listSpaces().then(setSpaces).catch(() => setSpaces([]))
  }, [])

  const create = () => {
    const name = newName.trim()
    if (!name) return
    api.createSpace(name).then((s) => {
      setSpaces([...spaces, s])
      setNewName('')
    })
  }

  return (
    <div className="flex h-screen">
      <aside className="w-64 shrink-0 flex-col border-r border-white/[0.08] bg-[#0d0d0d]">
        <div className="flex items-center gap-2 px-4 py-4">
          <span className="text-sm font-medium text-zinc-100">Orca</span>
        </div>
        <div className="px-3 pb-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') create() }}
            onBlur={create}
            placeholder="New space, press Enter"
            className="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-sm text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-f54e00/50"
          />
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
          {spaces.map((s) => (
            <div key={s.id} className="group flex items-center rounded-md">
              <Link
                href={`/spaces/${s.id}`}
                className={`flex-1 truncate rounded-md px-2.5 py-1.5 text-left text-sm text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-200`}
              >
                {s.name}
              </Link>
            </div>
          ))}
        </nav>
        <div className="border-t border-white/[0.08] px-4 py-3">
          <p className="text-xs text-zinc-600">Dots arrive in Phase 2.</p>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-6">
        <h1 className="text-2xl font-medium text-zinc-100 mb-6">Spaces</h1>
        {spaces.length === 0 && (
          <p className="text-sm text-zinc-500">No spaces yet. Create one on the left.</p>
        )}
        {spaces.map((s) => (
          <div key={s.id} className="mb-4">
            <Link
              href={`/spaces/${s.id}`}
              className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-4 text-left transition-colors hover:bg-white/[0.05]"
            >
              <div className="truncate text-sm font-medium text-zinc-200">{s.name}</div>
            </Link>
          </div>
        ))}
      </main>
    </div>
  )
}
