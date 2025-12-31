'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { StoryNote } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { GameIcon } from '@/components/icons/GameIcon'
import { useNotes, NOTE_TYPES, NoteTypeValue } from './hooks/useNotesContext'
import { NPCStatsEditor, NPCStats, DEFAULT_NPC_STATS, monsterToStats } from './NPCStatsEditor'
import { Upload, X, Save, Loader2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

interface NoteEditorProps {
  note?: StoryNote  // undefined = create mode
  defaultType?: NoteTypeValue
  onCancel: () => void
  onCreate?: (data: Partial<StoryNote>) => Promise<void>
}

export function NoteEditor({ note, defaultType = 'general', onCancel, onCreate }: NoteEditorProps) {
  const { updateNote, createNote, monsters, selectedNoteMonster, campaignId, onMonsterCreated } = useNotes()
  const isCreateMode = !note

  // Form state
  const [title, setTitle] = useState(note?.title || '')
  const [noteType, setNoteType] = useState<NoteTypeValue>(
    (note?.note_type as NoteTypeValue) || defaultType
  )
  const [dmNotes, setDmNotes] = useState(note?.dm_notes || '')
  const [content, setContent] = useState(note?.content || '')
  const [imageUrl, setImageUrl] = useState(note?.image_url || '')

  // NPC Stats state
  const [showStats, setShowStats] = useState(!!note?.monster_id)
  const [npcStats, setNpcStats] = useState<NPCStats>(() => {
    if (note?.monster_id && selectedNoteMonster) {
      return monsterToStats(selectedNoteMonster)
    }
    return { ...DEFAULT_NPC_STATS }
  })

  // Update stats when editing mode changes and monster is available
  useEffect(() => {
    if (note?.monster_id && selectedNoteMonster) {
      setNpcStats(monsterToStats(selectedNoteMonster))
      setShowStats(true)
    }
  }, [note?.monster_id, selectedNoteMonster])

  // UI state
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle image upload
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (note?.id) {
        formData.append('noteId', note.id)
      }

      const res = await fetch('/api/note-image', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (data.success) {
        setImageUrl(data.url)
      } else {
        console.error('Upload failed:', data.error)
      }
    } catch (err) {
      console.error('Upload error:', err)
    } finally {
      setUploading(false)
    }
  }

  // Handle image removal
  async function handleRemoveImage() {
    if (!imageUrl) return

    try {
      await fetch('/api/note-image', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: imageUrl }),
      })
      setImageUrl('')
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  // Handle save
  async function handleSave() {
    if (!title.trim()) return

    setSaving(true)
    try {
      let monsterId = note?.monster_id || null

      // If NPC with stats, create/update monster
      if (noteType === 'npc' && showStats) {
        const monsterData = {
          name: title.trim(),
          campaign_id: campaignId,
          ...npcStats,
          // Keep existing monster_id if updating
          id: note?.monster_id || undefined,
        }

        const res = await fetch('/api/monsters', {
          method: note?.monster_id ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(monsterData),
        })

        const result = await res.json()
        if (result.success && result.data?.id) {
          monsterId = result.data.id
          // Notify parent to add monster to state
          if (onMonsterCreated && !note?.monster_id) {
            onMonsterCreated(result.data)
          }
        }
      } else if (noteType !== 'npc' && note?.monster_id) {
        // If changed from NPC to another type, unlink monster
        monsterId = null
      }

      const data: Partial<StoryNote> = {
        title: title.trim(),
        note_type: noteType,
        dm_notes: dmNotes.trim() || null,
        content: content.trim() || null,
        image_url: imageUrl || null,
        monster_id: monsterId,
      }

      if (isCreateMode) {
        if (onCreate) {
          await onCreate(data)
        } else {
          await createNote(data)
        }
      } else {
        await updateNote(note.id, data)
      }

      onCancel() // Close editor
    } catch (err) {
      console.error('Save error:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] shrink-0">
        <h2 className="font-display text-lg text-[var(--ink)]">
          {isCreateMode ? 'Nuova Nota' : 'Modifica Nota'}
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={saving}
          >
            Annulla
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="gap-2"
          >
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Salvataggio...
              </>
            ) : (
              <>
                <Save size={14} />
                Salva
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Form - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Titolo *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nome della nota..."
            className="text-lg font-display"
          />
        </div>

        {/* Note Type */}
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select value={noteType} onValueChange={(v) => setNoteType(v as NoteTypeValue)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NOTE_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-2">
                    <span style={{ color: type.color }}>
                      <GameIcon name={type.icon} category="ui" size={16} />
                    </span>
                    {type.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* NPC Stats Section - Only for NPC type */}
        {noteType === 'npc' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <GameIcon name="combat" category="ui" size={16} className="text-[var(--coral)]" />
                Statistiche Combattimento
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--ink-light)]">
                  {showStats ? 'Attive' : 'Disattivate'}
                </span>
                <Switch
                  checked={showStats}
                  onCheckedChange={setShowStats}
                />
              </div>
            </div>
            {showStats && (
              <NPCStatsEditor stats={npcStats} onChange={setNpcStats} />
            )}
            {!showStats && (
              <p className="text-xs text-[var(--ink-light)]">
                Attiva le statistiche per aggiungere AC, HP, abilità e altri dati di combattimento.
              </p>
            )}
          </div>
        )}

        {/* Image Upload */}
        <div className="space-y-2">
          <Label>Immagine</Label>
          {imageUrl ? (
            <div className="relative">
              <div className="relative w-full h-40 rounded-lg overflow-hidden bg-[var(--paper)]">
                <Image
                  src={imageUrl}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={handleRemoveImage}
              >
                <X size={14} />
              </Button>
            </div>
          ) : (
            <div
              className="border-2 border-dashed border-[var(--border)] rounded-lg p-8 text-center cursor-pointer hover:border-[var(--teal)] hover:bg-[var(--teal)]/5 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 size={24} className="mx-auto animate-spin text-[var(--ink-light)]" />
              ) : (
                <>
                  <Upload size={24} className="mx-auto text-[var(--ink-light)] mb-2" />
                  <p className="text-sm text-[var(--ink-light)]">
                    Clicca per caricare un'immagine
                  </p>
                </>
              )}
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
        </div>

        {/* DM Notes */}
        <div className="space-y-2">
          <Label htmlFor="dm-notes" className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[var(--coral)]" />
            Note DM (private)
          </Label>
          <Textarea
            id="dm-notes"
            value={dmNotes}
            onChange={(e) => setDmNotes(e.target.value)}
            placeholder="Note visibili solo a te come DM..."
            rows={4}
            className="resize-none border-[var(--coral)]/30 focus:border-[var(--coral)] bg-[var(--coral)]/5"
          />
          <p className="text-xs text-[var(--ink-light)]">
            Queste note non saranno mai visibili ai giocatori.
          </p>
        </div>

        {/* Player Content */}
        <div className="space-y-2">
          <Label htmlFor="content" className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[var(--teal)]" />
            Contenuto Giocatori
          </Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Contenuto che i giocatori vedranno quando riveli la nota..."
            rows={4}
            className="resize-none border-[var(--teal)]/30 focus:border-[var(--teal)] bg-[var(--teal)]/5"
          />
          <p className="text-xs text-[var(--ink-light)]">
            Questo contenuto sara visibile ai giocatori quando la nota e rivelata.
          </p>
        </div>
      </div>
    </div>
  )
}
