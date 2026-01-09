import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'
import {
  canLearnSpell,
  normalizeClassName,
  getClassSpellcasting
} from '@/lib/spell-rules'

interface PlayerAuth {
  characterId: string
  playerId: string
  campaignId: string
}

interface CharacterData {
  id: string
  class: string
  level: number
}

async function getPlayerAuth(): Promise<PlayerAuth | null> {
  const cookieStore = await cookies()
  const playerCookie = cookieStore.get('player-auth')
  if (!playerCookie?.value) return null
  try {
    return JSON.parse(playerCookie.value)
  } catch {
    return null
  }
}

// Update spell (toggle prepared, change sort order)
export async function PUT(request: NextRequest) {
  try {
    const playerAuth = await getPlayerAuth()
    if (!playerAuth) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const { id, is_prepared, sort_order, notes } = await request.json()

    // Verify spell belongs to player's character
    const { data: existing } = await supabase
      .from('dnd_character_spells')
      .select('character_id')
      .eq('id', id)
      .single() as { data: { character_id: string } | null }

    if (!existing || existing.character_id !== playerAuth.characterId) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const updateData: Record<string, unknown> = {}
    if (is_prepared !== undefined) updateData.is_prepared = is_prepared
    if (sort_order !== undefined) updateData.sort_order = sort_order
    if (notes !== undefined) updateData.notes = notes

    const { error } = await supabase
      .from('dnd_character_spells')
      .update(updateData)
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: 'Errore aggiornamento' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}

// Add a new spell to character
export async function POST(request: NextRequest) {
  try {
    const playerAuth = await getPlayerAuth()
    if (!playerAuth) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const { character_id, spell_slug, spell_name, spell_level } = await request.json()

    // Verify character belongs to player
    if (character_id !== playerAuth.characterId) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    // Get character details
    const { data: character, error: charError } = await supabase
      .from('dnd_characters')
      .select('id, class, level')
      .eq('id', character_id)
      .single() as { data: CharacterData | null; error: any }

    console.log('Character query:', { character_id, character, charError })

    if (!character) {
      return NextResponse.json({ error: 'Personaggio non trovato' }, { status: 404 })
    }

    // Check if spell already exists for this character
    const { data: existingSpell } = await supabase
      .from('dnd_character_spells')
      .select('id')
      .eq('character_id', character_id)
      .eq('spell_slug', spell_slug)
      .single()

    if (existingSpell) {
      return NextResponse.json({ error: 'Incantesimo già presente' }, { status: 400 })
    }

    // Get spell info from 2024 spells table
    const { data: spell } = await supabase
      .from('dnd_2024_spells')
      .select('slug, name, name_it, level, classes')
      .eq('slug', spell_slug)
      .single() as { data: { slug: string; name: string; name_it: string; level: number; classes: string[] } | null }

    console.log('Spell query:', { spell_slug, spell })

    if (!spell) {
      return NextResponse.json({ error: 'Incantesimo non trovato' }, { status: 404 })
    }

    // Get current spells count for this character
    const { data: currentSpells } = await supabase
      .from('dnd_character_spells')
      .select('spell_level')
      .eq('character_id', character_id) as { data: { spell_level: number }[] | null }

    const spellCount = currentSpells?.filter(s => s.spell_level > 0).length || 0
    const cantripCount = currentSpells?.filter(s => s.spell_level === 0).length || 0

    // Check if character can learn this spell
    const normalizedClass = normalizeClassName(character.class)
    const canLearn = canLearnSpell(
      normalizedClass,
      character.level,
      spell.level,
      spell.classes,
      spellCount,
      cantripCount
    )

    if (!canLearn.allowed) {
      return NextResponse.json({ error: canLearn.reason || 'Non puoi imparare questo incantesimo' }, { status: 400 })
    }

    // Add the spell
    const insertData = {
      character_id,
      spell_slug,
      spell_name, // Use the name from request body (already correct)
      spell_level: spell.level,
      is_prepared: spell.level === 0, // Cantrips are always prepared
      sort_order: 0
    }
    console.log('Insert data:', insertData)

    const { error } = await supabase
      .from('dnd_character_spells')
      .insert(insertData)

    if (error) {
      console.error('Insert spell error:', error)
      return NextResponse.json({ error: 'Errore aggiunta incantesimo' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Add spell error:', err)
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}

// Remove a spell from character
export async function DELETE(request: NextRequest) {
  try {
    const playerAuth = await getPlayerAuth()
    if (!playerAuth) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const spellId = searchParams.get('id')

    if (!spellId) {
      return NextResponse.json({ error: 'ID incantesimo richiesto' }, { status: 400 })
    }

    // Verify spell belongs to player's character
    const { data: existing } = await supabase
      .from('dnd_character_spells')
      .select('character_id')
      .eq('id', spellId)
      .single() as { data: { character_id: string } | null }

    if (!existing || existing.character_id !== playerAuth.characterId) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    // Delete the spell
    const { error } = await supabase
      .from('dnd_character_spells')
      .delete()
      .eq('id', spellId)

    if (error) {
      console.error('Delete spell error:', error)
      return NextResponse.json({ error: 'Errore rimozione incantesimo' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Delete spell error:', err)
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}
