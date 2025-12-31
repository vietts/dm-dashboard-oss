import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdminUntyped } from '@/lib/supabase-admin'

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

// Add player note
export async function POST(request: NextRequest) {
  try {
    const playerAuth = await getPlayerAuth()
    if (!playerAuth) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const { playerId, title, content } = await request.json()

    if (playerId !== playerAuth.playerId) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const { data, error } = await supabaseAdminUntyped
      .from('dnd_player_notes')
      .insert({
        player_id: playerId,
        title: title || null,
        content: content || null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Errore creazione nota' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}

// Update player note
export async function PUT(request: NextRequest) {
  try {
    const playerAuth = await getPlayerAuth()
    if (!playerAuth) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const { id, title, content, sort_order } = await request.json()

    // Verify note belongs to player
    const { data: existing } = await supabaseAdminUntyped
      .from('dnd_player_notes')
      .select('player_id')
      .eq('id', id)
      .single() as { data: { player_id: string } | null }

    if (!existing || existing.player_id !== playerAuth.playerId) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const { error } = await supabaseAdminUntyped
      .from('dnd_player_notes')
      .update({
        title,
        content,
        sort_order,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: 'Errore aggiornamento' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}

// Delete player note
export async function DELETE(request: NextRequest) {
  try {
    const playerAuth = await getPlayerAuth()
    if (!playerAuth) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const noteId = searchParams.get('id')

    if (!noteId) {
      return NextResponse.json({ error: 'ID richiesto' }, { status: 400 })
    }

    // Verify note belongs to player
    const { data: existing } = await supabaseAdminUntyped
      .from('dnd_player_notes')
      .select('player_id')
      .eq('id', noteId)
      .single() as { data: { player_id: string } | null }

    if (!existing || existing.player_id !== playerAuth.playerId) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const { error } = await supabaseAdminUntyped
      .from('dnd_player_notes')
      .delete()
      .eq('id', noteId)

    if (error) {
      return NextResponse.json({ error: 'Errore eliminazione' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}
