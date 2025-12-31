import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdminUntyped } from '@/lib/supabase-admin'

// Get player auth from cookie
async function getPlayerAuth() {
  const cookieStore = await cookies()
  const playerCookie = cookieStore.get('player-auth')
  if (!playerCookie?.value) return null
  try {
    return JSON.parse(playerCookie.value)
  } catch {
    return null
  }
}

// Add inventory item
export async function POST(request: NextRequest) {
  try {
    const playerAuth = await getPlayerAuth()
    if (!playerAuth) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const { characterId, item_name, quantity, weight, notes, is_equipped } = await request.json()

    // Verify player owns this character
    if (characterId !== playerAuth.characterId) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const { data, error } = await supabaseAdminUntyped
      .from('dnd_inventory')
      .insert({
        character_id: characterId,
        item_name,
        quantity: quantity || 1,
        weight: weight || null,
        notes: notes || null,
        is_equipped: is_equipped || false,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Errore aggiunta oggetto' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}

// Update inventory item
export async function PUT(request: NextRequest) {
  try {
    const playerAuth = await getPlayerAuth()
    if (!playerAuth) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const item = await request.json()

    // Verify item belongs to player's character
    const { data: existing } = await supabaseAdminUntyped
      .from('dnd_inventory')
      .select('character_id')
      .eq('id', item.id)
      .single() as { data: { character_id: string } | null }

    if (!existing || existing.character_id !== playerAuth.characterId) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const { error } = await supabaseAdminUntyped
      .from('dnd_inventory')
      .update({
        item_name: item.item_name,
        quantity: item.quantity,
        weight: item.weight,
        notes: item.notes,
        is_equipped: item.is_equipped,
        sort_order: item.sort_order,
      })
      .eq('id', item.id)

    if (error) {
      return NextResponse.json({ error: 'Errore aggiornamento' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}

// Delete inventory item
export async function DELETE(request: NextRequest) {
  try {
    const playerAuth = await getPlayerAuth()
    if (!playerAuth) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('id')

    if (!itemId) {
      return NextResponse.json({ error: 'ID richiesto' }, { status: 400 })
    }

    // Verify item belongs to player's character
    const { data: existing } = await supabaseAdminUntyped
      .from('dnd_inventory')
      .select('character_id')
      .eq('id', itemId)
      .single() as { data: { character_id: string } | null }

    if (!existing || existing.character_id !== playerAuth.characterId) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const { error } = await supabaseAdminUntyped
      .from('dnd_inventory')
      .delete()
      .eq('id', itemId)

    if (error) {
      return NextResponse.json({ error: 'Errore eliminazione' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}
