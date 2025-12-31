'use client'

import { Encounter } from '@/types/database'
import { GameIcon } from '@/components/icons/GameIcon'

interface CombatLogProps {
  encounters: (Encounter & { monsters?: string[] })[]
}

// Difficulty colors
const difficultyColors: Record<string, string> = {
  easy: 'text-[var(--teal)] bg-[var(--teal)]/10',
  medium: 'text-[var(--health-mid)] bg-amber-100',
  hard: 'text-orange-600 bg-orange-100',
  deadly: 'text-[var(--coral)] bg-[var(--coral)]/10',
}

export default function CombatLog({ encounters }: CombatLogProps) {
  if (encounters.length === 0) {
    return (
      <div className="parchment-card p-4">
        <h3 className="text-lg font-display font-semibold text-[var(--ink)] mb-4 flex items-center gap-2">
          <GameIcon name="combat" category="ui" size={20} className="text-[var(--teal)]" />
          Combattimenti
        </h3>
        <p className="text-[var(--ink-faded)] text-sm text-center py-4">
          Nessun combattimento completato
        </p>
      </div>
    )
  }

  return (
    <div className="parchment-card p-4">
      <h3 className="text-lg font-display font-semibold text-[var(--ink)] mb-4 flex items-center gap-2">
        <GameIcon name="combat" category="ui" size={20} className="text-[var(--teal)]" />
        Combattimenti
        <span className="text-xs text-[var(--ink-faded)] font-normal">({encounters.length})</span>
      </h3>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {encounters.map((encounter) => (
          <div
            key={encounter.id}
            className="bg-[var(--cream-dark)] rounded-lg p-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[var(--ink)] font-medium">{encounter.name}</div>
                {encounter.location && (
                  <div className="text-xs text-[var(--ink-faded)] flex items-center gap-1 mt-1">
                    <span className="text-[var(--teal)]">&#9679;</span> {encounter.location}
                  </div>
                )}
              </div>
              {encounter.difficulty && (
                <span className={`text-xs px-2 py-1 rounded font-medium ${difficultyColors[encounter.difficulty] || 'text-[var(--ink-light)] bg-[var(--cream)]'}`}>
                  {encounter.difficulty}
                </span>
              )}
            </div>

            {encounter.monsters && encounter.monsters.length > 0 && (
              <div className="mt-2 pt-2 border-t border-[var(--border-decorative)]">
                <div className="text-xs text-[var(--ink-light)] mb-1 flex items-center gap-1">
                  <GameIcon name="skull" category="ui" size={12} />
                  Nemici affrontati:
                </div>
                <div className="flex flex-wrap gap-1">
                  {encounter.monsters.map((monster, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2 py-0.5 bg-[var(--paper)] text-[var(--ink)] rounded border border-[var(--border-decorative)]"
                    >
                      {monster}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
