/**
 * D&D 2024 Spellcasting Rules
 *
 * Defines spellcasting types, known spell limits, cantrips, and preparation rules
 * for each class based on the 2024 Player's Handbook.
 */

// =============================================================================
// TYPES
// =============================================================================

export type SpellcastingType = 'known' | 'spellbook' | 'prepared' | 'none'
export type SpellcastingAbility = 'int' | 'wis' | 'cha' | 'none'
/** When can spells be swapped/changed */
export type SpellSwapFrequency = 'none' | 'long_rest' | 'level_up'

export interface ClassSpellcastingInfo {
  type: SpellcastingType
  ability: SpellcastingAbility
  /** Level at which class gains spellcasting (SRD 2024: all casters start at level 1) */
  spellcastingLevel: number
  /** Array indexed by class level (1-20), value is number of spells known */
  knownProgression?: number[]
  /** Array indexed by class level (1-20), value is number of cantrips known */
  cantripsKnown?: number[]
  /** For half-casters, the divisor for spell slot calculation */
  spellSlotDivisor?: number
  /** When spells can be changed (SRD 2024) */
  swapFrequency?: SpellSwapFrequency
}

// =============================================================================
// CLASS SPELLCASTING DATA (D&D 2024)
// =============================================================================

export const CLASS_SPELLCASTING: Record<string, ClassSpellcastingInfo> = {
  // Full Casters - Known Spells (swap only at level-up)
  bard: {
    type: 'known',
    ability: 'cha',
    spellcastingLevel: 1,
    swapFrequency: 'level_up',
    // Bard spells known by level (index 0 = level 1)
    knownProgression: [
      4, 5, 6, 7, 8, 9, 10, 11, 12, 14,  // Levels 1-10
      15, 15, 16, 18, 19, 19, 20, 22, 22, 22  // Levels 11-20
    ],
    cantripsKnown: [
      2, 2, 2, 3, 3, 3, 3, 3, 3, 4,  // Levels 1-10
      4, 4, 4, 4, 4, 4, 4, 4, 4, 4   // Levels 11-20
    ]
  },

  sorcerer: {
    type: 'known',
    ability: 'cha',
    spellcastingLevel: 1,
    swapFrequency: 'level_up',
    knownProgression: [
      2, 3, 4, 5, 6, 7, 8, 9, 10, 11,  // Levels 1-10
      12, 12, 13, 13, 14, 14, 15, 15, 15, 15  // Levels 11-20
    ],
    cantripsKnown: [
      4, 4, 4, 5, 5, 5, 5, 5, 5, 6,  // Levels 1-10
      6, 6, 6, 6, 6, 6, 6, 6, 6, 6   // Levels 11-20
    ]
  },

  warlock: {
    type: 'known',
    ability: 'cha',
    spellcastingLevel: 1,
    swapFrequency: 'level_up',
    knownProgression: [
      2, 3, 4, 5, 6, 7, 8, 9, 10, 10,  // Levels 1-10
      11, 11, 12, 12, 13, 13, 14, 14, 15, 15  // Levels 11-20
    ],
    cantripsKnown: [
      2, 2, 2, 3, 3, 3, 3, 3, 3, 4,  // Levels 1-10
      4, 4, 4, 4, 4, 4, 4, 4, 4, 4   // Levels 11-20
    ]
  },

  // Full Casters - Spellbook (prepare different spells each long rest)
  wizard: {
    type: 'spellbook',
    ability: 'int',
    spellcastingLevel: 1,
    swapFrequency: 'long_rest',
    // Wizard starts with 6 spells, gains 2 per level
    // This represents MINIMUM spellbook size (can copy more)
    knownProgression: [
      6, 8, 10, 12, 14, 16, 18, 20, 22, 24,  // Levels 1-10
      26, 28, 30, 32, 34, 36, 38, 40, 42, 44  // Levels 11-20
    ],
    cantripsKnown: [
      3, 3, 3, 4, 4, 4, 4, 4, 4, 5,  // Levels 1-10
      5, 5, 5, 5, 5, 5, 5, 5, 5, 5   // Levels 11-20
    ]
  },

  // Full Casters - Prepared (all class spells available, change each long rest)
  cleric: {
    type: 'prepared',
    ability: 'wis',
    spellcastingLevel: 1,
    swapFrequency: 'long_rest',
    cantripsKnown: [
      3, 3, 3, 4, 4, 4, 4, 4, 4, 5,  // Levels 1-10
      5, 5, 5, 5, 5, 5, 5, 5, 5, 5   // Levels 11-20
    ]
  },

  druid: {
    type: 'prepared',
    ability: 'wis',
    spellcastingLevel: 1,
    swapFrequency: 'long_rest',
    cantripsKnown: [
      2, 2, 2, 3, 3, 3, 3, 3, 3, 4,  // Levels 1-10
      4, 4, 4, 4, 4, 4, 4, 4, 4, 4   // Levels 11-20
    ]
  },

  // Half Casters - Known Spells (SRD 2024: can swap 1 spell per long rest)
  ranger: {
    type: 'known',
    ability: 'wis',
    spellcastingLevel: 1,  // SRD 2024: Gains spellcasting at level 1 (not 2!)
    spellSlotDivisor: 2,
    swapFrequency: 'long_rest',  // SRD 2024: swap 1 per long rest
    knownProgression: [
      2, 2, 3, 3, 4, 4, 5, 5, 6, 6,  // Levels 1-10 (starts with 2, not 0!)
      7, 7, 8, 8, 9, 9, 10, 10, 11, 11  // Levels 11-20
    ],
    cantripsKnown: undefined  // Rangers don't get cantrips by default
  },

  // Half Casters - Known Spells (SRD 2024: Paladin uses known spells, not prepared)
  paladin: {
    type: 'known',  // Changed from 'prepared' per SRD 2024
    ability: 'cha',
    spellcastingLevel: 1,  // SRD 2024: Gains spellcasting at level 1 (not 2!)
    spellSlotDivisor: 2,
    swapFrequency: 'long_rest',  // SRD 2024: swap 1 per long rest
    // Paladin spells known - starts with 2 at level 1
    knownProgression: [
      2, 2, 3, 3, 4, 4, 5, 5, 6, 6,  // Levels 1-10 (starts with 2, not 0!)
      7, 7, 8, 8, 9, 9, 10, 10, 11, 11  // Levels 11-20
    ],
    cantripsKnown: undefined  // Paladins don't get cantrips
  },

  // Non-casters
  barbarian: { type: 'none', ability: 'none', spellcastingLevel: 0 },
  fighter: { type: 'none', ability: 'none', spellcastingLevel: 0 },
  monk: { type: 'none', ability: 'none', spellcastingLevel: 0 },
  rogue: { type: 'none', ability: 'none', spellcastingLevel: 0 },

  // Special cases (subclass casters - simplified)
  // Eldritch Knight (Fighter) and Arcane Trickster (Rogue) would need subclass handling
}

// =============================================================================
// SPELL LEVEL PROGRESSION
// =============================================================================

/**
 * Maximum spell level accessible based on character level
 * For full casters. Half-casters cap at 5th level spells.
 */
const FULL_CASTER_MAX_SPELL_LEVEL: Record<number, number> = {
  1: 1, 2: 1,
  3: 2, 4: 2,
  5: 3, 6: 3,
  7: 4, 8: 4,
  9: 5, 10: 5,
  11: 6, 12: 6,
  13: 7, 14: 7,
  15: 8, 16: 8,
  17: 9, 18: 9, 19: 9, 20: 9
}

const HALF_CASTER_MAX_SPELL_LEVEL: Record<number, number> = {
  1: 1, 2: 1, 3: 1, 4: 1,  // SRD 2024: Half-casters start at level 1 with 1st level spells
  5: 2, 6: 2, 7: 2, 8: 2,
  9: 3, 10: 3, 11: 3, 12: 3,
  13: 4, 14: 4, 15: 4, 16: 4,
  17: 5, 18: 5, 19: 5, 20: 5
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Normalize class name to lowercase key
 */
export function normalizeClassName(className: string): string {
  return className.toLowerCase().trim()
}

/**
 * Get spellcasting info for a class
 */
export function getClassSpellcasting(className: string): ClassSpellcastingInfo | null {
  const normalized = normalizeClassName(className)
  return CLASS_SPELLCASTING[normalized] || null
}

/**
 * Check if a class can cast spells
 */
export function canCastSpells(className: string): boolean {
  const info = getClassSpellcasting(className)
  return info !== null && info.type !== 'none'
}

/**
 * Check if character has reached spellcasting level
 */
export function hasSpellcasting(className: string, level: number): boolean {
  const info = getClassSpellcasting(className)
  if (!info || info.type === 'none') return false
  return level >= info.spellcastingLevel
}

/**
 * Get maximum spell level accessible for a class at a given level
 */
export function getMaxSpellLevel(className: string, level: number): number {
  const info = getClassSpellcasting(className)
  if (!info || info.type === 'none') return 0
  if (!hasSpellcasting(className, level)) return 0

  // Half-casters have different progression
  if (info.spellSlotDivisor === 2) {
    return HALF_CASTER_MAX_SPELL_LEVEL[level] || 0
  }

  return FULL_CASTER_MAX_SPELL_LEVEL[level] || 0
}

/**
 * Get maximum number of known spells for "known" casters
 * Returns null for prepared casters (they don't have a limit)
 */
export function getMaxKnownSpells(className: string, level: number): number | null {
  const info = getClassSpellcasting(className)
  if (!info) return 0
  if (info.type === 'prepared') return null  // No limit for prepared casters
  if (info.type === 'none') return 0
  if (!info.knownProgression) return null

  // Array is 0-indexed, level is 1-indexed
  return info.knownProgression[level - 1] || 0
}

/**
 * Get maximum number of cantrips known
 */
export function getCantripsKnown(className: string, level: number): number {
  const info = getClassSpellcasting(className)
  if (!info || !info.cantripsKnown) return 0
  return info.cantripsKnown[level - 1] || 0
}

/**
 * Get maximum number of prepared spells for "prepared" casters
 * Formula: ability modifier + class level (minimum 1)
 */
export function getMaxPreparedSpells(
  className: string,
  level: number,
  abilityModifier: number
): number {
  const info = getClassSpellcasting(className)
  if (!info || info.type !== 'prepared') return 0
  if (!hasSpellcasting(className, level)) return 0

  // For half-casters, use half level (rounded down)
  const effectiveLevel = info.spellSlotDivisor === 2
    ? Math.floor(level / 2)
    : level

  return Math.max(1, abilityModifier + effectiveLevel)
}

/**
 * Get spellcasting ability modifier from character stats
 */
export function getSpellcastingAbilityScore(
  className: string,
  stats: { int: number; wis: number; cha: number }
): number {
  const info = getClassSpellcasting(className)
  if (!info || info.ability === 'none') return 10

  switch (info.ability) {
    case 'int': return stats.int
    case 'wis': return stats.wis
    case 'cha': return stats.cha
    default: return 10
  }
}

/**
 * Calculate ability modifier from score
 */
export function getModifier(score: number): number {
  return Math.floor((score - 10) / 2)
}

/**
 * Get a summary of spellcasting limits for display
 */
export function getSpellcastingSummary(
  className: string,
  level: number,
  abilityModifier: number
): {
  type: SpellcastingType
  swapFrequency: SpellSwapFrequency
  maxSpellLevel: number
  maxKnown: number | null
  maxPrepared: number | null
  cantripsKnown: number
  canAddSpells: boolean
  description: string
} {
  const info = getClassSpellcasting(className)

  if (!info || info.type === 'none') {
    return {
      type: 'none',
      swapFrequency: 'none',
      maxSpellLevel: 0,
      maxKnown: 0,
      maxPrepared: 0,
      cantripsKnown: 0,
      canAddSpells: false,
      description: 'Questa classe non lancia incantesimi'
    }
  }

  const maxSpellLevel = getMaxSpellLevel(className, level)
  const maxKnown = getMaxKnownSpells(className, level)
  const maxPrepared = info.type === 'prepared'
    ? getMaxPreparedSpells(className, level, abilityModifier)
    : null
  const cantripsKnown = getCantripsKnown(className, level)

  let description = ''
  switch (info.type) {
    case 'known':
      // Different descriptions based on swap frequency (SRD 2024)
      if (info.swapFrequency === 'long_rest') {
        // Paladin/Ranger: can swap 1 per long rest
        description = `Conosci ${maxKnown} incantesimi. Puoi scambiarne 1 per riposo lungo.`
      } else {
        // Bard/Sorcerer/Warlock: swap only at level-up
        description = `Conosci ${maxKnown} incantesimi. Puoi cambiarli solo al level-up.`
      }
      break
    case 'spellbook':
      description = `Libro degli incantesimi. Puoi aggiungere spell trovate e prepararne ${maxPrepared || 'MOD INT + livello'}.`
      break
    case 'prepared':
      description = `Accesso a tutti gli incantesimi della classe. Prepara ${maxPrepared} al giorno.`
      break
  }

  return {
    type: info.type,
    swapFrequency: info.swapFrequency || 'none',
    maxSpellLevel,
    maxKnown,
    maxPrepared,
    cantripsKnown,
    canAddSpells: hasSpellcasting(className, level),
    description
  }
}

/**
 * Check if a character can learn a specific spell
 */
export function canLearnSpell(
  className: string,
  characterLevel: number,
  spellLevel: number,
  spellClasses: string[],
  currentSpellCount: number,
  currentCantripCount: number
): { allowed: boolean; reason?: string } {
  const info = getClassSpellcasting(className)
  const normalized = normalizeClassName(className)

  // Check if class can cast spells
  if (!info || info.type === 'none') {
    return { allowed: false, reason: 'Questa classe non lancia incantesimi' }
  }

  // Check if character has reached spellcasting level
  if (!hasSpellcasting(className, characterLevel)) {
    return {
      allowed: false,
      reason: `Ottieni incantesimi al livello ${info.spellcastingLevel}`
    }
  }

  // Check if spell is available to this class
  if (!spellClasses.map(c => c.toLowerCase()).includes(normalized)) {
    return { allowed: false, reason: 'Incantesimo non disponibile per questa classe' }
  }

  // Check spell level accessibility
  const maxLevel = getMaxSpellLevel(className, characterLevel)
  if (spellLevel > maxLevel) {
    return {
      allowed: false,
      reason: `Puoi imparare solo incantesimi fino al ${maxLevel}° livello`
    }
  }

  // For cantrips, check cantrip limit
  if (spellLevel === 0) {
    const maxCantrips = getCantripsKnown(className, characterLevel)
    if (currentCantripCount >= maxCantrips) {
      return {
        allowed: false,
        reason: `Hai già il massimo di ${maxCantrips} trucchetti`
      }
    }
  }

  // For known casters, check known spell limit (excluding cantrips)
  if (info.type === 'known' && spellLevel > 0) {
    const maxKnown = getMaxKnownSpells(className, characterLevel)
    if (maxKnown !== null && currentSpellCount >= maxKnown) {
      return {
        allowed: false,
        reason: `Hai già il massimo di ${maxKnown} incantesimi conosciuti`
      }
    }
  }

  // Wizard spellbook has no hard limit (can always copy more)
  // Prepared casters have no "known" limit (they pick from full list)

  return { allowed: true }
}
