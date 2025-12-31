'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Act, StoryNote, Encounter, Monster, Campaign, Session } from '@/types/database'
import { ActHeader } from '@/components/act/ActHeader'
import { ActDescription } from '@/components/act/ActDescription'
import { ActObjectives } from '@/components/act/ActObjectives'
import { NotesLayout } from '@/components/notes'
import { EncountersSection } from '@/components/act/EncountersSection'
import { NPCMonstersSection } from '@/components/act/NPCMonstersSection'
import { ActNavigation } from '@/components/act/ActNavigation'
import { ActSessions } from '@/components/act/ActSessions'
import { NarrativeView } from '@/components/narrative'
import { Button } from '@/components/ui/button'
import { GameIcon } from '@/components/icons/GameIcon'

// Note types - same as in campaign page
export const NOTE_TYPES = [
  { value: 'general', label: 'Generale', icon: 'book' },
  { value: 'npc', label: 'PNG', icon: 'masks' },
  { value: 'location', label: 'Luogo', icon: 'scroll' },
  { value: 'quest', label: 'Quest', icon: 'combat' },
  { value: 'secret', label: 'Segreto', icon: 'skull' },
  { value: 'lore', label: 'Lore', icon: 'dragon' },
] as const

// Encounter difficulties
export const DIFFICULTIES = [
  { value: 'easy', label: 'Facile', color: 'text-green-600' },
  { value: 'medium', label: 'Medio', color: 'text-yellow-600' },
  { value: 'hard', label: 'Difficile', color: 'text-orange-600' },
  { value: 'deadly', label: 'Mortale', color: 'text-red-600' },
] as const

// Encounter statuses
export const STATUSES = [
  { value: 'planned', label: 'Pianificato', color: 'bg-[var(--teal)]/10 text-[var(--teal)]' },
  { value: 'active', label: 'In Corso', color: 'bg-[var(--coral)]/10 text-[var(--coral)]' },
  { value: 'completed', label: 'Completato', color: 'bg-green-100 text-green-700' },
] as const

export default function ActDetailPage() {
  const params = useParams()
  const router = useRouter()
  const campaignId = params.id as string
  const actId = params.actId as string

  // Data state
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [act, setAct] = useState<Act | null>(null)
  const [allActs, setAllActs] = useState<Act[]>([])
  const [notes, setNotes] = useState<StoryNote[]>([])
  const [encounters, setEncounters] = useState<Encounter[]>([])
  const [monsters, setMonsters] = useState<Monster[]>([])
  const [encounterMonsters, setEncounterMonsters] = useState<Record<string, string[]>>({})
  const [sessions, setSessions] = useState<Session[]>([])

  // UI state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Computed: notes grouped by type
  const notesByType = useMemo(() => {
    const grouped: Record<string, StoryNote[]> = {}
    NOTE_TYPES.forEach(type => {
      grouped[type.value] = notes.filter(n => n.note_type === type.value)
    })
    return grouped
  }, [notes])

  // Computed: NPC notes with monster data
  const npcNotes = useMemo(() => {
    return notes.filter(n => n.note_type === 'npc')
  }, [notes])

  // Computed: monsters referenced in encounters
  const encounterMonstersList = useMemo(() => {
    const monsterIds = new Set<string>()
    Object.values(encounterMonsters).forEach(ids => {
      ids.forEach(id => monsterIds.add(id))
    })
    return monsters.filter(m => monsterIds.has(m.id))
  }, [monsters, encounterMonsters])

  // Fetch all data
  useEffect(() => {
    if (campaignId && actId) {
      fetchAllData()
    }
  }, [campaignId, actId])

  async function fetchAllData() {
    setLoading(true)
    setError(null)

    try {
      // First fetch the act to get its act_number
      const { data: actData, error: actError } = await supabase
        .from('dnd_acts')
        .select('*')
        .eq('id', actId)
        .single()

      if (actError) throw actError
      if (!actData) throw new Error('Atto non trovato')

      setAct(actData)

      // Now fetch everything else in parallel
      const [campaignResult, actsResult, notesResult, encountersResult, monstersResult, sessionsResult] = await Promise.all([
        supabase
          .from('dnd_campaigns')
          .select('*')
          .eq('id', campaignId)
          .single(),
        supabase
          .from('dnd_acts')
          .select('*')
          .eq('campaign_id', campaignId)
          .order('act_number', { ascending: true }),
        supabase
          .from('dnd_story_notes')
          .select('*')
          .eq('campaign_id', campaignId)
          .eq('act', actData.act_number)
          .order('created_at', { ascending: false }),
        supabase
          .from('dnd_encounters')
          .select('*')
          .eq('campaign_id', campaignId)
          .eq('act', actData.act_number)
          .order('created_at', { ascending: false }),
        supabase
          .from('dnd_monsters')
          .select('*')
          .eq('campaign_id', campaignId),
        supabase
          .from('dnd_sessions')
          .select('*')
          .eq('act_id', actId)
          .order('session_number', { ascending: true })
      ])

      if (campaignResult.data) setCampaign(campaignResult.data)
      if (actsResult.data) setAllActs(actsResult.data)
      if (notesResult.data) setNotes(notesResult.data)
      if (sessionsResult.data) setSessions(sessionsResult.data)
      if (encountersResult.data) {
        setEncounters(encountersResult.data)

        // Fetch encounter monsters
        const encounterIds = encountersResult.data.map(e => e.id)
        if (encounterIds.length > 0) {
          const { data: emData } = await supabase
            .from('dnd_encounter_monsters')
            .select('*')
            .in('encounter_id', encounterIds)

          if (emData) {
            const grouped: Record<string, string[]> = {}
            emData.forEach(em => {
              if (!grouped[em.encounter_id]) grouped[em.encounter_id] = []
              grouped[em.encounter_id].push(em.monster_id)
            })
            setEncounterMonsters(grouped)
          }
        }
      }
      if (monstersResult.data) setMonsters(monstersResult.data)

    } catch (err) {
      console.error('Error fetching act data:', err)
      setError(err instanceof Error ? err.message : 'Errore nel caricamento')
    } finally {
      setLoading(false)
    }
  }

  // CRUD Operations for Act
  async function updateAct(updates: Partial<Act>) {
    if (!act) return

    const { error } = await supabase
      .from('dnd_acts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', act.id)

    if (!error) {
      setAct(prev => prev ? { ...prev, ...updates } : null)
    }
  }

  async function toggleActComplete() {
    if (!act) return
    await updateAct({ is_complete: !act.is_complete })
  }

  async function setAsCurrentAct() {
    if (!act || !campaign) return

    const { error } = await supabase
      .from('dnd_campaigns')
      .update({ current_act: act.act_number })
      .eq('id', campaignId)

    if (!error) {
      setCampaign(prev => prev ? { ...prev, current_act: act.act_number } : null)
    }
  }

  // CRUD Operations for Notes
  async function createNote(noteData: Partial<StoryNote>) {
    if (!act) return

    const { data, error } = await supabase
      .from('dnd_story_notes')
      .insert({
        campaign_id: campaignId,
        act: act.act_number,
        title: noteData.title || 'Nuova Nota',
        content: noteData.content || '',
        dm_notes: noteData.dm_notes || null,
        note_type: noteData.note_type || 'general',
        is_revealed: noteData.is_revealed || false,
        tags: noteData.tags || [],
      })
      .select()
      .single()

    if (!error && data) {
      setNotes(prev => [data, ...prev])
    }
  }

  async function updateNote(id: string, updates: Partial<StoryNote>) {
    const { error } = await supabase
      .from('dnd_story_notes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (!error) {
      setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n))
    }
  }

  async function deleteNote(id: string) {
    const { error } = await supabase
      .from('dnd_story_notes')
      .delete()
      .eq('id', id)

    if (!error) {
      setNotes(prev => prev.filter(n => n.id !== id))
    }
  }

  // CRUD Operations for Encounters
  async function createEncounter(encounterData: Partial<Encounter>) {
    if (!act) return

    const { data, error } = await supabase
      .from('dnd_encounters')
      .insert({
        campaign_id: campaignId,
        act: act.act_number,
        name: encounterData.name || 'Nuovo Incontro',
        description: encounterData.description || '',
        location: encounterData.location || '',
        difficulty: encounterData.difficulty || 'medium',
        status: encounterData.status || 'planned',
        notes: encounterData.notes || '',
      })
      .select()
      .single()

    if (!error && data) {
      setEncounters(prev => [data, ...prev])
    }
  }

  async function updateEncounter(id: string, updates: Partial<Encounter>) {
    const { error } = await supabase
      .from('dnd_encounters')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (!error) {
      setEncounters(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e))
    }
  }

  async function deleteEncounter(id: string) {
    // First delete encounter monsters
    await supabase
      .from('dnd_encounter_monsters')
      .delete()
      .eq('encounter_id', id)

    const { error } = await supabase
      .from('dnd_encounters')
      .delete()
      .eq('id', id)

    if (!error) {
      setEncounters(prev => prev.filter(e => e.id !== id))
      setEncounterMonsters(prev => {
        const newMap = { ...prev }
        delete newMap[id]
        return newMap
      })
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <GameIcon name="d20" category="ui" size={48} className="text-[var(--coral)] animate-spin" />
          <p className="text-[var(--ink-light)]">Caricamento atto...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !act) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center space-y-4">
          <GameIcon name="skull" category="ui" size={48} className="text-[var(--coral)] mx-auto" />
          <h2 className="text-xl font-display text-[var(--ink)]">Atto non trovato</h2>
          <p className="text-[var(--ink-light)]">{error || 'L\'atto richiesto non esiste.'}</p>
          <Link href={`/campaigns/${campaignId}`}>
            <Button variant="outline">Torna alla Campagna</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <ActHeader
          act={act}
          campaign={campaign}
          onUpdate={updateAct}
          onToggleComplete={toggleActComplete}
          onSetCurrent={setAsCurrentAct}
        />

        {/* Description */}
        <ActDescription
          description={act.description}
          onUpdate={(description) => updateAct({ description })}
        />

        {/* Objectives */}
        <ActObjectives
          objectives={act.objectives || []}
          onUpdate={(objectives) => updateAct({ objectives })}
        />

        {/* Narrative Tree */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <GameIcon name="path" category="ui" size={24} className="text-[var(--teal)]" />
            <h2 className="text-xl font-display text-[var(--ink)]">Narrativa</h2>
          </div>
          <NarrativeView
            actId={actId}
            campaignId={campaignId}
            actNumber={act.act_number}
          />
        </section>

        {/* Notes - Sidebar + Panel Layout */}
        <NotesLayout
          campaignId={campaignId}
          notes={notes}
          monsters={monsters}
          onCreateNote={createNote}
          onUpdateNote={updateNote}
          onDeleteNote={deleteNote}
          onMonsterCreated={(monster) => setMonsters(prev => [...prev, monster])}
        />

        {/* Encounters */}
        <EncountersSection
          encounters={encounters}
          encounterMonsters={encounterMonsters}
          monsters={monsters}
          difficulties={DIFFICULTIES}
          statuses={STATUSES}
          onCreate={createEncounter}
          onUpdate={updateEncounter}
          onDelete={deleteEncounter}
        />

        {/* NPCs & Monsters Reference */}
        <NPCMonstersSection
          npcNotes={npcNotes}
          encounterMonsters={encounterMonstersList}
          allMonsters={monsters}
        />

        {/* Sessions linked to this act */}
        <ActSessions
          sessions={sessions}
          actNumber={act.act_number}
        />

        {/* Navigation */}
        <ActNavigation
          campaignId={campaignId}
          currentAct={act}
          allActs={allActs}
        />
      </div>
    </div>
  )
}
