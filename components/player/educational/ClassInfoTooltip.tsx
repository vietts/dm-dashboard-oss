/**
 * Class Info Tooltip Component
 *
 * Displays class-specific mechanical information:
 * - Spellcasting ability (if applicable)
 * - Proficient saving throws
 * - Melee and ranged attack abilities
 *
 * Used in tooltips to help players understand what their class uses.
 */

import { getClassMechanics, isSpellcaster } from '@/lib/class-mechanics'
import { getAbilityColor, type AbilityScore } from '@/lib/ability-colors'

interface ClassInfoTooltipProps {
  className: string  // Class name (lowercase, English)
}

export default function ClassInfoTooltip({ className }: ClassInfoTooltipProps) {
  const mechanics = getClassMechanics(className.toLowerCase())

  if (!mechanics) {
    return (
      <div className="class-info-tooltip p-3 text-xs text-[var(--ink-light)]">
        Informazioni non disponibili per questa classe.
      </div>
    )
  }

  const hasSpellcasting = isSpellcaster(className)
  const spellAbility = mechanics.spellcastingAbility
  const spellColor = spellAbility ? getAbilityColor(spellAbility) : null

  const [save1, save2] = mechanics.savingThrowProficiencies
  const save1Color = getAbilityColor(save1)
  const save2Color = getAbilityColor(save2)

  return (
    <div className="class-info-tooltip p-3 min-w-[280px]">
      {/* Header */}
      <div className="font-semibold text-sm mb-3 text-[var(--cream)]">
        {mechanics.className} - Cosa Usa
      </div>

      {/* Description */}
      <div className="text-xs text-[var(--cream)]/80 mb-4 italic">
        {mechanics.description}
      </div>

      {/* Grid of class mechanics */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {/* Spellcasting ability */}
        {hasSpellcasting && spellAbility && spellColor && (
          <div className="col-span-2 p-2 bg-purple-500/20 border border-purple-400/30 rounded">
            <div className="text-xs text-purple-300 font-semibold mb-1">Incantesimi</div>
            <div className="flex items-center gap-1">
              <span className="bg-[var(--teal)]/30 text-[var(--teal-light)] border border-[var(--teal-light)]/30 px-1.5 py-0.5 rounded text-xs font-bold">
                {spellColor.name}
              </span>
              <span className="text-xs text-[var(--cream)]/80">{spellColor.fullName}</span>
            </div>
          </div>
        )}

        {/* Saving throw proficiencies */}
        <div className="col-span-2 p-2 bg-blue-500/20 border border-blue-400/30 rounded">
          <div className="text-xs text-blue-300 font-semibold mb-1">Tiri Salvezza Competenti</div>
          <div className="flex gap-1">
            <span className="bg-[var(--teal)]/30 text-[var(--teal-light)] border border-[var(--teal-light)]/30 px-1.5 py-0.5 rounded text-xs font-bold">
              {save1Color.name}
            </span>
            <span className="bg-[var(--teal)]/30 text-[var(--teal-light)] border border-[var(--teal-light)]/30 px-1.5 py-0.5 rounded text-xs font-bold">
              {save2Color.name}
            </span>
          </div>
        </div>

        {/* Melee attack ability */}
        <div className="p-2 bg-red-500/20 border border-red-400/30 rounded">
          <div className="text-xs text-red-300 font-semibold mb-1">Attacco Mischia</div>
          {Array.isArray(mechanics.meleeAttackAbility) ? (
            <div className="flex gap-1 flex-wrap">
              {mechanics.meleeAttackAbility.map((ability) => {
                const color = getAbilityColor(ability)
                return (
                  <span
                    key={ability}
                    className="bg-[var(--teal)]/30 text-[var(--teal-light)] border border-[var(--teal-light)]/30 px-1.5 py-0.5 rounded text-xs font-bold"
                  >
                    {color.name}
                  </span>
                )
              })}
              <span className="text-xs text-[var(--cream)]/60">*</span>
            </div>
          ) : (
            <span className="bg-[var(--teal)]/30 text-[var(--teal-light)] border border-[var(--teal-light)]/30 px-1.5 py-0.5 rounded text-xs font-bold inline-block">
              {getAbilityColor(mechanics.meleeAttackAbility).name}
            </span>
          )}
        </div>

        {/* Ranged attack ability */}
        <div className="p-2 bg-green-500/20 border border-green-400/30 rounded">
          <div className="text-xs text-green-300 font-semibold mb-1">Attacco Distanza</div>
          <span className="bg-[var(--teal)]/30 text-[var(--teal-light)] border border-[var(--teal-light)]/30 px-1.5 py-0.5 rounded text-xs font-bold inline-block">
            {getAbilityColor(mechanics.rangedAttackAbility).name}
          </span>
        </div>
      </div>

      {/* Finesse weapons note */}
      {Array.isArray(mechanics.meleeAttackAbility) && (
        <div className="text-xs text-[var(--cream)]/60 italic mt-2">
          * Con armi Accurate puoi scegliere Destrezza invece di Forza
        </div>
      )}

      {/* Formulas section */}
      <div className="mt-3 pt-3 border-t border-[var(--cream)]/30">
        <div className="text-xs font-semibold text-[var(--cream)] mb-2">Formule chiave:</div>
        <div className="space-y-1 text-xs text-[var(--cream)]/80">
          {hasSpellcasting && spellAbility && (
            <>
              <div className="bg-white/10 p-1.5 rounded font-mono">
                CD Incantesimi = 8 + {getAbilityColor(spellAbility).name} + Competenza
              </div>
              <div className="bg-white/10 p-1.5 rounded font-mono">
                Attacco Incantesimi = {getAbilityColor(spellAbility).name} + Competenza
              </div>
            </>
          )}
          <div className="bg-white/10 p-1.5 rounded font-mono">
            Tiro Salvezza = d20 + mod. + Competenza (se competente)
          </div>
        </div>
      </div>
    </div>
  )
}
