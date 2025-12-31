'use client'

import { useState } from 'react'
import { Session } from '@/types/database'
import { GameIcon } from '@/components/icons/GameIcon'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface SessionsListProps {
  sessions: Session[]
}

export default function SessionsList({ sessions }: SessionsListProps) {
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)

  if (sessions.length === 0) {
    return (
      <div className="parchment-card p-4">
        <h3 className="text-lg font-display font-semibold text-[var(--ink)] mb-4 flex items-center gap-2">
          <GameIcon name="scroll" category="ui" size={20} className="text-[var(--teal)]" />
          Sessioni
        </h3>
        <p className="text-[var(--ink-faded)] text-sm text-center py-4">
          Nessuna sessione registrata ancora
        </p>
      </div>
    )
  }

  // Calculate total XP
  const totalXP = sessions.reduce((sum, s) => sum + (s.xp_awarded || 0), 0)

  return (
    <>
      <div className="parchment-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-display font-semibold text-[var(--ink)] flex items-center gap-2">
            <GameIcon name="scroll" category="ui" size={20} className="text-[var(--teal)]" />
            Sessioni
          </h3>
          <span className="text-xs text-[var(--health-mid)] bg-amber-100 px-2 py-1 rounded font-medium">
            {totalXP} XP totali
          </span>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => session.summary && setSelectedSession(session)}
              className={`bg-[var(--cream-dark)] rounded-lg p-3 transition-colors ${
                session.summary
                  ? 'hover:bg-[var(--ink)]/5 cursor-pointer'
                  : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--ink)] font-medium">
                      Sessione #{session.session_number}
                    </span>
                    {session.xp_awarded > 0 && (
                      <span className="text-xs text-[var(--health-mid)] font-medium">+{session.xp_awarded} XP</span>
                    )}
                  </div>
                  {session.play_date && (
                    <div className="text-xs text-[var(--ink-faded)] mt-1">
                      {new Date(session.play_date).toLocaleDateString('it-IT', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </div>
                  )}
                </div>
                {session.summary && (
                  <GameIcon name="book" category="ui" size={14} className="text-[var(--ink-faded)] mt-1" />
                )}
              </div>
              {session.summary && (
                <p className="text-[var(--ink-light)] text-sm mt-2 line-clamp-2">
                  {session.summary}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Session Detail Modal */}
      <Dialog open={!!selectedSession} onOpenChange={(open) => !open && setSelectedSession(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GameIcon name="scroll" category="ui" size={20} className="text-[var(--teal)]" />
              Sessione #{selectedSession?.session_number}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Date and XP */}
            <div className="flex items-center justify-between text-sm">
              {selectedSession?.play_date && (
                <span className="text-[var(--ink-light)]">
                  {new Date(selectedSession.play_date).toLocaleDateString('it-IT', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              )}
              {selectedSession?.xp_awarded && selectedSession.xp_awarded > 0 && (
                <span className="text-[var(--health-mid)] bg-amber-100 px-2 py-1 rounded font-medium">
                  +{selectedSession.xp_awarded} XP
                </span>
              )}
            </div>

            {/* Full Summary */}
            {selectedSession?.summary && (
              <div className="bg-[var(--cream-dark)] rounded-lg p-4">
                <h4 className="text-sm font-medium text-[var(--ink)] mb-2 flex items-center gap-2">
                  <GameIcon name="quill" category="ui" size={14} className="text-[var(--teal)]" />
                  Resoconto della Sessione
                </h4>
                <p className="text-[var(--ink-light)] text-sm whitespace-pre-wrap leading-relaxed">
                  {selectedSession.summary}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
