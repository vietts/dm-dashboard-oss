'use client'

import { Button } from '@/components/ui/button'
import { GameIcon } from '@/components/icons/GameIcon'
import { Plus } from 'lucide-react'

interface NotesEmptyStateProps {
  onCreateNote?: () => void
  message?: string
}

export function NotesEmptyState({
  onCreateNote,
  message = 'Seleziona una nota dalla sidebar o creane una nuova'
}: NotesEmptyStateProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-[var(--paper)] flex items-center justify-center mb-4">
        <GameIcon name="book" category="ui" size={32} className="text-[var(--ink-light)]" />
      </div>
      <h3 className="text-lg font-display text-[var(--ink)] mb-2">
        Nessuna nota selezionata
      </h3>
      <p className="text-sm text-[var(--ink-light)] max-w-xs mb-6">
        {message}
      </p>
      {onCreateNote && (
        <Button onClick={onCreateNote} className="gap-2">
          <Plus size={16} />
          Crea Nota
        </Button>
      )}
    </div>
  )
}
