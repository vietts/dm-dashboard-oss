import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET - List actions for a character
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const characterId = searchParams.get('character_id')

    if (!characterId) {
      return NextResponse.json({ error: 'character_id is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('dnd_character_actions')
      .select('*')
      .eq('character_id', characterId)
      .eq('is_active', true)
      .order('sort_order')
      .order('name')

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching actions:', error)
    return NextResponse.json({ error: 'Failed to fetch actions' }, { status: 500 })
  }
}

// POST - Create a new action
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      character_id,
      name,
      description,
      action_type,
      attack_type,
      range_value,
      hit_bonus,
      damage_dice,
      damage_type,
      limited_uses,
      uses_remaining,
      recharge_on,
      source,
      sort_order,
    } = body

    if (!character_id || !name || !action_type) {
      return NextResponse.json(
        { error: 'character_id, name, and action_type are required' },
        { status: 400 }
      )
    }

    // Validate action_type
    if (!['action', 'bonus_action', 'reaction', 'other'].includes(action_type)) {
      return NextResponse.json({ error: 'Invalid action_type' }, { status: 400 })
    }

    // If limited_uses is set, initialize uses_remaining if not provided
    const finalUsesRemaining = limited_uses !== null && limited_uses !== undefined
      ? (uses_remaining !== null && uses_remaining !== undefined ? uses_remaining : limited_uses)
      : null

    const { data, error } = await supabase
      .from('dnd_character_actions')
      .insert({
        character_id,
        name,
        description: description || null,
        action_type,
        attack_type: attack_type || null,
        range_value: range_value || null,
        hit_bonus: hit_bonus !== undefined ? hit_bonus : null,
        damage_dice: damage_dice || null,
        damage_type: damage_type || null,
        limited_uses: limited_uses !== undefined ? limited_uses : null,
        uses_remaining: finalUsesRemaining,
        recharge_on: recharge_on || null,
        source: source || null,
        sort_order: sort_order !== undefined ? sort_order : 0,
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error creating action:', error)
    return NextResponse.json({ error: 'Failed to create action' }, { status: 500 })
  }
}

// PUT - Update an action
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    // Validate action_type if provided
    if (updates.action_type && !['action', 'bonus_action', 'reaction', 'other'].includes(updates.action_type)) {
      return NextResponse.json({ error: 'Invalid action_type' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('dnd_character_actions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating action:', error)
    return NextResponse.json({ error: 'Failed to update action' }, { status: 500 })
  }
}

// DELETE - Delete an action (soft delete by setting is_active = false)
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')
    const hardDelete = searchParams.get('hard_delete') === 'true'

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    if (hardDelete) {
      // Permanent deletion
      const { error } = await supabase
        .from('dnd_character_actions')
        .delete()
        .eq('id', id)

      if (error) throw error
    } else {
      // Soft delete - set is_active to false
      const { error } = await supabase
        .from('dnd_character_actions')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting action:', error)
    return NextResponse.json({ error: 'Failed to delete action' }, { status: 500 })
  }
}
