'use client'

import { useState } from 'react'
import Image from 'next/image'
import { StoryNote, Monster } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GameIcon } from '@/components/icons/GameIcon'
import { ImageLightbox } from '@/components/ui/ImageLightbox'
import { NPCStatBlock } from './NPCStatBlock'
import { NoteEditor } from './NoteEditor'
import { getNoteTypeConfig, useNotes } from './hooks/useNotesContext'
import { Pencil, Trash2, Eye, EyeOff, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface NoteDetailProps {
  note: StoryNote
  monster?: Monster | null
  onClose?: () => void
}

export function NoteDetail({ note, monster, onClose }: NoteDetailProps) {
  const { updateNote, deleteNote, isEditing, setIsEditing } = useNotes()
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [saving, setSaving] = useState(false)

  const noteType = getNoteTypeConfig(note.note_type || 'general')
  const isNpc = note.note_type === 'npc'

  // Toggle reveal
  async function handleToggleReveal() {
    setSaving(true)
    await updateNote(note.id, { is_revealed: !note.is_revealed })
    setSaving(false)
  }

  // Delete note
  async function handleDelete() {
    setSaving(true)
    await deleteNote(note.id)
    setSaving(false)
    setConfirmDelete(false)
  }

  // If editing, show editor
  if (isEditing) {
    return (
      <NoteEditor
        note={note}
        onCancel={() => setIsEditing(false)}
      />
    )
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] shrink-0">
        <div className="flex items-center gap-2">
          <GameIcon
            name={noteType.icon}
            category="ui"
            size={20}
            className={`text-[${noteType.color}]`}
          />
          <span className="text-sm font-medium text-[var(--ink-light)]">
            {noteType.label}
          </span>
          {note.is_revealed ? (
            <Badge className="bg-[var(--teal)]/10 text-[var(--teal)] border-[var(--teal)]/30">
              Rivelato
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[var(--ink-light)]">
              Nascosto
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="h-8 w-8 p-0"
          >
            <Pencil size={16} />
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 lg:hidden ml-1"
            >
              <X size={16} />
            </Button>
          )}
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        {/* Hero Image */}
        {note.image_url && (
          <div
            className="relative w-full h-48 bg-[var(--paper)] cursor-pointer"
            onClick={() => setLightboxOpen(true)}
          >
            <Image
              src={note.image_url}
              alt={note.title}
              fill
              className="object-cover"
            />
          </div>
        )}

        <div className="p-4 space-y-4">
          {/* Title */}
          <h1 className="text-2xl font-display text-[var(--ink)]">
            {note.title}
          </h1>

          {/* NPC Stat Block */}
          {isNpc && (
            <NPCStatBlock note={note} monster={monster} />
          )}

          {/* DM Notes Box - coral background */}
          {note.dm_notes && (
            <div className="rounded-lg border border-[var(--coral)]/30 bg-[var(--coral)]/5 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-[var(--coral)] mb-2">
                <GameIcon name="skull" category="ui" size={16} />
                Note DM (private)
              </div>
              <div className="text-sm text-[var(--ink)] whitespace-pre-wrap">
                {note.dm_notes}
              </div>
            </div>
          )}

          {/* Player Content Box - teal background */}
          {note.content && (
            <div className="rounded-lg border border-[var(--teal)]/30 bg-[var(--teal)]/5 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-[var(--teal)] mb-2">
                <GameIcon name="book" category="ui" size={16} />
                Contenuto Giocatori
                {note.is_revealed && (
                  <Badge className="text-[10px] bg-[var(--teal)] text-white ml-auto">
                    Visibile
                  </Badge>
                )}
              </div>
              <div className="text-sm text-[var(--ink)] whitespace-pre-wrap">
                {note.content}
              </div>
            </div>
          )}

          {/* Empty content message */}
          {!note.dm_notes && !note.content && !isNpc && (
            <div className="text-center py-8 text-[var(--ink-light)]">
              <p className="text-sm">Questa nota non ha ancora contenuto.</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setIsEditing(true)}
              >
                <Pencil size={14} className="mr-2" />
                Aggiungi contenuto
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Actions Footer */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-[var(--border)] shrink-0 bg-[var(--paper)]">
        <Button
          variant="outline"
          size="sm"
          onClick={handleToggleReveal}
          disabled={saving}
          className="gap-2"
        >
          {note.is_revealed ? (
            <>
              <EyeOff size={14} />
              Nascondi
            </>
          ) : (
            <>
              <Eye size={14} />
              Rivela ai Giocatori
            </>
          )}
        </Button>

        <div className="flex-1" />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setConfirmDelete(true)}
          disabled={saving}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 size={14} />
        </Button>
      </div>

      {/* Lightbox */}
      {note.image_url && (
        <ImageLightbox
          src={note.image_url}
          alt={note.title}
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Elimina nota</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare "{note.title}"? Questa azione non puo essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Annulla
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? 'Eliminazione...' : 'Elimina'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
