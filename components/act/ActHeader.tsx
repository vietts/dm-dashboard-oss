'use client'

import { useState } from 'react'
import { Act, Campaign } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { GameIcon } from '@/components/icons/GameIcon'

interface ActHeaderProps {
  act: Act
  campaign: Campaign | null
  onUpdate: (updates: Partial<Act>) => Promise<void>
  onToggleComplete: () => Promise<void>
  onSetCurrent: () => Promise<void>
}

export function ActHeader({
  act,
  campaign,
  onUpdate,
  onToggleComplete,
  onSetCurrent
}: ActHeaderProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(act.title)
  const [editTheme, setEditTheme] = useState(act.theme || '')
  const [saving, setSaving] = useState(false)

  const isCurrent = campaign?.current_act === act.act_number

  async function handleSave() {
    if (!editTitle.trim()) return

    setSaving(true)
    await onUpdate({
      title: editTitle.trim(),
      theme: editTheme.trim() || null
    })
    setSaving(false)
    setIsEditing(false)
  }

  function handleCancel() {
    setEditTitle(act.title)
    setEditTheme(act.theme || '')
    setIsEditing(false)
  }

  return (
    <div className="bg-[var(--parchment)] rounded-lg border border-[var(--ink-faded)]/20 p-6 space-y-4">
      {/* Top row: Act number + badges */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="bg-[var(--coral)] text-white font-display">
          Atto {act.act_number}
        </Badge>
        {isCurrent && (
          <Badge className="bg-[var(--teal)]/10 text-[var(--teal)] border border-[var(--teal)]/30">
            Corrente
          </Badge>
        )}
        {act.is_complete && (
          <Badge className="bg-green-100 text-green-700 border border-green-200">
            Completato
          </Badge>
        )}
      </div>

      {/* Title and Theme */}
      {isEditing ? (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-[var(--ink-light)] mb-1 block">Titolo</label>
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Titolo dell'atto"
              className="text-2xl font-display"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs text-[var(--ink-light)] mb-1 block">Tema</label>
            <Input
              value={editTheme}
              onChange={(e) => setEditTheme(e.target.value)}
              placeholder="Tema dell'atto (opzionale)"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving || !editTitle.trim()}>
              {saving ? 'Salvataggio...' : 'Salva'}
            </Button>
            <Button variant="outline" onClick={handleCancel}>
              Annulla
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          <h1 className="text-3xl font-display text-[var(--ink)]">
            {act.title}
          </h1>
          {act.theme && (
            <p className="text-lg text-[var(--ink-light)]">
              Tema: {act.theme}
            </p>
          )}
        </div>
      )}

      {/* Action buttons */}
      {!isEditing && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--ink-faded)]/10">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            <GameIcon name="quill" category="ui" size={14} className="mr-1" />
            Modifica
          </Button>

          {!isCurrent && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSetCurrent}
            >
              Imposta Corrente
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onToggleComplete}
            className={act.is_complete ? 'text-green-600' : ''}
          >
            {act.is_complete ? '✓ Completato' : 'Segna Completo'}
          </Button>
        </div>
      )}
    </div>
  )
}
