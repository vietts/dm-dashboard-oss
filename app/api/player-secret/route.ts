import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdminUntyped } from '@/lib/supabase-admin'

// GET - Retrieve secret for a player (used by DM preview)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const playerId = searchParams.get('playerId')

  if (!playerId) {
    return NextResponse.json(
      { success: false, error: 'Player ID required' },
      { status: 400 }
    )
  }

  try {
    const { data, error } = await supabaseAdminUntyped
      .from('dnd_players')
      .select('character_secret')
      .eq('id', playerId)
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: data?.character_secret || ''
    })
  } catch (error) {
    console.error('Error fetching secret:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch secret' },
      { status: 500 }
    )
  }
}

// PATCH - Set secret for a player (one-time sealed write)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { playerId, secret } = body as {
      playerId: string
      secret: string
    }

    if (!playerId) {
      return NextResponse.json(
        { success: false, error: 'Player ID required' },
        { status: 400 }
      )
    }

    if (!secret || secret.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Secret cannot be empty' },
        { status: 400 }
      )
    }

    // Check if secret already exists (sealed = cannot modify)
    const { data: currentData } = await supabaseAdminUntyped
      .from('dnd_players')
      .select('character_secret')
      .eq('id', playerId)
      .single()

    if (currentData?.character_secret && currentData.character_secret.trim().length > 0) {
      return NextResponse.json(
        { success: false, error: 'Secret already sealed. Cannot modify.' },
        { status: 403 }
      )
    }

    // Set the secret (one-time write)
    const { error } = await supabaseAdminUntyped
      .from('dnd_players')
      .update({ character_secret: secret.trim() })
      .eq('id', playerId)

    if (error) throw error

    return NextResponse.json({
      success: true,
      sealed: true
    })
  } catch (error) {
    console.error('Error setting secret:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to set secret' },
      { status: 500 }
    )
  }
}
