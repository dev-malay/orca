import { useCallback, useEffect, useState } from 'react'
import type { Space } from '@repo/shared'
import { api } from './api'
import { Sidebar } from './components/Sidebar'
import { SpaceLibrary } from './components/SpaceLibrary'
import { PageEditor } from './components/PageEditor'

type View = { kind: 'library' } | { kind: 'page'; pageId: string }

export default function App() {
  const [spaces, setSpaces] = useState<Space[]>([])
  const [spacesError, setSpacesError] = useState<string | null>(null)
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null)
  const [view, setView] = useState<View>({ kind: 'library' })

  const refreshSpaces = useCallback(() => {
    api
      .listSpaces()
      .then((list) => {
        setSpaces(list)
        setSpacesError(null)
        setSelectedSpaceId((current) => current ?? list[0]?.id ?? null)
      })
      .catch(() => {
        setSpacesError('Failed to load spaces. Is the server running?')
      })
  }, [])

  useEffect(() => {
    refreshSpaces()
  }, [refreshSpaces])

  const selectedSpace = spaces.find((space) => space.id === selectedSpaceId) ?? null

  const handleCreateSpace = (name: string) => {
    api
      .createSpace(name)
      .then((space) => {
        refreshSpaces()
        setSelectedSpaceId(space.id)
        setView({ kind: 'library' })
      })
      .catch((cause) => {
        setSpacesError(cause instanceof Error ? cause.message : 'Failed to create space.')
      })
  }

  const handleRenameSpace = (id: string, name: string) => {
    api.renameSpace(id, name).then(refreshSpaces).catch(() => {
      setSpacesError('Failed to rename space.')
    })
  }

  const handleDeleteSpace = (id: string) => {
    api
      .deleteSpace(id)
      .then(() => {
        refreshSpaces()
        if (selectedSpaceId === id) {
          setSelectedSpaceId(null)
          setView({ kind: 'library' })
        }
      })
      .catch(() => {
        setSpacesError('Failed to delete space.')
      })
  }

  return (
    <div className="flex h-full">
      <Sidebar
        spaces={spaces}
        selectedSpaceId={selectedSpaceId}
        error={spacesError}
        onSelectSpace={(id) => {
          setSelectedSpaceId(id)
          setView({ kind: 'library' })
        }}
        onCreateSpace={handleCreateSpace}
        onRenameSpace={handleRenameSpace}
        onDeleteSpace={handleDeleteSpace}
      />

      <main className="min-w-0 flex-1 overflow-hidden">
        {!selectedSpace && (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="text-3xl font-medium tracking-tight text-fg">Orca</div>
            <p className="max-w-sm text-sm leading-relaxed text-sec">
              Create a Space on the left. Each Space holds pages of working documents. Your AI
              coworkers (Dots) arrive in Phase 2.
            </p>
          </div>
        )}

        {selectedSpace && view.kind === 'library' && (
          <SpaceLibrary
            space={selectedSpace}
            onOpenPage={(pageId) => setView({ kind: 'page', pageId })}
          />
        )}

        {selectedSpace && view.kind === 'page' && (
          <PageEditor
            key={view.pageId}
            space={selectedSpace}
            pageId={view.pageId}
            onBack={() => setView({ kind: 'library' })}
          />
        )}
      </main>
    </div>
  )
}
