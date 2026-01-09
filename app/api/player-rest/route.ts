import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export const dynamic = 'force-dynamic'

/**
 * API Route: /api/player-rest
 *
 * Gestisce i riposi (breve/lungo) per un personaggio.
 * Reset delle risorse appropriate in base al tipo di riposo.
 *
 * POST body:
 * {
 *   characterId: string
 *   restType: 'short' | 'long'
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { characterId, restType } = body

    if (!characterId || !restType) {
      return NextResponse.json(
        { error: 'characterId e restType sono richiesti' },
        { status: 400 }
      )
    }

    if (restType !== 'short' && restType !== 'long') {
      return NextResponse.json(
        { error: 'restType deve essere "short" o "long"' },
        { status: 400 }
      )
    }

    // 1. Fetch character
    const { data: character, error: charError } = await supabase
      .from('dnd_characters')
      .select('*')
      .eq('id', characterId)
      .single()

    if (charError || !character) {
      return NextResponse.json({ error: 'Personaggio non trovato' }, { status: 404 })
    }

    // 2. Reset class resources
    const classResources = (character.class_resources as any[] | null) || []
    const updatedResources = classResources.map((resource) => {
      // Reset in base al recharge type
      if (restType === 'long' && resource.recharge === 'long') {
        return { ...resource, current: resource.max }
      }
      if (restType === 'short' && resource.recharge === 'short') {
        return { ...resource, current: resource.max }
      }
      // Riposo lungo resetta ANCHE le risorse che si ricaricano con riposo breve
      if (restType === 'long' && resource.recharge === 'short') {
        return { ...resource, current: resource.max }
      }
      return resource
    })

    // 3. Reset character actions (dnd_character_actions)
    const { data: actions, error: actionsError } = await supabase
      .from('dnd_character_actions')
      .select('*')
      .eq('character_id', characterId)
      .not('limited_uses', 'is', null)  // Solo azioni con utilizzi limitati

    if (actionsError) {
      console.error('Errore fetch azioni:', actionsError)
    }

    if (actions && actions.length > 0) {
      // Prepara batch update
      const actionsToUpdate = actions
        .filter((action) => {
          // Reset in base al recharge_on
          if (restType === 'long' && action.recharge_on === 'long_rest') return true
          if (restType === 'short' && action.recharge_on === 'short_rest') return true
          // Riposo lungo resetta ANCHE le azioni che si ricaricano con riposo breve
          if (restType === 'long' && action.recharge_on === 'short_rest') return true
          return false
        })
        .map((action) => ({
          id: action.id,
          uses_remaining: action.limited_uses,
        }))

      // Batch update azioni (usando Promise.all per parallelizzare)
      if (actionsToUpdate.length > 0) {
        await Promise.all(
          actionsToUpdate.map((update) =>
            supabase
              .from('dnd_character_actions')
              .update({ uses_remaining: update.uses_remaining })
              .eq('id', update.id)
          )
        )
      }
    }

    // 4. Riposo lungo: reset HP, death saves, hit dice
    let additionalUpdates: any = {}

    if (restType === 'long') {
      additionalUpdates = {
        current_hp: character.max_hp,  // Heal to max
        death_save_successes: 0,
        death_save_failures: 0,
        // TODO: Reset hit dice (recupera metà hit dice, minimo 1)
        // Per ora non implementato - richiederebbe un campo hit_dice_used nel character
      }
    }

    // 5. Update character
    const { error: updateError } = await supabase
      .from('dnd_characters')
      .update({
        class_resources: updatedResources,
        ...additionalUpdates,
      })
      .eq('id', characterId)

    if (updateError) {
      console.error('Errore update character:', updateError)
      return NextResponse.json(
        { error: 'Errore durante il riposo' },
        { status: 500 }
      )
    }

    // Success
    return NextResponse.json({
      success: true,
      restType,
      message: `Riposo ${restType === 'short' ? 'breve' : 'lungo'} completato!`,
      updatedResourcesCount: updatedResources.filter((r: any) => r.current === r.max).length,
      updatedActionsCount: actions?.length || 0,
    })
  } catch (error) {
    console.error('Errore API /api/player-rest:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}
