import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdminUntyped } from '@/lib/supabase-admin'

async function getPlayerAuth() {
  const cookieStore = await cookies()
  const playerCookie = cookieStore.get('player-auth')
  if (!playerCookie?.value) return null
  try {
    return JSON.parse(playerCookie.value)
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const playerAuth = await getPlayerAuth()
    if (!playerAuth) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const characterId = formData.get('characterId') as string

    if (!file || !characterId) {
      return NextResponse.json({ error: 'File e characterId richiesti' }, { status: 400 })
    }

    // Verify player owns this character
    if (characterId !== playerAuth.characterId) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Solo JPG, PNG o WebP' }, { status: 400 })
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'Massimo 2MB' }, { status: 400 })
    }

    // Generate unique filename
    const ext = file.type.split('/')[1]
    const fileName = `${characterId}-${Date.now()}.${ext}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdminUntyped.storage
      .from('character-avatars')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Errore upload' }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdminUntyped.storage
      .from('character-avatars')
      .getPublicUrl(fileName)

    // Update character with new avatar URL
    const { error: updateError } = await supabaseAdminUntyped
      .from('dnd_characters')
      .update({ avatar_url: publicUrl })
      .eq('id', characterId)

    if (updateError) {
      return NextResponse.json({ error: 'Errore aggiornamento' }, { status: 500 })
    }

    return NextResponse.json({ success: true, url: publicUrl })
  } catch (err) {
    console.error('Avatar upload error:', err)
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}
