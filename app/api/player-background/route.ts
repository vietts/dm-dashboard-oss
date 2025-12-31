import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdminUntyped } from '@/lib/supabase-admin'
import { BackgroundAnswers } from '@/types/database'

// GET - Retrieve background answers for a player
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
      .select('background_answers')
      .eq('id', playerId)
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: data?.background_answers || {}
    })
  } catch (error) {
    console.error('Error fetching background:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch background' },
      { status: 500 }
    )
  }
}

// PATCH - Update background answers for a player
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { playerId, answers } = body as {
      playerId: string
      answers: BackgroundAnswers
    }

    if (!playerId) {
      return NextResponse.json(
        { success: false, error: 'Player ID required' },
        { status: 400 }
      )
    }

    // Get current answers to merge with new ones
    const { data: currentData } = await supabaseAdminUntyped
      .from('dnd_players')
      .select('background_answers')
      .eq('id', playerId)
      .single()

    const currentAnswers = (currentData?.background_answers as BackgroundAnswers) || {}
    const mergedAnswers: BackgroundAnswers = {
      ...currentAnswers,
      ...answers
    }

    // Update with merged answers
    const { error } = await supabaseAdminUntyped
      .from('dnd_players')
      .update({ background_answers: mergedAnswers })
      .eq('id', playerId)

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: mergedAnswers
    })
  } catch (error) {
    console.error('Error updating background:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update background' },
      { status: 500 }
    )
  }
}
