/**
 * D&D 5e Skills System
 * Contains constants and types for the 18 core skills
 */

export type AbilityScore = 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA'

export type SkillKey =
  // STR
  | 'athletics'
  // DEX
  | 'acrobatics'
  | 'sleight_of_hand'
  | 'stealth'
  // INT
  | 'arcana'
  | 'history'
  | 'investigation'
  | 'nature'
  | 'religion'
  // WIS
  | 'animal_handling'
  | 'insight'
  | 'medicine'
  | 'perception'
  | 'survival'
  // CHA
  | 'deception'
  | 'intimidation'
  | 'performance'
  | 'persuasion'

export type ProficiencyLevel = 'none' | 'proficient' | 'expertise'

export type SkillProficiencies = Record<SkillKey, ProficiencyLevel>

export interface Skill {
  key: SkillKey
  name: string
  ability: AbilityScore
}

/**
 * All 18 D&D 5e skills with their associated ability scores
 * Ordered by ability score for easy grouping in UI
 * Names use official Italian D&D 5e translations
 */
export const SKILLS: readonly Skill[] = [
  // STR-based skills
  { key: 'athletics', name: 'Atletica', ability: 'STR' },

  // DEX-based skills
  { key: 'acrobatics', name: 'Acrobazia', ability: 'DEX' },
  { key: 'sleight_of_hand', name: 'Rapidità di Mano', ability: 'DEX' },
  { key: 'stealth', name: 'Furtività', ability: 'DEX' },

  // INT-based skills
  { key: 'arcana', name: 'Arcano', ability: 'INT' },
  { key: 'history', name: 'Storia', ability: 'INT' },
  { key: 'investigation', name: 'Indagare', ability: 'INT' },
  { key: 'nature', name: 'Natura', ability: 'INT' },
  { key: 'religion', name: 'Religione', ability: 'INT' },

  // WIS-based skills
  { key: 'animal_handling', name: 'Addestrare Animali', ability: 'WIS' },
  { key: 'insight', name: 'Intuizione', ability: 'WIS' },
  { key: 'medicine', name: 'Medicina', ability: 'WIS' },
  { key: 'perception', name: 'Percezione', ability: 'WIS' },
  { key: 'survival', name: 'Sopravvivenza', ability: 'WIS' },

  // CHA-based skills
  { key: 'deception', name: 'Inganno', ability: 'CHA' },
  { key: 'intimidation', name: 'Intimidire', ability: 'CHA' },
  { key: 'performance', name: 'Intrattenere', ability: 'CHA' },
  { key: 'persuasion', name: 'Persuasione', ability: 'CHA' },
] as const

/**
 * Default skill proficiencies (all set to 'none')
 */
export const DEFAULT_SKILL_PROFICIENCIES: SkillProficiencies = {
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

/**
 * Calculate skill modifier based on ability modifier, proficiency, and expertise
 * @param abilityModifier - The modifier from the associated ability score (e.g., +3 for STR 16)
 * @param proficiencyBonus - The character's proficiency bonus (based on level)
 * @param proficiencyLevel - 'none', 'proficient', or 'expertise'
 * @returns The total skill modifier
 */
export function calculateSkillModifier(
  abilityModifier: number,
  proficiencyBonus: number,
  proficiencyLevel: ProficiencyLevel
): number {
  let modifier = abilityModifier

  if (proficiencyLevel === 'proficient') {
    modifier += proficiencyBonus
  } else if (proficiencyLevel === 'expertise') {
    // Expertise = double proficiency (Rogue/Bard feature)
    modifier += proficiencyBonus * 2
  }

  return modifier
}

/**
 * Calculate proficiency bonus based on character level
 * D&D 5e proficiency bonus progression:
 * - Levels 1-4: +2
 * - Levels 5-8: +3
 * - Levels 9-12: +4
 * - Levels 13-16: +5
 * - Levels 17-20: +6
 */
export function calculateProficiencyBonus(level: number): number {
  return Math.floor((level - 1) / 4) + 2
}
