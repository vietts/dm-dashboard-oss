import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdminUntyped } from '@/lib/supabase-admin'

// GET: Fetch spells for a monster
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const monsterId = searchParams.get('monsterId')

    if (!monsterId) {
      return NextResponse.json({ error: 'monsterId richiesto' }, { status: 400 })
    }

    const { data, error } = await supabaseAdminUntyped
      .from('dnd_monster_spells')
      .select('*')
      .eq('monster_id', monsterId)
      .order('spell_level', { ascending: true })
      .order('spell_name', { ascending: true })

    if (error) {
      console.error('Fetch monster spells error:', error)
      return NextResponse.json({ error: 'Errore caricamento spell' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('Monster spells GET error:', err)
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}

// POST: Add spell to monster
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { monster_id, spell_slug, spell_name, spell_level, uses_per_day, notes } = body

    if (!monster_id || !spell_slug || !spell_name) {
      return NextResponse.json({ error: 'monster_id, spell_slug e spell_name richiesti' }, { status: 400 })
    }

    // Check if spell already exists for this monster
    const { data: existing } = await supabaseAdminUntyped
      .from('dnd_monster_spells')
      .select('id')
      .eq('monster_id', monster_id)
      .eq('spell_slug', spell_slug)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Spell già assegnato a questo mostro' }, { status: 400 })
    }

    const { data, error } = await supabaseAdminUntyped
      .from('dnd_monster_spells')
      .insert({
        monster_id,
        spell_slug,
        spell_name,
        spell_level: spell_level || 0,
        uses_per_day: uses_per_day || null,
        notes: notes || null
      })
      .select()
      .single()

    if (error) {
      console.error('Add monster spell error:', error)
      return NextResponse.json({ error: 'Errore aggiunta spell' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('Monster spells POST error:', err)
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}

// PUT: Update spell (uses_per_day, notes)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, uses_per_day, notes } = body

    if (!id) {
      return NextResponse.json({ error: 'ID richiesto' }, { status: 400 })
    }

    const { data, error } = await supabaseAdminUntyped
      .from('dnd_monster_spells')
      .update({
        uses_per_day: uses_per_day ?? null,
        notes: notes ?? null
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Update monster spell error:', error)
      return NextResponse.json({ error: 'Errore aggiornamento spell' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('Monster spells PUT error:', err)
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}

// DELETE: Remove spell from monster
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID richiesto' }, { status: 400 })
    }

    const { error } = await supabaseAdminUntyped
      .from('dnd_monster_spells')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Delete monster spell error:', error)
      return NextResponse.json({ error: 'Errore rimozione spell' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Monster spells DELETE error:', err)
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}
