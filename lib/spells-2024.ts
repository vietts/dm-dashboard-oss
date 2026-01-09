/**
 * D&D 2024 Spells Client
 *
 * Spell data from D&D 5e 2024 edition (SRD v5.2)
 * Static data stored in Supabase - no external API calls
 */

import { supabase } from './supabase'

// =============================================================================
// TYPES
// =============================================================================

export interface Spell2024 {
  id: string
  slug: string
  name: string
  name_it: string | null
  level: number
  school: string
  classes: string[]
  action_type: string | null
  concentration: boolean
  ritual: boolean
  range: string | null
  components: string[] | null
  material: string | null
  duration: string | null
  description: string | null
  description_it: string | null
  cantrip_upgrade: string | null
  higher_level_slot: string | null

  // Combat & Mechanics Fields
  saving_throw: string | null       // Es: "Saggezza", "Destrezza"
  attack_roll: boolean               // Richiede tiro per colpire
  damage: string | null              // Es: "3d8 psichici", "1d6 per livello"
  area_of_effect: string | null      // Es: "raggio 6m", "cubo 3m"

  created_at: string
}

export interface SpellSearchOptions {
  level?: number
  school?: string
  className?: string
  concentration?: boolean
  ritual?: boolean
  limit?: number
  useItalian?: boolean
}

// =============================================================================
// SPELL SEARCH & FETCH
// =============================================================================

/**
 * Search spells by name with optional filters
 */
export async function searchSpells2024(
  query: string,
  options?: SpellSearchOptions
): Promise<Spell2024[]> {
  const limit = options?.limit || 20

  let queryBuilder = supabase
    .from('dnd_2024_spells')
    .select('*')

  // Search by name (both EN and IT)
  if (query) {
    queryBuilder = queryBuilder.or(`name.ilike.%${query}%,name_it.ilike.%${query}%`)
  }

  // Filter by level
  if (options?.level !== undefined) {
    queryBuilder = queryBuilder.eq('level', options.level)
  }

  // Filter by school
  if (options?.school) {
    queryBuilder = queryBuilder.ilike('school', options.school)
  }

  // Filter by class (using array contains)
  if (options?.className) {
    queryBuilder = queryBuilder.contains('classes', [options.className.toLowerCase()])
  }

  // Filter by concentration
  if (options?.concentration !== undefined) {
    queryBuilder = queryBuilder.eq('concentration', options.concentration)
  }

  // Filter by ritual
  if (options?.ritual !== undefined) {
    queryBuilder = queryBuilder.eq('ritual', options.ritual)
  }

  // Order and limit
  queryBuilder = queryBuilder
    .order('level', { ascending: true })
    .order('name', { ascending: true })
    .limit(limit)

  const { data, error } = await queryBuilder

  if (error) {
    console.error('Error searching spells:', error)
    return []
  }

  return data || []
}

/**
 * Get spell by slug
 */
export async function getSpellBySlug2024(slug: string): Promise<Spell2024 | null> {
  const { data, error } = await supabase
    .from('dnd_2024_spells')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    console.error('Error fetching spell:', error)
    return null
  }

  return data
}

/**
 * Get spell by ID
 */
export async function getSpellById2024(id: string): Promise<Spell2024 | null> {
  const { data, error } = await supabase
    .from('dnd_2024_spells')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching spell:', error)
    return null
  }

  return data
}

/**
 * Get all spells for a specific class
 */
export async function getSpellsForClass(
  className: string,
  options?: { level?: number; limit?: number }
): Promise<Spell2024[]> {
  let queryBuilder = supabase
    .from('dnd_2024_spells')
    .select('*')
    .contains('classes', [className.toLowerCase()])

  if (options?.level !== undefined) {
    queryBuilder = queryBuilder.eq('level', options.level)
  }

  queryBuilder = queryBuilder
    .order('level', { ascending: true })
    .order('name', { ascending: true })

  if (options?.limit) {
    queryBuilder = queryBuilder.limit(options.limit)
  }

  const { data, error } = await queryBuilder

  if (error) {
    console.error('Error fetching spells for class:', error)
    return []
  }

  return data || []
}

/**
 * Get all cantrips (level 0 spells)
 */
export async function getCantrips(className?: string): Promise<Spell2024[]> {
  let queryBuilder = supabase
    .from('dnd_2024_spells')
    .select('*')
    .eq('level', 0)

  if (className) {
    queryBuilder = queryBuilder.contains('classes', [className.toLowerCase()])
  }

  queryBuilder = queryBuilder.order('name', { ascending: true })

  const { data, error } = await queryBuilder

  if (error) {
    console.error('Error fetching cantrips:', error)
    return []
  }

  return data || []
}

/**
 * Get all spells grouped by level (for spell lists)
 */
export async function getSpellsByLevel(
  className?: string
): Promise<Record<number, Spell2024[]>> {
  let queryBuilder = supabase
    .from('dnd_2024_spells')
    .select('*')

  if (className) {
    queryBuilder = queryBuilder.contains('classes', [className.toLowerCase()])
  }

  queryBuilder = queryBuilder
    .order('level', { ascending: true })
    .order('name', { ascending: true })

  const { data, error } = await queryBuilder

  if (error) {
    console.error('Error fetching spells:', error)
    return {}
  }

  // Group by level
  const grouped: Record<number, Spell2024[]> = {}
  for (const spell of data || []) {
    if (!grouped[spell.level]) {
      grouped[spell.level] = []
    }
    grouped[spell.level].push(spell)
  }

  return grouped
}

/**
 * Get spell count by level
 */
export async function getSpellCountByLevel(
  className?: string
): Promise<Record<number, number>> {
  let queryBuilder = supabase
    .from('dnd_2024_spells')
    .select('level')

  if (className) {
    queryBuilder = queryBuilder.contains('classes', [className.toLowerCase()])
  }

  const { data, error } = await queryBuilder

  if (error) {
    console.error('Error counting spells:', error)
    return {}
  }

  const counts: Record<number, number> = {}
  for (const spell of data || []) {
    counts[spell.level] = (counts[spell.level] || 0) + 1
  }

  return counts
}

// =============================================================================
// TRANSLATION HELPERS
// =============================================================================

/**
 * Update Italian translation for a spell
 */
export async function updateSpellTranslation(
  spellId: string,
  translations: { name_it?: string; description_it?: string }
): Promise<boolean> {
  const { error } = await supabase
    .from('dnd_2024_spells')
    .update(translations)
    .eq('id', spellId)

  if (error) {
    console.error('Error updating spell translation:', error)
    return false
  }

  return true
}

/**
 * Get spells that need translation
 */
export async function getUntranslatedSpells(limit = 20): Promise<Spell2024[]> {
  const { data, error } = await supabase
    .from('dnd_2024_spells')
    .select('*')
    .is('name_it', null)
    .order('level', { ascending: true })
    .order('name', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('Error fetching untranslated spells:', error)
    return []
  }

  return data || []
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Format components for display
 */
export function formatComponents(spell: Spell2024): string {
  if (!spell.components || spell.components.length === 0) return '-'

  const parts = spell.components.map(c => {
    switch (c.toLowerCase()) {
      case 'v': return 'V'
      case 's': return 'S'
      case 'm': return spell.material ? `M (${spell.material})` : 'M'
      default: return c.toUpperCase()
    }
  })

  return parts.join(', ')
}

/**
 * Get display name (Italian if available, otherwise English)
 */
export function getSpellDisplayName(spell: Spell2024, preferItalian = true): string {
  if (preferItalian && spell.name_it) {
    return spell.name_it
  }
  return spell.name
}

/**
 * Get display description (Italian if available, otherwise English)
 */
export function getSpellDisplayDescription(spell: Spell2024, preferItalian = true): string | null {
  if (preferItalian && spell.description_it) {
    return spell.description_it
  }
  return spell.description
}

/**
 * Format action type for display
 */
export function formatActionType(actionType: string | null): string {
  if (!actionType) return '-'

  switch (actionType.toLowerCase()) {
    case 'action': return 'Azione'
    case 'bonusaction': return 'Azione bonus'
    case 'reaction': return 'Reazione'
    case 'minute': return '1 minuto'
    case '10minutes': return '10 minuti'
    case 'hour': return '1 ora'
    default: return actionType
  }
}

/**
 * Format school name for display
 */
export function formatSchool(school: string): string {
  const schools: Record<string, string> = {
    'abjuration': 'Abiurazione',
    'conjuration': 'Convocazione',
    'divination': 'Divinazione',
    'enchantment': 'Incantamento',
    'evocation': 'Evocazione',
    'illusion': 'Illusione',
    'necromancy': 'Necromanzia',
    'transmutation': 'Trasmutazione'
  }
  return schools[school.toLowerCase()] || school
}

/**
 * Format level for display
 */
export function formatSpellLevel(level: number): string {
  if (level === 0) return 'Trucchetto'
  return `${level}° livello`
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const SPELL_SCHOOLS_2024 = [
  { value: 'abjuration', label: 'Abiurazione', labelEn: 'Abjuration' },
  { value: 'conjuration', label: 'Convocazione', labelEn: 'Conjuration' },
  { value: 'divination', label: 'Divinazione', labelEn: 'Divination' },
  { value: 'enchantment', label: 'Incantamento', labelEn: 'Enchantment' },
  { value: 'evocation', label: 'Evocazione', labelEn: 'Evocation' },
  { value: 'illusion', label: 'Illusione', labelEn: 'Illusion' },
  { value: 'necromancy', label: 'Necromanzia', labelEn: 'Necromancy' },
  { value: 'transmutation', label: 'Trasmutazione', labelEn: 'Transmutation' }
]

export const SPELL_LEVELS_2024 = [
  { value: 0, label: 'Trucchetto', labelEn: 'Cantrip' },
  { value: 1, label: '1° livello', labelEn: '1st level' },
  { value: 2, label: '2° livello', labelEn: '2nd level' },
  { value: 3, label: '3° livello', labelEn: '3rd level' },
  { value: 4, label: '4° livello', labelEn: '4th level' },
  { value: 5, label: '5° livello', labelEn: '5th level' },
  { value: 6, label: '6° livello', labelEn: '6th level' },
  { value: 7, label: '7° livello', labelEn: '7th level' },
  { value: 8, label: '8° livello', labelEn: '8th level' },
  { value: 9, label: '9° livello', labelEn: '9th level' }
]

export const SPELLCASTING_CLASSES_2024 = [
  { value: 'bard', label: 'Bardo', labelEn: 'Bard' },
  { value: 'cleric', label: 'Chierico', labelEn: 'Cleric' },
  { value: 'druid', label: 'Druido', labelEn: 'Druid' },
  { value: 'paladin', label: 'Paladino', labelEn: 'Paladin' },
  { value: 'ranger', label: 'Ranger', labelEn: 'Ranger' },
  { value: 'sorcerer', label: 'Stregone', labelEn: 'Sorcerer' },
  { value: 'warlock', label: 'Warlock', labelEn: 'Warlock' },
  { value: 'wizard', label: 'Mago', labelEn: 'Wizard' }
]
