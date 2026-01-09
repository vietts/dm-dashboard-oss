/**
 * D&D 5e Class Mechanics
 *
 * Contains comprehensive information about how each class works:
 * - Spellcasting ability scores
 * - Proficient saving throws
 * - Weapon attack abilities
 *
 * Based on official D&D 5e rules (Player's Handbook)
 */

import type { AbilityScore } from './ability-colors'

export interface ClassMechanics {
  spellcastingAbility: AbilityScore | null  // null for non-spellcasters
  savingThrowProficiencies: [AbilityScore, AbilityScore]  // All classes have exactly 2
  meleeAttackAbility: AbilityScore | AbilityScore[]  // Can use STR or DEX (finesse)
  rangedAttackAbility: AbilityScore
  className: string  // Italian name
  description: string  // Brief description in Italian
}

/**
 * Complete mechanics table for all 12 D&D 5e core classes
 *
 * Note: "Armi Accurate" (Finesse weapons) allow DEX instead of STR for melee attacks
 */
export const CLASS_MECHANICS: Record<string, ClassMechanics> = {
  // --- MARTIAL CLASSES (no spellcasting or half-casters) ---

  barbarian: {
    spellcastingAbility: null,
    savingThrowProficiencies: ['STR', 'CON'],
    meleeAttackAbility: 'STR',
    rangedAttackAbility: 'DEX',
    className: 'Barbaro',
    description: 'Guerriero feroce che entra in ira per combattere con furia primordiale.',
  },

  fighter: {
    spellcastingAbility: null,  // Exception: Eldritch Knight uses INT (subclass)
    savingThrowProficiencies: ['STR', 'CON'],
    meleeAttackAbility: ['STR', 'DEX'],  // Can use finesse weapons
    rangedAttackAbility: 'DEX',
    className: 'Guerriero',
    description: 'Maestro di armi e tattiche, versatile in qualsiasi stile di combattimento.',
  },

  monk: {
    spellcastingAbility: null,  // Exception: Way of Four Elements uses WIS (subclass)
    savingThrowProficiencies: ['STR', 'DEX'],
    meleeAttackAbility: ['STR', 'DEX'],  // Martial Arts use STR or DEX
    rangedAttackAbility: 'DEX',
    className: 'Monaco',
    description: 'Artista marziale che canalizza il ki per prodezze sovrumane.',
  },

  rogue: {
    spellcastingAbility: null,  // Exception: Arcane Trickster uses INT (subclass)
    savingThrowProficiencies: ['DEX', 'INT'],
    meleeAttackAbility: 'DEX',  // Always DEX (finesse weapons)
    rangedAttackAbility: 'DEX',
    className: 'Ladro',
    description: 'Esperto furtivo che colpisce con precisione letale.',
  },

  // --- HALF-CASTERS ---

  paladin: {
    spellcastingAbility: 'CHA',
    savingThrowProficiencies: ['WIS', 'CHA'],
    meleeAttackAbility: ['STR', 'DEX'],  // Can use finesse weapons
    rangedAttackAbility: 'DEX',
    className: 'Paladino',
    description: 'Guerriero sacro che combina armi e magia divina.',
  },

  ranger: {
    spellcastingAbility: 'WIS',
    savingThrowProficiencies: ['STR', 'DEX'],
    meleeAttackAbility: ['STR', 'DEX'],  // Can use finesse weapons
    rangedAttackAbility: 'DEX',
    className: 'Ranger',
    description: 'Cacciatore esperto che usa magia naturale e abilità marziali.',
  },

  // --- FULL CASTERS ---

  bard: {
    spellcastingAbility: 'CHA',
    savingThrowProficiencies: ['DEX', 'CHA'],
    meleeAttackAbility: ['STR', 'DEX'],  // Usually DEX (finesse)
    rangedAttackAbility: 'DEX',
    className: 'Bardo',
    description: 'Intrattenitore e incantatore che usa la magia per ispirare e ingannare.',
  },

  cleric: {
    spellcastingAbility: 'WIS',
    savingThrowProficiencies: ['WIS', 'CHA'],
    meleeAttackAbility: ['STR', 'DEX'],  // Depends on domain
    rangedAttackAbility: 'DEX',
    className: 'Chierico',
    description: 'Servitore divino che canalizza il potere della sua divinità.',
  },

  druid: {
    spellcastingAbility: 'WIS',
    savingThrowProficiencies: ['INT', 'WIS'],
    meleeAttackAbility: ['STR', 'DEX'],  // Wild Shape uses STR
    rangedAttackAbility: 'DEX',
    className: 'Druido',
    description: 'Custode della natura che manipola elementi e assume forme animali.',
  },

  sorcerer: {
    spellcastingAbility: 'CHA',
    savingThrowProficiencies: ['CON', 'CHA'],
    meleeAttackAbility: ['STR', 'DEX'],  // Rarely used
    rangedAttackAbility: 'DEX',
    className: 'Stregone',
    description: 'Incantatore innato con magia nel sangue.',
  },

  warlock: {
    spellcastingAbility: 'CHA',
    savingThrowProficiencies: ['WIS', 'CHA'],
    meleeAttackAbility: ['STR', 'DEX'],  // Pact of Blade can use CHA (Hexblade)
    rangedAttackAbility: 'DEX',
    className: 'Warlock',
    description: "Incantatore che ha stretto un patto con un'entità ultraterrena.",
  },

  wizard: {
    spellcastingAbility: 'INT',
    savingThrowProficiencies: ['INT', 'WIS'],
    meleeAttackAbility: ['STR', 'DEX'],  // Rarely used
    rangedAttackAbility: 'DEX',
    className: 'Mago',
    description: 'Studioso arcano che manipola la realtà attraverso la conoscenza.',
  },
}

/**
 * Get mechanics for a specific class
 * @param className - The class name (lowercase, English)
 * @returns Class mechanics object or undefined if class not found
 */
export function getClassMechanics(className: string): ClassMechanics | undefined {
  return CLASS_MECHANICS[className.toLowerCase()]
}

/**
 * Get spellcasting ability for a class
 * @param className - The class name (lowercase, English)
 * @returns Ability score used for spellcasting, or null if non-spellcaster
 */
export function getSpellcastingAbility(className: string): AbilityScore | null {
  const mechanics = getClassMechanics(className)
  return mechanics?.spellcastingAbility ?? null
}

/**
 * Get proficient saving throws for a class
 * @param className - The class name (lowercase, English)
 * @returns Array of 2 ability scores, or empty array if class not found
 */
export function getSavingThrowProficiencies(className: string): AbilityScore[] {
  const mechanics = getClassMechanics(className)
  return mechanics?.savingThrowProficiencies ?? []
}

/**
 * Check if a class is a spellcaster
 * @param className - The class name (lowercase, English)
 * @returns true if the class has spellcasting ability
 */
export function isSpellcaster(className: string): boolean {
  return getSpellcastingAbility(className) !== null
}

/**
 * Get Italian class name
 * @param className - The class name (lowercase, English)
 * @returns Italian name of the class
 */
export function getItalianClassName(className: string): string {
  const mechanics = getClassMechanics(className)
  return mechanics?.className ?? className
}

/**
 * Get all available classes
 * @returns Array of class names (lowercase, English)
 */
export function getAllClasses(): string[] {
  return Object.keys(CLASS_MECHANICS)
}
