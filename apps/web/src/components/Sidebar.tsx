import { useRef, useState } from 'react'
import type { Space } from '@repo/shared'

interface SidebarProps {
  spaces: Space[]
  selectedSpaceId: string | null
  error: string | null
  onSelectSpace: (id: string) => void
  onCreateSpace: (name: string) => void
  onRenameSpace: (id: string, name: string) => void
  onDeleteSpace: (id: string) => void
}

export function Sidebar({
  spaces,
  selectedSpaceId,
  error,
  onSelectSpace,
  onCreateSpace,
  onRenameSpace,
  onDeleteSpace,
}: SidebarProps) {
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const editCancelledRef = useRef(false)

  const create = () => {
    const name = newName.trim()
    if (!name) return
    onCreateSpace(name)
    setNewName('')
  }

  const commitRename = (space: Space) => {
    if (editCancelledRef.current) {
      editCancelledRef.current = false
      return
    }
    const name = editName.trim()
    if (name && name !== space.name) onRenameSpace(space.id, name)
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-line bg-app">
      <div className="flex items-center gap-2 px-4 py-4">
        <span className="text-sm font-medium text-fg">Orca</span>
      </div>

      <div className="px-3 pb-2">
        <input
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') create()
          }}
          onBlur={create}
          placeholder="New space, press Enter"
          className="w-full rounded-md border border-line bg-panel-01 px-2.5 py-1.5 text-sm text-fg outline-none transition-[background-color,border-color] duration-[140ms] ease-spring placeholder:text-ter focus:border-line-strong"
        />
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
        {error && <p className="px-1 py-1 text-xs text-danger">{error}</p>}
        {spaces.map((space) => (
          <div key={space.id} className="group flex items-center rounded-md">
            {editingId === space.id ? (
              <input
                autoFocus
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    commitRename(space)
                    setEditingId(null)
                  }
                  if (event.key === 'Escape') {
                    editCancelledRef.current = true
                    setEditingId(null)
                  }
                }}
                onBlur={() => {
                  commitRename(space)
                  setEditingId(null)
                }}
                className="w-full rounded-md border border-line-strong bg-panel-01 px-2.5 py-1.5 text-sm text-fg outline-none"
              />
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onSelectSpace(space.id)}
                  className={`flex-1 truncate rounded-md px-2.5 py-1.5 text-left text-sm transition-colors duration-[140ms] ease-spring ${
                    selectedSpaceId === space.id
                      ? 'bg-panel-02 text-fg'
                      : 'text-sec hover:bg-panel hover:text-fg'
                  }`}
                >
                  {space.name}
                </button>
                <span className="hidden shrink-0 gap-0.5 pr-1 group-hover:flex">
                  <button
                    type="button"
                    title="Rename"
                    onClick={() => {
                      editCancelledRef.current = false
                      setEditingId(space.id)
                      setEditName(space.name)
                    }}
                    className="rounded px-1 py-0.5 text-xs text-ter transition-colors duration-[140ms] ease-spring hover:text-fg"
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    title="Delete"
                    onClick={() => {
                      if (window.confirm(`Delete space "${space.name}" and all its pages?`)) {
                        onDeleteSpace(space.id)
                      }
                    }}
                    className="rounded px-1 py-0.5 text-xs text-ter transition-colors duration-[140ms] ease-spring hover:text-danger"
                  >
                    Delete
                  </button>
                </span>
              </>
            )}
          </div>
        ))}
      </nav>

      <div className="border-t border-line px-4 py-3">
        <p className="text-xs text-ter">Agents arrive in Phase 2.</p>
      </div>
    </aside>
  )
}
