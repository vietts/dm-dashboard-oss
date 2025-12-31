'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GameIcon } from '@/components/icons/GameIcon'

interface ActDescriptionProps {
  description: string | null
  onUpdate: (description: string | null) => Promise<void>
}

export function ActDescription({ description, onUpdate }: ActDescriptionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(description || '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    await onUpdate(editValue.trim() || null)
    setSaving(false)
    setIsEditing(false)
  }

  function handleCancel() {
    setEditValue(description || '')
    setIsEditing(false)
  }

  return (
    <Card className="bg-[var(--parchment)] border-[var(--ink-faded)]/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-display text-[var(--ink)] flex items-center gap-2">
            <GameIcon name="book" category="ui" size={20} className="text-[var(--teal)]" />
            Descrizione
          </CardTitle>
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="text-[var(--ink-light)] hover:text-[var(--ink)]"
            >
              <GameIcon name="quill" category="ui" size={14} className="mr-1" />
              Modifica
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-3">
            <Textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder="Descrivi questo atto della campagna..."
              rows={6}
              className="resize-none"
              autoFocus
            />
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving} size="sm">
                {saving ? 'Salvataggio...' : 'Salva'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleCancel}>
                Annulla
              </Button>
            </div>
          </div>
        ) : description ? (
          <p className="text-[var(--ink)] whitespace-pre-wrap leading-relaxed">
            {description}
          </p>
        ) : (
          <p className="text-[var(--ink-light)] italic">
            Nessuna descrizione. Clicca "Modifica" per aggiungerne una.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
