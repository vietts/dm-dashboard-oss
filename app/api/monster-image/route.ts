import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdminUntyped } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const monsterId = formData.get('monsterId') as string

    if (!file || !monsterId) {
      return NextResponse.json({ error: 'File e monsterId richiesti' }, { status: 400 })
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Solo JPG, PNG, WebP o GIF' }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Massimo 5MB' }, { status: 400 })
    }

    // Generate unique filename
    const ext = file.type.split('/')[1]
    const fileName = `${monsterId}-${Date.now()}.${ext}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdminUntyped.storage
      .from('monster-images')
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
      .from('monster-images')
      .getPublicUrl(fileName)

    // Update monster with image_url
    const { error: updateError } = await supabaseAdminUntyped
      .from('dnd_monsters')
      .update({ image_url: publicUrl })
      .eq('id', monsterId)

    if (updateError) {
      console.error('Update monster error:', updateError)
      return NextResponse.json({ error: 'Errore aggiornamento mostro' }, { status: 500 })
    }

    return NextResponse.json({ success: true, url: publicUrl })
  } catch (err) {
    console.error('Monster image upload error:', err)
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}

// List all images in monster-images and note-images buckets
export async function GET() {
  try {
    // Fetch from both buckets
    const [monsterImages, noteImages] = await Promise.all([
      supabaseAdminUntyped.storage.from('monster-images').list('', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } }),
      supabaseAdminUntyped.storage.from('note-images').list('', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } })
    ])

    const images: { url: string; name: string; bucket: string }[] = []

    // Add monster images
    if (monsterImages.data) {
      for (const file of monsterImages.data) {
        const { data: { publicUrl } } = supabaseAdminUntyped.storage
          .from('monster-images')
          .getPublicUrl(file.name)
        images.push({ url: publicUrl, name: file.name, bucket: 'monster-images' })
      }
    }

    // Add note images
    if (noteImages.data) {
      for (const file of noteImages.data) {
        const { data: { publicUrl } } = supabaseAdminUntyped.storage
          .from('note-images')
          .getPublicUrl(file.name)
        images.push({ url: publicUrl, name: file.name, bucket: 'note-images' })
      }
    }

    return NextResponse.json({ success: true, images })
  } catch (err) {
    console.error('List images error:', err)
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'URL richiesto' }, { status: 400 })
    }

    // Extract filename and bucket from URL
    const fileName = url.split('/').pop()
    const bucket = url.includes('/monster-images/') ? 'monster-images' : 'note-images'

    if (!fileName) {
      return NextResponse.json({ error: 'Nome file non valido' }, { status: 400 })
    }

    // Delete from Supabase Storage
    const { error } = await supabaseAdminUntyped.storage
      .from(bucket)
      .remove([fileName])

    if (error) {
      console.error('Delete error:', error)
      return NextResponse.json({ error: 'Errore eliminazione' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Monster image delete error:', err)
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}
