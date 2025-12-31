'use client'

import { useState, useEffect } from 'react'
import { NarrativeNode, StoryNote, Encounter, Monster } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { GameIcon } from '@/components/icons/GameIcon'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface NarrativeNodeDialogProps {
  open: boolean
  onClose: () => void
  node?: NarrativeNode | null
  parentNodeId?: string
  edgeLabel?: string
  availableNotes: StoryNote[]
  availableEncounters: Encounter[]
  availableMonsters: Monster[]
  linkedNoteIds: string[]
  linkedEncounterIds: string[]
  linkedMonsterIds: string[]
  onSave: (data: {
    title: string
    description: string | null
    edgeLabel?: string
  }) => Promise<void>
  onLinkToggle: (type: 'note' | 'encounter' | 'monster', id: string, isLinked: boolean) => Promise<void>
}

export function NarrativeNodeDialog({
  open,
  onClose,
  node,
  parentNodeId,
  edgeLabel: initialEdgeLabel,
  availableNotes,
  availableEncounters,
  availableMonsters,
  linkedNoteIds,
  linkedEncounterIds,
  linkedMonsterIds,
  onSave,
  onLinkToggle
}: NarrativeNodeDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [edgeLabel, setEdgeLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'content' | 'links'>('content')

  const isEditing = !!node

  useEffect(() => {
    if (node) {
      setTitle(node.title)
      setDescription(node.description || '')
    } else {
      setTitle('')
      setDescription('')
    }
    setEdgeLabel(initialEdgeLabel || '')
  }, [node, initialEdgeLabel, open])

  async function handleSave() {
    if (!title.trim()) return

    setSaving(true)
    await onSave({
      title: title.trim(),
      description: description.trim() || null,
      edgeLabel: parentNodeId ? edgeLabel.trim() || undefined : undefined
    })
    setSaving(false)
    onClose()
  }

  function handleClose() {
    setTitle('')
    setDescription('')
    setEdgeLabel('')
    setActiveTab('content')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GameIcon name="path" category="ui" size={20} />
            {isEditing ? 'Modifica Nodo' : 'Nuovo Nodo Narrativo'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifica il contenuto e i collegamenti del nodo.'
              : parentNodeId
                ? 'Crea un nuovo nodo collegato al precedente.'
                : 'Crea il nodo iniziale della storia.'}
          </DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-[var(--ink-faded)]/10 pb-2">
          <Button
            variant={activeTab === 'content' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('content')}
          >
            Contenuto
          </Button>
          {isEditing && (
            <Button
              variant={activeTab === 'links' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('links')}
            >
              Collegamenti ({linkedNoteIds.length + linkedEncounterIds.length + linkedMonsterIds.length})
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          {activeTab === 'content' && (
            <div className="space-y-4">
              {/* Edge label (only for new nodes with parent) */}
              {parentNodeId && !isEditing && (
                <div>
                  <label className="text-sm text-[var(--ink-light)] mb-1 block">
                    Etichetta percorso (opzionale)
                  </label>
                  <Input
                    value={edgeLabel}
                    onChange={(e) => setEdgeLabel(e.target.value)}
                    placeholder="es. 'Se accettano la missione', 'Vittoria in combattimento'"
                  />
                  <p className="text-xs text-[var(--ink-light)] mt-1">
                    Descrive la condizione o azione che porta a questo nodo
                  </p>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="text-sm text-[var(--ink-light)] mb-1 block">
                  Titolo *
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="es. 'Il party arriva al villaggio'"
                  autoFocus
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-sm text-[var(--ink-light)] mb-1 block">
                  Descrizione
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrizione dettagliata della scena, cosa succede, cosa i giocatori vedono..."
                  rows={6}
                  className="resize-none"
                />
              </div>
            </div>
          )}

          {activeTab === 'links' && isEditing && (
            <div className="space-y-6">
              {/* Notes */}
              <div>
                <h4 className="text-sm font-medium text-[var(--ink)] mb-2 flex items-center gap-2">
                  <GameIcon name="scroll" category="ui" size={14} />
                  Note ({linkedNoteIds.length})
                </h4>
                {availableNotes.length === 0 ? (
                  <p className="text-sm text-[var(--ink-light)] italic">
                    Nessuna nota disponibile in questo atto.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {availableNotes.map(note => {
                      const isLinked = linkedNoteIds.includes(note.id)
                      return (
                        <Badge
                          key={note.id}
                          variant={isLinked ? 'default' : 'outline'}
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => onLinkToggle('note', note.id, isLinked)}
                        >
                          {isLinked && <GameIcon name="check" category="ui" size={10} className="mr-1" />}
                          {note.title}
                        </Badge>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Encounters */}
              <div>
                <h4 className="text-sm font-medium text-[var(--ink)] mb-2 flex items-center gap-2">
                  <GameIcon name="swords" category="ui" size={14} className="text-[var(--coral)]" />
                  Encounter ({linkedEncounterIds.length})
                </h4>
                {availableEncounters.length === 0 ? (
                  <p className="text-sm text-[var(--ink-light)] italic">
                    Nessun encounter disponibile in questo atto.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {availableEncounters.map(enc => {
                      const isLinked = linkedEncounterIds.includes(enc.id)
                      return (
                        <Badge
                          key={enc.id}
                          variant={isLinked ? 'default' : 'outline'}
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => onLinkToggle('encounter', enc.id, isLinked)}
                        >
                          {isLinked && <GameIcon name="check" category="ui" size={10} className="mr-1" />}
                          {enc.name}
                        </Badge>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Monsters/NPCs */}
              <div>
                <h4 className="text-sm font-medium text-[var(--ink)] mb-2 flex items-center gap-2">
                  <GameIcon name="dragon" category="ui" size={14} className="text-purple-600" />
                  NPC/Mostri ({linkedMonsterIds.length})
                </h4>
                {availableMonsters.length === 0 ? (
                  <p className="text-sm text-[var(--ink-light)] italic">
                    Nessun mostro/NPC disponibile.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {availableMonsters.map(mon => {
                      const isLinked = linkedMonsterIds.includes(mon.id)
                      return (
                        <Badge
                          key={mon.id}
                          variant={isLinked ? 'default' : 'outline'}
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => onLinkToggle('monster', mon.id, isLinked)}
                        >
                          {isLinked && <GameIcon name="check" category="ui" size={10} className="mr-1" />}
                          {mon.name}
                        </Badge>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Annulla
          </Button>
          <Button onClick={handleSave} disabled={saving || !title.trim()}>
            {saving ? 'Salvataggio...' : isEditing ? 'Salva' : 'Crea'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Quick branch dialog - simplified version for fast creation during live session
interface QuickBranchDialogProps {
  open: boolean
  onClose: () => void
  onSave: (title: string, edgeLabel?: string) => Promise<void>
}

export function QuickBranchDialog({ open, onClose, onSave }: QuickBranchDialogProps) {
  const [title, setTitle] = useState('')
  const [edgeLabel, setEdgeLabel] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!title.trim()) return

    setSaving(true)
    await onSave(title.trim(), edgeLabel.trim() || undefined)
    setSaving(false)
    setTitle('')
    setEdgeLabel('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GameIcon name="lightning" category="ui" size={20} className="text-[var(--coral)]" />
            Nuovo Branch Rapido
          </DialogTitle>
          <DialogDescription>
            Crea velocemente un nuovo percorso dalla posizione attuale.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm text-[var(--ink-light)] mb-1 block">
              Cosa succede?
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="es. 'I giocatori decidono di fuggire'"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          </div>
          <div>
            <label className="text-sm text-[var(--ink-light)] mb-1 block">
              Perché? (opzionale)
            </label>
            <Input
              value={edgeLabel}
              onChange={(e) => setEdgeLabel(e.target.value)}
              placeholder="es. 'Falliscono il tiro salvezza'"
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annulla
          </Button>
          <Button onClick={handleSave} disabled={saving || !title.trim()}>
            {saving ? '...' : 'Crea e Vai'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
