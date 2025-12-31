'use client'

import Image from 'next/image'
import { StoryNote } from '@/types/database'
import { GameIcon } from '@/components/icons/GameIcon'
import { Badge } from '@/components/ui/badge'
import { getNoteTypeConfig, NoteType } from './hooks/useNotesContext'
import { cn } from '@/lib/utils'

interface NotesSidebarItemProps {
  note: StoryNote
  isSelected: boolean
  onClick: () => void
}

export function NotesSidebarItem({ note, isSelected, onClick }: NotesSidebarItemProps) {
  const noteType = getNoteTypeConfig(note.note_type || 'general')

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left',
        'hover:bg-[var(--paper)] border-l-3',
        isSelected
          ? 'bg-[var(--paper)] border-l-[var(--teal)]'
          : 'border-l-transparent'
      )}
      style={{
        borderLeftColor: isSelected ? noteType.color : 'transparent',
      }}
    >
      {/* Thumbnail or Icon */}
      <div className="relative w-8 h-8 rounded overflow-hidden shrink-0 bg-[var(--paper)] flex items-center justify-center">
        {note.image_url ? (
          <Image
            src={note.image_url}
            alt={note.title}
            fill
            className="object-cover"
          />
        ) : (
          <span style={{ color: noteType.color }}>
            <GameIcon
              name={noteType.icon}
              category="ui"
              size={16}
            />
          </span>
        )}
      </div>

      {/* Title and info */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm truncate',
          isSelected ? 'font-medium text-[var(--ink)]' : 'text-[var(--ink-light)]'
        )}>
          {note.title}
        </p>
      </div>

      {/* Reveal badge */}
      {note.is_revealed ? (
        <Badge variant="outline" className="shrink-0 text-[10px] px-1.5 py-0 h-5 bg-[var(--teal)]/10 text-[var(--teal)] border-[var(--teal)]/30">
          Rivelato
        </Badge>
      ) : (
        <Badge variant="outline" className="shrink-0 text-[10px] px-1.5 py-0 h-5 bg-[var(--paper)] text-[var(--ink-light)] border-[var(--border)]">
          Nascosto
        </Badge>
      )}
    </button>
  )
}
