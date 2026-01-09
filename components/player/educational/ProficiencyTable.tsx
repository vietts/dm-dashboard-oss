/**
 * Proficiency Bonus Table Component
 *
 * Displays the D&D 5e proficiency bonus progression table,
 * highlighting the current character level.
 *
 * Shows:
 * - Level ranges (1-4, 5-8, 9-12, 13-16, 17-20)
 * - Corresponding proficiency bonus (+2 to +6)
 * - Highlights current level range
 */

interface ProficiencyTableProps {
  currentLevel: number
  currentBonus: number
}

export default function ProficiencyTable({ currentLevel, currentBonus }: ProficiencyTableProps) {
  const proficiencyRanges = [
    { levels: '1-4', bonus: 2 },
    { levels: '5-8', bonus: 3 },
    { levels: '9-12', bonus: 4 },
    { levels: '13-16', bonus: 5 },
    { levels: '17-20', bonus: 6 },
  ]

  /**
   * Check if the current level falls within a range
   */
  const isCurrentRange = (range: string): boolean => {
    const [min, max] = range.split('-').map(Number)
    return currentLevel >= min && currentLevel <= max
  }

  return (
    <div className="proficiency-table p-3 min-w-[200px]">
      <div className="font-semibold text-sm mb-3 text-[var(--cream)]">
        Bonus di Competenza per Livello
      </div>

      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[var(--cream)]/30">
            <th className="text-left py-2 text-[var(--cream)]/80 font-medium">Livello</th>
            <th className="text-right py-2 text-[var(--cream)]/80 font-medium">Bonus</th>
          </tr>
        </thead>
        <tbody>
          {proficiencyRanges.map((range) => {
            const isCurrent = isCurrentRange(range.levels)
            return (
              <tr
                key={range.levels}
                className={`${
                  isCurrent
                    ? 'bg-[var(--teal)]/20 font-bold'
                    : 'hover:bg-white/5'
                } transition-colors`}
              >
                <td className="py-2 text-[var(--cream)]">
                  {range.levels}
                  {isCurrent && (
                    <span className="ml-2 text-[var(--teal-light)] text-xs">← Sei qui</span>
                  )}
                </td>
                <td className="text-right font-mono font-bold text-[var(--cream)]">
                  +{range.bonus}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className="mt-3 pt-3 border-t border-[var(--cream)]/30 text-xs text-[var(--cream)]/80 italic space-y-1">
        <p>Il bonus si aggiunge ogni volta che fai qualcosa in cui sei competente.</p>
        <p className="font-semibold text-[var(--teal-light)]">
          Il tuo bonus attuale: +{currentBonus}
        </p>
      </div>

      <div className="mt-3 pt-3 border-t border-[var(--cream)]/30 text-xs text-[var(--cream)]/80">
        <div className="font-semibold mb-1 text-[var(--cream)]">Esempi di utilizzo:</div>
        <ul className="list-disc list-inside space-y-0.5">
          <li>Attacchi con armi competenti</li>
          <li>Prove di abilità competenti</li>
          <li>Tiri salvezza competenti</li>
          <li>CD degli incantesimi</li>
        </ul>
      </div>
    </div>
  )
}
