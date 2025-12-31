'use client'

import { useState, useRef } from 'react'
import { GameIcon } from '@/components/icons/GameIcon'
import { Camera } from 'lucide-react'

interface AvatarUploadProps {
  characterId: string
  currentUrl: string | null
  characterName: string
  onUpdate: () => void
}

export default function AvatarUpload({ characterId, currentUrl, characterName, onUpdate }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Solo JPG, PNG o WebP')
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Massimo 2MB')
      return
    }

    setError(null)
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('characterId', characterId)

      const res = await fetch('/api/player-avatar', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        onUpdate()
      } else {
        const data = await res.json()
        setError(data.error || 'Errore upload')
      }
    } catch {
      setError('Errore di connessione')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="flex items-center gap-4">
      {/* Avatar Preview */}
      <div className="relative">
        {currentUrl ? (
          <img
            src={currentUrl}
            alt={characterName}
            className="w-20 h-20 rounded-full object-cover border-2 border-[var(--teal)]"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-[var(--cream-dark)] flex items-center justify-center border-2 border-[var(--border-decorative)]">
            <GameIcon name="masks" category="ui" size={32} className="text-[var(--ink-light)]" />
          </div>
        )}

        {/* Upload Overlay */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
        >
          {uploading ? (
            <span className="text-white text-sm">...</span>
          ) : (
            <Camera className="w-6 h-6 text-white" />
          )}
        </button>
      </div>

      {/* Upload Info */}
      <div className="text-sm">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="text-[var(--teal)] hover:text-[var(--teal-dark)] underline transition-colors"
        >
          {uploading ? 'Caricamento...' : 'Cambia avatar'}
        </button>
        <p className="text-[var(--ink-faded)] text-xs mt-1">JPG, PNG o WebP, max 2MB</p>
        {error && <p className="text-[var(--coral)] text-xs mt-1">{error}</p>}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}
