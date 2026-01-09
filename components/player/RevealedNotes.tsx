'use client'

import { useState } from 'react'
import Image from 'next/image'
import { StoryNote } from '@/types/database'
import { GameIcon } from '@/components/icons/GameIcon'
import { ImageLightbox } from '@/components/ui/ImageLightbox'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface RevealedNotesProps {
  notes: StoryNote[]
}

// Note type icons and labels
const noteTypeConfig: Record<string, { icon: string; label: string; color: string }> = {
  npc: { icon: 'masks', label: 'Personaggi', color: 'text-blue-600' },
  location: { icon: 'scroll', label: 'Luoghi', color: 'text-[var(--teal)]' },
  quest: { icon: 'combat', label: 'Missioni', color: 'text-[var(--health-mid)]' },
  lore: { icon: 'book', label: 'Storia', color: 'text-purple-600' },
  secret: { icon: 'skull', label: 'Segreti', color: 'text-pink-600' },
  general: { icon: 'quill', label: 'Note', color: 'text-[var(--ink-light)]' },
}

export default function RevealedNotes({ notes }: RevealedNotesProps) {
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set(['npc', 'quest']))
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set())
  const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string } | null>(null)

  if (notes.length === 0) {
    return (
      <div className="parchment-card p-4">
        <h3 className="text-lg font-display font-semibold text-[var(--ink)] mb-4 flex items-center gap-2">
          <GameIcon name="quill" category="ui" size={20} className="text-[var(--teal)]" />
          Note Rivelate
        </h3>
        <p className="text-[var(--ink-faded)] text-sm text-center py-4">
          Il DM non ha ancora rivelato nessuna nota
        </p>
      </div>
    )
  }

  // Group notes by type
  const groupedNotes = notes.reduce((acc, note) => {
    const type = note.note_type || 'general'
    if (!acc[type]) acc[type] = []
    acc[type].push(note)
    return acc
  }, {} as Record<string, StoryNote[]>)

  function toggleType(type: string) {
    setExpandedTypes((prev) => {
      const next = new Set(prev)
      if (next.has(type)) {
        next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }

  function toggleNote(noteId: string) {
    setExpandedNotes((prev) => {
      const next = new Set(prev)
      if (next.has(noteId)) {
        next.delete(noteId)
      } else {
        next.add(noteId)
      }
      return next
    })
  }

  return (
    <div className="parchment-card p-4">
      <h3 className="text-lg font-display font-semibold text-[var(--ink)] mb-4 flex items-center gap-2">
        <GameIcon name="quill" category="ui" size={20} className="text-[var(--teal)]" />
        Note Rivelate
        <span className="text-xs text-[var(--ink-faded)] font-normal">({notes.length})</span>
      </h3>

      <div className="space-y-2">
        {Object.entries(groupedNotes).map(([type, typeNotes]) => {
          const config = noteTypeConfig[type] || noteTypeConfig.general
          const isExpanded = expandedTypes.has(type)

          return (
            <div key={type} className="bg-[var(--cream-dark)] rounded-lg overflow-hidden">
              {/* Type Header */}
              <button
                onClick={() => toggleType(type)}
                className="w-full flex items-center justify-between p-3 hover:bg-[var(--ink)]/5 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <GameIcon name={config.icon} category="ui" size={16} className={config.color} />
                  <span className={`font-medium ${config.color}`}>{config.label}</span>
                  <span className="text-xs text-[var(--ink-faded)]">({typeNotes.length})</span>
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-[var(--ink-light)]" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-[var(--ink-light)]" />
                )}
              </button>

              {/* Notes List */}
              {isExpanded && (
                <div className="border-t border-[var(--border-decorative)]">
                  {typeNotes.map((note) => {
                    const isNoteExpanded = expandedNotes.has(note.id)

                    return (
                      <div
                        key={note.id}
                        className="border-b border-[var(--border-decorative)] last:border-b-0"
                      >
                        <button
                          onClick={() => toggleNote(note.id)}
                          className="w-full p-3 text-left hover:bg-[var(--ink)]/5 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {/* Image thumbnail or icon */}
                            {note.image_url ? (
                              <div className="relative w-8 h-8 rounded overflow-hidden shrink-0">
                                <Image
                                  src={note.image_url}
                                  alt={note.title}
                                  fill
                                  sizes="32px"
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <GameIcon
                                name={config.icon}
                                category="ui"
                                size={16}
                                className={config.color}
                              />
                            )}
                            <span className="flex-1 text-[var(--ink)]">{note.title}</span>
                            <span className="text-[var(--ink-light)] text-sm">
                              {isNoteExpanded ? '−' : '+'}
                            </span>
                          </div>
                          {note.tags && note.tags.length > 0 && (
                            <div className="flex gap-1 mt-1 ml-11">
                              {note.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="text-xs px-1.5 py-0.5 bg-[var(--paper)] text-[var(--ink-light)] rounded border border-[var(--border-decorative)]"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </button>

                        {isNoteExpanded && (
                          <div className="px-3 pb-3 space-y-3">
                            {/* Note image - clickable for lightbox */}
                            {note.image_url && (
                              <div
                                className="relative w-full max-w-sm h-48 rounded-lg overflow-hidden cursor-pointer border border-[var(--border-decorative)]"
                                onClick={() => setLightboxImage({ src: note.image_url!, alt: note.title })}
                              >
                                <Image
                                  src={note.image_url}
                                  alt={note.title}
                                  fill
                                  sizes="(max-width: 768px) 100vw, 384px"
                                  className="object-cover hover:scale-105 transition-transform"
                                />
                              </div>
                            )}

                            {/* Note content (player-visible only, dm_notes is NOT shown) */}
                            {note.content && (
                              <div className="text-[var(--ink)] text-sm whitespace-pre-wrap bg-[var(--paper)] rounded p-3 border border-[var(--border-decorative)]">
                                {note.content}
                              </div>
                            )}

                            {!note.content && !note.image_url && (
                              <p className="text-[var(--ink-faded)] text-sm italic">
                                Nessun contenuto aggiuntivo.
                              </p>
                            )}

                            <div className="text-xs text-[var(--ink-faded)]">
                              Aggiornato: {new Date(note.updated_at ?? new Date()).toLocaleDateString('it-IT')}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Image Lightbox */}
      <ImageLightbox
        src={lightboxImage?.src || null}
        alt={lightboxImage?.alt || ''}
        open={!!lightboxImage}
        onOpenChange={(open) => !open && setLightboxImage(null)}
      />
    </div>
  )
}
