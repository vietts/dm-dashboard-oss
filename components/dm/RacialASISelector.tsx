'use client'

import { useState, useEffect } from 'react'
import type { RacialASIChoice, AbilityName } from '@/types/database'
import { ABILITY_LABELS, ALL_ABILITIES } from '@/lib/level-up-utils'

interface RacialASISelectorProps {
  /** Number of abilities to choose (e.g., 2 for Half-Elf) */
  count: number
  /** Bonus per ability (e.g., 1 for Half-Elf) */
  bonus: number
  /** Abilities to exclude from selection (e.g., ['cha'] for Half-Elf) */
  exclude: string[]
  /** Callback when choices change */
  onChange: (choices: RacialASIChoice[]) => void
  /** Current choices (for controlled component) */
  value?: RacialASIChoice[]
}

export default function RacialASISelector({
  count,
  bonus,
  exclude,
  onChange,
  value = []
}: RacialASISelectorProps) {
  const [selections, setSelections] = useState<(AbilityName | '')[]>(
    value.map(v => v.ability) || Array(count).fill('')
  )

  // Available abilities (excluding already selected and excluded ones)
  const availableAbilities = ALL_ABILITIES.filter(
    ability => !exclude.includes(ability)
  )

  // Update parent when selections change
  useEffect(() => {
    const validChoices: RacialASIChoice[] = selections
      .filter((s): s is AbilityName => s !== '')
      .map(ability => ({ ability, bonus }))

    onChange(validChoices)
  }, [selections, bonus, onChange])

  // Handle selection change
  function handleSelectionChange(index: number, ability: AbilityName | '') {
    const newSelections = [...selections]
    newSelections[index] = ability
    setSelections(newSelections)
  }

  // Get options for a dropdown (exclude already selected in other dropdowns)
  function getOptionsForIndex(index: number): AbilityName[] {
    const selectedElsewhere = selections.filter((s, i) => i !== index && s !== '')
    return availableAbilities.filter(a => !selectedElsewhere.includes(a as AbilityName))
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-[var(--ink-light)]">
        Scegli {count} attribut{count === 1 ? 'o' : 'i'} per +{bonus} ciascuno:
      </div>

      <div className="flex flex-wrap gap-2">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="flex items-center gap-2">
            <select
              value={selections[index] || ''}
              onChange={(e) => handleSelectionChange(index, e.target.value as AbilityName | '')}
              className="px-3 py-2 bg-[var(--paper)] border border-[var(--border-decorative)] rounded text-[var(--ink)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--teal)]"
            >
              <option value="">Scegli...</option>
              {getOptionsForIndex(index).map(ability => (
                <option key={ability} value={ability}>
                  {ABILITY_LABELS[ability].full} ({ABILITY_LABELS[ability].short})
                </option>
              ))}
            </select>
            <span className="text-[var(--teal)] font-semibold">+{bonus}</span>
          </div>
        ))}
      </div>

      {/* Validation message */}
      {selections.filter(s => s !== '').length < count && (
        <div className="text-xs text-[var(--health-mid)]">
          Seleziona {count - selections.filter(s => s !== '').length} altr{count - selections.filter(s => s !== '').length === 1 ? 'o attributo' : 'i attributi'}
        </div>
      )}
    </div>
  )
}
