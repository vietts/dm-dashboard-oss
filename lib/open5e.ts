/**
 * Open5e API Client con caching su Supabase
 *
 * API Endpoint: https://api.open5e.com/v1/
 * Docs: https://api.open5e.com/
 */

import { supabase } from './supabase'

const OPEN5E_BASE_URL = 'https://api.open5e.com/v1'
const CACHE_MAX_AGE_HOURS = 24 * 7 // 7 giorni

// =============================================================================
// TYPES
// =============================================================================

export interface Open5eSpell {
  slug: string
  name: string
  level_int: number
  school: string
  casting_time: string
  range: string
  duration: string
  components: string
  requires_concentration: boolean
  desc: string
  higher_level: string
  dnd_class: string
  document__title: string
}

export interface Open5eRace {
  slug: string
  name: string
  size_raw: string
  speed: Record<string, number>
  asi_desc: string
  traits: string
  languages: string
  document__title: string
}

export interface Open5eClass {
  slug: string
  name: string
  hit_dice: string
  hp_at_1st_level: string
  prof_armor: string
  prof_weapons: string
  prof_saving_throws: string
  spellcasting_ability: string
  archetypes: Array<{ name: string; slug: string; desc: string }>
  document__title: string
}

export interface Open5eApiResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface CachedSpell {
  id: string
  slug: string
  name: string
  level_int: number | null
  school: string | null
  casting_time: string | null
  range: string | null
  duration: string | null
  components: string | null
  requires_concentration: boolean
  description: string | null
  higher_level: string | null
  dnd_class: string | null
  document_title: string | null
  raw_data: Open5eSpell
  cached_at: string
}

export interface CachedRace {
  id: string
  slug: string
  name: string
  size_raw: string | null
  speed: Record<string, number> | null
  asi_desc: string | null
  traits: string | null
  languages: string | null
  document_title: string | null
  raw_data: Open5eRace
  cached_at: string
}

export interface CachedClass {
  id: string
  slug: string
  name: string
  hit_dice: string | null
  hp_at_1st_level: string | null
  prof_armor: string | null
  prof_weapons: string | null
  prof_saving_throws: string | null
  spellcasting_ability: string | null
  archetypes: Array<{ name: string; slug: string; desc: string }> | null
  document_title: string | null
  raw_data: Open5eClass
  cached_at: string
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function isCacheValid(cachedAt: string): boolean {
  const cacheDate = new Date(cachedAt)
  const now = new Date()
  const diffHours = (now.getTime() - cacheDate.getTime()) / (1000 * 60 * 60)
  return diffHours < CACHE_MAX_AGE_HOURS
}

async function fetchFromOpen5e<T>(endpoint: string, params?: Record<string, string>): Promise<Open5eApiResponse<T>> {
  const url = new URL(`${OPEN5E_BASE_URL}${endpoint}`)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value)
    })
  }

  const response = await fetch(url.toString())
  if (!response.ok) {
    throw new Error(`Open5e API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

// =============================================================================
// SPELLS
// =============================================================================

export async function searchSpells(query: string, options?: {
  level?: number
  school?: string
  limit?: number
}): Promise<CachedSpell[]> {
  const limit = options?.limit || 20

  // Prima cerca nella cache locale
  let queryBuilder = supabase
    .from('open5e_spells')
    .select('*')
    .ilike('name', `%${query}%`)
    .limit(limit)

  if (options?.level !== undefined) {
    queryBuilder = queryBuilder.eq('level_int', options.level)
  }
  if (options?.school) {
    queryBuilder = queryBuilder.ilike('school', `%${options.school}%`)
  }

  const { data: cachedResults } = await queryBuilder

  // Se abbiamo risultati validi nella cache, restituiscili
  if (cachedResults && cachedResults.length > 0) {
    const validCached = cachedResults.filter(s => isCacheValid(s.cached_at))
    if (validCached.length >= Math.min(5, limit)) {
      return validCached
    }
  }

  // Altrimenti, cerca su Open5e API
  try {
    const params: Record<string, string> = {
      search: query,
      limit: limit.toString()
    }
    if (options?.level !== undefined) {
      params.level_int = options.level.toString()
    }
    if (options?.school) {
      params.school = options.school
    }

    const response = await fetchFromOpen5e<Open5eSpell>('/spells/', params)

    // Salva i risultati nella cache
    const spellsToCache = response.results.map(spell => ({
      slug: spell.slug,
      name: spell.name,
      level_int: spell.level_int,
      school: spell.school,
      casting_time: spell.casting_time,
      range: spell.range,
      duration: spell.duration,
      components: spell.components,
      requires_concentration: spell.requires_concentration,
      description: spell.desc,
      higher_level: spell.higher_level,
      dnd_class: spell.dnd_class,
      document_title: spell.document__title,
      raw_data: spell,
      cached_at: new Date().toISOString()
    }))

    if (spellsToCache.length > 0) {
      await supabase
        .from('open5e_spells')
        .upsert(spellsToCache, { onConflict: 'slug' })
    }

    // Restituisci dalla cache aggiornata
    const { data: freshResults } = await queryBuilder
    return freshResults || []

  } catch (error) {
    console.error('Error fetching from Open5e:', error)
    // In caso di errore API, restituisci la cache anche se scaduta
    return cachedResults || []
  }
}

export async function getSpellBySlug(slug: string): Promise<CachedSpell | null> {
  // Cerca nella cache
  const { data: cached } = await supabase
    .from('open5e_spells')
    .select('*')
    .eq('slug', slug)
    .single()

  if (cached && isCacheValid(cached.cached_at)) {
    return cached
  }

  // Fetch da API
  try {
    const response = await fetch(`${OPEN5E_BASE_URL}/spells/${slug}/`)
    if (!response.ok) return cached || null

    const spell: Open5eSpell = await response.json()

    const spellToCache = {
      slug: spell.slug,
      name: spell.name,
      level_int: spell.level_int,
      school: spell.school,
      casting_time: spell.casting_time,
      range: spell.range,
      duration: spell.duration,
      components: spell.components,
      requires_concentration: spell.requires_concentration,
      description: spell.desc,
      higher_level: spell.higher_level,
      dnd_class: spell.dnd_class,
      document_title: spell.document__title,
      raw_data: spell,
      cached_at: new Date().toISOString()
    }

    const { data: upserted } = await supabase
      .from('open5e_spells')
      .upsert(spellToCache, { onConflict: 'slug' })
      .select()
      .single()

    return upserted
  } catch (error) {
    console.error('Error fetching spell:', error)
    return cached || null
  }
}

// =============================================================================
// RACES
// =============================================================================

export async function searchRaces(query: string, limit = 20): Promise<CachedRace[]> {
  // Prima cerca nella cache locale
  const { data: cachedResults } = await supabase
    .from('open5e_races')
    .select('*')
    .ilike('name', `%${query}%`)
    .limit(limit)

  if (cachedResults && cachedResults.length > 0) {
    const validCached = cachedResults.filter(r => isCacheValid(r.cached_at))
    if (validCached.length >= Math.min(3, limit)) {
      return validCached
    }
  }

  // Fetch da API
  try {
    const response = await fetchFromOpen5e<Open5eRace>('/races/', {
      search: query,
      limit: limit.toString()
    })

    const racesToCache = response.results.map(race => ({
      slug: race.slug,
      name: race.name,
      size_raw: race.size_raw,
      speed: race.speed,
      asi_desc: race.asi_desc,
      traits: race.traits,
      languages: race.languages,
      document_title: race.document__title,
      raw_data: race,
      cached_at: new Date().toISOString()
    }))

    if (racesToCache.length > 0) {
      await supabase
        .from('open5e_races')
        .upsert(racesToCache, { onConflict: 'slug' })
    }

    const { data: freshResults } = await supabase
      .from('open5e_races')
      .select('*')
      .ilike('name', `%${query}%`)
      .limit(limit)

    return freshResults || []

  } catch (error) {
    console.error('Error fetching races:', error)
    return cachedResults || []
  }
}

export async function getAllRaces(): Promise<CachedRace[]> {
  // Controlla se abbiamo razze nella cache
  const { data: cachedRaces, count } = await supabase
    .from('open5e_races')
    .select('*', { count: 'exact' })
    .order('name')

  // Se abbiamo già delle razze nella cache e sono valide, restituiscile
  if (cachedRaces && cachedRaces.length > 10) {
    return cachedRaces
  }

  // Fetch tutte le razze da API
  try {
    const response = await fetchFromOpen5e<Open5eRace>('/races/', { limit: '100' })

    const racesToCache = response.results.map(race => ({
      slug: race.slug,
      name: race.name,
      size_raw: race.size_raw,
      speed: race.speed,
      asi_desc: race.asi_desc,
      traits: race.traits,
      languages: race.languages,
      document_title: race.document__title,
      raw_data: race,
      cached_at: new Date().toISOString()
    }))

    if (racesToCache.length > 0) {
      await supabase
        .from('open5e_races')
        .upsert(racesToCache, { onConflict: 'slug' })
    }

    const { data: freshResults } = await supabase
      .from('open5e_races')
      .select('*')
      .order('name')

    return freshResults || []

  } catch (error) {
    console.error('Error fetching all races:', error)
    return cachedRaces || []
  }
}

// =============================================================================
// CLASSES
// =============================================================================

export async function searchClasses(query: string, limit = 20): Promise<CachedClass[]> {
  // Prima cerca nella cache locale
  const { data: cachedResults } = await supabase
    .from('open5e_classes')
    .select('*')
    .ilike('name', `%${query}%`)
    .limit(limit)

  if (cachedResults && cachedResults.length > 0) {
    const validCached = cachedResults.filter(c => isCacheValid(c.cached_at))
    if (validCached.length >= Math.min(3, limit)) {
      return validCached
    }
  }

  // Fetch da API
  try {
    const response = await fetchFromOpen5e<Open5eClass>('/classes/', {
      search: query,
      limit: limit.toString()
    })

    const classesToCache = response.results.map(cls => ({
      slug: cls.slug,
      name: cls.name,
      hit_dice: cls.hit_dice,
      hp_at_1st_level: cls.hp_at_1st_level,
      prof_armor: cls.prof_armor,
      prof_weapons: cls.prof_weapons,
      prof_saving_throws: cls.prof_saving_throws,
      spellcasting_ability: cls.spellcasting_ability,
      archetypes: cls.archetypes,
      document_title: cls.document__title,
      raw_data: cls,
      cached_at: new Date().toISOString()
    }))

    if (classesToCache.length > 0) {
      await supabase
        .from('open5e_classes')
        .upsert(classesToCache, { onConflict: 'slug' })
    }

    const { data: freshResults } = await supabase
      .from('open5e_classes')
      .select('*')
      .ilike('name', `%${query}%`)
      .limit(limit)

    return freshResults || []

  } catch (error) {
    console.error('Error fetching classes:', error)
    return cachedResults || []
  }
}

export async function getAllClasses(): Promise<CachedClass[]> {
  // Controlla se abbiamo classi nella cache
  const { data: cachedClasses } = await supabase
    .from('open5e_classes')
    .select('*')
    .order('name')

  // Se abbiamo le classi base (12+), restituiscile
  if (cachedClasses && cachedClasses.length >= 12) {
    return cachedClasses
  }

  // Fetch tutte le classi da API
  try {
    const response = await fetchFromOpen5e<Open5eClass>('/classes/', { limit: '50' })

    const classesToCache = response.results.map(cls => ({
      slug: cls.slug,
      name: cls.name,
      hit_dice: cls.hit_dice,
      hp_at_1st_level: cls.hp_at_1st_level,
      prof_armor: cls.prof_armor,
      prof_weapons: cls.prof_weapons,
      prof_saving_throws: cls.prof_saving_throws,
      spellcasting_ability: cls.spellcasting_ability,
      archetypes: cls.archetypes,
      document_title: cls.document__title,
      raw_data: cls,
      cached_at: new Date().toISOString()
    }))

    if (classesToCache.length > 0) {
      await supabase
        .from('open5e_classes')
        .upsert(classesToCache, { onConflict: 'slug' })
    }

    const { data: freshResults } = await supabase
      .from('open5e_classes')
      .select('*')
      .order('name')

    return freshResults || []

  } catch (error) {
    console.error('Error fetching all classes:', error)
    return cachedClasses || []
  }
}

// =============================================================================
// SPELL SCHOOLS & LEVELS (per filtri UI)
// =============================================================================

export const SPELL_SCHOOLS = [
  'Abjuration',
  'Conjuration',
  'Divination',
  'Enchantment',
  'Evocation',
  'Illusion',
  'Necromancy',
  'Transmutation'
]

export const SPELL_LEVELS = [
  { value: 0, label: 'Trucchetto' },
  { value: 1, label: '1° livello' },
  { value: 2, label: '2° livello' },
  { value: 3, label: '3° livello' },
  { value: 4, label: '4° livello' },
  { value: 5, label: '5° livello' },
  { value: 6, label: '6° livello' },
  { value: 7, label: '7° livello' },
  { value: 8, label: '8° livello' },
  { value: 9, label: '9° livello' }
]

export const DND_CLASSES_LIST = [
  'Barbarian',
  'Bard',
  'Cleric',
  'Druid',
  'Fighter',
  'Monk',
  'Paladin',
  'Ranger',
  'Rogue',
  'Sorcerer',
  'Warlock',
  'Wizard',
  'Artificer'
]
