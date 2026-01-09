import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Get spell details from D&D 2024 spells table
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Fetch from 2024 spells table
    const { data: spell, error } = await supabase
      .from('dnd_2024_spells')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error || !spell) {
      // Fallback: try old Open5e cache
      const { data: legacySpell } = await supabase
        .from('open5e_spells')
        .select('*')
        .eq('slug', slug)
        .single()

      if (legacySpell) {
        return NextResponse.json(legacySpell)
      }

      return NextResponse.json({ error: 'Incantesimo non trovato' }, { status: 404 })
    }

    // Transform to match expected format for backward compatibility
    const response = {
      id: spell.id,
      slug: spell.slug,
      name: spell.name_it || spell.name,
      name_en: spell.name,
      level: spell.level,
      level_int: spell.level, // backward compat
      school: spell.school,
      casting_time: spell.action_type,
      action_type: spell.action_type,
      range: spell.range,
      duration: spell.duration,
      components: spell.components?.map((c: string) => c.toUpperCase()).join(', '),
      components_array: spell.components,
      material: spell.material,
      requires_concentration: spell.concentration,
      concentration: spell.concentration,
      ritual: spell.ritual,
      description: spell.description_it || spell.description,
      description_en: spell.description,
      higher_level: spell.higher_level_slot,
      higher_level_slot: spell.higher_level_slot,
      cantrip_upgrade: spell.cantrip_upgrade,
      classes: spell.classes,
      dnd_class: spell.classes?.join(', '), // backward compat

      // Combat & Mechanics fields
      saving_throw: spell.saving_throw,
      attack_roll: spell.attack_roll ?? false,
      damage: spell.damage,
      area_of_effect: spell.area_of_effect,
    }

    return NextResponse.json(response)
  } catch (err) {
    console.error('Spell fetch error:', err)
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}
