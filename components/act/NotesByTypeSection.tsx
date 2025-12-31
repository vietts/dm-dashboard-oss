'use client'

import { useState } from 'react'
import { StoryNote } from '@/types/database'
import { NoteCard } from './NoteCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GameIcon } from '@/components/icons/GameIcon'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

interface NoteType {
  value: string
  label: string
  icon: string
}

interface NotesByTypeSectionProps {
  notesByType: Record<string, StoryNote[]>
  noteTypes: readonly NoteType[]
  onCreate: (note: Partial<StoryNote>) => Promise<void>
  onUpdate: (id: string, updates: Partial<StoryNote>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function NotesByTypeSection({
  notesByType,
  noteTypes,
  onCreate,
  onUpdate,
  onDelete
}: NotesByTypeSectionProps) {
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set(['general']))
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [createForType, setCreateForType] = useState<string>('general')
  const [newNote, setNewNote] = useState({ title: '', content: '', dm_notes: '' })
  const [creating, setCreating] = useState(false)

  function toggleType(type: string) {
    setExpandedTypes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(type)) {
        newSet.delete(type)
      } else {
        newSet.add(type)
      }
      return newSet
    })
  }

  function openCreateDialog(type: string) {
    setCreateForType(type)
    setNewNote({ title: '', content: '', dm_notes: '' })
    setCreateDialogOpen(true)
  }

  async function handleCreate() {
    if (!newNote.title.trim()) return

    setCreating(true)
    await onCreate({
      title: newNote.title.trim(),
      content: newNote.content.trim() || null,
      dm_notes: newNote.dm_notes.trim() || null,
      note_type: createForType,
      is_revealed: false,
    })
    setCreating(false)
    setCreateDialogOpen(false)
    setNewNote({ title: '', content: '', dm_notes: '' })

    // Expand the type section if not already
    setExpandedTypes(prev => new Set(prev).add(createForType))
  }

  const totalNotes = Object.values(notesByType).reduce((sum, notes) => sum + notes.length, 0)

  return (
    <>
      <Card className="bg-[var(--parchment)] border-[var(--ink-faded)]/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-display text-[var(--ink)] flex items-center gap-2">
            <GameIcon name="quill" category="ui" size={20} className="text-[var(--teal)]" />
            Note
            <span className="text-sm font-normal text-[var(--ink-light)]">
              ({totalNotes})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {noteTypes.map((type) => {
            const notes = notesByType[type.value] || []
            const isExpanded = expandedTypes.has(type.value)

            return (
              <Collapsible
                key={type.value}
                open={isExpanded}
                onOpenChange={() => toggleType(type.value)}
              >
                <div className="border border-[var(--ink-faded)]/10 rounded-lg overflow-hidden">
                  {/* Section header */}
                  <div className="flex items-center bg-[var(--paper)]">
                    <CollapsibleTrigger asChild>
                      <button className="flex-1 flex items-center gap-3 p-3 hover:bg-[var(--ink)]/5 transition-colors text-left">
                        <span
                          className="text-[var(--ink-light)] transition-transform duration-200"
                          style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                        >
                          ▸
                        </span>
                        <GameIcon
                          name={type.icon}
                          category="ui"
                          size={18}
                          className="text-[var(--ink-light)]"
                        />
                        <span className="font-medium text-[var(--ink)]">
                          {type.label}
                        </span>
                        <span className="text-sm text-[var(--ink-light)]">
                          ({notes.length})
                        </span>
                      </button>
                    </CollapsibleTrigger>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        openCreateDialog(type.value)
                      }}
                      className="mr-2 text-[var(--teal)] hover:text-[var(--teal)] hover:bg-[var(--teal)]/10"
                    >
                      + Nota
                    </Button>
                  </div>

                  {/* Notes list */}
                  <CollapsibleContent>
                    <div className="p-3 pt-0 space-y-2">
                      {notes.length > 0 ? (
                        notes.map((note) => (
                          <NoteCard
                            key={note.id}
                            note={note}
                            noteType={type}
                            onUpdate={onUpdate}
                            onDelete={onDelete}
                          />
                        ))
                      ) : (
                        <p className="text-[var(--ink-light)] italic text-sm py-2 text-center">
                          Nessuna nota di tipo {type.label.toLowerCase()}.
                        </p>
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            )
          })}
        </CardContent>
      </Card>

      {/* Create Note Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GameIcon
                name={noteTypes.find(t => t.value === createForType)?.icon || 'book'}
                category="ui"
                size={20}
              />
              Nuova Nota
            </DialogTitle>
            <DialogDescription>
              Tipo: {noteTypes.find(t => t.value === createForType)?.label}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm text-[var(--ink-light)] mb-1 block">Titolo *</label>
              <Input
                value={newNote.title}
                onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Titolo della nota"
                autoFocus
              />
            </div>

            {/* DM Notes - Private */}
            <div>
              <label className="text-sm text-[var(--ink-light)] mb-1 flex items-center gap-2">
                <GameIcon name="skull" category="ui" size={14} className="text-[var(--coral)]" />
                Appunti DM (privati)
              </label>
              <Textarea
                value={newNote.dm_notes}
                onChange={(e) => setNewNote(prev => ({ ...prev, dm_notes: e.target.value }))}
                placeholder="Note solo per il DM (non visibili ai giocatori)..."
                rows={4}
                className="resize-none border-[var(--coral)]/30"
              />
            </div>

            {/* Player Content */}
            <div>
              <label className="text-sm text-[var(--ink-light)] mb-1 flex items-center gap-2">
                <GameIcon name="book" category="ui" size={14} className="text-[var(--teal)]" />
                Contenuto Giocatori
              </label>
              <Textarea
                value={newNote.content}
                onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Contenuto visibile ai giocatori (se rivelato)..."
                rows={5}
                className="resize-none border-[var(--teal)]/30"
              />
              <p className="text-xs text-[var(--ink-light)] mt-1">
                Potrai caricare un&apos;immagine dopo aver creato la nota (tramite Modifica)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleCreate} disabled={creating || !newNote.title.trim()}>
              {creating ? 'Creazione...' : 'Crea Nota'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
