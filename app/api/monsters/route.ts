import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdminUntyped } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    const { name, campaign_id, armor_class, max_hp, speed, str, dex, con, int, wis, cha, cr, monster_type, size, abilities } = data

    if (!name) {
      return NextResponse.json({ error: 'Nome richiesto' }, { status: 400 })
    }

    // Create new monster
    const { data: monster, error } = await supabaseAdminUntyped
      .from('dnd_monsters')
      .insert({
        name,
        campaign_id: campaign_id || null,
        armor_class: armor_class || 10,
        max_hp: max_hp || 10,
        speed: speed || '30 ft',
        str: str || 10,
        dex: dex || 10,
        con: con || 10,
        int: int || 10,
        wis: wis || 10,
        cha: cha || 10,
        cr: cr || '0',
        monster_type: monster_type || 'humanoid',
        size: size || 'Medium',
        abilities: abilities || null,
        is_template: false,
        source: 'custom',
      })
      .select()
      .single()

    if (error) {
      console.error('Create monster error:', error)
      return NextResponse.json({ error: 'Errore creazione mostro' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: monster })
  } catch (err) {
    console.error('Monster POST error:', err)
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()

    const { id, name, armor_class, max_hp, speed, str, dex, con, int, wis, cha, cr, monster_type, size, abilities } = data

    if (!id) {
      return NextResponse.json({ error: 'ID mostro richiesto' }, { status: 400 })
    }

    // Update existing monster
    const { data: monster, error } = await supabaseAdminUntyped
      .from('dnd_monsters')
      .update({
        name,
        armor_class: armor_class || 10,
        max_hp: max_hp || 10,
        speed: speed || '30 ft',
        str: str || 10,
        dex: dex || 10,
        con: con || 10,
        int: int || 10,
        wis: wis || 10,
        cha: cha || 10,
        cr: cr || '0',
        monster_type: monster_type || 'humanoid',
        size: size || 'Medium',
        abilities: abilities || null,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Update monster error:', error)
      return NextResponse.json({ error: 'Errore aggiornamento mostro' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: monster })
  } catch (err) {
    console.error('Monster PUT error:', err)
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}
