/**
 * D&D 5e Ability Score Color System
 *
 * Provides consistent color coding for the 6 ability scores across the app.
 * Each ability has a distinct color palette for backgrounds, text, and borders.
 *
 * Usage:
 * - Import ABILITY_COLORS to access color classes
 * - Use getAbilityColor() to get colors for a specific ability
 * - Colors follow Tailwind naming: bg-*, text-*, border-*
 */

export type AbilityScore = 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA'

export interface AbilityColorScheme {
  bg: string        // Background color class (e.g., 'bg-red-100')
  text: string      // Text color class (e.g., 'text-red-700')
  border: string    // Border color class (e.g., 'border-red-300')
  name: string      // Italian name of the ability
  fullName: string  // Full Italian name
}

/**
 * Color mapping for all 6 D&D 5e ability scores
 *
 * Color choices:
 * - STR (Forza): Red - represents physical power and combat
 * - DEX (Destrezza): Blue - represents agility and precision
 * - CON (Costituzione): Green - represents health and endurance
 * - INT (Intelligenza): Purple - represents arcane knowledge
 * - WIS (Saggezza): Amber - represents perception and insight
 * - CHA (Carisma): Pink - represents charm and leadership
 */
export const ABILITY_COLORS: Record<AbilityScore, AbilityColorScheme> = {
  STR: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-300',
    name: 'FOR',
    fullName: 'Forza',
  },
  DEX: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-300',
    name: 'DES',
    fullName: 'Destrezza',
  },
  CON: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-300',
    name: 'COS',
    fullName: 'Costituzione',
  },
  INT: {
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    border: 'border-purple-300',
    name: 'INT',
    fullName: 'Intelligenza',
  },
  WIS: {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    border: 'border-amber-300',
    name: 'SAG',
    fullName: 'Saggezza',
  },
  CHA: {
    bg: 'bg-pink-100',
    text: 'text-pink-700',
    border: 'border-pink-300',
    name: 'CAR',
    fullName: 'Carisma',
  },
}

/**
 * Get color scheme for a specific ability score
 * @param ability - The ability score (STR, DEX, CON, INT, WIS, CHA)
 * @returns Color scheme object with bg, text, border, and name properties
 */
export function getAbilityColor(ability: AbilityScore): AbilityColorScheme {
  return ABILITY_COLORS[ability]
}

/**
 * Get all ability scores in standard D&D order
 * @returns Array of ability scores: [STR, DEX, CON, INT, WIS, CHA]
 */
export function getAbilityScoresInOrder(): AbilityScore[] {
  return ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']
}
