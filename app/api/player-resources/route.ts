import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'

interface PlayerAuth {
  characterId: string
  playerId: string
  campaignId: string
}

interface ClassResource {
  id: string
  name: string
  max: number
  current: number
  recharge: 'short' | 'long' | 'passive'
  class: string
  description?: string
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

// Update class resource (spend or recover points)
export async function PUT(request: NextRequest) {
  try {
    const playerAuth = await getPlayerAuth()
    if (!playerAuth) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const { resourceId, operation, amount = 1 } = await request.json()

    if (!resourceId || !operation) {
      return NextResponse.json(
        { error: 'resourceId e operation richiesti' },
        { status: 400 }
      )
    }

    if (!['spend', 'recover'].includes(operation)) {
      return NextResponse.json(
        { error: 'operation deve essere "spend" o "recover"' },
        { status: 400 }
      )
    }

    // Get current character data
    const { data: character, error: charError } = await supabase
      .from('dnd_characters')
      .select('id, class_resources')
      .eq('id', playerAuth.characterId)
      .single() as {
        data: { id: string; class_resources: ClassResource[] | null } | null
        error: any
      }

    if (charError || !character) {
      return NextResponse.json(
        { error: 'Personaggio non trovato' },
        { status: 404 }
      )
    }

    // Get class resources array
    const resources = (character.class_resources || []) as ClassResource[]
    const resourceIndex = resources.findIndex(r => r.id === resourceId)

    if (resourceIndex === -1) {
      return NextResponse.json(
        { error: 'Risorsa non trovata' },
        { status: 404 }
      )
    }

    const resource = resources[resourceIndex]

    // Validate: cannot modify passive resources
    if (resource.recharge === 'passive') {
      return NextResponse.json(
        { error: 'Le risorse passive non possono essere modificate' },
        { status: 400 }
      )
    }

    // Calculate new value
    let newCurrent = resource.current

    if (operation === 'spend') {
      newCurrent = Math.max(0, resource.current - amount)
    } else if (operation === 'recover') {
      newCurrent = Math.min(resource.max, resource.current + amount)
    }

    // Update the resource in the array
    const updatedResources = [...resources]
    updatedResources[resourceIndex] = {
      ...resource,
      current: newCurrent
    }

    // Save to database
    const { error: updateError } = await supabase
      .from('dnd_characters')
      .update({ class_resources: updatedResources })
      .eq('id', playerAuth.characterId)

    if (updateError) {
      console.error('Update resource error:', updateError)
      return NextResponse.json(
        { error: 'Errore aggiornamento risorsa' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      resource: updatedResources[resourceIndex],
      resources: updatedResources
    })
  } catch (err) {
    console.error('Resource update error:', err)
    return NextResponse.json(
      { error: 'Errore server' },
      { status: 500 }
    )
  }
}
