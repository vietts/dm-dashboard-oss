import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdminUntyped } from '@/lib/supabase-admin'

interface PlayerCharacter {
  id: string
  name: string
  campaign_id: string | null
}

interface PlayerRow {
  id: string
  character_id: string
  access_code: string
  player_name: string
  last_login: string | null
  character?: PlayerCharacter | null
}

// Player login with access code
export async function POST(request: NextRequest) {
  try {
    const { accessCode } = await request.json()

    if (!accessCode || typeof accessCode !== 'string') {
      return NextResponse.json(
        { error: 'Codice accesso richiesto' },
        { status: 400 }
      )
    }

    // Check for DM Master Code
    if (accessCode.toUpperCase() === 'DM-MASTER') {
      const playerData = {
        isDM: true,
        playerName: 'Dungeon Master'
      }

      const cookieStore = await cookies()
      cookieStore.set('player-auth', JSON.stringify(playerData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/'
      })

      return NextResponse.json({
        success: true,
        isDM: true,
        playerName: 'Dungeon Master'
      })
    }

    // Find player by access code using admin client (bypasses RLS)
    const { data: player, error } = await supabaseAdminUntyped
      .from('dnd_players')
      .select(`
        *,
        character:dnd_characters(
          id,
          name,
          campaign_id
        )
      `)
      .eq('access_code', accessCode.toUpperCase())
      .single() as { data: PlayerRow | null; error: unknown }

    if (error || !player) {
      return NextResponse.json(
        { error: 'Codice accesso non valido' },
        { status: 401 }
      )
    }

    // Update last_login
    await supabaseAdminUntyped
      .from('dnd_players')
      .update({ last_login: new Date().toISOString() })
      .eq('id', player.id)

    // Set secure cookie with player data
    const playerData = {
      playerId: player.id,
      characterId: player.character_id,
      campaignId: player.character?.campaign_id,
      playerName: player.player_name
    }

    const cookieStore = await cookies()
    cookieStore.set('player-auth', JSON.stringify(playerData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/'
    })

    return NextResponse.json({
      success: true,
      characterId: player.character_id,
      campaignId: player.character?.campaign_id,
      characterName: player.character?.name,
      playerName: player.player_name
    })
  } catch {
    return NextResponse.json(
      { error: 'Errore durante il login' },
      { status: 500 }
    )
  }
}

// Player logout
export async function DELETE() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('player-auth')

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Errore durante il logout' },
      { status: 500 }
    )
  }
}

// Get current player session
export async function GET() {
  try {
    const cookieStore = await cookies()
    const playerCookie = cookieStore.get('player-auth')

    if (!playerCookie?.value) {
      return NextResponse.json(
        { error: 'Non autenticato' },
        { status: 401 }
      )
    }

    const playerData = JSON.parse(playerCookie.value)

    // If DM session, skip player verification
    if (playerData.isDM) {
      return NextResponse.json({
        authenticated: true,
        ...playerData
      })
    }

    // Verify player still exists
    const { data: player, error } = await supabaseAdminUntyped
      .from('dnd_players')
      .select('id, player_name')
      .eq('id', playerData.playerId)
      .single() as { data: { id: string; player_name: string } | null; error: unknown }

    if (error || !player) {
      // Clear invalid cookie
      cookieStore.delete('player-auth')
      return NextResponse.json(
        { error: 'Sessione non valida' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      authenticated: true,
      ...playerData
    })
  } catch {
    return NextResponse.json(
      { error: 'Errore durante la verifica sessione' },
      { status: 500 }
    )
  }
}
