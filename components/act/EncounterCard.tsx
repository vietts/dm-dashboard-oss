'use client'

import { useState } from 'react'
import { Encounter, Monster } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { GameIcon } from '@/components/icons/GameIcon'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Difficulty {
  value: string
  label: string
  color: string
}

interface Status {
  value: string
  label: string
  color: string
}

interface EncounterCardProps {
  encounter: Encounter
  monsterIds: string[]
  monsters: Monster[]
  difficulties: readonly Difficulty[]
  statuses: readonly Status[]
  onUpdate: (id: string, updates: Partial<Encounter>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function EncounterCard({
  encounter,
  monsterIds,
  monsters,
  difficulties,
  statuses,
  onUpdate,
  onDelete
}: EncounterCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    name: encounter.name,
    description: encounter.description || '',
    location: encounter.location || '',
    difficulty: encounter.difficulty || 'medium',
    status: encounter.status || 'planned',
    notes: encounter.notes || '',
  })
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const encounterMonsters = monsters.filter(m => monsterIds.includes(m.id))
  const difficulty = difficulties.find(d => d.value === encounter.difficulty)
  const status = statuses.find(s => s.value === encounter.status)

  async function handleSave() {
    if (!editData.name.trim()) return

    setSaving(true)
    await onUpdate(encounter.id, {
      name: editData.name.trim(),
      description: editData.description.trim() || null,
      location: editData.location.trim() || null,
      difficulty: editData.difficulty,
      status: editData.status,
      notes: editData.notes.trim() || null,
    })
    setSaving(false)
    setIsEditing(false)
  }

  function handleCancel() {
    setEditData({
      name: encounter.name,
      description: encounter.description || '',
      location: encounter.location || '',
      difficulty: encounter.difficulty || 'medium',
      status: encounter.status || 'planned',
      notes: encounter.notes || '',
    })
    setIsEditing(false)
  }

  async function handleStatusChange(newStatus: string) {
    await onUpdate(encounter.id, { status: newStatus })
  }

  async function handleDelete() {
    await onDelete(encounter.id)
    setConfirmDelete(false)
  }

  // Editing mode dialog
  if (isEditing) {
    return (
      <Dialog open={isEditing} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GameIcon name="dragon" category="ui" size={20} />
              Modifica Incontro
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm text-[var(--ink-light)] mb-1 block">Nome *</label>
              <Input
                value={editData.name}
                onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome dell'incontro"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-[var(--ink-light)] mb-1 block">Luogo</label>
                <Input
                  value={editData.location}
                  onChange={(e) => setEditData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Dove avviene l'incontro"
                />
              </div>
              <div>
                <label className="text-sm text-[var(--ink-light)] mb-1 block">Difficoltà</label>
                <Select
                  value={editData.difficulty}
                  onValueChange={(value) => setEditData(prev => ({ ...prev, difficulty: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {difficulties.map(d => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm text-[var(--ink-light)] mb-1 block">Descrizione</label>
              <Textarea
                value={editData.description}
                onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrizione dell'incontro..."
                rows={4}
              />
            </div>

            <div>
              <label className="text-sm text-[var(--ink-light)] mb-1 block">Note DM</label>
              <Textarea
                value={editData.notes}
                onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Note per il DM..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Annulla
            </Button>
            <Button onClick={handleSave} disabled={saving || !editData.name.trim()}>
              {saving ? 'Salvataggio...' : 'Salva'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <>
      <div className="bg-[var(--paper)] rounded border border-[var(--ink-faded)]/10 overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center gap-3 p-3 cursor-pointer hover:bg-[var(--ink)]/5 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span
            className="text-[var(--ink-light)] transition-transform duration-200"
            style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
          >
            ▸
          </span>
          <GameIcon name="dragon" category="ui" size={18} className="text-[var(--coral)]" />
          <span className="flex-1 font-medium text-[var(--ink)] truncate">
            {encounter.name}
          </span>

          {/* Badges */}
          <div className="flex items-center gap-2">
            {status && (
              <Badge className={status.color}>
                {status.label}
              </Badge>
            )}
            {difficulty && (
              <Badge variant="outline" className={difficulty.color}>
                {difficulty.label}
              </Badge>
            )}
          </div>
        </div>

        {/* Expanded content */}
        {isExpanded && (
          <div className="border-t border-[var(--ink-faded)]/10 p-3 space-y-3 animate-in slide-in-from-top-2 duration-200">
            {/* Location */}
            {encounter.location && (
              <div className="flex items-center gap-2 text-sm">
                <GameIcon name="scroll" category="ui" size={14} className="text-[var(--ink-light)]" />
                <span className="text-[var(--ink-light)]">Luogo:</span>
                <span className="text-[var(--ink)]">{encounter.location}</span>
              </div>
            )}

            {/* Monsters */}
            {encounterMonsters.length > 0 && (
              <div className="flex items-start gap-2 text-sm">
                <GameIcon name="skull" category="ui" size={14} className="text-[var(--ink-light)] mt-0.5" />
                <div>
                  <span className="text-[var(--ink-light)]">Mostri: </span>
                  <span className="text-[var(--ink)]">
                    {encounterMonsters.map(m => m.name).join(', ')}
                  </span>
                </div>
              </div>
            )}

            {/* Description */}
            {encounter.description && (
              <p className="text-[var(--ink)] text-sm whitespace-pre-wrap">
                {encounter.description}
              </p>
            )}

            {/* DM Notes */}
            {encounter.notes && (
              <div className="bg-[var(--parchment)] p-2 rounded text-sm">
                <span className="text-[var(--ink-light)] font-medium">Note DM: </span>
                <span className="text-[var(--ink)]">{encounter.notes}</span>
              </div>
            )}

            {/* Quick status buttons */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--ink-faded)]/10">
              <div className="flex gap-1">
                {statuses.map(s => (
                  <Button
                    key={s.value}
                    variant={encounter.status === s.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStatusChange(s.value)
                    }}
                    className={encounter.status === s.value ? s.color : ''}
                  >
                    {s.label}
                  </Button>
                ))}
              </div>
              <div className="flex-1" />
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsEditing(true)
                }}
              >
                <GameIcon name="quill" category="ui" size={12} className="mr-1" />
                Modifica
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  setConfirmDelete(true)
                }}
                className="text-red-500 hover:text-red-600 hover:border-red-300"
              >
                Elimina
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminare questo incontro?</DialogTitle>
            <DialogDescription>
              Stai per eliminare "{encounter.name}". Questa azione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Annulla
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Elimina
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
