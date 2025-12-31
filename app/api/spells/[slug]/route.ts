import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Get spell details from cache or Open5e
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // First check cache
    const { data: cachedSpell } = await supabase
      .from('open5e_spells')
      .select('*')
      .eq('slug', slug)
      .single()

    if (cachedSpell) {
      return NextResponse.json(cachedSpell)
    }

    // Fetch from Open5e API
    const res = await fetch(`https://api.open5e.com/v1/spells/${slug}/`)

    if (!res.ok) {
      return NextResponse.json({ error: 'Incantesimo non trovato' }, { status: 404 })
    }

    const spellData = await res.json()

    // Cache the spell
    const cacheData = {
      slug: spellData.slug,
      name: spellData.name,
      level_int: spellData.level_int,
      school: spellData.school,
      casting_time: spellData.casting_time,
      range: spellData.range,
      duration: spellData.duration,
      components: spellData.components,
      requires_concentration: spellData.requires_concentration || false,
      description: spellData.desc,
      higher_level: spellData.higher_level,
      dnd_class: spellData.dnd_class,
      document_title: spellData.document__title,
      raw_data: spellData,
    }

    // Try to cache (ignore errors)
    await supabase.from('open5e_spells').upsert(cacheData, { onConflict: 'slug' })

    return NextResponse.json(cacheData)
  } catch (err) {
    console.error('Spell fetch error:', err)
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}
