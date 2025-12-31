import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdminUntyped } from '@/lib/supabase-admin'

// Generate random 8-character alphanumeric code
function generateAccessCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Excludes I,O,0,1 for readability
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// Verify DM is authenticated
async function verifyDMAuth(): Promise<boolean> {
  const cookieStore = await cookies()
  const authCookie = cookieStore.get('dm-auth')
  return authCookie?.value === process.env.AUTH_SECRET
}

// Generate or regenerate player access code
export async function POST(request: NextRequest) {
  try {
    // Verify DM authentication
    if (!await verifyDMAuth()) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      )
    }

    const { characterId, playerName } = await request.json()

    if (!characterId || !playerName) {
      return NextResponse.json(
        { error: 'characterId e playerName richiesti' },
        { status: 400 }
      )
    }

    // Check if player record already exists for this character
    const { data: existingPlayer } = await supabaseAdminUntyped
      .from('dnd_players')
      .select('id')
      .eq('character_id', characterId)
      .single() as { data: { id: string } | null }

    // Generate unique access code
    let accessCode: string
    let isUnique = false
    let attempts = 0

    do {
      accessCode = generateAccessCode()
      const { data } = await supabaseAdminUntyped
        .from('dnd_players')
        .select('id')
        .eq('access_code', accessCode)
        .single() as { data: { id: string } | null }
      isUnique = !data
      attempts++
    } while (!isUnique && attempts < 10)

    if (!isUnique) {
      return NextResponse.json(
        { error: 'Impossibile generare codice unico' },
        { status: 500 }
      )
    }

    if (existingPlayer) {
      // Update existing player with new code
      const { error } = await supabaseAdminUntyped
        .from('dnd_players')
        .update({
          access_code: accessCode,
          player_name: playerName
        })
        .eq('id', existingPlayer.id)

      if (error) {
        return NextResponse.json(
          { error: 'Errore aggiornamento codice' },
          { status: 500 }
        )
      }
    } else {
      // Create new player record
      const { error } = await supabaseAdminUntyped
        .from('dnd_players')
        .insert({
          character_id: characterId,
          access_code: accessCode,
          player_name: playerName
        })

      if (error) {
        return NextResponse.json(
          { error: 'Errore creazione giocatore' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      accessCode,
      isNew: !existingPlayer
    })
  } catch {
    return NextResponse.json(
      { error: 'Errore durante la generazione codice' },
      { status: 500 }
    )
  }
}

// Get player code for a character (DM only)
export async function GET(request: NextRequest) {
  try {
    if (!await verifyDMAuth()) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const characterId = searchParams.get('characterId')

    if (!characterId) {
      return NextResponse.json(
        { error: 'characterId richiesto' },
        { status: 400 }
      )
    }

    const { data: player, error } = await supabaseAdminUntyped
      .from('dnd_players')
      .select('id, access_code, player_name, last_login, created_at')
      .eq('character_id', characterId)
      .single()

    if (error || !player) {
      return NextResponse.json({
        exists: false
      })
    }

    return NextResponse.json({
      exists: true,
      ...player
    })
  } catch {
    return NextResponse.json(
      { error: 'Errore durante la ricerca' },
      { status: 500 }
    )
  }
}

// Revoke player access
export async function DELETE(request: NextRequest) {
  try {
    if (!await verifyDMAuth()) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const characterId = searchParams.get('characterId')

    if (!characterId) {
      return NextResponse.json(
        { error: 'characterId richiesto' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdminUntyped
      .from('dnd_players')
      .delete()
      .eq('character_id', characterId)

    if (error) {
      return NextResponse.json(
        { error: 'Errore durante la revoca' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Errore durante la revoca accesso' },
      { status: 500 }
    )
  }
}
