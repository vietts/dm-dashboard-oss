'use client'

import { useState } from 'react'
import { Encounter, Monster } from '@/types/database'
import { EncounterCard } from './EncounterCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

interface EncountersSectionProps {
  encounters: Encounter[]
  encounterMonsters: Record<string, string[]>
  monsters: Monster[]
  difficulties: readonly Difficulty[]
  statuses: readonly Status[]
  onCreate: (encounter: Partial<Encounter>) => Promise<void>
  onUpdate: (id: string, updates: Partial<Encounter>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function EncountersSection({
  encounters,
  encounterMonsters,
  monsters,
  difficulties,
  statuses,
  onCreate,
  onUpdate,
  onDelete
}: EncountersSectionProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newEncounter, setNewEncounter] = useState({
    name: '',
    description: '',
    location: '',
    difficulty: 'medium',
    notes: '',
  })
  const [creating, setCreating] = useState(false)

  async function handleCreate() {
    if (!newEncounter.name.trim()) return

    setCreating(true)
    await onCreate({
      name: newEncounter.name.trim(),
      description: newEncounter.description.trim() || null,
      location: newEncounter.location.trim() || null,
      difficulty: newEncounter.difficulty,
      status: 'planned',
      notes: newEncounter.notes.trim() || null,
    })
    setCreating(false)
    setCreateDialogOpen(false)
    setNewEncounter({
      name: '',
      description: '',
      location: '',
      difficulty: 'medium',
      notes: '',
    })
  }

  // Group encounters by status
  const plannedEncounters = encounters.filter(e => e.status === 'planned')
  const activeEncounters = encounters.filter(e => e.status === 'active')
  const completedEncounters = encounters.filter(e => e.status === 'completed')

  return (
    <>
      <Card className="bg-[var(--parchment)] border-[var(--ink-faded)]/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-display text-[var(--ink)] flex items-center gap-2">
              <GameIcon name="dragon" category="ui" size={20} className="text-[var(--coral)]" />
              Incontri
              <span className="text-sm font-normal text-[var(--ink-light)]">
                ({encounters.length})
              </span>
            </CardTitle>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              size="sm"
              className="bg-[var(--coral)] hover:bg-[var(--coral)]/90"
            >
              + Incontro
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {encounters.length > 0 ? (
            <>
              {/* Active encounters first */}
              {activeEncounters.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-[var(--coral)] flex items-center gap-2">
                    <span className="w-2 h-2 bg-[var(--coral)] rounded-full animate-pulse" />
                    In Corso ({activeEncounters.length})
                  </h4>
                  {activeEncounters.map(encounter => (
                    <EncounterCard
                      key={encounter.id}
                      encounter={encounter}
                      monsterIds={encounterMonsters[encounter.id] || []}
                      monsters={monsters}
                      difficulties={difficulties}
                      statuses={statuses}
                      onUpdate={onUpdate}
                      onDelete={onDelete}
                    />
                  ))}
                </div>
              )}

              {/* Planned encounters */}
              {plannedEncounters.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-[var(--teal)]">
                    Pianificati ({plannedEncounters.length})
                  </h4>
                  {plannedEncounters.map(encounter => (
                    <EncounterCard
                      key={encounter.id}
                      encounter={encounter}
                      monsterIds={encounterMonsters[encounter.id] || []}
                      monsters={monsters}
                      difficulties={difficulties}
                      statuses={statuses}
                      onUpdate={onUpdate}
                      onDelete={onDelete}
                    />
                  ))}
                </div>
              )}

              {/* Completed encounters */}
              {completedEncounters.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-green-600">
                    Completati ({completedEncounters.length})
                  </h4>
                  {completedEncounters.map(encounter => (
                    <EncounterCard
                      key={encounter.id}
                      encounter={encounter}
                      monsterIds={encounterMonsters[encounter.id] || []}
                      monsters={monsters}
                      difficulties={difficulties}
                      statuses={statuses}
                      onUpdate={onUpdate}
                      onDelete={onDelete}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <GameIcon name="dragon" category="ui" size={40} className="text-[var(--ink-faded)] mx-auto mb-3" />
              <p className="text-[var(--ink-light)]">
                Nessun incontro per questo atto.
              </p>
              <p className="text-sm text-[var(--ink-faded)]">
                Clicca "+ Incontro" per aggiungerne uno.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Encounter Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GameIcon name="dragon" category="ui" size={20} />
              Nuovo Incontro
            </DialogTitle>
            <DialogDescription>
              Crea un nuovo incontro per questo atto.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm text-[var(--ink-light)] mb-1 block">Nome *</label>
              <Input
                value={newEncounter.name}
                onChange={(e) => setNewEncounter(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome dell'incontro"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-[var(--ink-light)] mb-1 block">Luogo</label>
                <Input
                  value={newEncounter.location}
                  onChange={(e) => setNewEncounter(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Dove avviene l'incontro"
                />
              </div>
              <div>
                <label className="text-sm text-[var(--ink-light)] mb-1 block">Difficoltà</label>
                <Select
                  value={newEncounter.difficulty}
                  onValueChange={(value) => setNewEncounter(prev => ({ ...prev, difficulty: value }))}
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
                value={newEncounter.description}
                onChange={(e) => setNewEncounter(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrizione dell'incontro..."
                rows={4}
              />
            </div>

            <div>
              <label className="text-sm text-[var(--ink-light)] mb-1 block">Note DM</label>
              <Textarea
                value={newEncounter.notes}
                onChange={(e) => setNewEncounter(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Note per il DM..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleCreate} disabled={creating || !newEncounter.name.trim()}>
              {creating ? 'Creazione...' : 'Crea Incontro'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
