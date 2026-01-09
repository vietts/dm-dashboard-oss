'use client'

import { useState, useEffect } from 'react'
import {
  NarrativeNode,
  StoryNote,
  Encounter,
  Monster,
  NarrativeCheck,
  NarrativeCheckInsert,
  DND_SKILLS,
  DND_ABILITIES,
  DND_ABILITY_LABELS,
  DndAbility
} from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { GameIcon } from '@/components/icons/GameIcon'
import { Trash2, Plus, Eye, EyeOff, Dices, Shield, HelpCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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
  checks: NarrativeCheck[]
  onSave: (data: {
    title: string
    description: string | null
    edgeLabel?: string
  }) => Promise<void>
  onLinkToggle: (type: 'note' | 'encounter' | 'monster', id: string, isLinked: boolean) => Promise<void>
  onCheckCreate: (check: Omit<NarrativeCheckInsert, 'node_id'>) => Promise<void>
  onCheckDelete: (checkId: string) => Promise<void>
  onCheckUpdate: (checkId: string, updates: Partial<NarrativeCheck>) => Promise<void>
}

// DC color helper
function getDCColor(dc: number | null): string {
  if (!dc) return 'text-[var(--ink-light)]'
  if (dc <= 10) return 'text-green-600'
  if (dc <= 15) return 'text-yellow-600'
  return 'text-red-600'
}

function getDCBadgeClass(dc: number | null): string {
  if (!dc) return 'bg-[var(--ink-faded)]/20 text-[var(--ink-light)]'
  if (dc <= 10) return 'bg-green-100 text-green-700 border-green-300'
  if (dc <= 15) return 'bg-yellow-100 text-yellow-700 border-yellow-300'
  return 'bg-red-100 text-red-700 border-red-300'
}

// Check form type
interface CheckFormState {
  check_type: 'ability' | 'save' | 'condition'
  skill: string
  ability: '' | 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
  dc: number
  condition_text: string
  success_text: string
  failure_text: string
  critical_text: string
  is_hidden: boolean
}

// Default empty check form
const EMPTY_CHECK_FORM: CheckFormState = {
  check_type: 'ability',
  skill: '',
  ability: '',
  dc: 12,
  condition_text: '',
  success_text: '',
  failure_text: '',
  critical_text: '',
  is_hidden: false
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
  checks,
  onSave,
  onLinkToggle,
  onCheckCreate,
  onCheckDelete,
  onCheckUpdate
}: NarrativeNodeDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [edgeLabel, setEdgeLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'content' | 'links' | 'checks'>('content')

  // Check form state
  const [showCheckForm, setShowCheckForm] = useState(false)
  const [checkForm, setCheckForm] = useState<CheckFormState>(EMPTY_CHECK_FORM)
  const [savingCheck, setSavingCheck] = useState(false)

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
    setShowCheckForm(false)
    setCheckForm(EMPTY_CHECK_FORM)
    onClose()
  }

  async function handleCheckCreate() {
    if (!checkForm.success_text.trim() || !checkForm.failure_text.trim()) return

    // Validate based on check type
    if (checkForm.check_type === 'ability' && !checkForm.skill) return
    if (checkForm.check_type === 'save' && !checkForm.ability) return
    if (checkForm.check_type === 'condition' && !checkForm.condition_text.trim()) return

    setSavingCheck(true)
    await onCheckCreate({
      check_type: checkForm.check_type,
      skill: checkForm.check_type === 'ability' ? checkForm.skill : null,
      ability: checkForm.check_type === 'save' ? checkForm.ability as 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha' : null,
      dc: checkForm.check_type !== 'condition' ? checkForm.dc : null,
      condition_text: checkForm.check_type === 'condition' ? checkForm.condition_text : null,
      success_text: checkForm.success_text.trim(),
      failure_text: checkForm.failure_text.trim(),
      critical_text: checkForm.critical_text.trim() || null,
      is_hidden: checkForm.is_hidden
    })
    setSavingCheck(false)
    setShowCheckForm(false)
    setCheckForm(EMPTY_CHECK_FORM)
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
            <>
              <Button
                variant={activeTab === 'links' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('links')}
              >
                Collegamenti ({linkedNoteIds.length + linkedEncounterIds.length + linkedMonsterIds.length})
              </Button>
              <Button
                variant={activeTab === 'checks' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('checks')}
                className="flex items-center gap-1"
              >
                <Dices size={14} />
                Check ({checks.length})
              </Button>
            </>
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

          {/* Checks Tab */}
          {activeTab === 'checks' && isEditing && (
            <div className="space-y-4">
              {/* Add check button */}
              {!showCheckForm && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCheckForm(true)}
                  className="w-full border-dashed"
                >
                  <Plus size={14} className="mr-1" />
                  Aggiungi Check
                </Button>
              )}

              {/* Check form */}
              {showCheckForm && (
                <div className="border border-[var(--teal)] rounded-lg p-4 space-y-4 bg-[var(--teal)]/5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-[var(--ink)] flex items-center gap-2">
                      <Dices size={16} className="text-[var(--teal)]" />
                      Nuovo Check
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowCheckForm(false)
                        setCheckForm(EMPTY_CHECK_FORM)
                      }}
                    >
                      Annulla
                    </Button>
                  </div>

                  {/* Check Type */}
                  <div>
                    <label className="text-sm text-[var(--ink-light)] mb-1 block">Tipo</label>
                    <div className="flex gap-2">
                      <Button
                        variant={checkForm.check_type === 'ability' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCheckForm(prev => ({ ...prev, check_type: 'ability' }))}
                        className="flex-1"
                      >
                        <Dices size={14} className="mr-1" />
                        Skill Check
                      </Button>
                      <Button
                        variant={checkForm.check_type === 'save' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCheckForm(prev => ({ ...prev, check_type: 'save' }))}
                        className="flex-1"
                      >
                        <Shield size={14} className="mr-1" />
                        Tiro Salvezza
                      </Button>
                      <Button
                        variant={checkForm.check_type === 'condition' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCheckForm(prev => ({ ...prev, check_type: 'condition' }))}
                        className="flex-1"
                      >
                        <HelpCircle size={14} className="mr-1" />
                        Condizione
                      </Button>
                    </div>
                  </div>

                  {/* Skill select (for ability checks) */}
                  {checkForm.check_type === 'ability' && (
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-sm text-[var(--ink-light)] mb-1 block">Skill</label>
                        <Select
                          value={checkForm.skill}
                          onValueChange={(v) => setCheckForm(prev => ({ ...prev, skill: v }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleziona skill" />
                          </SelectTrigger>
                          <SelectContent>
                            {DND_SKILLS.map(skill => (
                              <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-24">
                        <label className="text-sm text-[var(--ink-light)] mb-1 block">CD</label>
                        <Input
                          type="number"
                          min={1}
                          max={30}
                          value={checkForm.dc}
                          onChange={(e) => setCheckForm(prev => ({ ...prev, dc: parseInt(e.target.value) || 10 }))}
                        />
                      </div>
                    </div>
                  )}

                  {/* Ability select (for saves) */}
                  {checkForm.check_type === 'save' && (
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-sm text-[var(--ink-light)] mb-1 block">Caratteristica</label>
                        <Select
                          value={checkForm.ability}
                          onValueChange={(v) => setCheckForm(prev => ({ ...prev, ability: v as typeof prev.ability }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleziona" />
                          </SelectTrigger>
                          <SelectContent>
                            {DND_ABILITIES.map(ab => (
                              <SelectItem key={ab} value={ab}>{DND_ABILITY_LABELS[ab]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-24">
                        <label className="text-sm text-[var(--ink-light)] mb-1 block">CD</label>
                        <Input
                          type="number"
                          min={1}
                          max={30}
                          value={checkForm.dc}
                          onChange={(e) => setCheckForm(prev => ({ ...prev, dc: parseInt(e.target.value) || 10 }))}
                        />
                      </div>
                    </div>
                  )}

                  {/* Condition text */}
                  {checkForm.check_type === 'condition' && (
                    <div>
                      <label className="text-sm text-[var(--ink-light)] mb-1 block">Condizione</label>
                      <Input
                        value={checkForm.condition_text}
                        onChange={(e) => setCheckForm(prev => ({ ...prev, condition_text: e.target.value }))}
                        placeholder="es. 'Se hanno l'anello della Faglia'"
                      />
                    </div>
                  )}

                  {/* Outcomes */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-sm text-green-600 mb-1 block flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        Successo *
                      </label>
                      <Textarea
                        value={checkForm.success_text}
                        onChange={(e) => setCheckForm(prev => ({ ...prev, success_text: e.target.value }))}
                        placeholder="Cosa succede se passa..."
                        rows={2}
                        className="resize-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-red-600 mb-1 block flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        Fallimento *
                      </label>
                      <Textarea
                        value={checkForm.failure_text}
                        onChange={(e) => setCheckForm(prev => ({ ...prev, failure_text: e.target.value }))}
                        placeholder="Cosa succede se fallisce..."
                        rows={2}
                        className="resize-none text-sm"
                      />
                    </div>
                  </div>

                  {/* Critical text (optional) */}
                  <div>
                    <label className="text-sm text-purple-600 mb-1 block">Critico (opz.)</label>
                    <Input
                      value={checkForm.critical_text}
                      onChange={(e) => setCheckForm(prev => ({ ...prev, critical_text: e.target.value }))}
                      placeholder="Bonus per nat 20..."
                    />
                  </div>

                  {/* Hidden toggle */}
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-[var(--ink-light)] flex items-center gap-2">
                      {checkForm.is_hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                      Visibile solo al DM
                    </label>
                    <Button
                      variant={checkForm.is_hidden ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCheckForm(prev => ({ ...prev, is_hidden: !prev.is_hidden }))}
                    >
                      {checkForm.is_hidden ? 'Nascosto' : 'Visibile'}
                    </Button>
                  </div>

                  {/* Save button */}
                  <Button
                    onClick={handleCheckCreate}
                    disabled={savingCheck || !checkForm.success_text.trim() || !checkForm.failure_text.trim()}
                    className="w-full"
                  >
                    {savingCheck ? 'Salvataggio...' : 'Aggiungi Check'}
                  </Button>
                </div>
              )}

              {/* Existing checks list */}
              {checks.length === 0 && !showCheckForm ? (
                <p className="text-sm text-[var(--ink-light)] italic text-center py-4">
                  Nessun check configurato per questo nodo.
                </p>
              ) : (
                <div className="space-y-3">
                  {checks.map(check => (
                    <div
                      key={check.id}
                      className="border rounded-lg p-3 bg-[var(--paper)] hover:border-[var(--teal)] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {/* Type icon */}
                          {check.check_type === 'ability' && <Dices size={16} className="text-[var(--teal)]" />}
                          {check.check_type === 'save' && <Shield size={16} className="text-purple-600" />}
                          {check.check_type === 'condition' && <HelpCircle size={16} className="text-orange-600" />}

                          {/* Check details */}
                          <div>
                            {check.check_type === 'ability' && (
                              <span className="font-medium text-sm">
                                {check.skill}
                                <Badge className={`ml-2 ${getDCBadgeClass(check.dc)}`}>
                                  CD {check.dc}
                                </Badge>
                              </span>
                            )}
                            {check.check_type === 'save' && (
                              <span className="font-medium text-sm">
                                TS {check.ability ? DND_ABILITY_LABELS[check.ability as DndAbility] : '?'}
                                <Badge className={`ml-2 ${getDCBadgeClass(check.dc)}`}>
                                  CD {check.dc}
                                </Badge>
                              </span>
                            )}
                            {check.check_type === 'condition' && (
                              <span className="font-medium text-sm text-orange-700">
                                {check.condition_text}
                              </span>
                            )}
                          </div>

                          {/* Hidden indicator */}
                          {check.is_hidden && (
                            <EyeOff size={12} className="text-[var(--ink-faded)]" />
                          )}
                        </div>

                        {/* Delete button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onCheckDelete(check.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>

                      {/* Outcomes preview */}
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-green-50 rounded p-1.5 border border-green-200">
                          <span className="text-green-700 font-medium">✓</span>
                          <span className="text-green-800 ml-1 line-clamp-2">{check.success_text}</span>
                        </div>
                        <div className="bg-red-50 rounded p-1.5 border border-red-200">
                          <span className="text-red-700 font-medium">✗</span>
                          <span className="text-red-800 ml-1 line-clamp-2">{check.failure_text}</span>
                        </div>
                      </div>

                      {/* Critical if exists */}
                      {check.critical_text && (
                        <div className="mt-1 text-xs bg-purple-50 rounded p-1.5 border border-purple-200">
                          <span className="text-purple-700 font-medium">★</span>
                          <span className="text-purple-800 ml-1">{check.critical_text}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
