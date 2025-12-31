'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GameIcon } from '@/components/icons/GameIcon'

interface ActObjectivesProps {
  objectives: string[]
  onUpdate: (objectives: string[]) => Promise<void>
}

export function ActObjectives({ objectives, onUpdate }: ActObjectivesProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editObjectives, setEditObjectives] = useState<string[]>(objectives)
  const [newObjective, setNewObjective] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    await onUpdate(editObjectives.filter(o => o.trim()))
    setSaving(false)
    setIsEditing(false)
  }

  function handleCancel() {
    setEditObjectives(objectives)
    setNewObjective('')
    setIsEditing(false)
  }

  function addObjective() {
    if (newObjective.trim()) {
      setEditObjectives([...editObjectives, newObjective.trim()])
      setNewObjective('')
    }
  }

  function removeObjective(index: number) {
    setEditObjectives(editObjectives.filter((_, i) => i !== index))
  }

  function moveObjective(index: number, direction: 'up' | 'down') {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= editObjectives.length) return

    const newList = [...editObjectives]
    const [moved] = newList.splice(index, 1)
    newList.splice(newIndex, 0, moved)
    setEditObjectives(newList)
  }

  return (
    <Card className="bg-[var(--parchment)] border-[var(--ink-faded)]/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-display text-[var(--ink)] flex items-center gap-2">
            <GameIcon name="combat" category="ui" size={20} className="text-[var(--coral)]" />
            Obiettivi
            {objectives.length > 0 && (
              <span className="text-sm font-normal text-[var(--ink-light)]">
                ({objectives.length})
              </span>
            )}
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
            {/* Add new objective */}
            <div className="flex gap-2">
              <Input
                value={newObjective}
                onChange={(e) => setNewObjective(e.target.value)}
                placeholder="Aggiungi obiettivo..."
                onKeyDown={(e) => e.key === 'Enter' && addObjective()}
              />
              <Button onClick={addObjective} disabled={!newObjective.trim()}>
                +
              </Button>
            </div>

            {/* List of objectives */}
            {editObjectives.length > 0 ? (
              <ul className="space-y-2">
                {editObjectives.map((obj, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-2 p-2 bg-[var(--paper)] rounded border border-[var(--ink-faded)]/10"
                  >
                    <span className="flex-1 text-[var(--ink)]">{obj}</span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveObjective(index, 'up')}
                        disabled={index === 0}
                        className="h-6 w-6 p-0"
                      >
                        ↑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveObjective(index, 'down')}
                        disabled={index === editObjectives.length - 1}
                        className="h-6 w-6 p-0"
                      >
                        ↓
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeObjective(index)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        ×
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[var(--ink-light)] italic text-sm">
                Nessun obiettivo. Aggiungine uno sopra.
              </p>
            )}

            {/* Save/Cancel */}
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={saving} size="sm">
                {saving ? 'Salvataggio...' : 'Salva'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleCancel}>
                Annulla
              </Button>
            </div>
          </div>
        ) : objectives.length > 0 ? (
          <ul className="space-y-2">
            {objectives.map((obj, index) => (
              <li key={index} className="flex items-start gap-2 text-[var(--ink)]">
                <span className="text-[var(--coral)] font-bold">•</span>
                <span>{obj}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[var(--ink-light)] italic">
            Nessun obiettivo definito. Clicca "Modifica" per aggiungerne.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
