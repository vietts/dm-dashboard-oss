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

// Update spell (toggle prepared, change sort order)
export async function PUT(request: NextRequest) {
  try {
    const playerAuth = await getPlayerAuth()
    if (!playerAuth) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const { id, is_prepared, sort_order, notes } = await request.json()

    // Verify spell belongs to player's character
    const { data: existing } = await supabaseAdminUntyped
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

    const { error } = await supabaseAdminUntyped
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
