'use client'

import { useState, useCallback } from 'react'
import { StoryNote, Monster } from '@/types/database'
import { Card } from '@/components/ui/card'
import { GameIcon } from '@/components/icons/GameIcon'
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { NotesSidebar } from './NotesSidebar'
import { NoteDetail } from './NoteDetail'
import { NoteEditor } from './NoteEditor'
import { NotesEmptyState } from './NotesEmptyState'
import { NotesProvider, useNotes, NoteTypeValue } from './hooks/useNotesContext'

interface NotesLayoutProps {
  campaignId: string
  notes: StoryNote[]
  monsters: Monster[]
  onCreateNote: (data: Partial<StoryNote>) => Promise<void>
  onUpdateNote: (id: string, updates: Partial<StoryNote>) => Promise<void>
  onDeleteNote: (id: string) => Promise<void>
  onMonsterCreated?: (monster: Monster) => void
}

// Inner component that uses the context
function NotesLayoutInner() {
  const {
    selectedNote,
    selectedNoteMonster,
    isMobilePanelOpen,
    setIsMobilePanelOpen,
    createNote,
  } = useNotes()

  // State for create mode
  const [isCreating, setIsCreating] = useState(false)
  const [createType, setCreateType] = useState<NoteTypeValue>('general')

  // Handle create note from sidebar
  const handleCreateFromSidebar = useCallback((type: NoteTypeValue) => {
    setCreateType(type)
    setIsCreating(true)
  }, [])

  // Handle create note submission
  const handleCreate = useCallback(async (data: Partial<StoryNote>) => {
    await createNote({ ...data, note_type: createType })
    setIsCreating(false)
  }, [createNote, createType])

  // Handle close create
  const handleCancelCreate = useCallback(() => {
    setIsCreating(false)
  }, [])

  // Handle close mobile panel
  const handleCloseMobile = useCallback(() => {
    setIsMobilePanelOpen(false)
  }, [setIsMobilePanelOpen])

  return (
    <Card className="overflow-hidden bg-[var(--parchment)] border-[var(--ink-faded)]/20">
      {/* Section Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)] bg-[var(--paper)]">
        <GameIcon name="book" category="ui" size={20} className="text-[var(--teal)]" />
        <h2 className="text-lg font-display text-[var(--ink)]">Note della Storia</h2>
      </div>

      {/* Desktop Layout - Resizable Panels */}
      <div className="hidden lg:block h-[600px]">
        <ResizablePanelGroup direction="horizontal">
          {/* Sidebar Panel */}
          <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
            <NotesSidebar onCreateNote={handleCreateFromSidebar} />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Main Panel */}
          <ResizablePanel defaultSize={65}>
            {isCreating ? (
              <NoteEditor
                defaultType={createType}
                onCancel={handleCancelCreate}
                onCreate={handleCreate}
              />
            ) : selectedNote ? (
              <NoteDetail
                note={selectedNote}
                monster={selectedNoteMonster}
              />
            ) : (
              <NotesEmptyState
                onCreateNote={() => handleCreateFromSidebar('general')}
              />
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Mobile Layout - Full width sidebar + Sheet for detail */}
      <div className="lg:hidden h-[500px]">
        <NotesSidebar onCreateNote={handleCreateFromSidebar} />

        {/* Mobile Detail Sheet */}
        <Sheet open={isMobilePanelOpen || isCreating} onOpenChange={(open) => {
          if (!open) {
            setIsMobilePanelOpen(false)
            setIsCreating(false)
          }
        }}>
          <SheetContent side="bottom" className="h-[85vh] p-0 rounded-t-2xl">
            <VisuallyHidden>
              <SheetTitle>
                {isCreating ? 'Nuova Nota' : selectedNote?.title || 'Dettaglio Nota'}
              </SheetTitle>
              <SheetDescription>
                Pannello dettaglio nota
              </SheetDescription>
            </VisuallyHidden>
            {isCreating ? (
              <NoteEditor
                defaultType={createType}
                onCancel={handleCancelCreate}
                onCreate={handleCreate}
              />
            ) : selectedNote ? (
              <NoteDetail
                note={selectedNote}
                monster={selectedNoteMonster}
                onClose={handleCloseMobile}
              />
            ) : null}
          </SheetContent>
        </Sheet>
      </div>
    </Card>
  )
}

// Main export with provider
export function NotesLayout({
  campaignId,
  notes,
  monsters,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
  onMonsterCreated,
}: NotesLayoutProps) {
  return (
    <NotesProvider
      campaignId={campaignId}
      notes={notes}
      monsters={monsters}
      onCreateNote={onCreateNote}
      onUpdateNote={onUpdateNote}
      onDeleteNote={onDeleteNote}
      onMonsterCreated={onMonsterCreated}
    >
      <NotesLayoutInner />
    </NotesProvider>
  )
}
