// Level-Up System Utilities for D&D 5e
// Handles ASI (Ability Score Improvement), HP calculation, and racial bonuses

import type { AbilityScores, ASIChoice, RacialASIChoice, AbilityName } from '@/types/database'
import { DND_RACES } from './dnd-utils'

// ============================================
// ASI Level Configuration by Class
// ============================================

// Standard ASI levels for most classes
const DEFAULT_ASI_LEVELS = [4, 8, 12, 16, 19]

// Fighter gets extra ASI at levels 6 and 14
const FIGHTER_ASI_LEVELS = [4, 6, 8, 12, 14, 16, 19]

// Rogue gets extra ASI at level 10
const ROGUE_ASI_LEVELS = [4, 8, 10, 12, 16, 19]

export const ASI_LEVELS: Record<string, number[]> = {
  default: DEFAULT_ASI_LEVELS,
  fighter: FIGHTER_ASI_LEVELS,
  rogue: ROGUE_ASI_LEVELS,
}

/**
 * Get ASI levels for a specific class
 */
export function getASILevels(className: string | null): number[] {
  if (!className) return ASI_LEVELS.default
  const key = className.toLowerCase()
  return ASI_LEVELS[key] || ASI_LEVELS.default
}

/**
 * Check if a class gets ASI at a specific level
 */
export function hasASIAtLevel(className: string | null, level: number): boolean {
  return getASILevels(className).includes(level)
}

/**
 * Get next ASI level for a character
 */
export function getNextASILevel(className: string | null, currentLevel: number): number | null {
  const asiLevels = getASILevels(className)
  const nextLevel = asiLevels.find(l => l > currentLevel)
  return nextLevel || null
}

// ============================================
// HP Calculation
// ============================================

/**
 * Get hit die value for a class (d6, d8, d10, d12)
 */
export function getHitDie(className: string | null): number {
  if (!className) return 8
  const cl = className.toLowerCase()

  // d12 classes
  if (cl.includes('barbarian')) return 12

  // d10 classes
  if (cl.includes('fighter') || cl.includes('paladin') || cl.includes('ranger')) return 10

  // d6 classes
  if (cl.includes('sorcerer') || cl.includes('wizard')) return 6

  // d8 classes (default: Bard, Cleric, Druid, Monk, Rogue, Warlock)
  return 8
}

/**
 * Get average hit die roll (used for reference)
 * Average = (max + 1) / 2 rounded up
 */
export function getAverageHitDieRoll(hitDie: number): number {
  return Math.ceil((hitDie + 1) / 2)
}

/**
 * Calculate modifier from ability score
 */
export function getModifier(score: number): number {
  return Math.floor((score - 10) / 2)
}

/**
 * Calculate HP gain on level up
 * @param hitDieRoll - The result of rolling the hit die (entered by DM)
 * @param conScore - Character's Constitution score
 * @returns Object with roll, conMod, and total (minimum 1 HP)
 */
export function calculateHPGain(hitDieRoll: number, conScore: number): {
  roll: number
  conMod: number
  total: number
} {
  const conMod = getModifier(conScore)
  const total = Math.max(1, hitDieRoll + conMod) // Minimum 1 HP per level

  return {
    roll: hitDieRoll,
    conMod,
    total
  }
}

/**
 * Calculate HP at level 1 (max hit die + CON mod)
 */
export function calculateLevel1HP(className: string | null, conScore: number): number {
  const hitDie = getHitDie(className)
  const conMod = getModifier(conScore)
  return Math.max(1, hitDie + conMod)
}

// ============================================
// Racial Bonuses
// ============================================

/**
 * Apply racial ability score bonuses to base stats
 * @param baseStats - The base ability scores (before racial bonuses)
 * @param raceKey - The race key from DND_RACES
 * @param asiChoices - Optional choices for races with asiChoice (e.g., Half-Elf)
 * @returns New ability scores with racial bonuses applied
 */
export function applyRacialBonuses(
  baseStats: AbilityScores,
  raceKey: string | null,
  asiChoices?: RacialASIChoice[]
): AbilityScores {
  if (!raceKey) return { ...baseStats }

  const race = DND_RACES[raceKey]
  if (!race) return { ...baseStats }

  const result: AbilityScores = { ...baseStats }

  // Apply fixed racial bonuses
  if (race.asi) {
    if (race.asi.str) result.str += race.asi.str
    if (race.asi.dex) result.dex += race.asi.dex
    if (race.asi.con) result.con += race.asi.con
    if (race.asi.int) result.int += race.asi.int
    if (race.asi.wis) result.wis += race.asi.wis
    if (race.asi.cha) result.cha += race.asi.cha
  }

  // Apply player choices (e.g., Half-Elf +1 to two abilities)
  if (asiChoices && asiChoices.length > 0) {
    asiChoices.forEach(choice => {
      result[choice.ability] += choice.bonus
    })
  }

  return result
}

/**
 * Get the fixed racial bonuses for a race (not including choices)
 */
export function getRacialBonuses(raceKey: string | null): Partial<AbilityScores> {
  if (!raceKey) return {}

  const race = DND_RACES[raceKey]
  if (!race || !race.asi) return {}

  return { ...race.asi }
}

/**
 * Check if a race has ASI choices (like Half-Elf)
 */
export function raceHasASIChoice(raceKey: string | null): boolean {
  if (!raceKey) return false
  const race = DND_RACES[raceKey]
  return !!(race && race.asiChoice)
}

/**
 * Get ASI choice configuration for a race
 */
export function getRaceASIChoice(raceKey: string | null): {
  count: number
  bonus: number
  exclude?: string[]
} | null {
  if (!raceKey) return null
  const race = DND_RACES[raceKey]
  if (!race || !race.asiChoice) return null
  return {
    count: race.asiChoice.count,
    bonus: race.asiChoice.bonus,
    exclude: race.asiChoice.exclude || []
  }
}

// ============================================
// ASI Application
// ============================================

/**
 * Apply ASI choices to ability scores
 * @param stats - Current ability scores
 * @param choices - ASI choices (either +2 to one or +1 to two)
 * @returns New ability scores with ASI applied (capped at 20)
 */
export function applyASI(
  stats: AbilityScores,
  choices: ASIChoice[]
): AbilityScores {
  const result: AbilityScores = { ...stats }

  choices.forEach(choice => {
    // Cap at 20 (D&D 5e standard ability score maximum)
    result[choice.ability] = Math.min(20, result[choice.ability] + choice.bonus)
  })

  return result
}

/**
 * Validate ASI choices
 * Valid options: +2 to one stat OR +1 to two different stats
 */
export function validateASIChoices(choices: ASIChoice[]): {
  valid: boolean
  error?: string
} {
  if (!choices || choices.length === 0) {
    return { valid: false, error: 'Nessuna scelta ASI effettuata' }
  }

  // Option 1: +2 to one stat
  if (choices.length === 1) {
    if (choices[0].bonus === 2) {
      return { valid: true }
    }
    return { valid: false, error: 'Con una sola scelta, il bonus deve essere +2' }
  }

  // Option 2: +1 to two different stats
  if (choices.length === 2) {
    if (choices[0].bonus === 1 && choices[1].bonus === 1) {
      // Check they're different abilities
      if (choices[0].ability === choices[1].ability) {
        return { valid: false, error: 'Devi scegliere due attributi diversi' }
      }
      return { valid: true }
    }
    return { valid: false, error: 'Con due scelte, ogni bonus deve essere +1' }
  }

  return { valid: false, error: 'Scelta ASI non valida' }
}

/**
 * Check if applying ASI would exceed the 20 cap
 */
export function wouldExceedCap(
  stats: AbilityScores,
  choices: ASIChoice[]
): { exceeds: boolean; abilities: AbilityName[] } {
  const exceededAbilities: AbilityName[] = []

  choices.forEach(choice => {
    const newValue = stats[choice.ability] + choice.bonus
    if (newValue > 20) {
      exceededAbilities.push(choice.ability)
    }
  })

  return {
    exceeds: exceededAbilities.length > 0,
    abilities: exceededAbilities
  }
}

// ============================================
// Ability Score Labels (Italian)
// ============================================

export const ABILITY_LABELS: Record<AbilityName, { short: string; full: string }> = {
  str: { short: 'FOR', full: 'Forza' },
  dex: { short: 'DES', full: 'Destrezza' },
  con: { short: 'COS', full: 'Costituzione' },
  int: { short: 'INT', full: 'Intelligenza' },
  wis: { short: 'SAG', full: 'Saggezza' },
  cha: { short: 'CAR', full: 'Carisma' },
}

export const ALL_ABILITIES: AbilityName[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']
