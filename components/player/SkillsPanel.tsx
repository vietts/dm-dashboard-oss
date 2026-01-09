'use client'

import { useState } from 'react'
import { SKILLS, calculateSkillModifier, calculateProficiencyBonus, type SkillProficiencies, type ProficiencyLevel, type SkillKey } from '@/lib/skills'
import type { Character } from '@/types/database'
import { getAbilityColor, type AbilityScore } from '@/lib/ability-colors'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ChevronDown, ChevronUp, BookOpen } from 'lucide-react'
import SkillCalculationBreakdown from '@/components/player/educational/SkillCalculationBreakdown'
import ProficiencyTable from '@/components/player/educational/ProficiencyTable'

interface SkillsPanelProps {
  character: Character
  onUpdate?: () => void
  readOnly?: boolean
  defaultCollapsed?: boolean
}

/**
 * Proficiency Circle Component
 * Displays visual indicator of proficiency level:
 * - none: empty circle (○)
 * - proficient: half-filled circle (◐)
 * - expertise: filled circle (●)
 */
function ProficiencyCircle({
  level,
  onClick,
  readOnly = false,
}: {
  level: ProficiencyLevel
  onClick?: () => void
  readOnly?: boolean
}) {
  const getCircleChar = () => {
    switch (level) {
      case 'none':
        return '○'
      case 'proficient':
        return '◐'
      case 'expertise':
        return '●'
      default:
        return '○'
    }
  }

  const getColor = () => {
    switch (level) {
      case 'none':
        return 'text-gray-300'
      case 'proficient':
        return 'text-blue-600'
      case 'expertise':
        return 'text-purple-600'
      default:
        return 'text-gray-300'
    }
  }

  const getAriaLabel = () => {
    switch (level) {
      case 'none':
        return 'Nessuna competenza. Clicca per impostare proficiency.'
      case 'proficient':
        return 'Competente. Bonus competenza applicato. Clicca per impostare expertise.'
      case 'expertise':
        return 'Expertise. Doppio bonus competenza. Clicca per rimuovere competenza.'
      default:
        return 'Nessuna competenza'
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={readOnly}
      className={`text-lg font-bold ${getColor()} ${!readOnly ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
      aria-label={readOnly ? `Competenza: ${level === 'none' ? 'nessuna' : level === 'proficient' ? 'normale' : 'expertise'}` : getAriaLabel()}
      title={level === 'none' ? 'Nessuna competenza' : level === 'proficient' ? 'Competente (+bonus competenza)' : 'Expertise (doppio bonus competenza)'}
    >
      {getCircleChar()}
    </button>
  )
}

/**
 * Skill Row Component
 * Displays a single skill with proficiency indicator and calculated modifier
 */
function SkillRow({
  skillKey,
  abilityModifier,
  abilityScore,
  proficiencyBonus,
  proficiencyLevel,
  onToggleProficiency,
  readOnly = false,
}: {
  skillKey: SkillKey
  abilityModifier: number
  abilityScore: number
  proficiencyBonus: number
  proficiencyLevel: ProficiencyLevel
  onToggleProficiency: (skillKey: SkillKey) => void
  readOnly: boolean
}) {
  const skill = SKILLS.find((s) => s.key === skillKey)
  if (!skill) return null

  const modifier = calculateSkillModifier(abilityModifier, proficiencyBonus, proficiencyLevel)
  const abilityColor = getAbilityColor(skill.ability as AbilityScore)

  return (
    <div className="flex items-center justify-between py-2 px-2 hover:bg-gray-50 rounded group">
      <div className="flex items-center gap-2">
        <ProficiencyCircle
          level={proficiencyLevel}
          onClick={() => onToggleProficiency(skillKey)}
          readOnly={readOnly}
        />
        {/* Colored badge for ability */}
        <span
          className={`text-xs font-bold ${abilityColor.bg} ${abilityColor.text} px-2 py-1 rounded`}
        >
          {skill.ability}
        </span>
        <span className="text-sm font-medium text-gray-900">{skill.name}</span>
      </div>

      {/* Modifier with tooltip breakdown */}
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <span className="text-sm font-bold text-gray-700 tabular-nums cursor-help">
              {modifier >= 0 ? '+' : ''}
              {modifier}
            </span>
          </TooltipTrigger>
          <TooltipContent side="left" align="center">
            <SkillCalculationBreakdown
              skillKey={skillKey}
              abilityScore={abilityScore}
              abilityMod={abilityModifier}
              proficiencyBonus={proficiencyBonus}
              proficiencyLevel={proficiencyLevel}
              total={modifier}
            />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

/**
 * Skills Panel Component
 * Displays all 18 D&D 5e skills with proficiency tracking and modifier calculation
 */
export default function SkillsPanel({ character, onUpdate, readOnly = false, defaultCollapsed = true }: SkillsPanelProps) {
  const [updating, setUpdating] = useState(false)
  const [expanded, setExpanded] = useState(!defaultCollapsed)

  // Get skill proficiencies from character (with fallback to all 'none')
  const skillProficiencies: SkillProficiencies =
    (character.skill_proficiencies as unknown as SkillProficiencies) || {
      athletics: 'none',
      acrobatics: 'none',
      sleight_of_hand: 'none',
      stealth: 'none',
      arcana: 'none',
      history: 'none',
      investigation: 'none',
      nature: 'none',
      religion: 'none',
      animal_handling: 'none',
      insight: 'none',
      medicine: 'none',
      perception: 'none',
      survival: 'none',
      deception: 'none',
      intimidation: 'none',
      performance: 'none',
      persuasion: 'none',
    }

  // Calculate proficiency bonus based on level
  const proficiencyBonus = calculateProficiencyBonus(character.level ?? 1)

  // Calculate ability modifiers (from character's ability scores)
  const getAbilityScore = (ability: 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA'): number => {
    const abilityMap = {
      STR: character.str ?? 10,
      DEX: character.dex ?? 10,
      CON: character.con ?? 10,
      INT: character.int ?? 10,
      WIS: character.wis ?? 10,
      CHA: character.cha ?? 10,
    }
    return abilityMap[ability]
  }

  const getAbilityModifier = (ability: 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA'): number => {
    const score = getAbilityScore(ability)
    return Math.floor((score - 10) / 2)
  }

  /**
   * Toggle proficiency level for a skill
   * Cycles: none -> proficient -> expertise -> none
   */
  const handleToggleProficiency = async (skillKey: SkillKey) => {
    if (readOnly || updating) return

    const currentLevel = skillProficiencies[skillKey]
    let newLevel: ProficiencyLevel = 'none'

    // Cycle through proficiency levels
    switch (currentLevel) {
      case 'none':
        newLevel = 'proficient'
        break
      case 'proficient':
        newLevel = 'expertise'
        break
      case 'expertise':
        newLevel = 'none'
        break
    }

    // Update skill proficiencies
    const updatedProficiencies = {
      ...skillProficiencies,
      [skillKey]: newLevel,
    }

    setUpdating(true)

    try {
      const response = await fetch(`/api/characters/${character.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skill_proficiencies: updatedProficiencies,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update skill proficiencies')
      }

      onUpdate?.()
    } catch (error) {
      console.error('Error updating skill proficiencies:', error)
      alert('Errore nell\'aggiornamento delle proficienze. Riprova.')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="skills-panel">
      {/* Collapsible Header - Card Style */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-[var(--teal)]/10 to-[var(--teal)]/5 border border-[var(--teal)]/30 hover:border-[var(--teal)]/50 hover:from-[var(--teal)]/15 hover:to-[var(--teal)]/10 transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded bg-[var(--teal)]/20">
            <BookOpen size={18} className="text-[var(--teal)]" />
          </div>
          <div className="flex flex-col items-start gap-0.5">
            <h3 className="text-base font-display font-bold leading-tight text-[var(--ink)]">Abilità</h3>
            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <span className="text-xs text-[var(--ink-light)] cursor-help">
                    Competenza{' '}
                    <span className="font-bold text-[var(--teal)]">+{proficiencyBonus}</span>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="center">
                  <ProficiencyTable currentLevel={character.level ?? 1} currentBonus={proficiencyBonus} />
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--ink-light)] hidden sm:inline">
            {expanded ? 'Chiudi' : 'Mostra tutte'}
          </span>
          <div className="text-[var(--teal)] group-hover:scale-110 transition-transform">
            {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>
      </button>

      {/* Collapsible Content */}
      {expanded && (
        <>
          <div className="skills-list space-y-1 mt-4">
            {SKILLS.map((skill) => (
              <SkillRow
                key={skill.key}
                skillKey={skill.key}
                abilityScore={getAbilityScore(skill.ability)}
                abilityModifier={getAbilityModifier(skill.ability)}
                proficiencyBonus={proficiencyBonus}
                proficiencyLevel={skillProficiencies[skill.key]}
                onToggleProficiency={handleToggleProficiency}
                readOnly={readOnly}
              />
            ))}
          </div>

          {!readOnly && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-xs leading-relaxed text-[var(--ink-light)]">
                <span className="font-semibold text-[var(--ink)]">Click sui pallini per cambiare proficiency:</span>
                <br />○ Nessuna → ◐ Proficient (+{proficiencyBonus}) → ● Expertise (+
                {proficiencyBonus * 2})
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
