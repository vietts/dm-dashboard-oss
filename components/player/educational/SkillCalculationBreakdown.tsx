/**
 * Skill Calculation Breakdown Component
 *
 * Displays a detailed breakdown of how a skill modifier is calculated,
 * showing the formula and real values from the character.
 *
 * Shows:
 * - Skill name and associated ability
 * - Formula (d20 + ability mod + proficiency)
 * - Breakdown of each component with values
 * - Total modifier
 */

import { SKILLS, type SkillKey, type ProficiencyLevel } from '@/lib/skills'
import { getAbilityColor, type AbilityScore } from '@/lib/ability-colors'

interface SkillCalculationBreakdownProps {
  skillKey: SkillKey
  abilityScore: number        // Raw ability score (e.g., 16)
  abilityMod: number          // Calculated modifier (e.g., +3)
  proficiencyBonus: number
  proficiencyLevel: ProficiencyLevel
  total: number
}

export default function SkillCalculationBreakdown({
  skillKey,
  abilityScore,
  abilityMod,
  proficiencyBonus,
  proficiencyLevel,
  total,
}: SkillCalculationBreakdownProps) {
  const skill = SKILLS.find((s) => s.key === skillKey)
  if (!skill) return null

  const abilityColor = getAbilityColor(skill.ability as AbilityScore)

  // Calculate proficiency contribution
  const proficiencyContribution =
    proficiencyLevel === 'none' ? 0 : proficiencyLevel === 'proficient' ? proficiencyBonus : proficiencyBonus * 2

  return (
    <div className="skill-breakdown p-3 min-w-[280px]">
      {/* Header */}
      <div className="mb-3">
        <div className="text-sm font-semibold text-[var(--cream)] mb-1">
          Come si calcola {skill.name}?
        </div>
        <div className="text-xs text-[var(--cream)]/80">
          Questa abilità usa <span className="text-[var(--teal-light)] font-semibold">{abilityColor.name}</span>
        </div>
      </div>

      {/* Formula generale */}
      <div className="formula mb-3 p-2 bg-white/10 rounded text-xs font-mono text-[var(--cream)]">
        <div className="flex items-center gap-1 flex-wrap">
          <span>d20 +</span>
          <span className="bg-[var(--teal)]/30 text-[var(--teal-light)] px-1.5 py-0.5 rounded font-bold border border-[var(--teal-light)]/30">
            {abilityColor.name}
          </span>
          <span>+ Competenza</span>
          <span className="text-[var(--cream)]/60 italic">(se competente)</span>
        </div>
      </div>

      {/* Breakdown con valori reali */}
      <div className="breakdown space-y-2 text-xs">
        <div className="text-xs font-semibold text-[var(--cream)]/80 mb-2">
          Con il tuo personaggio:
        </div>

        {/* Ability modifier */}
        <div className="flex justify-between items-center">
          <span className="text-[var(--teal-light)]">
            Modificatore {abilityColor.name} ({abilityScore})
          </span>
          <span className="font-bold font-mono text-[var(--cream)]">
            {abilityMod >= 0 ? '+' : ''}
            {abilityMod}
          </span>
        </div>

        {/* Proficiency bonus */}
        {proficiencyLevel !== 'none' && (
          <div className="flex justify-between items-center">
            <span className="text-purple-300">
              {proficiencyLevel === 'proficient' ? 'Competenza' : 'Expertise (×2)'}
            </span>
            <span className="font-bold font-mono text-[var(--cream)]">
              +{proficiencyContribution}
            </span>
          </div>
        )}

        {/* No proficiency message */}
        {proficiencyLevel === 'none' && (
          <div className="text-xs text-[var(--cream)]/60 italic">
            Non sei competente in questa abilità
          </div>
        )}

        {/* Total */}
        <div className="border-t border-[var(--cream)]/30 pt-2 mt-2 flex justify-between items-center font-bold">
          <span className="text-[var(--cream)]">TOTALE</span>
          <span className="text-[var(--teal-light)] font-mono text-base">
            {total >= 0 ? '+' : ''}
            {total}
          </span>
        </div>
      </div>

      {/* Usage example */}
      <div className="mt-3 pt-3 border-t border-[var(--cream)]/30 text-xs text-[var(--cream)]/80">
        <div className="font-semibold mb-1 text-[var(--cream)]">Come si usa:</div>
        <div className="bg-white/10 p-2 rounded font-mono text-xs text-[var(--cream)]">
          Tira 1d20, aggiungi{' '}
          <span className="text-[var(--teal-light)] font-bold">
            {total >= 0 ? '+' : ''}
            {total}
          </span>
        </div>
        <div className="mt-1 text-xs italic">
          Esempio: tiri 15 sul dado → 15 + ({total}) = {15 + total} totale
        </div>
      </div>

      {/* Proficiency explanation */}
      {proficiencyLevel === 'expertise' && (
        <div className="mt-3 pt-3 border-t border-[var(--cream)]/30 text-xs text-[var(--cream)]/80">
          <div className="flex items-start gap-2">
            <div className="text-purple-300 font-bold">●</div>
            <div>
              <span className="font-semibold text-purple-300">Expertise:</span> Aggiungi il bonus di
              competenza due volte (privilegi di Ladro o Bardo)
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
