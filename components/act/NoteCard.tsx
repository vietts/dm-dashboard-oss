'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { StoryNote } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { GameIcon } from '@/components/icons/GameIcon'
import { ImageLightbox } from '@/components/ui/ImageLightbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface NoteCardProps {
  note: StoryNote
  noteType: { value: string; label: string; icon: string }
  onUpdate: (id: string, updates: Partial<StoryNote>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function NoteCard({ note, noteType, onUpdate, onDelete }: NoteCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(note.title)
  const [editContent, setEditContent] = useState(note.content || '')
  const [editDmNotes, setEditDmNotes] = useState(note.dm_notes || '')
  const [editImageUrl, setEditImageUrl] = useState(note.image_url || '')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('noteId', note.id)

      const res = await fetch('/api/note-image', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (data.success) {
        setEditImageUrl(data.url)
      } else {
        console.error('Upload failed:', data.error)
      }
    } catch (err) {
      console.error('Upload error:', err)
    } finally {
      setUploading(false)
    }
  }

  async function handleRemoveImage() {
    if (!editImageUrl) return

    try {
      await fetch('/api/note-image', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: editImageUrl }),
      })
      setEditImageUrl('')
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  async function handleSave() {
    if (!editTitle.trim()) return

    setSaving(true)
    await onUpdate(note.id, {
      title: editTitle.trim(),
      content: editContent.trim() || null,
      dm_notes: editDmNotes.trim() || null,
      image_url: editImageUrl || null,
    })
    setSaving(false)
    setIsEditing(false)
  }

  function handleCancel() {
    setEditTitle(note.title)
    setEditContent(note.content || '')
    setEditDmNotes(note.dm_notes || '')
    setEditImageUrl(note.image_url || '')
    setIsEditing(false)
  }

  async function handleToggleReveal() {
    await onUpdate(note.id, { is_revealed: !note.is_revealed })
  }

  async function handleDelete() {
    await onDelete(note.id)
    setConfirmDelete(false)
  }

  // Editing mode dialog
  if (isEditing) {
    return (
      <Dialog open={isEditing} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GameIcon name={noteType.icon} category="ui" size={20} />
              Modifica Nota
            </DialogTitle>
            <DialogDescription>
              {noteType.label}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4">
          <div className="space-y-4">
            {/* Image Upload */}
            <div>
              <label className="text-sm text-[var(--ink-light)] mb-2 block">Immagine (opzionale)</label>
              <div className="flex items-center gap-3">
                {editImageUrl ? (
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-[var(--ink-faded)]/20">
                    <Image
                      src={editImageUrl}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-lg border-2 border-dashed border-[var(--ink-faded)]/30 flex items-center justify-center">
                    <GameIcon name={noteType.icon} category="ui" size={24} className="text-[var(--ink-light)]" />
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? 'Caricamento...' : editImageUrl ? 'Cambia' : 'Carica'}
                  </Button>
                  {editImageUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveImage}
                      className="text-red-500 hover:text-red-600"
                    >
                      Rimuovi
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="text-sm text-[var(--ink-light)] mb-1 block">Titolo</label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
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
                value={editDmNotes}
                onChange={(e) => setEditDmNotes(e.target.value)}
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
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Contenuto visibile ai giocatori (se rivelato)..."
                rows={6}
                className="resize-none border-[var(--teal)]/30"
              />
              <p className="text-xs text-[var(--ink-light)] mt-1">
                Questo contenuto sarà visibile ai giocatori se la nota è &quot;Rivelata&quot;
              </p>
            </div>
          </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Annulla
            </Button>
            <Button onClick={handleSave} disabled={saving || !editTitle.trim()}>
              {saving ? 'Salvataggio...' : 'Salva'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <>
      <div className="bg-[var(--paper)] rounded border border-[var(--ink-faded)]/10 overflow-hidden">
        {/* Header - always visible */}
        <div
          className="flex items-center gap-3 p-3 cursor-pointer hover:bg-[var(--ink)]/5 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span className="text-[var(--ink-light)] transition-transform duration-200" style={{
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
          }}>
            ▸
          </span>
          {/* Image or Icon */}
          {note.image_url ? (
            <div className="relative w-8 h-8 rounded overflow-hidden shrink-0">
              <Image
                src={note.image_url}
                alt={note.title}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <GameIcon
              name={noteType.icon}
              category="ui"
              size={18}
              className="text-[var(--teal)]"
            />
          )}
          <span className="flex-1 font-medium text-[var(--ink)] truncate">
            {note.title}
          </span>

          {/* Badges */}
          <div className="flex items-center gap-2">
            {note.is_revealed ? (
              <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                Rivelato
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs text-[var(--ink-light)]">
                Nascosto
              </Badge>
            )}
          </div>
        </div>

        {/* Expanded content */}
        {isExpanded && (
          <div className="border-t border-[var(--ink-faded)]/10 p-3 space-y-3 animate-in slide-in-from-top-2 duration-200">
            {/* Image preview */}
            {note.image_url && (
              <div
                className="relative w-full max-w-xs h-40 rounded-lg overflow-hidden cursor-pointer border border-[var(--ink-faded)]/20"
                onClick={(e) => {
                  e.stopPropagation()
                  setLightboxOpen(true)
                }}
              >
                <Image
                  src={note.image_url}
                  alt={note.title}
                  fill
                  className="object-cover hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
                  <span className="opacity-0 hover:opacity-100 text-white text-sm bg-black/50 px-2 py-1 rounded">
                    Clicca per ingrandire
                  </span>
                </div>
              </div>
            )}

            {/* DM Notes - Private */}
            {note.dm_notes && (
              <div className="bg-[var(--coral)]/5 rounded-lg p-3 border border-[var(--coral)]/20">
                <div className="flex items-center gap-2 mb-2">
                  <GameIcon name="skull" category="ui" size={14} className="text-[var(--coral)]" />
                  <span className="text-xs font-medium text-[var(--coral)]">Appunti DM (privati)</span>
                </div>
                <div className="text-[var(--ink)] text-sm whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                  {note.dm_notes}
                </div>
              </div>
            )}

            {/* Player Content */}
            {note.content ? (
              <div className="bg-[var(--teal)]/5 rounded-lg p-3 border border-[var(--teal)]/20">
                <div className="flex items-center gap-2 mb-2">
                  <GameIcon name="book" category="ui" size={14} className="text-[var(--teal)]" />
                  <span className="text-xs font-medium text-[var(--teal)]">
                    Contenuto Giocatori {note.is_revealed ? '(visibile)' : '(nascosto)'}
                  </span>
                </div>
                <div className="text-[var(--ink)] text-sm whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                  {note.content}
                </div>
              </div>
            ) : !note.dm_notes && (
              <p className="text-[var(--ink-light)] italic text-sm">
                Nessun contenuto.
              </p>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--ink-faded)]/10">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsEditing(true)
                }}
              >
                <GameIcon name="quill" category="ui" size={12} className="mr-1" />
                Modifica
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggleReveal()
                }}
              >
                {note.is_revealed ? 'Nascondi' : 'Rivela'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  setConfirmDelete(true)
                }}
                className="text-red-500 hover:text-red-600 hover:border-red-300"
              >
                Elimina
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Image Lightbox */}
      <ImageLightbox
        src={note.image_url}
        alt={note.title}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
      />

      {/* Delete confirmation dialog */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminare questa nota?</DialogTitle>
            <DialogDescription>
              Stai per eliminare "{note.title}". Questa azione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Annulla
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Elimina
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
