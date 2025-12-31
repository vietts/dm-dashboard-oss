import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdminUntyped } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const noteId = formData.get('noteId') as string

    if (!file || !noteId) {
      return NextResponse.json({ error: 'File e noteId richiesti' }, { status: 400 })
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Solo JPG, PNG, WebP o GIF' }, { status: 400 })
    }

    // Validate file size (max 5MB for note images)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Massimo 5MB' }, { status: 400 })
    }

    // Generate unique filename
    const ext = file.type.split('/')[1]
    const fileName = `${noteId}-${Date.now()}.${ext}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdminUntyped.storage
      .from('note-images')
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
      .from('note-images')
      .getPublicUrl(fileName)

    return NextResponse.json({ success: true, url: publicUrl })
  } catch (err) {
    console.error('Note image upload error:', err)
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'URL richiesto' }, { status: 400 })
    }

    // Extract filename from URL
    const fileName = url.split('/').pop()
    if (!fileName) {
      return NextResponse.json({ error: 'Nome file non valido' }, { status: 400 })
    }

    // Delete from Supabase Storage
    const { error } = await supabaseAdminUntyped.storage
      .from('note-images')
      .remove([fileName])

    if (error) {
      console.error('Delete error:', error)
      return NextResponse.json({ error: 'Errore eliminazione' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Note image delete error:', err)
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}
