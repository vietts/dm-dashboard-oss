'use client'

import { useState } from 'react'
import { PlayerNote } from '@/types/database'
import { GameIcon } from '@/components/icons/GameIcon'
import { Pencil, Trash2 } from 'lucide-react'

interface PlayerNotesProps {
  playerId: string
  notes: PlayerNote[]
  onUpdate: () => void
  readOnly?: boolean
}

export default function PlayerNotes({ playerId, notes, onUpdate, readOnly = false }: PlayerNotesProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newNote, setNewNote] = useState({ title: '', content: '' })
  const [editNote, setEditNote] = useState({ title: '', content: '' })
  const [loading, setLoading] = useState(false)

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault()
    if (!newNote.title.trim() && !newNote.content.trim()) return

    setLoading(true)
    try {
      const res = await fetch('/api/player-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, ...newNote }),
      })
      if (res.ok) {
        setNewNote({ title: '', content: '' })
        setIsAdding(false)
        onUpdate()
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateNote(noteId: string) {
    setLoading(true)
    try {
      await fetch('/api/player-notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: noteId, ...editNote }),
      })
      setEditingId(null)
      onUpdate()
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteNote(noteId: string) {
    if (!confirm('Eliminare questa nota?')) return
    setLoading(true)
    try {
      await fetch(`/api/player-notes?id=${noteId}`, { method: 'DELETE' })
      onUpdate()
    } finally {
      setLoading(false)
    }
  }

  function startEditing(note: PlayerNote) {
    setEditingId(note.id)
    setEditNote({ title: note.title || '', content: note.content || '' })
  }

  return (
    <div className="parchment-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-display font-semibold text-[var(--ink)] flex items-center gap-2">
          <GameIcon name="quill" category="ui" size={20} className="text-[var(--teal)]" />
          {readOnly ? 'Note Giocatore' : 'I Miei Appunti'}
        </h3>
        {!readOnly && (
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="px-2 py-1 text-xs bg-[var(--teal)] hover:bg-[var(--teal-dark)] text-white rounded transition-colors"
          >
            + Nuova nota
          </button>
        )}
      </div>

      {/* Add Note Form */}
      {!readOnly && isAdding && (
        <form onSubmit={handleAddNote} className="mb-4 p-3 bg-[var(--cream-dark)] rounded-lg">
          <input
            type="text"
            placeholder="Titolo (opzionale)"
            value={newNote.title}
            onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
            className="w-full px-2 py-1 bg-[var(--paper)] border border-[var(--border-decorative)] rounded text-sm text-[var(--ink)] placeholder:text-[var(--ink-faded)] mb-2"
            autoFocus
          />
          <textarea
            placeholder="Scrivi i tuoi appunti..."
            value={newNote.content}
            onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
            className="w-full px-2 py-1 bg-[var(--paper)] border border-[var(--border-decorative)] rounded text-sm text-[var(--ink)] placeholder:text-[var(--ink-faded)] mb-2 min-h-[80px] resize-y"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading || (!newNote.title.trim() && !newNote.content.trim())}
              className="px-3 py-1 bg-[var(--teal)] hover:bg-[var(--teal-dark)] disabled:bg-[var(--ink-faded)] text-white text-sm rounded transition-colors"
            >
              Salva
            </button>
            <button
              type="button"
              onClick={() => { setIsAdding(false); setNewNote({ title: '', content: '' }) }}
              className="px-3 py-1 bg-[var(--cream)] hover:bg-[var(--ink)]/10 text-[var(--ink)] text-sm rounded border border-[var(--border-decorative)] transition-colors"
            >
              Annulla
            </button>
          </div>
        </form>
      )}

      {/* Notes List */}
      {notes.length === 0 ? (
        <p className="text-[var(--ink-faded)] text-sm text-center py-4">
          Nessun appunto. Clicca &quot;Nuova nota&quot; per iniziare!
        </p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {notes.map((note) => (
            <div key={note.id} className="bg-[var(--cream-dark)] rounded-lg p-3">
              {editingId === note.id ? (
                <div>
                  <input
                    type="text"
                    value={editNote.title}
                    onChange={(e) => setEditNote({ ...editNote, title: e.target.value })}
                    className="w-full px-2 py-1 bg-[var(--paper)] border border-[var(--border-decorative)] rounded text-sm text-[var(--ink)] mb-2"
                    placeholder="Titolo"
                  />
                  <textarea
                    value={editNote.content}
                    onChange={(e) => setEditNote({ ...editNote, content: e.target.value })}
                    className="w-full px-2 py-1 bg-[var(--paper)] border border-[var(--border-decorative)] rounded text-sm text-[var(--ink)] mb-2 min-h-[60px]"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateNote(note.id)}
                      disabled={loading}
                      className="px-2 py-1 bg-[var(--teal)] hover:bg-[var(--teal-dark)] text-white text-xs rounded transition-colors"
                    >
                      Salva
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-2 py-1 bg-[var(--cream)] hover:bg-[var(--ink)]/10 text-[var(--ink)] text-xs rounded border border-[var(--border-decorative)] transition-colors"
                    >
                      Annulla
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {note.title && (
                        <h4 className="text-[var(--ink)] font-medium text-sm mb-1">{note.title}</h4>
                      )}
                      {note.content && (
                        <p className="text-[var(--ink-light)] text-sm whitespace-pre-wrap">{note.content}</p>
                      )}
                    </div>
                    {!readOnly && (
                      <div className="flex gap-1 ml-2">
                        <button
                          onClick={() => startEditing(note)}
                          className="text-[var(--ink-faded)] hover:text-[var(--teal)] p-1 transition-colors"
                          title="Modifica"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-[var(--ink-faded)] hover:text-[var(--coral)] p-1 transition-colors"
                          title="Elimina"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-[var(--ink-faded)] mt-2">
                    {new Date(note.updated_at ?? new Date()).toLocaleDateString('it-IT')}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
