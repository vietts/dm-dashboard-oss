'use client'

import { useState, useEffect } from 'react'
import { X, ChevronUp, Sparkles } from 'lucide-react'
import type { ASIChoice, AbilityName, LevelUpData } from '@/types/database'

// Minimal character data required for level-up dialog
interface LevelUpCharacter {
  name: string
  level: number
  class: string | null
  max_hp: number
  str: number
  dex: number
  con: number
  int: number
  wis: number
  cha: number
}
import { GameIcon } from '@/components/icons/GameIcon'
import {
  getHitDie,
  getModifier,
  calculateHPGain,
  hasASIAtLevel,
  validateASIChoices,
  applyASI,
  wouldExceedCap,
  ABILITY_LABELS,
  ALL_ABILITIES,
} from '@/lib/level-up-utils'

interface LevelUpDialogProps {
  character: LevelUpCharacter
  open: boolean
  onOpenChange: (open: boolean) => void
  onLevelUp: (data: LevelUpData) => Promise<void>
}

export default function LevelUpDialog({
  character,
  open,
  onOpenChange,
  onLevelUp
}: LevelUpDialogProps) {
  const [hpRoll, setHpRoll] = useState<number | ''>('')
  const [asiMode, setAsiMode] = useState<'two' | 'one'>('two') // +2 to one OR +1 to two
  const [asiChoice1, setAsiChoice1] = useState<AbilityName | ''>('')
  const [asiChoice2, setAsiChoice2] = useState<AbilityName | ''>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const newLevel = character.level + 1
  const hitDie = getHitDie(character.class)
  const conMod = getModifier(character.con)
  const hasASI = hasASIAtLevel(character.class, newLevel)

  // Calculate HP gain
  const hpGain = hpRoll !== '' ? calculateHPGain(hpRoll, character.con) : null

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setHpRoll('')
      setAsiMode('two')
      setAsiChoice1('')
      setAsiChoice2('')
      setError(null)
    }
  }, [open])

  // Build ASI choices based on mode
  function getASIChoices(): ASIChoice[] {
    if (!hasASI) return []

    if (asiMode === 'one' && asiChoice1) {
      return [{ ability: asiChoice1, bonus: 2 }]
    }

    if (asiMode === 'two') {
      const choices: ASIChoice[] = []
      if (asiChoice1) choices.push({ ability: asiChoice1, bonus: 1 })
      if (asiChoice2) choices.push({ ability: asiChoice2, bonus: 1 })
      return choices
    }

    return []
  }

  // Validate form
  function validateForm(): { valid: boolean; error?: string } {
    // Check HP roll
    if (hpRoll === '' || hpRoll < 1 || hpRoll > hitDie) {
      return { valid: false, error: `Il tiro del dado vita deve essere tra 1 e ${hitDie}` }
    }

    // Check level cap
    if (newLevel > 20) {
      return { valid: false, error: 'Il livello massimo è 20' }
    }

    // Check ASI if applicable
    if (hasASI) {
      const asiChoices = getASIChoices()
      const validation = validateASIChoices(asiChoices)
      if (!validation.valid) {
        return { valid: false, error: validation.error }
      }

      // Check for cap exceed
      const currentStats = {
        str: character.str,
        dex: character.dex,
        con: character.con,
        int: character.int,
        wis: character.wis,
        cha: character.cha
      }
      const capCheck = wouldExceedCap(currentStats, asiChoices)
      if (capCheck.exceeds) {
        const abilityNames = capCheck.abilities.map(a => ABILITY_LABELS[a].full).join(', ')
        return { valid: false, error: `${abilityNames} supererebbe il massimo di 20` }
      }
    }

    return { valid: true }
  }

  // Handle submit
  async function handleSubmit() {
    const validation = validateForm()
    if (!validation.valid) {
      setError(validation.error || 'Errore di validazione')
      return
    }

    if (hpRoll === '') return

    setLoading(true)
    setError(null)

    try {
      const levelUpData: LevelUpData = {
        newLevel,
        hpRoll,
        conModifier: conMod,
        totalHPGain: hpGain?.total || 0,
        hasASI,
        asiChoices: hasASI ? getASIChoices() : undefined
      }

      await onLevelUp(levelUpData)
      onOpenChange(false)
    } catch (err) {
      setError('Errore durante il level-up')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Get available abilities for ASI dropdown (exclude already selected in other dropdown)
  function getAvailableAbilities(exclude?: AbilityName): AbilityName[] {
    return ALL_ABILITIES.filter(a => a !== exclude)
  }

  // Preview new stats after ASI
  function getPreviewStats() {
    const currentStats = {
      str: character.str,
      dex: character.dex,
      con: character.con,
      int: character.int,
      wis: character.wis,
      cha: character.cha
    }
    if (!hasASI) return currentStats
    return applyASI(currentStats, getASIChoices())
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="parchment-card p-6 max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header - fixed */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--teal)]/20 flex items-center justify-center">
              <ChevronUp className="w-6 h-6 text-[var(--teal)]" />
            </div>
            <div>
              <h2 className="font-display text-xl text-[var(--ink)]">Level Up!</h2>
              <p className="text-sm text-[var(--ink-light)]">{character.name}</p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 text-[var(--ink-light)] hover:text-[var(--ink)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto">
        {/* Level Display */}
        <div className="text-center mb-6 py-4 bg-[var(--cream-dark)] rounded-lg">
          <div className="text-[var(--ink-light)] text-sm mb-1">Livello</div>
          <div className="flex items-center justify-center gap-3">
            <span className="text-3xl font-display text-[var(--ink)]">{character.level}</span>
            <span className="text-2xl text-[var(--ink-light)]">→</span>
            <span className="text-3xl font-display text-[var(--teal)]">{newLevel}</span>
          </div>
        </div>

        {/* HP Section */}
        <div className="mb-6">
          <h3 className="font-display text-lg text-[var(--ink)] mb-3 flex items-center gap-2">
            <GameIcon name="heart" category="ui" size={20} className="text-[var(--coral)]" />
            Punti Ferita
          </h3>

          <div className="bg-[var(--cream-dark)] rounded-lg p-4 space-y-3">
            {/* Hit Die Info */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--ink-light)]">Dado Vita ({character.class}):</span>
              <span className="font-semibold text-[var(--ink)]">d{hitDie}</span>
            </div>

            {/* HP Roll Input */}
            <div>
              <label className="block text-sm text-[var(--ink-light)] mb-1">
                Risultato del tiro:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={hitDie}
                  value={hpRoll}
                  onChange={(e) => setHpRoll(e.target.value ? parseInt(e.target.value) : '')}
                  placeholder={`1-${hitDie}`}
                  className="w-20 px-3 py-2 bg-[var(--paper)] border border-[var(--border-decorative)] rounded text-center text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--teal)]"
                />
                <span className="text-[var(--ink-light)]">+</span>
                <span className="px-3 py-2 bg-[var(--paper)] border border-[var(--border-decorative)] rounded text-[var(--ink)]">
                  {conMod >= 0 ? `+${conMod}` : conMod} COS
                </span>
                <span className="text-[var(--ink-light)]">=</span>
                <span className={`px-3 py-2 font-semibold rounded ${
                  hpGain ? 'bg-[var(--teal)] text-white' : 'bg-[var(--cream)] text-[var(--ink-faded)]'
                }`}>
                  {hpGain ? `+${hpGain.total} HP` : '?'}
                </span>
              </div>
              <p className="text-xs text-[var(--ink-faded)] mt-1">
                HP attuali: {character.max_hp} → {hpGain ? character.max_hp + hpGain.total : '?'}
              </p>
            </div>
          </div>
        </div>

        {/* ASI Section (if applicable) */}
        {hasASI && (
          <div className="mb-6">
            <h3 className="font-display text-lg text-[var(--ink)] mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[var(--teal)]" />
              Aumento Caratteristiche (ASI)
            </h3>

            <div className="bg-[var(--cream-dark)] rounded-lg p-4 space-y-4">
              {/* ASI Mode Selection */}
              <div className="flex gap-2">
                <button
                  onClick={() => { setAsiMode('two'); setAsiChoice2('') }}
                  className={`flex-1 py-2 px-3 rounded text-sm transition-colors ${
                    asiMode === 'two'
                      ? 'bg-[var(--teal)] text-white'
                      : 'bg-[var(--paper)] text-[var(--ink-light)] hover:bg-[var(--ink)]/5'
                  }`}
                >
                  +1 a due attributi
                </button>
                <button
                  onClick={() => { setAsiMode('one'); setAsiChoice2('') }}
                  className={`flex-1 py-2 px-3 rounded text-sm transition-colors ${
                    asiMode === 'one'
                      ? 'bg-[var(--teal)] text-white'
                      : 'bg-[var(--paper)] text-[var(--ink-light)] hover:bg-[var(--ink)]/5'
                  }`}
                >
                  +2 a un attributo
                </button>
              </div>

              {/* ASI Dropdowns */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <select
                    value={asiChoice1}
                    onChange={(e) => setAsiChoice1(e.target.value as AbilityName | '')}
                    className="flex-1 px-3 py-2 bg-[var(--paper)] border border-[var(--border-decorative)] rounded text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--teal)]"
                  >
                    <option value="">Scegli attributo...</option>
                    {getAvailableAbilities(asiMode === 'two' ? asiChoice2 || undefined : undefined).map(ability => (
                      <option key={ability} value={ability}>
                        {ABILITY_LABELS[ability].full} ({character[ability]})
                      </option>
                    ))}
                  </select>
                  <span className="text-[var(--teal)] font-semibold w-8 text-center">
                    +{asiMode === 'one' ? 2 : 1}
                  </span>
                </div>

                {asiMode === 'two' && (
                  <div className="flex items-center gap-2">
                    <select
                      value={asiChoice2}
                      onChange={(e) => setAsiChoice2(e.target.value as AbilityName | '')}
                      className="flex-1 px-3 py-2 bg-[var(--paper)] border border-[var(--border-decorative)] rounded text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--teal)]"
                    >
                      <option value="">Scegli attributo...</option>
                      {getAvailableAbilities(asiChoice1 || undefined).map(ability => (
                        <option key={ability} value={ability}>
                          {ABILITY_LABELS[ability].full} ({character[ability]})
                        </option>
                      ))}
                    </select>
                    <span className="text-[var(--teal)] font-semibold w-8 text-center">+1</span>
                  </div>
                )}
              </div>

              {/* Preview */}
              {(asiChoice1 || asiChoice2) && (
                <div className="text-xs text-[var(--ink-light)] pt-2 border-t border-[var(--border-decorative)]">
                  <span className="font-medium">Anteprima:</span>
                  {asiChoice1 && (
                    <span className="ml-2">
                      {ABILITY_LABELS[asiChoice1].short}: {character[asiChoice1]} → {getPreviewStats()[asiChoice1]}
                    </span>
                  )}
                  {asiChoice2 && (
                    <span className="ml-2">
                      {ABILITY_LABELS[asiChoice2].short}: {character[asiChoice2]} → {getPreviewStats()[asiChoice2]}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-[var(--coral)]/10 border border-[var(--coral)]/30 rounded-lg text-[var(--coral)] text-sm">
            {error}
          </div>
        )}
        </div>

        {/* Actions - fixed at bottom */}
        <div className="flex gap-3">
          <button
            onClick={() => onOpenChange(false)}
            className="flex-1 py-2 px-4 bg-[var(--cream)] hover:bg-[var(--ink)]/5 text-[var(--ink)] rounded border border-[var(--border-decorative)] transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !validateForm().valid}
            className="flex-1 py-2 px-4 bg-[var(--teal)] hover:bg-[var(--teal-dark)] disabled:bg-[var(--ink-faded)] text-white rounded transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              'Salvataggio...'
            ) : (
              <>
                <ChevronUp className="w-4 h-4" />
                Conferma Level Up
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
