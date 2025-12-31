'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Campaign, Character, StoryNote, Encounter, Monster, InitiativeItem, Session, Act } from '@/types/database'
import { searchSpells, getSpellBySlug, SPELL_SCHOOLS, SPELL_LEVELS, getAllRaces, getAllClasses, CachedSpell, CachedRace, CachedClass } from '@/lib/open5e'
import { DND_CLASSES, DND_RACES, CONDITIONS, formatModifier, rollInitiative, abilityModifier, getClassResources } from '@/lib/dnd-utils'
import { useResource, restoreResource, shortRest, longRest, getRechargeColor, getRechargeLabel } from '@/lib/class-resources'
import { applyRacialBonuses, raceHasASIChoice, getRaceASIChoice, hasASIAtLevel, getHitDie, calculateLevel1HP } from '@/lib/level-up-utils'
import type { ClassResource, Json, CharacterSpell, CharacterSpellInsert, RacialASIChoice, LevelUpData, ASIHistoryEntry } from '@/types/database'
import LevelUpDialog from '@/components/dm/LevelUpDialog'
import RacialASISelector from '@/components/dm/RacialASISelector'
import CharacterSheet from '@/components/player/CharacterSheet'

// Extended Character type for client-side state with properly typed class_resources
type CharacterState = Omit<Character, 'class_resources'> & {
  class_resources: ClassResource[] | null
}
import { ExternalLink } from 'lucide-react'
import { GameIcon } from '@/components/icons/GameIcon'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { PlayerCodeManager } from '@/components/dm/PlayerCodeManager'
import { LevelUpWizard } from '@/components/level-up'
import type { LevelUpUpdates } from '@/components/level-up'
import { TrendingUp } from 'lucide-react'

export default function CampaignPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const campaignId = params.id as string

  // Valid tab values
  const validTabs = ['party', 'acts', 'combat', 'notes', 'sessions', 'encounters', 'bestiary', 'spells', 'races']
  const tabFromUrl = searchParams.get('tab')
  const initialTab = tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : 'party'

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [characters, setCharacters] = useState<CharacterState[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(initialTab)
  const [isCharacterDialogOpen, setIsCharacterDialogOpen] = useState(false)
  const [newCharacter, setNewCharacter] = useState({
    name: '',
    player_name: '',
    class: '',
    race: '',
    level: 1,
    max_hp: 10,
    armor_class: 10,
    initiative_bonus: 0,
    str: 10,
    dex: 10,
    con: 10,
    int: 10,
    wis: 10,
    cha: 10,
  })

  // Avatar upload state
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false)
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterState | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Character sheet preview state (player view)
  const [viewingCharacterSheet, setViewingCharacterSheet] = useState<CharacterState | null>(null)

  // Notes state
  const [notes, setNotes] = useState<StoryNote[]>([])
  const [noteFilter, setNoteFilter] = useState<{ act: number | null; type: string | null }>({ act: null, type: null })
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<StoryNote | null>(null)
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    dm_notes: '',
    note_type: 'general',
    act: 1,
    tags: [] as string[],
    is_revealed: false,
  })

  // Encounters state
  const [encounters, setEncounters] = useState<Encounter[]>([])
  const [encounterFilter, setEncounterFilter] = useState<{ act: number | null; status: string | null }>({ act: null, status: null })
  const [isEncounterDialogOpen, setIsEncounterDialogOpen] = useState(false)
  const [editingEncounter, setEditingEncounter] = useState<Encounter | null>(null)
  const [newEncounter, setNewEncounter] = useState({
    name: '',
    description: '',
    location: '',
    difficulty: 'medium',
    act: 1,
    status: 'planned',
    notes: '',
  })

  // Bestiary state
  const [monsters, setMonsters] = useState<Monster[]>([])
  const [monsterSearch, setMonsterSearch] = useState('')
  const [open5eResults, setOpen5eResults] = useState<any[]>([])
  const [searchingOpen5e, setSearchingOpen5e] = useState(false)
  const [isMonsterDialogOpen, setIsMonsterDialogOpen] = useState(false)
  const [selectedMonster, setSelectedMonster] = useState<Monster | any | null>(null)
  const [viewingMonster, setViewingMonster] = useState(false)
  const [newMonster, setNewMonster] = useState({
    name: '',
    cr: '1',
    max_hp: 10,
    armor_class: 10,
    speed: '30 ft.',
    str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10,
    abilities: '',
    source: 'Homebrew',
    is_template: true,
  })

  // Spells state
  const [spells, setSpells] = useState<CachedSpell[]>([])
  const [spellSearch, setSpellSearch] = useState('')
  const [spellFilters, setSpellFilters] = useState<{ level: number | null; school: string | null }>({ level: null, school: null })
  const [searchingSpells, setSearchingSpells] = useState(false)
  const [selectedSpell, setSelectedSpell] = useState<CachedSpell | null>(null)
  const [viewingSpell, setViewingSpell] = useState(false)

  // Races & Classes state
  const [races, setRaces] = useState<CachedRace[]>([])
  const [classes, setClasses] = useState<CachedClass[]>([])
  const [loadingRaces, setLoadingRaces] = useState(false)
  const [loadingClasses, setLoadingClasses] = useState(false)
  const [selectedRace, setSelectedRace] = useState<CachedRace | null>(null)
  const [selectedClass, setSelectedClass] = useState<CachedClass | null>(null)
  const [viewingRace, setViewingRace] = useState(false)
  const [viewingClass, setViewingClass] = useState(false)
  const [raceClassTab, setRaceClassTab] = useState<'races' | 'classes'>('races')

  // Combat/Initiative Tracker state
  const [combatActive, setCombatActive] = useState(false)
  const [combatants, setCombatants] = useState<InitiativeItem[]>([])
  const [currentTurn, setCurrentTurn] = useState(0)
  const [roundNumber, setRoundNumber] = useState(1)
  const [combatStateId, setCombatStateId] = useState<string | null>(null)
  const [setupCombatOpen, setSetupCombatOpen] = useState(false)
  const [selectedEncounterForCombat, setSelectedEncounterForCombat] = useState<string | null>(null)
  const [selectedCharactersForCombat, setSelectedCharactersForCombat] = useState<string[]>([])
  const [selectedMonstersForCombat, setSelectedMonstersForCombat] = useState<{ id: string; count: number }[]>([])

  // Character Details Modal state
  const [viewingCharacterDetails, setViewingCharacterDetails] = useState(false)
  const [characterRaceData, setCharacterRaceData] = useState<CachedRace | null>(null)
  const [characterClassData, setCharacterClassData] = useState<CachedClass | null>(null)

  // Character Edit Mode state
  const [editingCharacter, setEditingCharacter] = useState(false)
  const [editedCharacter, setEditedCharacter] = useState<CharacterState | null>(null)

  // Character Spells state
  const [characterSpells, setCharacterSpells] = useState<CharacterSpell[]>([])
  const [loadingCharacterSpells, setLoadingCharacterSpells] = useState(false)
  const [addingSpellToCharacter, setAddingSpellToCharacter] = useState(false)
  const [addSpellDialogOpen, setAddSpellDialogOpen] = useState(false)

  // Level Up Wizard state
  const [levelUpWizardOpen, setLevelUpWizardOpen] = useState(false)

  // Sessions state
  const [sessions, setSessions] = useState<Session[]>([])
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set())
  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<Session | null>(null)
  const [newSession, setNewSession] = useState({
    session_number: 1,
    play_date: new Date().toISOString().split('T')[0],
    summary: '',
    xp_awarded: 0,
    act_id: null as string | null,
  })

  // Acts state
  const [acts, setActs] = useState<Act[]>([])
  const [isActDialogOpen, setIsActDialogOpen] = useState(false)
  const [editingAct, setEditingAct] = useState<Act | null>(null)
  const [newAct, setNewAct] = useState({
    act_number: 1,
    title: '',
    description: '',
    theme: '',
    objectives: [] as string[],
    is_complete: false,
  })
  const [newObjective, setNewObjective] = useState('')
  const [expandedActNotes, setExpandedActNotes] = useState<Set<string>>(new Set())

  // Level-Up state
  const [levelUpDialogOpen, setLevelUpDialogOpen] = useState(false)
  const [levelUpCharacterId, setLevelUpCharacterId] = useState<string | null>(null)

  // Racial ASI Choices state (for character creation)
  const [racialASIChoices, setRacialASIChoices] = useState<RacialASIChoice[]>([])

  // Toggle act notes expansion
  const toggleActNotesExpansion = (actId: string) => {
    setExpandedActNotes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(actId)) {
        newSet.delete(actId)
      } else {
        newSet.add(actId)
      }
      return newSet
    })
  }

  // Get notes for a specific act
  const getNotesForAct = (actNumber: number) => {
    return notes.filter(n => n.act === actNumber)
  }

  // Encounter difficulties
  const DIFFICULTIES = [
    { value: 'easy', label: 'Facile', color: 'text-green-600' },
    { value: 'medium', label: 'Medio', color: 'text-yellow-600' },
    { value: 'hard', label: 'Difficile', color: 'text-orange-600' },
    { value: 'deadly', label: 'Mortale', color: 'text-red-600' },
  ]

  // Encounter statuses
  const STATUSES = [
    { value: 'planned', label: 'Pianificato', color: 'bg-[var(--teal)]/10 text-[var(--teal)]' },
    { value: 'active', label: 'In Corso', color: 'bg-[var(--coral)]/10 text-[var(--coral)]' },
    { value: 'completed', label: 'Completato', color: 'bg-green-100 text-green-700' },
  ]

  // Note types for D&D
  const NOTE_TYPES = [
    { value: 'general', label: 'Generale', icon: 'book' },
    { value: 'npc', label: 'PNG', icon: 'masks' },
    { value: 'location', label: 'Luogo', icon: 'scroll' },
    { value: 'quest', label: 'Quest', icon: 'combat' },
    { value: 'secret', label: 'Segreto', icon: 'skull' },
    { value: 'lore', label: 'Lore', icon: 'dragon' },
  ]

  // Computed values for sessions
  const nextSessionNumber = useMemo(() => {
    if (sessions.length === 0) return 1
    return Math.max(...sessions.map(s => s.session_number || 0)) + 1
  }, [sessions])

  const totalCampaignXP = useMemo(() => {
    return sessions.reduce((sum, s) => sum + (s.xp_awarded || 0), 0)
  }, [sessions])

  // Computed stats for acts (note and encounter counts)
  const actStats = useMemo(() => {
    return acts.map(act => ({
      ...act,
      noteCount: notes.filter(n => n.act === act.act_number).length,
      encounterCount: encounters.filter(e => e.act === act.act_number).length,
    }))
  }, [acts, notes, encounters])

  // Get act title by number
  const getActTitle = (actNumber: number | null) => {
    if (actNumber === null) return null
    const act = acts.find(a => a.act_number === actNumber)
    return act ? act.title : null
  }

  useEffect(() => {
    if (campaignId) {
      fetchCampaignData()
      fetchNotes()
      fetchEncounters()
      fetchMonsters()
      fetchSessions()
      fetchActs()
    }
  }, [campaignId])

  async function fetchCampaignData() {
    setLoading(true)

    // Fetch campaign
    const { data: campaignData, error: campaignError } = await supabase
      .from('dnd_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single()

    if (campaignError) {
      console.error('Error fetching campaign:', campaignError)
    } else {
      setCampaign(campaignData)
    }

    // Fetch characters
    const { data: charactersData, error: charactersError } = await supabase
      .from('dnd_characters')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('name')

    if (charactersError) {
      console.error('Error fetching characters:', charactersError)
    } else {
      // Cast from DB type to client state type (class_resources: Json -> ClassResource[])
      setCharacters((charactersData || []) as CharacterState[])
    }

    setLoading(false)
  }

  async function fetchNotes() {
    const { data, error } = await supabase
      .from('dnd_story_notes')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('act')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching notes:', error)
    } else {
      setNotes(data || [])
    }
  }

  async function fetchEncounters() {
    const { data, error } = await supabase
      .from('dnd_encounters')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('act')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching encounters:', error)
    } else {
      setEncounters(data || [])
    }
  }

  async function fetchSessions() {
    const { data, error } = await supabase
      .from('dnd_sessions')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('session_number', { ascending: false })

    if (error) {
      console.error('Error fetching sessions:', error)
    } else {
      setSessions(data || [])
    }
  }

  async function createOrUpdateSession() {
    if (editingSession) {
      // Update existing session
      const { error } = await supabase
        .from('dnd_sessions')
        .update({
          session_number: newSession.session_number,
          play_date: newSession.play_date || null,
          summary: newSession.summary || null,
          xp_awarded: newSession.xp_awarded,
          act_id: newSession.act_id,
        })
        .eq('id', editingSession.id)

      if (!error) {
        setSessions(sessions.map(s => s.id === editingSession.id ? {
          ...s,
          session_number: newSession.session_number,
          play_date: newSession.play_date || null,
          summary: newSession.summary || null,
          xp_awarded: newSession.xp_awarded,
          act_id: newSession.act_id,
        } : s))
      }
    } else {
      // Create new session
      const { data, error } = await supabase
        .from('dnd_sessions')
        .insert({
          campaign_id: campaignId,
          session_number: newSession.session_number,
          play_date: newSession.play_date || null,
          summary: newSession.summary || null,
          xp_awarded: newSession.xp_awarded,
          act_id: newSession.act_id,
        })
        .select()
        .single()

      if (!error && data) {
        setSessions([data, ...sessions])
      }
    }
    resetSessionForm()
  }

  async function deleteSession(id: string) {
    const { error } = await supabase
      .from('dnd_sessions')
      .delete()
      .eq('id', id)

    if (!error) {
      setSessions(sessions.filter(s => s.id !== id))
    }
  }

  function openEditSession(session: Session) {
    setEditingSession(session)
    setNewSession({
      session_number: session.session_number || 1,
      play_date: session.play_date || new Date().toISOString().split('T')[0],
      summary: session.summary || '',
      xp_awarded: session.xp_awarded || 0,
      act_id: session.act_id || null,
    })
    setIsSessionDialogOpen(true)
  }

  function resetSessionForm() {
    // Pre-select current act for new sessions
    const currentActId = acts.find(a => a.act_number === campaign?.current_act)?.id || null
    setNewSession({
      session_number: nextSessionNumber,
      play_date: new Date().toISOString().split('T')[0],
      summary: '',
      xp_awarded: 0,
      act_id: currentActId,
    })
    setEditingSession(null)
    setIsSessionDialogOpen(false)
  }

  // ===== ACTS FUNCTIONS =====
  async function fetchActs() {
    const { data, error } = await supabase
      .from('dnd_acts')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('act_number')

    if (error) {
      console.error('Error fetching acts:', error)
    } else {
      setActs(data || [])
    }
  }

  async function createOrUpdateAct() {
    if (!newAct.title.trim()) return

    if (editingAct) {
      const { error } = await supabase
        .from('dnd_acts')
        .update({
          act_number: newAct.act_number,
          title: newAct.title,
          description: newAct.description || null,
          theme: newAct.theme || null,
          objectives: newAct.objectives,
          is_complete: newAct.is_complete,
        })
        .eq('id', editingAct.id)

      if (!error) {
        setActs(acts.map(a => a.id === editingAct.id ? {
          ...a,
          act_number: newAct.act_number,
          title: newAct.title,
          description: newAct.description || null,
          theme: newAct.theme || null,
          objectives: newAct.objectives,
          is_complete: newAct.is_complete,
        } : a).sort((a, b) => a.act_number - b.act_number))
      }
    } else {
      const { data, error } = await supabase
        .from('dnd_acts')
        .insert({
          campaign_id: campaignId,
          act_number: newAct.act_number,
          title: newAct.title,
          description: newAct.description || null,
          theme: newAct.theme || null,
          objectives: newAct.objectives,
          is_complete: newAct.is_complete,
        })
        .select()
        .single()

      if (!error && data) {
        setActs([...acts, data].sort((a, b) => a.act_number - b.act_number))
      }
    }
    resetActForm()
  }

  async function deleteAct(actId: string) {
    if (!confirm('Eliminare questo atto? Le note e gli incontri associati non verranno eliminati.')) return

    const { error } = await supabase
      .from('dnd_acts')
      .delete()
      .eq('id', actId)

    if (!error) {
      setActs(acts.filter(a => a.id !== actId))
    }
  }

  async function setCurrentAct(actNumber: number) {
    const { error } = await supabase
      .from('dnd_campaigns')
      .update({ current_act: actNumber })
      .eq('id', campaignId)

    if (!error) {
      setCampaign(prev => prev ? { ...prev, current_act: actNumber } : null)
    }
  }

  async function toggleActComplete(act: Act) {
    const { error } = await supabase
      .from('dnd_acts')
      .update({ is_complete: !act.is_complete })
      .eq('id', act.id)

    if (!error) {
      setActs(acts.map(a => a.id === act.id ? { ...a, is_complete: !a.is_complete } : a))
    }
  }

  function openEditAct(act: Act) {
    setEditingAct(act)
    setNewAct({
      act_number: act.act_number,
      title: act.title,
      description: act.description || '',
      theme: act.theme || '',
      objectives: act.objectives || [],
      is_complete: act.is_complete,
    })
    setIsActDialogOpen(true)
  }

  function resetActForm() {
    const nextActNumber = acts.length > 0
      ? Math.max(...acts.map(a => a.act_number)) + 1
      : 1
    setNewAct({
      act_number: Math.min(nextActNumber, 5),
      title: '',
      description: '',
      theme: '',
      objectives: [],
      is_complete: false,
    })
    setNewObjective('')
    setEditingAct(null)
    setIsActDialogOpen(false)
  }

  async function createOrUpdateNote() {
    if (!newNote.title.trim()) return

    if (editingNote) {
      // Update existing note
      const { error } = await supabase
        .from('dnd_story_notes')
        .update({
          title: newNote.title,
          content: newNote.content || null,
          dm_notes: newNote.dm_notes || null,
          note_type: newNote.note_type,
          act: newNote.act,
          tags: newNote.tags,
          is_revealed: newNote.is_revealed,
        })
        .eq('id', editingNote.id)

      if (!error) {
        setNotes(notes.map(n => n.id === editingNote.id ? {
          ...n,
          title: newNote.title,
          content: newNote.content || null,
          dm_notes: newNote.dm_notes || null,
          note_type: newNote.note_type,
          act: newNote.act,
          tags: newNote.tags,
          is_revealed: newNote.is_revealed,
        } : n))
      }
    } else {
      // Create new note
      const { data, error } = await supabase
        .from('dnd_story_notes')
        .insert([{
          campaign_id: campaignId,
          title: newNote.title,
          content: newNote.content || null,
          dm_notes: newNote.dm_notes || null,
          note_type: newNote.note_type,
          act: newNote.act,
          tags: newNote.tags,
          is_revealed: newNote.is_revealed,
        }])
        .select()
        .single()

      if (!error && data) {
        setNotes([data, ...notes])
      }
    }

    resetNoteForm()
  }

  async function deleteNote(noteId: string) {
    const { error } = await supabase
      .from('dnd_story_notes')
      .delete()
      .eq('id', noteId)

    if (!error) {
      setNotes(notes.filter(n => n.id !== noteId))
    }
  }

  function openEditNote(note: StoryNote) {
    setEditingNote(note)
    setNewNote({
      title: note.title,
      content: note.content || '',
      dm_notes: note.dm_notes || '',
      note_type: note.note_type,
      act: note.act || 1,
      tags: note.tags || [],
      is_revealed: note.is_revealed,
    })
    setIsNoteDialogOpen(true)
  }

  function resetNoteForm() {
    setNewNote({
      title: '',
      content: '',
      dm_notes: '',
      note_type: 'general',
      act: campaign?.current_act || 1,
      tags: [],
      is_revealed: false,
    })
    setEditingNote(null)
    setIsNoteDialogOpen(false)
  }

  // Filter notes based on act and type
  const filteredNotes = notes.filter(note => {
    if (noteFilter.act !== null && note.act !== noteFilter.act) return false
    if (noteFilter.type !== null && note.note_type !== noteFilter.type) return false
    return true
  })

  // Get unique acts from notes and encounters
  const availableActs = Array.from(new Set([
    ...notes.map(n => n.act).filter(Boolean),
    ...encounters.map(e => e.act).filter(Boolean),
    campaign?.current_act || 1
  ])).sort((a, b) => (a || 0) - (b || 0))

  // Encounter CRUD functions
  async function createOrUpdateEncounter() {
    if (!newEncounter.name.trim()) return

    if (editingEncounter) {
      const { error } = await supabase
        .from('dnd_encounters')
        .update({
          name: newEncounter.name,
          description: newEncounter.description || null,
          location: newEncounter.location || null,
          difficulty: newEncounter.difficulty,
          act: newEncounter.act,
          status: newEncounter.status,
          notes: newEncounter.notes || null,
        })
        .eq('id', editingEncounter.id)

      if (!error) {
        setEncounters(encounters.map(e => e.id === editingEncounter.id ? {
          ...e,
          name: newEncounter.name,
          description: newEncounter.description || null,
          location: newEncounter.location || null,
          difficulty: newEncounter.difficulty,
          act: newEncounter.act,
          status: newEncounter.status,
          notes: newEncounter.notes || null,
        } : e))
      }
    } else {
      const { data, error } = await supabase
        .from('dnd_encounters')
        .insert([{
          campaign_id: campaignId,
          name: newEncounter.name,
          description: newEncounter.description || null,
          location: newEncounter.location || null,
          difficulty: newEncounter.difficulty,
          act: newEncounter.act,
          status: newEncounter.status,
          notes: newEncounter.notes || null,
        }])
        .select()
        .single()

      if (!error && data) {
        setEncounters([data, ...encounters])
      }
    }

    resetEncounterForm()
  }

  async function deleteEncounter(encounterId: string) {
    const { error } = await supabase
      .from('dnd_encounters')
      .delete()
      .eq('id', encounterId)

    if (!error) {
      setEncounters(encounters.filter(e => e.id !== encounterId))
    }
  }

  async function updateEncounterStatus(encounterId: string, status: string) {
    const { error } = await supabase
      .from('dnd_encounters')
      .update({ status })
      .eq('id', encounterId)

    if (!error) {
      setEncounters(encounters.map(e => e.id === encounterId ? { ...e, status } : e))
    }
  }

  function openEditEncounter(encounter: Encounter) {
    setEditingEncounter(encounter)
    setNewEncounter({
      name: encounter.name,
      description: encounter.description || '',
      location: encounter.location || '',
      difficulty: encounter.difficulty || 'medium',
      act: encounter.act,
      status: encounter.status,
      notes: encounter.notes || '',
    })
    setIsEncounterDialogOpen(true)
  }

  function resetEncounterForm() {
    setNewEncounter({
      name: '',
      description: '',
      location: '',
      difficulty: 'medium',
      act: campaign?.current_act || 1,
      status: 'planned',
      notes: '',
    })
    setEditingEncounter(null)
    setIsEncounterDialogOpen(false)
  }

  // Filter encounters based on act and status
  const filteredEncounters = encounters.filter(encounter => {
    if (encounterFilter.act !== null && encounter.act !== encounterFilter.act) return false
    if (encounterFilter.status !== null && encounter.status !== encounterFilter.status) return false
    return true
  })

  // Monster/Bestiary functions
  async function fetchMonsters() {
    const { data, error } = await supabase
      .from('dnd_monsters')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('name')

    if (error) {
      console.error('Error fetching monsters:', error)
    } else {
      setMonsters(data || [])
    }
  }

  async function searchOpen5eMonsters(query: string) {
    if (!query.trim()) {
      setOpen5eResults([])
      return
    }

    setSearchingOpen5e(true)
    try {
      const response = await fetch(
        `https://api.open5e.com/v1/monsters/?search=${encodeURIComponent(query)}&limit=20`
      )
      const data = await response.json()
      setOpen5eResults(data.results || [])
    } catch (error) {
      console.error('Error searching Open5e:', error)
      setOpen5eResults([])
    }
    setSearchingOpen5e(false)
  }

  async function importFromOpen5e(monster: any) {
    const { data, error } = await supabase
      .from('dnd_monsters')
      .insert([{
        campaign_id: campaignId,
        name: monster.name,
        cr: monster.cr || '0',
        max_hp: monster.hit_points || 10,
        armor_class: monster.armor_class || 10,
        speed: monster.speed?.walk || '30 ft.',
        str: monster.strength || 10,
        dex: monster.dexterity || 10,
        con: monster.constitution || 10,
        int: monster.intelligence || 10,
        wis: monster.wisdom || 10,
        cha: monster.charisma || 10,
        abilities: formatMonsterAbilities(monster),
        legendary_actions: monster.legendary_actions ? JSON.stringify(monster.legendary_actions) : null,
        source: `Open5e - ${monster.document__title || 'SRD'}`,
        is_template: true,
      }])
      .select()
      .single()

    if (!error && data) {
      setMonsters([...monsters, data])
    }
    return { data, error }
  }

  function formatMonsterAbilities(monster: any): string {
    let abilities = ''

    // Special abilities
    if (monster.special_abilities?.length > 0) {
      abilities += '**Abilità Speciali**\n'
      monster.special_abilities.forEach((a: any) => {
        abilities += `• ${a.name}: ${a.desc}\n`
      })
      abilities += '\n'
    }

    // Actions
    if (monster.actions?.length > 0) {
      abilities += '**Azioni**\n'
      monster.actions.forEach((a: any) => {
        abilities += `• ${a.name}: ${a.desc}\n`
      })
    }

    return abilities.trim()
  }

  async function createCustomMonster() {
    if (!newMonster.name.trim()) return

    const { data, error } = await supabase
      .from('dnd_monsters')
      .insert([{
        campaign_id: campaignId,
        name: newMonster.name,
        cr: newMonster.cr,
        max_hp: newMonster.max_hp,
        armor_class: newMonster.armor_class,
        speed: newMonster.speed,
        str: newMonster.str,
        dex: newMonster.dex,
        con: newMonster.con,
        int: newMonster.int,
        wis: newMonster.wis,
        cha: newMonster.cha,
        abilities: newMonster.abilities || null,
        source: newMonster.source,
        is_template: newMonster.is_template,
      }])
      .select()
      .single()

    if (!error && data) {
      setMonsters([...monsters, data])
      resetMonsterForm()
    }
  }

  async function deleteMonster(monsterId: string) {
    const { error } = await supabase
      .from('dnd_monsters')
      .delete()
      .eq('id', monsterId)

    if (!error) {
      setMonsters(monsters.filter(m => m.id !== monsterId))
    }
  }

  function resetMonsterForm() {
    setNewMonster({
      name: '',
      cr: '1',
      max_hp: 10,
      armor_class: 10,
      speed: '30 ft.',
      str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10,
      abilities: '',
      source: 'Homebrew',
      is_template: true,
    })
    setIsMonsterDialogOpen(false)
  }

  function viewMonsterDetails(monster: Monster | any) {
    setSelectedMonster(monster)
    setViewingMonster(true)
  }

  // Calculate modifier from ability score
  function calcMod(score: number): string {
    const mod = Math.floor((score - 10) / 2)
    return mod >= 0 ? `+${mod}` : `${mod}`
  }

  // Spell search function
  async function handleSpellSearch() {
    if (!spellSearch.trim() && spellFilters.level === null && !spellFilters.school) {
      setSpells([])
      return
    }

    setSearchingSpells(true)
    try {
      const results = await searchSpells(spellSearch || '', {
        level: spellFilters.level ?? undefined,
        school: spellFilters.school ?? undefined,
        limit: 30
      })
      setSpells(results)
    } catch (error) {
      console.error('Error searching spells:', error)
      setSpells([])
    }
    setSearchingSpells(false)
  }

  function viewSpellDetails(spell: CachedSpell) {
    setSelectedSpell(spell)
    setViewingSpell(true)
  }

  // Format spell level for display
  function formatSpellLevel(level: number | null): string {
    if (level === null || level === 0) return 'Trucchetto'
    return `${level}° livello`
  }

  // Load all races from Open5e
  async function loadRaces() {
    if (races.length > 0) return // Already loaded
    setLoadingRaces(true)
    try {
      const results = await getAllRaces()
      setRaces(results)
    } catch (error) {
      console.error('Error loading races:', error)
    }
    setLoadingRaces(false)
  }

  // Load all classes from Open5e
  async function loadClasses() {
    if (classes.length > 0) return // Already loaded
    setLoadingClasses(true)
    try {
      const results = await getAllClasses()
      setClasses(results)
    } catch (error) {
      console.error('Error loading classes:', error)
    }
    setLoadingClasses(false)
  }

  function viewRaceDetails(race: CachedRace) {
    setSelectedRace(race)
    setViewingRace(true)
  }

  function viewClassDetails(cls: CachedClass) {
    setSelectedClass(cls)
    setViewingClass(true)
  }

  // ==================== CHARACTER DETAILS FUNCTIONS ====================

  async function fetchCharacterSpells(characterId: string) {
    setLoadingCharacterSpells(true)
    const { data, error } = await supabase
      .from('dnd_character_spells')
      .select('*')
      .eq('character_id', characterId)
      .order('spell_level', { ascending: true })
      .order('spell_name', { ascending: true })

    if (!error && data) {
      setCharacterSpells(data)
    } else {
      setCharacterSpells([])
      if (error) console.error('Error fetching character spells:', error)
    }
    setLoadingCharacterSpells(false)
  }

  async function addSpellToCharacter(spell: CachedSpell) {
    if (!selectedCharacter) return

    setAddingSpellToCharacter(true)
    const { error } = await supabase
      .from('dnd_character_spells')
      .insert({
        character_id: selectedCharacter.id,
        spell_slug: spell.slug,
        spell_name: spell.name,
        spell_level: spell.level_int || 0,
      })

    if (!error) {
      await fetchCharacterSpells(selectedCharacter.id)
      setAddSpellDialogOpen(false)
    } else {
      console.error('Error adding spell:', error)
    }
    setAddingSpellToCharacter(false)
  }

  async function removeSpellFromCharacter(spellId: string) {
    const { error } = await supabase
      .from('dnd_character_spells')
      .delete()
      .eq('id', spellId)

    if (!error) {
      setCharacterSpells(characterSpells.filter(s => s.id !== spellId))
    }
  }

  function openCharacterDetails(character: CharacterState) {
    setSelectedCharacter(character)
    setViewingCharacterDetails(true)

    // Carica incantesimi del personaggio
    fetchCharacterSpells(character.id)

    // Carica dati razza da Open5e (se disponibile)
    if (character.race) {
      const raceData = races.find(r =>
        r.slug === character.race?.toLowerCase().replace(/\s+/g, '-') ||
        r.name.toLowerCase() === character.race?.toLowerCase()
      )
      setCharacterRaceData(raceData || null)
    } else {
      setCharacterRaceData(null)
    }

    // Carica dati classe da Open5e
    if (character.class) {
      const classData = classes.find(c => c.slug === character.class?.toLowerCase())
      setCharacterClassData(classData || null)
    } else {
      setCharacterClassData(null)
    }
  }

  function startEditingCharacter() {
    if (selectedCharacter) {
      setEditedCharacter({ ...selectedCharacter })
      setEditingCharacter(true)
    }
  }

  function cancelEditingCharacter() {
    setEditingCharacter(false)
    setEditedCharacter(null)
  }

  async function updateCharacter() {
    if (!editedCharacter) return

    const { error } = await supabase
      .from('dnd_characters')
      .update({
        name: editedCharacter.name,
        player_name: editedCharacter.player_name,
        class: editedCharacter.class,
        race: editedCharacter.race,
        level: editedCharacter.level,
        max_hp: editedCharacter.max_hp,
        armor_class: editedCharacter.armor_class,
        initiative_bonus: editedCharacter.initiative_bonus,
        speed: editedCharacter.speed,
        passive_perception: editedCharacter.passive_perception,
        spell_save_dc: editedCharacter.spell_save_dc,
        str: editedCharacter.str,
        dex: editedCharacter.dex,
        con: editedCharacter.con,
        int: editedCharacter.int,
        wis: editedCharacter.wis,
        cha: editedCharacter.cha,
        notes: editedCharacter.notes,
      })
      .eq('id', editedCharacter.id)

    if (!error) {
      // Aggiorna lo stato locale
      setCharacters(characters.map(c =>
        c.id === editedCharacter.id ? editedCharacter : c
      ))
      setSelectedCharacter(editedCharacter)
      setEditingCharacter(false)
      setEditedCharacter(null)
    } else {
      console.error('Error updating character:', error)
    }
  }

  // Handle Level Up completion
  async function handleLevelUpComplete(updates: LevelUpUpdates) {
    if (!selectedCharacter) return

    try {
      // Update character in database
      const { error: charError } = await supabase
        .from('dnd_characters')
        .update({
          level: updates.level,
          max_hp: updates.max_hp,
          current_hp: updates.current_hp,
          subclass: updates.subclass,
          fighting_style: updates.fighting_style,
          eldritch_invocations: updates.eldritch_invocations,
          class_resources: updates.class_resources,
        })
        .eq('id', selectedCharacter.id)

      if (charError) throw charError

      // Insert new spells if any
      if (updates.newSpells.length > 0) {
        const { error: spellError } = await supabase
          .from('dnd_character_spells')
          .insert(updates.newSpells)

        if (spellError) throw spellError
      }

      // Update local state
      const updatedCharacter: CharacterState = {
        ...selectedCharacter,
        level: updates.level,
        max_hp: updates.max_hp,
        current_hp: updates.current_hp ?? selectedCharacter.current_hp,
        subclass: updates.subclass ?? null,
        fighting_style: updates.fighting_style ?? null,
        eldritch_invocations: updates.eldritch_invocations ?? null,
        class_resources: updates.class_resources,
      }

      setCharacters(characters.map(c =>
        c.id === selectedCharacter.id ? updatedCharacter : c
      ))
      setSelectedCharacter(updatedCharacter)
      setLevelUpWizardOpen(false)

      // Reload character spells to include new ones
      if (updates.newSpells.length > 0) {
        const { data: spells } = await supabase
          .from('dnd_character_spells')
          .select('*')
          .eq('character_id', selectedCharacter.id)
          .order('spell_level', { ascending: true })
        if (spells) setCharacterSpells(spells)
      }
    } catch (error) {
      console.error('Level up failed:', error)
    }
  }

  function getProficiencyBonus(level: number): number {
    return Math.ceil(level / 4) + 1
  }

  // ==================== RACE SELECTION WITH ASI ====================

  function handleRaceSelect(raceSlug: string) {
    const selectedRace = DND_RACES[raceSlug]
    if (!selectedRace) return

    // Reset racial ASI choices when race changes
    setRacialASIChoices([])

    // Le stat rimangono base 10, i bonus verranno applicati al salvataggio
    // Questo permette al DM di inserire le stat base del personaggio
    // e vedere l'anteprima dei bonus razziali
    setNewCharacter({
      ...newCharacter,
      race: raceSlug,
      // Non applichiamo più i bonus qui - verranno applicati in createCharacter()
    })
  }

  // ==================== COMBAT/INITIATIVE FUNCTIONS ====================

  function startCombat() {
    // Roll initiative for all selected combatants
    const initiativeList: InitiativeItem[] = []

    // Add selected characters
    for (const charId of selectedCharactersForCombat) {
      const char = characters.find(c => c.id === charId)
      if (char) {
        initiativeList.push({
          type: 'character',
          id: char.id,
          name: char.name,
          initiative: rollInitiative(char.initiative_bonus),
          current_hp: char.current_hp,
          max_hp: char.max_hp,
          conditions: char.conditions || [],
        })
      }
    }

    // Add selected monsters (with instances)
    for (const monsterSelection of selectedMonstersForCombat) {
      const monster = monsters.find(m => m.id === monsterSelection.id)
      if (monster) {
        const dexMod = abilityModifier(monster.dex)
        for (let i = 0; i < monsterSelection.count; i++) {
          initiativeList.push({
            type: 'monster',
            id: `${monster.id}_${i}`,
            name: monsterSelection.count > 1 ? `${monster.name} #${i + 1}` : monster.name,
            initiative: rollInitiative(dexMod),
            current_hp: monster.max_hp || 10,
            max_hp: monster.max_hp || 10,
            conditions: [],
          })
        }
      }
    }

    // Sort by initiative (highest first)
    initiativeList.sort((a, b) => b.initiative - a.initiative)

    setCombatants(initiativeList)
    setCurrentTurn(0)
    setRoundNumber(1)
    setCombatActive(true)
    setSetupCombatOpen(false)
  }

  function loadEncounterMonsters(encounterId: string) {
    // This would load monsters from an existing encounter
    // For now, we just set the selected encounter
    setSelectedEncounterForCombat(encounterId)
    // TODO: Load encounter monsters and add them to selectedMonstersForCombat
  }

  function nextTurn() {
    if (combatants.length === 0) return

    const nextIndex = currentTurn + 1
    if (nextIndex >= combatants.length) {
      // End of round, go back to first combatant
      setCurrentTurn(0)
      setRoundNumber(prev => prev + 1)
    } else {
      setCurrentTurn(nextIndex)
    }
  }

  function previousTurn() {
    if (combatants.length === 0) return

    const prevIndex = currentTurn - 1
    if (prevIndex < 0) {
      // Go to last combatant of previous round
      setCurrentTurn(combatants.length - 1)
      setRoundNumber(prev => Math.max(1, prev - 1))
    } else {
      setCurrentTurn(prevIndex)
    }
  }

  function removeCombatant(id: string) {
    setCombatants(prev => {
      const newList = prev.filter(c => c.id !== id)
      // Adjust current turn if needed
      if (currentTurn >= newList.length && newList.length > 0) {
        setCurrentTurn(newList.length - 1)
      }
      return newList
    })
  }

  function updateCombatantHP(id: string, newHP: number) {
    setCombatants(prev => prev.map(c =>
      c.id === id ? { ...c, current_hp: Math.max(0, Math.min(newHP, c.max_hp || 0)) } : c
    ))
  }

  function toggleCombatantCondition(id: string, condition: string) {
    setCombatants(prev => prev.map(c => {
      if (c.id !== id) return c
      const conditions = c.conditions || []
      if (conditions.includes(condition)) {
        return { ...c, conditions: conditions.filter(cond => cond !== condition) }
      } else {
        return { ...c, conditions: [...conditions, condition] }
      }
    }))
  }

  function endCombat() {
    setCombatActive(false)
    setCombatants([])
    setCurrentTurn(0)
    setRoundNumber(1)
    setSelectedCharactersForCombat([])
    setSelectedMonstersForCombat([])
    setSelectedEncounterForCombat(null)
  }

  function toggleCharacterForCombat(charId: string) {
    setSelectedCharactersForCombat(prev =>
      prev.includes(charId)
        ? prev.filter(id => id !== charId)
        : [...prev, charId]
    )
  }

  function addMonsterToCombat(monsterId: string) {
    setSelectedMonstersForCombat(prev => {
      const existing = prev.find(m => m.id === monsterId)
      if (existing) {
        return prev.map(m => m.id === monsterId ? { ...m, count: m.count + 1 } : m)
      }
      return [...prev, { id: monsterId, count: 1 }]
    })
  }

  function removeMonsterFromCombat(monsterId: string) {
    setSelectedMonstersForCombat(prev => {
      const existing = prev.find(m => m.id === monsterId)
      if (existing && existing.count > 1) {
        return prev.map(m => m.id === monsterId ? { ...m, count: m.count - 1 } : m)
      }
      return prev.filter(m => m.id !== monsterId)
    })
  }

  function rerollInitiative(id: string) {
    setCombatants(prev => {
      const combatant = prev.find(c => c.id === id)
      if (!combatant) return prev

      let modifier = 0
      if (combatant.type === 'character') {
        const char = characters.find(c => c.id === id)
        modifier = char?.initiative_bonus || 0
      } else {
        // Extract monster ID from instance ID (e.g., "uuid_0" -> "uuid")
        const monsterId = id.split('_')[0]
        const monster = monsters.find(m => m.id === monsterId)
        modifier = monster ? abilityModifier(monster.dex) : 0
      }

      const newInit = rollInitiative(modifier)
      const newList = prev.map(c => c.id === id ? { ...c, initiative: newInit } : c)
      newList.sort((a, b) => b.initiative - a.initiative)

      // Update current turn to follow the same combatant if possible
      const oldCombatant = prev[currentTurn]
      const newIndex = newList.findIndex(c => c.id === oldCombatant?.id)
      if (newIndex !== -1) {
        setCurrentTurn(newIndex)
      }

      return newList
    })
  }

  // ==================== END COMBAT FUNCTIONS ====================

  async function createCharacter() {
    if (!newCharacter.name.trim()) return

    // Le statistiche inserite dal DM sono le base stats
    const baseStats = {
      str: newCharacter.str,
      dex: newCharacter.dex,
      con: newCharacter.con,
      int: newCharacter.int,
      wis: newCharacter.wis,
      cha: newCharacter.cha,
    }

    // Applica i bonus razziali alle stat finali
    const finalStats = applyRacialBonuses(
      baseStats,
      newCharacter.race || null,
      racialASIChoices.length > 0 ? racialASIChoices : undefined
    )

    // Calcola HP al livello 1 se non specificato diversamente
    // HP = dado vita massimo + modificatore COS
    const calculatedHP = newCharacter.level === 1
      ? calculateLevel1HP(newCharacter.class, finalStats.con)
      : newCharacter.max_hp

    const { data, error } = await supabase
      .from('dnd_characters')
      .insert([{
        campaign_id: campaignId,
        name: newCharacter.name,
        player_name: newCharacter.player_name || null,
        class: newCharacter.class || null,
        race: newCharacter.race || null,
        level: newCharacter.level,
        max_hp: calculatedHP,
        current_hp: calculatedHP,
        armor_class: newCharacter.armor_class,
        initiative_bonus: newCharacter.initiative_bonus,
        // Stat finali (con bonus razziali applicati)
        str: finalStats.str,
        dex: finalStats.dex,
        con: finalStats.con,
        int: finalStats.int,
        wis: finalStats.wis,
        cha: finalStats.cha,
        // Stat base (senza bonus razziali)
        base_str: baseStats.str,
        base_dex: baseStats.dex,
        base_con: baseStats.con,
        base_int: baseStats.int,
        base_wis: baseStats.wis,
        base_cha: baseStats.cha,
        // Scelte ASI razziali (per Half-Elf ecc.)
        racial_asi_choices: racialASIChoices.length > 0 ? racialASIChoices : null,
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating character:', error)
    } else if (data) {
      setCharacters([...characters, data as CharacterState])
      setNewCharacter({
        name: '',
        player_name: '',
        class: '',
        race: '',
        level: 1,
        max_hp: 10,
        armor_class: 10,
        initiative_bonus: 0,
        str: 10,
        dex: 10,
        con: 10,
        int: 10,
        wis: 10,
        cha: 10,
      })
      setRacialASIChoices([])
      setIsCharacterDialogOpen(false)
    }
  }

  // ==================== LEVEL-UP FUNCTIONS ====================

  async function handleLevelUp(data: LevelUpData) {
    if (!levelUpCharacterId) return

    const character = characters.find(c => c.id === levelUpCharacterId)
    if (!character) return

    // Calculate new HP
    const newMaxHP = character.max_hp + data.totalHPGain
    const newCurrentHP = character.current_hp + data.totalHPGain

    // Build the updates object
    const updates: Record<string, unknown> = {
      level: data.newLevel,
      max_hp: newMaxHP,
      current_hp: Math.min(newCurrentHP, newMaxHP),
    }

    // Apply ASI if present
    if (data.hasASI && data.asiChoices && data.asiChoices.length > 0) {
      // Update ability scores
      for (const choice of data.asiChoices) {
        const currentValue = character[choice.ability] as number
        updates[choice.ability] = Math.min(20, currentValue + choice.bonus)
      }

      // Update ASI history
      const currentHistory = (character.asi_history as unknown as ASIHistoryEntry[]) || []
      const newEntry: ASIHistoryEntry = {
        level: data.newLevel,
        type: 'asi',
        choices: data.asiChoices,
        timestamp: new Date().toISOString()
      }
      updates.asi_history = [...currentHistory, newEntry]
    }

    // Update class resources for the new level
    const newResources = getClassResources(
      character.class,
      data.newLevel,
      {
        str: (updates.str as number) ?? character.str,
        dex: (updates.dex as number) ?? character.dex,
        con: (updates.con as number) ?? character.con,
        int: (updates.int as number) ?? character.int,
        wis: (updates.wis as number) ?? character.wis,
        cha: (updates.cha as number) ?? character.cha,
      }
    )
    updates.class_resources = newResources

    // Save to database
    const { error } = await supabase
      .from('dnd_characters')
      .update(updates)
      .eq('id', levelUpCharacterId)

    if (error) {
      console.error('Error leveling up character:', error)
      throw error
    }

    // Update local state
    setCharacters(characters.map(c =>
      c.id === levelUpCharacterId
        ? { ...c, ...updates } as CharacterState
        : c
    ))

    // Close the dialog
    setLevelUpDialogOpen(false)
    setLevelUpCharacterId(null)
  }

  function openLevelUpDialog(character: CharacterState) {
    setLevelUpCharacterId(character.id)
    setLevelUpDialogOpen(true)
  }

  // ==================== END LEVEL-UP FUNCTIONS ====================

  async function updateCharacterHP(characterId: string, change: number) {
    const character = characters.find(c => c.id === characterId)
    if (!character) return

    const newHP = Math.max(0, Math.min(character.max_hp, character.current_hp + change))

    const { error } = await supabase
      .from('dnd_characters')
      .update({ current_hp: newHP })
      .eq('id', characterId)

    if (!error) {
      setCharacters(characters.map(c =>
        c.id === characterId ? { ...c, current_hp: newHP } : c
      ))
    }
  }

  // Class Resources functions
  async function updateCharacterResources(characterId: string, resources: ClassResource[]) {
    const { error } = await supabase
      .from('dnd_characters')
      .update({ class_resources: resources })
      .eq('id', characterId)

    if (!error) {
      setCharacters(characters.map(c =>
        c.id === characterId ? { ...c, class_resources: resources } : c
      ))
      // Also update selectedCharacter if it's the same
      if (selectedCharacter?.id === characterId) {
        setSelectedCharacter({ ...selectedCharacter, class_resources: resources })
      }
    }
  }

  function handleUseResource(characterId: string, currentResources: ClassResource[], resourceId: string) {
    const updated = useResource(currentResources, resourceId)
    updateCharacterResources(characterId, updated)
  }

  function handleRestoreResource(characterId: string, currentResources: ClassResource[], resourceId: string) {
    const updated = restoreResource(currentResources, resourceId)
    updateCharacterResources(characterId, updated)
  }

  function handleShortRest(characterId: string, currentResources: ClassResource[]) {
    const updated = shortRest(currentResources)
    updateCharacterResources(characterId, updated)
  }

  function handleLongRest(characterId: string, currentResources: ClassResource[]) {
    const updated = longRest(currentResources)
    updateCharacterResources(characterId, updated)
  }

  function initializeResources(character: CharacterState) {
    const resources = getClassResources(
      character.class,
      character.level,
      { str: character.str, dex: character.dex, con: character.con, int: character.int, wis: character.wis, cha: character.cha }
    )
    updateCharacterResources(character.id, resources)
  }

  // Avatar upload functions
  function openAvatarDialog(character: CharacterState) {
    setSelectedCharacter(character)
    setAvatarPreview(character.avatar_url || null)
    setAvatarDialogOpen(true)
  }

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Immagine troppo grande. Massimo 2MB.')
      return
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Per favore seleziona un\'immagine.')
      return
    }

    // Convert to base64
    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target?.result as string
      setAvatarPreview(base64)
    }
    reader.readAsDataURL(file)
  }

  async function saveAvatar() {
    if (!selectedCharacter || !avatarPreview) return

    setUploadingAvatar(true)

    const { error } = await supabase
      .from('dnd_characters')
      .update({ avatar_url: avatarPreview })
      .eq('id', selectedCharacter.id)

    if (!error) {
      setCharacters(characters.map(c =>
        c.id === selectedCharacter.id ? { ...c, avatar_url: avatarPreview } : c
      ))
      setAvatarDialogOpen(false)
      setSelectedCharacter(null)
      setAvatarPreview(null)
    } else {
      console.error('Error saving avatar:', error)
      alert('Errore nel salvataggio dell\'avatar')
    }

    setUploadingAvatar(false)
  }

  async function removeAvatar() {
    if (!selectedCharacter) return

    setUploadingAvatar(true)

    const { error } = await supabase
      .from('dnd_characters')
      .update({ avatar_url: null })
      .eq('id', selectedCharacter.id)

    if (!error) {
      setCharacters(characters.map(c =>
        c.id === selectedCharacter.id ? { ...c, avatar_url: null } : c
      ))
      setAvatarPreview(null)
    }

    setUploadingAvatar(false)
  }

  function getHPStatus(current: number, max: number): 'healthy' | 'wounded' | 'critical' {
    const percentage = (current / max) * 100
    if (percentage > 50) return 'healthy'
    if (percentage > 25) return 'wounded'
    return 'critical'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin"><GameIcon name="d20" category="ui" size={56} className="text-[var(--teal)]" /></div>
          <p className="mt-4 text-[var(--ink-light)]">Caricamento campagna...</p>
        </div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="parchment-card p-8 text-center max-w-sm">
          <div className="mb-4"><GameIcon name="skull" category="ui" size={56} className="text-[var(--coral)]" /></div>
          <h2 className="text-xl font-semibold mb-4 text-[var(--ink)]">Campagna non trovata</h2>
          <Link href="/">
            <Button className="btn-secondary min-h-[44px]">Torna alla Home</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-6 md:mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/">
            <Button variant="outline" className="btn-secondary min-h-[44px] px-4">← Indietro</Button>
          </Link>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-[var(--coral)]">{campaign.name}</h1>
        <p className="text-[var(--ink-light)] mt-2">{campaign.description || 'Nessuna descrizione'}</p>
        <div className="flex flex-wrap gap-3 mt-4">
          <Badge variant="outline" className="text-[var(--teal)] border-[var(--teal)] bg-[var(--teal)]/10 px-3 py-1">
            Atto {campaign.current_act}
          </Badge>
          <Badge variant="outline" className="text-[var(--ink-light)] border-[var(--border-decorative)] px-3 py-1">
            {characters.length} Personaggi
          </Badge>
        </div>
      </header>

      <div className="max-w-7xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Navigation with 4 grouped dropdowns */}
          <div className="flex flex-wrap gap-2 mb-6">
            {/* GIOCO: Party + Combat */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={['party', 'combat'].includes(activeTab) ? 'default' : 'outline'}
                  className={`min-h-[44px] gap-2 ${['party', 'combat'].includes(activeTab) ? 'bg-[var(--teal)] text-white' : ''}`}
                >
                  <GameIcon name="combat" category="ui" size={18} />
                  Gioco
                  <span className="text-xs opacity-70">▼</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="parchment-card">
                <DropdownMenuItem onClick={() => setActiveTab('party')} className={activeTab === 'party' ? 'bg-[var(--teal)]/10' : ''}>
                  <GameIcon name="masks" category="ui" size={16} className="mr-2" /> Party
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab('combat')} className={activeTab === 'combat' ? 'bg-[var(--teal)]/10' : ''}>
                  <GameIcon name="combat" category="ui" size={16} className="mr-2" /> Combattimento
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* STORIA: Atti + Sessioni + Note */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={['acts', 'sessions', 'notes'].includes(activeTab) ? 'default' : 'outline'}
                  className={`min-h-[44px] gap-2 ${['acts', 'sessions', 'notes'].includes(activeTab) ? 'bg-[var(--teal)] text-white' : ''}`}
                >
                  <GameIcon name="book" category="ui" size={18} />
                  Storia
                  <span className="text-xs opacity-70">▼</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="parchment-card">
                <DropdownMenuItem onClick={() => setActiveTab('acts')} className={activeTab === 'acts' ? 'bg-[var(--teal)]/10' : ''}>
                  <GameIcon name="book" category="ui" size={16} className="mr-2" /> Atti
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab('sessions')} className={activeTab === 'sessions' ? 'bg-[var(--teal)]/10' : ''}>
                  <GameIcon name="scroll" category="ui" size={16} className="mr-2" /> Sessioni
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab('notes')} className={activeTab === 'notes' ? 'bg-[var(--teal)]/10' : ''}>
                  <GameIcon name="quill" category="ui" size={16} className="mr-2" /> Note
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* PREPARAZIONE: Incontri + Bestiario */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={['encounters', 'bestiary'].includes(activeTab) ? 'default' : 'outline'}
                  className={`min-h-[44px] gap-2 ${['encounters', 'bestiary'].includes(activeTab) ? 'bg-[var(--teal)] text-white' : ''}`}
                >
                  <GameIcon name="dragon" category="ui" size={18} />
                  Preparazione
                  <span className="text-xs opacity-70">▼</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="parchment-card">
                <DropdownMenuItem onClick={() => setActiveTab('encounters')} className={activeTab === 'encounters' ? 'bg-[var(--teal)]/10' : ''}>
                  <GameIcon name="dragon" category="ui" size={16} className="mr-2" /> Incontri
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab('bestiary')} className={activeTab === 'bestiary' ? 'bg-[var(--teal)]/10' : ''}>
                  <GameIcon name="skull" category="ui" size={16} className="mr-2" /> Bestiario
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* RIFERIMENTI: Incantesimi + Razze/Classi */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={['spells', 'races-classes'].includes(activeTab) ? 'default' : 'outline'}
                  className={`min-h-[44px] gap-2 ${['spells', 'races-classes'].includes(activeTab) ? 'bg-[var(--teal)] text-white' : ''}`}
                >
                  <GameIcon name="scroll" category="ui" size={18} />
                  Riferimenti
                  <span className="text-xs opacity-70">▼</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="parchment-card">
                <DropdownMenuItem onClick={() => setActiveTab('spells')} className={activeTab === 'spells' ? 'bg-[var(--teal)]/10' : ''}>
                  <GameIcon name="book" category="ui" size={16} className="mr-2" /> Incantesimi
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab('races-classes')} className={activeTab === 'races-classes' ? 'bg-[var(--teal)]/10' : ''}>
                  <GameIcon name="barbarian" category="classes" size={16} className="mr-2" /> Razze & Classi
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Current section indicator */}
            <div className="flex-1 flex items-center justify-end">
              <Badge variant="outline" className="text-sm">
                {activeTab === 'party' && 'Party'}
                {activeTab === 'combat' && 'Combattimento'}
                {activeTab === 'acts' && 'Atti'}
                {activeTab === 'sessions' && 'Sessioni'}
                {activeTab === 'notes' && 'Note'}
                {activeTab === 'encounters' && 'Incontri'}
                {activeTab === 'bestiary' && 'Bestiario'}
                {activeTab === 'spells' && 'Incantesimi'}
                {activeTab === 'races-classes' && 'Razze & Classi'}
              </Badge>
            </div>
          </div>

          {/* PARTY TAB */}
          <TabsContent value="party">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-xl md:text-2xl font-semibold text-[var(--ink)]">Personaggi del Party</h2>
              <Dialog open={isCharacterDialogOpen} onOpenChange={setIsCharacterDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="btn-primary min-h-[44px]">
                    + Aggiungi Personaggio
                  </Button>
                </DialogTrigger>
                <DialogContent className="parchment-card max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Nuovo Personaggio</DialogTitle>
                    <DialogDescription>
                      Aggiungi un personaggio giocante al party
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="char-name">Nome Personaggio *</Label>
                        <Input
                          id="char-name"
                          placeholder="es. Arathorn"
                          value={newCharacter.name}
                          onChange={(e) => setNewCharacter({ ...newCharacter, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="player-name">Nome Giocatore</Label>
                        <Input
                          id="player-name"
                          placeholder="es. Marco"
                          value={newCharacter.player_name}
                          onChange={(e) => setNewCharacter({ ...newCharacter, player_name: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Classe</Label>
                        <Select
                          value={newCharacter.class}
                          onValueChange={(value) => setNewCharacter({ ...newCharacter, class: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleziona classe" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(DND_CLASSES).map(([key, value]) => (
                              <SelectItem key={key} value={key}>
                                {value.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Razza</Label>
                        <Select
                          value={newCharacter.race}
                          onValueChange={handleRaceSelect}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleziona razza" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {Object.entries(DND_RACES).map(([key, race]) => (
                              <SelectItem key={key} value={key}>
                                {race.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Display ASI bonus when race is selected */}
                    {newCharacter.race && DND_RACES[newCharacter.race] && (() => {
                      const selectedRace = DND_RACES[newCharacter.race]
                      const asiBonuses = Object.entries(selectedRace.asi)
                        .filter(([, value]) => value !== undefined && value !== 0)
                        .map(([ability, bonus]) => `${ability.toUpperCase()} +${bonus}`)

                      return (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm space-y-3">
                          <div>
                            <span className="font-semibold text-amber-800">Bonus Caratteristiche:</span>{' '}
                            <span className="text-amber-900">{asiBonuses.join(', ')}</span>
                            {asiBonuses.length > 0 && !selectedRace.asiChoice && (
                              <span className="text-teal-600 ml-2 text-xs">(applicati automaticamente)</span>
                            )}
                          </div>

                          {/* RacialASISelector for races with asiChoice (e.g., Half-Elf) */}
                          {selectedRace.asiChoice && (
                            <div className="pt-2 border-t border-amber-200">
                              <RacialASISelector
                                count={selectedRace.asiChoice.count}
                                bonus={selectedRace.asiChoice.bonus}
                                exclude={selectedRace.asiChoice.exclude || []}
                                value={racialASIChoices}
                                onChange={setRacialASIChoices}
                              />
                            </div>
                          )}
                        </div>
                      )
                    })()}

                    <div className="grid grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="level">Livello</Label>
                        <Input
                          id="level"
                          type="number"
                          min={1}
                          max={20}
                          value={newCharacter.level}
                          onChange={(e) => setNewCharacter({ ...newCharacter, level: parseInt(e.target.value) || 1 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="max-hp">HP Max</Label>
                        <Input
                          id="max-hp"
                          type="number"
                          min={1}
                          value={newCharacter.max_hp}
                          onChange={(e) => setNewCharacter({ ...newCharacter, max_hp: parseInt(e.target.value) || 10 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ac">CA</Label>
                        <Input
                          id="ac"
                          type="number"
                          min={1}
                          value={newCharacter.armor_class}
                          onChange={(e) => setNewCharacter({ ...newCharacter, armor_class: parseInt(e.target.value) || 10 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="init">Init</Label>
                        <Input
                          id="init"
                          type="number"
                          value={newCharacter.initiative_bonus}
                          onChange={(e) => setNewCharacter({ ...newCharacter, initiative_bonus: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    </div>

                    {/* Ability Scores */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Caratteristiche</Label>
                      <div className="grid grid-cols-6 gap-2">
                        <div className="text-center">
                          <Label className="text-xs text-[var(--ink-light)]">FOR</Label>
                          <Input
                            type="number"
                            min={1}
                            max={30}
                            value={newCharacter.str}
                            onChange={(e) => setNewCharacter({ ...newCharacter, str: parseInt(e.target.value) || 10 })}
                            className="text-center"
                          />
                        </div>
                        <div className="text-center">
                          <Label className="text-xs text-[var(--ink-light)]">DES</Label>
                          <Input
                            type="number"
                            min={1}
                            max={30}
                            value={newCharacter.dex}
                            onChange={(e) => setNewCharacter({ ...newCharacter, dex: parseInt(e.target.value) || 10 })}
                            className="text-center"
                          />
                        </div>
                        <div className="text-center">
                          <Label className="text-xs text-[var(--ink-light)]">COS</Label>
                          <Input
                            type="number"
                            min={1}
                            max={30}
                            value={newCharacter.con}
                            onChange={(e) => setNewCharacter({ ...newCharacter, con: parseInt(e.target.value) || 10 })}
                            className="text-center"
                          />
                        </div>
                        <div className="text-center">
                          <Label className="text-xs text-[var(--ink-light)]">INT</Label>
                          <Input
                            type="number"
                            min={1}
                            max={30}
                            value={newCharacter.int}
                            onChange={(e) => setNewCharacter({ ...newCharacter, int: parseInt(e.target.value) || 10 })}
                            className="text-center"
                          />
                        </div>
                        <div className="text-center">
                          <Label className="text-xs text-[var(--ink-light)]">SAG</Label>
                          <Input
                            type="number"
                            min={1}
                            max={30}
                            value={newCharacter.wis}
                            onChange={(e) => setNewCharacter({ ...newCharacter, wis: parseInt(e.target.value) || 10 })}
                            className="text-center"
                          />
                        </div>
                        <div className="text-center">
                          <Label className="text-xs text-[var(--ink-light)]">CAR</Label>
                          <Input
                            type="number"
                            min={1}
                            max={30}
                            value={newCharacter.cha}
                            onChange={(e) => setNewCharacter({ ...newCharacter, cha: parseInt(e.target.value) || 10 })}
                            className="text-center"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => setIsCharacterDialogOpen(false)} className="btn-secondary min-h-[44px]">
                      Annulla
                    </Button>
                    <Button
                      onClick={createCharacter}
                      disabled={!newCharacter.name.trim()}
                      className="btn-primary min-h-[44px]"
                    >
                      Aggiungi
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {characters.length === 0 ? (
              <Card className="parchment-card text-center py-12 px-6">
                <CardContent>
                  <div className="mb-4"><GameIcon name="masks" category="ui" size={64} className="text-[var(--teal)]" /></div>
                  <h3 className="text-xl font-semibold mb-2 text-[var(--ink)]">Nessun personaggio</h3>
                  <p className="text-[var(--ink-light)] mb-6">
                    Aggiungi i personaggi del tuo party
                  </p>
                  <Button
                    onClick={() => setIsCharacterDialogOpen(true)}
                    className="btn-primary min-h-[44px]"
                  >
                    + Aggiungi Primo Personaggio
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3 card-stagger">
                {characters.map((character) => {
                  const hpStatus = getHPStatus(character.current_hp, character.max_hp)
                  const hpPercentage = (character.current_hp / character.max_hp) * 100
                  const classInfo = character.class ? DND_CLASSES[character.class as keyof typeof DND_CLASSES] : null

                  return (
                    <Card key={character.id} className="character-card">
                      {/* Header */}
                      <div className="character-card-header">
                        <div
                          className="character-avatar"
                          style={{ backgroundColor: classInfo?.color || 'var(--teal)' }}
                          onClick={() => openAvatarDialog(character)}
                          title="Clicca per cambiare avatar"
                        >
                          {character.avatar_url ? (
                            <img
                              src={character.avatar_url}
                              alt={character.name}
                              className="character-avatar-img"
                            />
                          ) : classInfo?.icon ? (
                            <GameIcon
                              name={classInfo.icon}
                              category="classes"
                              size={28}
                              className="text-white"
                            />
                          ) : (
                            character.name.charAt(0)
                          )}
                          <span className="character-avatar-overlay">
                            <GameIcon name="masks" category="ui" size={20} className="text-white" />
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3
                            className="character-name truncate cursor-pointer hover:text-[var(--teal)] transition-colors"
                            onClick={() => openCharacterDetails(character)}
                            title="Clicca per vedere dettagli"
                          >
                            {character.name}
                          </h3>
                          <p className="character-subtitle truncate">
                            {character.player_name && `${character.player_name} • `}
                            {character.race} {classInfo?.name} Lv.{character.level}
                          </p>
                        </div>
                      </div>

                      {/* HP Bar */}
                      <div className="mb-4">
                        <div className="hp-bar">
                          <div
                            className={`hp-bar-fill ${hpStatus}`}
                            style={{ width: `${hpPercentage}%` }}
                          />
                          <span className="hp-bar-text">
                            {character.current_hp}/{character.max_hp}
                            {character.temp_hp > 0 && ` (+${character.temp_hp})`}
                          </span>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button
                            className="btn-hp btn-hp-damage flex-1"
                            onClick={() => updateCharacterHP(character.id, -5)}
                          >
                            -5
                          </button>
                          <button
                            className="btn-hp btn-hp-damage flex-1"
                            onClick={() => updateCharacterHP(character.id, -1)}
                          >
                            -1
                          </button>
                          <button
                            className="btn-hp btn-hp-heal flex-1"
                            onClick={() => updateCharacterHP(character.id, 1)}
                          >
                            +1
                          </button>
                          <button
                            className="btn-hp btn-hp-heal flex-1"
                            onClick={() => updateCharacterHP(character.id, 5)}
                          >
                            +5
                          </button>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="character-stats">
                        <div className="stat-box">
                          <div className="stat-value">{character.armor_class}</div>
                          <div className="stat-label">CA</div>
                        </div>
                        <div className="stat-box">
                          <div className="stat-value">{formatModifier(character.initiative_bonus)}</div>
                          <div className="stat-label">Init</div>
                        </div>
                        <div className="stat-box">
                          <div className="stat-value">{character.passive_perception || '—'}</div>
                          <div className="stat-label">PP</div>
                        </div>
                        <div className="stat-box">
                          <div className="stat-value">{character.speed || 30}</div>
                          <div className="stat-label">Vel</div>
                        </div>
                      </div>

                      {/* View as Player Button */}
                      <button
                        onClick={() => setViewingCharacterSheet(character)}
                        className="w-full mt-3 py-2 px-3 text-sm text-[var(--teal)] hover:bg-[var(--teal)]/10 rounded-lg border border-[var(--teal)]/30 transition-colors flex items-center justify-center gap-2"
                      >
                        <GameIcon name="scroll" category="ui" size={14} />
                        Vedi Scheda Giocatore
                      </button>

                      {/* Open Full Sheet in New Tab (uses player dashboard with DM preview mode) */}
                      <button
                        onClick={() => window.open(`/player/dashboard?preview=${character.id}&campaignId=${campaignId}`, '_blank')}
                        className="w-full mt-2 py-2 px-3 text-sm text-[var(--ink-light)] hover:text-[var(--teal)] hover:bg-[var(--cream-dark)] rounded-lg border border-[var(--ink-faded)]/20 transition-colors flex items-center justify-center gap-2"
                      >
                        <ExternalLink size={14} />
                        Apri Scheda Completa
                      </button>

                      {/* Level Up Button */}
                      {character.level < 20 && (
                        <div className="mt-4 pt-4 border-t border-[var(--border-decorative)]">
                          <button
                            onClick={() => openLevelUpDialog(character)}
                            className="w-full py-2 px-4 bg-[var(--teal)]/10 hover:bg-[var(--teal)]/20 text-[var(--teal)] rounded-lg border border-[var(--teal)]/30 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                          >
                            <span className="text-lg">⬆</span>
                            Level Up → Lv.{character.level + 1}
                            {hasASIAtLevel(character.class, character.level + 1) && (
                              <span className="text-xs bg-[var(--teal)] text-white px-2 py-0.5 rounded">+ASI</span>
                            )}
                          </button>
                        </div>
                      )}

                      {/* Conditions */}
                      {character.conditions.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {character.conditions.map((condition: string) => {
                            const condInfo = CONDITIONS[condition as keyof typeof CONDITIONS] as { name: string; nameIt: string; icon: string; iconSvg: string; description: string } | undefined
                            return (
                              <span key={condition} className="condition-badge">
                                {condInfo?.iconSvg ? (
                                  <GameIcon
                                    name={condInfo.iconSvg}
                                    category="conditions"
                                    size={16}
                                    className="text-current"
                                  />
                                ) : (
                                  condInfo?.icon
                                )}
                                <span className="ml-1">{condInfo?.nameIt || condInfo?.name || condition}</span>
                              </span>
                            )
                          })}
                        </div>
                      )}

                      {/* Death Saves (when at 0 HP) */}
                      {character.current_hp === 0 && (
                        <div className="mt-4 pt-4 border-t border-[var(--border-decorative)]">
                          <p className="text-sm font-semibold mb-3 text-center text-[var(--coral)] flex items-center justify-center gap-2">
                            <GameIcon name="skull" category="ui" size={18} className="text-current" /> Tiri Salvezza vs Morte
                          </p>
                          <div className="flex justify-center gap-6">
                            <div className="flex gap-2">
                              <span className="text-xs text-[var(--teal)] mr-1">✓</span>
                              {[0, 1, 2].map((i) => (
                                <div
                                  key={`success-${i}`}
                                  className={`death-save ${i < character.death_save_successes ? 'success' : ''}`}
                                />
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <span className="text-xs text-[var(--coral)] mr-1">✗</span>
                              {[0, 1, 2].map((i) => (
                                <div
                                  key={`failure-${i}`}
                                  className={`death-save ${i < character.death_save_failures ? 'failure' : ''}`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </Card>
                  )
                })}
              </div>
            )}

            {/* Player Access Codes Section */}
            <div className="mt-8">
              <PlayerCodeManager
                characters={characters.map(c => ({
                  id: c.id,
                  name: c.name,
                  player_name: c.player_name
                }))}
                campaignId={campaignId}
              />
            </div>
          </TabsContent>

          {/* ACTS TAB */}
          <TabsContent value="acts">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h2 className="text-xl md:text-2xl font-semibold text-[var(--ink)]">Atti della Campagna</h2>
                <Dialog open={isActDialogOpen} onOpenChange={(open) => {
                  if (!open) resetActForm()
                  setIsActDialogOpen(open)
                }}>
                  <DialogTrigger asChild>
                    <Button className="btn-primary min-h-[44px]" disabled={acts.length >= 5}>
                      + Nuovo Atto
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="parchment-card max-w-lg">
                    <DialogHeader>
                      <DialogTitle>{editingAct ? 'Modifica Atto' : 'Nuovo Atto'}</DialogTitle>
                      <DialogDescription>
                        Definisci i dettagli di questo atto della campagna
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Numero Atto *</Label>
                          <Select
                            value={newAct.act_number.toString()}
                            onValueChange={(v) => setNewAct({ ...newAct, act_number: parseInt(v) })}
                          >
                            <SelectTrigger className="min-h-[44px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4, 5].map(n => (
                                <SelectItem
                                  key={n}
                                  value={n.toString()}
                                  disabled={!editingAct && acts.some(a => a.act_number === n)}
                                >
                                  Atto {n}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="act-title">Titolo *</Label>
                          <Input
                            id="act-title"
                            placeholder="es. L'Ombra si Risveglia"
                            value={newAct.title}
                            onChange={(e) => setNewAct({ ...newAct, title: e.target.value })}
                            className="min-h-[44px]"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="act-description">Descrizione</Label>
                        <Textarea
                          id="act-description"
                          placeholder="Descrizione di questo atto..."
                          value={newAct.description}
                          onChange={(e) => setNewAct({ ...newAct, description: e.target.value })}
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="act-theme">Tema</Label>
                        <Input
                          id="act-theme"
                          placeholder="es. Mistero, Esplorazione, Tradimento..."
                          value={newAct.theme}
                          onChange={(e) => setNewAct({ ...newAct, theme: e.target.value })}
                          className="min-h-[44px]"
                        />
                      </div>

                      {/* Objectives */}
                      <div className="space-y-2">
                        <Label>Obiettivi</Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Aggiungi obiettivo..."
                            value={newObjective}
                            onChange={(e) => setNewObjective(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && newObjective.trim()) {
                                e.preventDefault()
                                setNewAct({ ...newAct, objectives: [...newAct.objectives, newObjective.trim()] })
                                setNewObjective('')
                              }
                            }}
                            className="min-h-[44px]"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className="min-h-[44px]"
                            onClick={() => {
                              if (newObjective.trim()) {
                                setNewAct({ ...newAct, objectives: [...newAct.objectives, newObjective.trim()] })
                                setNewObjective('')
                              }
                            }}
                          >
                            +
                          </Button>
                        </div>
                        {newAct.objectives.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {newAct.objectives.map((obj, idx) => (
                              <li key={idx} className="flex items-center justify-between text-sm bg-[var(--cream-dark)]/50 px-3 py-2 rounded">
                                <span>{obj}</span>
                                <button
                                  type="button"
                                  className="text-[var(--coral)] hover:text-[var(--coral-dark)] ml-2"
                                  onClick={() => setNewAct({
                                    ...newAct,
                                    objectives: newAct.objectives.filter((_, i) => i !== idx)
                                  })}
                                >
                                  x
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="act-complete"
                          checked={newAct.is_complete}
                          onChange={(e) => setNewAct({ ...newAct, is_complete: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <Label htmlFor="act-complete">Atto completato</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={resetActForm} className="min-h-[44px]">Annulla</Button>
                      <Button onClick={createOrUpdateAct} disabled={!newAct.title.trim()} className="btn-primary min-h-[44px]">
                        {editingAct ? 'Salva' : 'Crea'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Acts Grid */}
              {actStats.length === 0 ? (
                <Card className="parchment-card">
                  <CardContent className="py-12 text-center text-[var(--ink-light)]">
                    <GameIcon name="book" category="ui" size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">Nessun atto definito</p>
                    <p className="text-sm">Crea il primo atto per organizzare la tua campagna</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {actStats.map((act) => {
                    const isCurrent = campaign?.current_act === act.act_number
                    return (
                      <Card
                        key={act.id}
                        className={`parchment-card hover:shadow-lg transition-all ${
                          isCurrent ? 'ring-2 ring-[var(--coral)]' : ''
                        } ${act.is_complete ? 'opacity-75' : ''}`}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge className={`${isCurrent ? 'bg-[var(--coral)] text-white' : 'bg-[var(--teal)]/10 text-[var(--teal)]'}`}>
                                Atto {act.act_number}
                              </Badge>
                              {act.is_complete && (
                                <Badge className="bg-green-100 text-green-700">Completato</Badge>
                              )}
                              {isCurrent && !act.is_complete && (
                                <Badge className="bg-[var(--coral)]/10 text-[var(--coral)]">Corrente</Badge>
                              )}
                            </div>
                          </div>
                          <CardTitle className="text-lg text-[var(--ink)] mt-2">{act.title}</CardTitle>
                          {act.theme && (
                            <CardDescription className="text-[var(--teal)] italic">
                              Tema: {act.theme}
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {act.description && (
                            <p className="text-sm text-[var(--ink-light)] line-clamp-2">{act.description}</p>
                          )}

                          {/* Stats - Expandable Notes */}
                          <div className="space-y-2">
                            <div className="flex gap-4 text-sm text-[var(--ink-light)]">
                              <button
                                onClick={() => act.noteCount > 0 && toggleActNotesExpansion(act.id)}
                                className={`flex items-center gap-1 hover:text-[var(--teal)] transition-colors ${act.noteCount > 0 ? 'cursor-pointer' : 'cursor-default'}`}
                                disabled={act.noteCount === 0}
                              >
                                <span className={expandedActNotes.has(act.id) ? 'rotate-90' : ''} style={{ transition: 'transform 0.2s' }}>
                                  {act.noteCount > 0 ? '▸' : ''}
                                </span>
                                <GameIcon name="quill" category="ui" size={14} className="text-current" />
                                {act.noteCount} note
                              </button>
                              <span className="flex items-center gap-1">
                                <GameIcon name="dragon" category="ui" size={14} className="text-current" />
                                {act.encounterCount} incontri
                              </span>
                            </div>

                            {/* Expanded Notes List */}
                            {expandedActNotes.has(act.id) && act.noteCount > 0 && (
                              <div className="pl-4 border-l-2 border-[var(--teal)]/30 space-y-1 animate-in slide-in-from-top-2 duration-200">
                                {getNotesForAct(act.act_number).map(note => {
                                  const noteType = NOTE_TYPES.find(t => t.value === note.note_type)
                                  return (
                                    <button
                                      key={note.id}
                                      onClick={() => {
                                        openEditNote(note)
                                        setActiveTab('notes')
                                      }}
                                      className="w-full text-left p-2 rounded hover:bg-[var(--teal)]/5 transition-colors group"
                                    >
                                      <div className="flex items-center gap-2">
                                        <GameIcon
                                          name={noteType?.icon || 'scroll'}
                                          category="ui"
                                          size={14}
                                          className="text-[var(--ink-light)] group-hover:text-[var(--teal)]"
                                        />
                                        <span className="text-sm text-[var(--ink)] group-hover:text-[var(--teal)] truncate flex-1">
                                          {note.title}
                                        </span>
                                        <Badge variant="outline" className="text-xs shrink-0">
                                          {noteType?.label || note.note_type}
                                        </Badge>
                                      </div>
                                    </button>
                                  )
                                })}
                              </div>
                            )}
                          </div>

                          {/* Objectives */}
                          {act.objectives && act.objectives.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-[var(--teal)]">Obiettivi:</p>
                              <ul className="text-xs text-[var(--ink-light)] space-y-0.5">
                                {act.objectives.slice(0, 3).map((obj, idx) => (
                                  <li key={idx} className="flex items-start gap-1">
                                    <span className="text-[var(--coral)]">-</span> {obj}
                                  </li>
                                ))}
                                {act.objectives.length > 3 && (
                                  <li className="text-[var(--ink-faded)]">+{act.objectives.length - 3} altri...</li>
                                )}
                              </ul>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--border)]">
                            {!isCurrent && !act.is_complete && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 min-h-[36px]"
                                onClick={() => setCurrentAct(act.act_number)}
                              >
                                Imposta Corrente
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant={act.is_complete ? "outline" : "default"}
                              className={`flex-1 min-h-[36px] ${!act.is_complete ? 'btn-primary' : ''}`}
                              onClick={() => toggleActComplete(act)}
                            >
                              {act.is_complete ? 'Riapri' : 'Completa'}
                            </Button>
                            <Link href={`/campaigns/${campaignId}/acts/${act.id}`}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="min-h-[36px] bg-[var(--teal)]/10 text-[var(--teal)] hover:bg-[var(--teal)]/20 border-[var(--teal)]/30"
                              >
                                Visualizza
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              variant="outline"
                              className="min-h-[36px]"
                              onClick={() => openEditAct(act)}
                            >
                              Modifica
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 min-h-[36px]"
                              onClick={() => deleteAct(act.id)}
                            >
                              Elimina
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* COMBAT TAB */}
          <TabsContent value="combat">
            {!combatActive ? (
              /* Setup Combat View */
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-[var(--ink)] flex items-center gap-2">
                    <GameIcon name="combat" category="ui" size={28} className="text-[var(--coral)]" />
                    Initiative Tracker
                  </h2>
                  <Button
                    onClick={() => setSetupCombatOpen(true)}
                    className="bg-[var(--coral)] hover:bg-[var(--coral)]/90"
                  >
                    <GameIcon name="combat" category="ui" size={18} className="mr-2" />
                    Nuovo Combattimento
                  </Button>
                </div>

                <Card className="parchment-card text-center py-12 px-6">
                  <CardContent>
                    <div className="mb-4">
                      <GameIcon name="combat" category="ui" size={64} className="text-[var(--ink-light)]/30" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-[var(--ink)]">Nessun combattimento attivo</h3>
                    <p className="text-[var(--ink-light)] mb-6">
                      Clicca su "Nuovo Combattimento" per iniziare a tracciare l'iniziativa
                    </p>
                  </CardContent>
                </Card>

                {/* Setup Combat Dialog */}
                <Dialog open={setupCombatOpen} onOpenChange={setSetupCombatOpen}>
                  <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <GameIcon name="combat" category="ui" size={24} className="text-[var(--coral)]" />
                        Prepara Combattimento
                      </DialogTitle>
                      <DialogDescription>
                        Seleziona i personaggi e i mostri che parteciperanno al combattimento
                      </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                      {/* Characters Selection */}
                      <div>
                        <h4 className="font-semibold mb-3 text-[var(--ink)] flex items-center gap-2">
                          <GameIcon name="users" category="ui" size={18} />
                          Personaggi ({selectedCharactersForCombat.length}/{characters.length})
                        </h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {characters.length === 0 ? (
                            <p className="text-[var(--ink-light)] text-sm">Nessun personaggio nella campagna</p>
                          ) : (
                            characters.map(char => (
                              <div
                                key={char.id}
                                onClick={() => toggleCharacterForCombat(char.id)}
                                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                                  selectedCharactersForCombat.includes(char.id)
                                    ? 'bg-[var(--teal)]/10 border-[var(--teal)]'
                                    : 'bg-[var(--parchment-light)] border-[var(--border)] hover:border-[var(--teal)]'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <span className="font-medium text-[var(--ink)]">{char.name}</span>
                                    {char.player_name && (
                                      <span className="text-sm text-[var(--ink-light)]"> ({char.player_name})</span>
                                    )}
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    Init {formatModifier(char.initiative_bonus)}
                                  </Badge>
                                </div>
                                <div className="text-xs text-[var(--ink-light)] mt-1">
                                  {char.class} Lv.{char.level} • HP {char.current_hp}/{char.max_hp}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Monsters Selection */}
                      <div>
                        <h4 className="font-semibold mb-3 text-[var(--ink)] flex items-center gap-2">
                          <GameIcon name="dragon" category="ui" size={18} />
                          Mostri ({selectedMonstersForCombat.reduce((a, m) => a + m.count, 0)})
                        </h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {monsters.length === 0 ? (
                            <p className="text-[var(--ink-light)] text-sm">Nessun mostro nel bestiario</p>
                          ) : (
                            monsters.map(monster => {
                              const selected = selectedMonstersForCombat.find(m => m.id === monster.id)
                              return (
                                <div
                                  key={monster.id}
                                  className={`p-3 rounded-lg border transition-colors ${
                                    selected
                                      ? 'bg-[var(--coral)]/10 border-[var(--coral)]'
                                      : 'bg-[var(--parchment-light)] border-[var(--border)]'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <span className="font-medium text-[var(--ink)]">{monster.name}</span>
                                      <Badge variant="outline" className="ml-2 text-xs">
                                        CR {monster.cr}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => removeMonsterFromCombat(monster.id)}
                                        disabled={!selected}
                                        className="h-7 w-7 p-0"
                                      >
                                        -
                                      </Button>
                                      <span className="w-8 text-center font-medium">
                                        {selected?.count || 0}
                                      </span>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => addMonsterToCombat(monster.id)}
                                        className="h-7 w-7 p-0"
                                      >
                                        +
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="text-xs text-[var(--ink-light)] mt-1">
                                    HP {monster.max_hp} • AC {monster.armor_class} • DEX {formatModifier(abilityModifier(monster.dex))}
                                  </div>
                                </div>
                              )
                            })
                          )}
                        </div>
                      </div>
                    </div>

                    <DialogFooter className="mt-6">
                      <Button variant="outline" onClick={() => setSetupCombatOpen(false)}>
                        Annulla
                      </Button>
                      <Button
                        onClick={startCombat}
                        disabled={selectedCharactersForCombat.length === 0 && selectedMonstersForCombat.length === 0}
                        className="bg-[var(--coral)] hover:bg-[var(--coral)]/90"
                      >
                        <GameIcon name="combat" category="ui" size={18} className="mr-2" />
                        Inizia Combattimento
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              /* Active Combat View */
              <div className="space-y-4">
                {/* Combat Header */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-[var(--ink)] flex items-center gap-2">
                      <GameIcon name="combat" category="ui" size={28} className="text-[var(--coral)]" />
                      Combattimento
                    </h2>
                    <Badge className="bg-[var(--coral)] text-white text-lg px-4 py-1">
                      Round {roundNumber}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={previousTurn} disabled={combatants.length === 0}>
                      ◀ Precedente
                    </Button>
                    <Button onClick={nextTurn} disabled={combatants.length === 0} className="bg-[var(--teal)] hover:bg-[var(--teal)]/90">
                      Prossimo ▶
                    </Button>
                    <Button variant="destructive" onClick={endCombat}>
                      Termina
                    </Button>
                  </div>
                </div>

                {/* Initiative List */}
                <div className="space-y-2">
                  {combatants.map((combatant, index) => {
                    const isCurrentTurn = index === currentTurn
                    const hpPercent = combatant.max_hp ? (combatant.current_hp || 0) / combatant.max_hp * 100 : 100
                    const isDead = (combatant.current_hp || 0) <= 0

                    return (
                      <Card
                        key={combatant.id}
                        className={`parchment-card transition-all ${
                          isCurrentTurn
                            ? 'ring-2 ring-[var(--coral)] shadow-lg scale-[1.02]'
                            : isDead
                            ? 'opacity-50'
                            : ''
                        }`}
                      >
                        <CardContent className="py-3 px-4">
                          <div className="flex items-center gap-4">
                            {/* Initiative Badge */}
                            <div
                              className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                                isCurrentTurn
                                  ? 'bg-[var(--coral)] text-white'
                                  : combatant.type === 'character'
                                  ? 'bg-[var(--teal)]/20 text-[var(--teal)]'
                                  : 'bg-[var(--coral)]/20 text-[var(--coral)]'
                              }`}
                            >
                              {combatant.initiative}
                            </div>

                            {/* Combatant Info */}
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className={`font-semibold ${isDead ? 'line-through' : ''}`}>
                                  {combatant.name}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {combatant.type === 'character' ? 'PG' : 'Mostro'}
                                </Badge>
                                {isCurrentTurn && (
                                  <Badge className="bg-[var(--coral)] text-white text-xs animate-pulse">
                                    TURNO
                                  </Badge>
                                )}
                              </div>

                              {/* HP Bar */}
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex-1 max-w-48">
                                  <Progress
                                    value={hpPercent}
                                    className="h-2"
                                    style={{
                                      background: 'var(--parchment-light)',
                                    }}
                                  />
                                </div>
                                <span className="text-sm font-medium text-[var(--ink)]">
                                  {combatant.current_hp}/{combatant.max_hp} HP
                                </span>
                              </div>

                              {/* Conditions */}
                              {combatant.conditions && combatant.conditions.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {combatant.conditions.map(cond => (
                                    <Badge
                                      key={cond}
                                      variant="secondary"
                                      className="text-xs cursor-pointer hover:bg-red-100"
                                      onClick={() => toggleCombatantCondition(combatant.id, cond)}
                                    >
                                      {CONDITIONS[cond as keyof typeof CONDITIONS]?.icon || '⚠️'} {cond}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1">
                              {/* HP Adjustment */}
                              <div className="flex items-center gap-1 mr-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateCombatantHP(combatant.id, (combatant.current_hp || 0) - 1)}
                                  className="h-7 w-7 p-0 text-red-600"
                                >
                                  -
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateCombatantHP(combatant.id, (combatant.current_hp || 0) + 1)}
                                  className="h-7 w-7 p-0 text-green-600"
                                >
                                  +
                                </Button>
                              </div>

                              {/* Reroll Initiative */}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => rerollInitiative(combatant.id)}
                                title="Rilancia iniziativa"
                              >
                                🎲
                              </Button>

                              {/* Conditions Menu */}
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="ghost" title="Condizioni">
                                    ⚡
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>Condizioni - {combatant.name}</DialogTitle>
                                  </DialogHeader>
                                  <div className="grid grid-cols-2 gap-2 mt-4">
                                    {Object.entries(CONDITIONS).map(([key, cond]) => {
                                      const hasCondition = combatant.conditions?.includes(key)
                                      return (
                                        <Button
                                          key={key}
                                          variant={hasCondition ? 'default' : 'outline'}
                                          size="sm"
                                          onClick={() => toggleCombatantCondition(combatant.id, key)}
                                          className={hasCondition ? 'bg-[var(--coral)]' : ''}
                                        >
                                          {cond.icon} {cond.name}
                                        </Button>
                                      )
                                    })}
                                  </div>
                                </DialogContent>
                              </Dialog>

                              {/* Remove */}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeCombatant(combatant.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Rimuovi dal combattimento"
                              >
                                ✕
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

                {combatants.length === 0 && (
                  <Card className="parchment-card text-center py-8">
                    <CardContent>
                      <p className="text-[var(--ink-light)]">Nessun combattente rimasto</p>
                      <Button onClick={endCombat} variant="outline" className="mt-4">
                        Termina Combattimento
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          {/* NOTES TAB */}
          <TabsContent value="notes">
            {/* Header with filters and add button */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl md:text-2xl font-semibold text-[var(--ink)]">Note Narrative</h2>

                {/* Act filter */}
                <Select
                  value={noteFilter.act?.toString() || 'all'}
                  onValueChange={(v) => setNoteFilter({ ...noteFilter, act: v === 'all' ? null : parseInt(v) })}
                >
                  <SelectTrigger className="w-[120px] h-10">
                    <SelectValue placeholder="Atto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti gli Atti</SelectItem>
                    {availableActs.map(act => {
                      const title = getActTitle(act)
                      return (
                        <SelectItem key={act} value={act?.toString() || '1'}>
                          Atto {act}{title ? `: ${title}` : ''}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>

                {/* Type filter */}
                <Select
                  value={noteFilter.type || 'all'}
                  onValueChange={(v) => setNoteFilter({ ...noteFilter, type: v === 'all' ? null : v })}
                >
                  <SelectTrigger className="w-[140px] h-10">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti i Tipi</SelectItem>
                    {NOTE_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Dialog open={isNoteDialogOpen} onOpenChange={(open) => {
                setIsNoteDialogOpen(open)
                if (!open) resetNoteForm()
              }}>
                <DialogTrigger asChild>
                  <Button className="btn-primary min-h-[44px]">
                    + Nuova Nota
                  </Button>
                </DialogTrigger>
                <DialogContent className="parchment-card max-w-lg max-h-[85vh] flex flex-col">
                  <DialogHeader>
                    <DialogTitle>{editingNote ? 'Modifica Nota' : 'Nuova Nota'}</DialogTitle>
                    <DialogDescription>
                      {editingNote ? 'Modifica i dettagli della nota' : 'Aggiungi una nota alla tua campagna'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex-1 overflow-y-auto">
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="note-title">Titolo *</Label>
                        <Input
                          id="note-title"
                          placeholder="es. Il misterioso straniero"
                          value={newNote.title}
                          onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Atto</Label>
                        <Select
                          value={newNote.act.toString()}
                          onValueChange={(v) => setNewNote({ ...newNote, act: parseInt(v) })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5].map(act => {
                              const title = getActTitle(act)
                              return (
                                <SelectItem key={act} value={act.toString()}>
                                  Atto {act}{title ? `: ${title}` : ''}
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Tipo di Nota</Label>
                      <div className="flex flex-wrap gap-2">
                        {NOTE_TYPES.map(type => (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => setNewNote({ ...newNote, note_type: type.value })}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                              newNote.note_type === type.value
                                ? 'border-[var(--teal)] bg-[var(--teal)]/10 text-[var(--teal-dark)]'
                                : 'border-[var(--border-decorative)] hover:border-[var(--teal)]/50'
                            }`}
                          >
                            <GameIcon name={type.icon} category="ui" size={18} className="text-current" />
                            <span className="text-sm">{type.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Appunti DM (privati) */}
                    <div className="space-y-2">
                      <Label htmlFor="note-dm-notes" className="flex items-center gap-2">
                        <GameIcon name="skull" category="ui" size={14} className="text-[var(--coral)]" />
                        Appunti DM (privati)
                      </Label>
                      <Textarea
                        id="note-dm-notes"
                        placeholder="Note solo per il DM (non visibili ai giocatori)..."
                        rows={4}
                        value={newNote.dm_notes}
                        onChange={(e) => setNewNote({ ...newNote, dm_notes: e.target.value })}
                        className="border-[var(--coral)]/30"
                      />
                    </div>

                    {/* Contenuto giocatori */}
                    <div className="space-y-2">
                      <Label htmlFor="note-content" className="flex items-center gap-2">
                        <GameIcon name="book" category="ui" size={14} className="text-[var(--teal)]" />
                        Contenuto Giocatori
                      </Label>
                      <Textarea
                        id="note-content"
                        placeholder="Contenuto visibile ai giocatori (se rivelato)..."
                        rows={5}
                        value={newNote.content}
                        onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                        className="border-[var(--teal)]/30"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="note-revealed"
                        checked={newNote.is_revealed}
                        onChange={(e) => setNewNote({ ...newNote, is_revealed: e.target.checked })}
                        className="w-5 h-5 rounded border-2 border-[var(--border-decorative)]"
                      />
                      <Label htmlFor="note-revealed" className="cursor-pointer">
                        Rivelato ai giocatori
                      </Label>
                    </div>
                  </div>
                  </div>
                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={resetNoteForm} className="btn-secondary min-h-[44px]">
                      Annulla
                    </Button>
                    <Button
                      onClick={createOrUpdateNote}
                      disabled={!newNote.title.trim()}
                      className="btn-primary min-h-[44px]"
                    >
                      {editingNote ? 'Salva Modifiche' : 'Crea Nota'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Notes list */}
            {filteredNotes.length === 0 ? (
              <Card className="parchment-card text-center py-12 px-6">
                <CardContent>
                  <div className="mb-4"><GameIcon name="book" category="ui" size={64} className="text-[var(--teal)]" /></div>
                  <h3 className="text-xl font-semibold mb-2 text-[var(--ink)]">
                    {notes.length === 0 ? 'Nessuna nota' : 'Nessuna nota con questi filtri'}
                  </h3>
                  <p className="text-[var(--ink-light)] mb-6">
                    {notes.length === 0
                      ? 'Inizia a documentare la tua campagna'
                      : 'Prova a cambiare i filtri'}
                  </p>
                  {notes.length === 0 && (
                    <Button onClick={() => setIsNoteDialogOpen(true)} className="btn-primary min-h-[44px]">
                      + Crea Prima Nota
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3 card-stagger">
                {filteredNotes.map((note) => {
                  const noteType = NOTE_TYPES.find(t => t.value === note.note_type)
                  return (
                    <Card key={note.id} className="parchment-card hover:shadow-lg transition-all">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-lg ${note.note_type === 'secret' ? 'bg-[var(--coral)]/10' : 'bg-[var(--teal)]/10'}`}>
                              <GameIcon
                                name={noteType?.icon || 'book'}
                                category="ui"
                                size={20}
                                className={note.note_type === 'secret' ? 'text-[var(--coral)]' : 'text-[var(--teal)]'}
                              />
                            </div>
                            <div>
                              <CardTitle className="text-lg text-[var(--ink)]">{note.title}</CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs" title={getActTitle(note.act) || undefined}>Atto {note.act}{getActTitle(note.act) ? `: ${getActTitle(note.act)}` : ''}</Badge>
                                <Badge variant="outline" className="text-xs">{noteType?.label}</Badge>
                                {note.is_revealed && (
                                  <Badge className="text-xs bg-[var(--teal)] text-white">Rivelato</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-[var(--ink-light)] line-clamp-3 whitespace-pre-wrap">
                          {note.content || 'Nessun contenuto'}
                        </p>
                        <div className="flex gap-2 mt-4 pt-4 border-t border-[var(--border-decorative)]">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditNote(note)}
                            className="flex-1 min-h-[40px]"
                          >
                            Modifica
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm('Eliminare questa nota?')) deleteNote(note.id)
                            }}
                            className="min-h-[40px] text-[var(--coral)] hover:bg-[var(--coral)]/10"
                          >
                            Elimina
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* SESSIONS TAB */}
          <TabsContent value="sessions">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl md:text-2xl font-semibold text-[var(--ink)]">Sessioni di Gioco</h2>
                <Badge variant="outline" className="text-sm">
                  {sessions.length} {sessions.length === 1 ? 'Sessione' : 'Sessioni'}
                </Badge>
                <Badge variant="secondary" className="text-sm bg-amber-100 text-amber-800">
                  {totalCampaignXP.toLocaleString()} XP Totali
                </Badge>
              </div>

              <Dialog open={isSessionDialogOpen} onOpenChange={(open) => {
                if (!open) resetSessionForm()
                else {
                  setNewSession(prev => ({ ...prev, session_number: nextSessionNumber }))
                  setIsSessionDialogOpen(true)
                }
              }}>
                <DialogTrigger asChild>
                  <Button className="btn-primary min-h-[44px]">
                    + Nuova Sessione
                  </Button>
                </DialogTrigger>
                <DialogContent className="parchment-card max-w-lg">
                  <DialogHeader>
                    <DialogTitle>{editingSession ? 'Modifica Sessione' : 'Nuova Sessione'}</DialogTitle>
                    <DialogDescription>
                      {editingSession ? 'Modifica i dettagli della sessione' : 'Registra una nuova sessione di gioco'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="session-number">Numero Sessione</Label>
                        <Input
                          id="session-number"
                          type="number"
                          min={1}
                          value={newSession.session_number}
                          onChange={(e) => setNewSession({ ...newSession, session_number: parseInt(e.target.value) || 1 })}
                          className="min-h-[44px]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="session-date">Data</Label>
                        <Input
                          id="session-date"
                          type="date"
                          value={newSession.play_date}
                          onChange={(e) => setNewSession({ ...newSession, play_date: e.target.value })}
                          className="min-h-[44px]"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="session-xp">XP Assegnati</Label>
                      <Input
                        id="session-xp"
                        type="number"
                        min={0}
                        step={50}
                        value={newSession.xp_awarded}
                        onChange={(e) => setNewSession({ ...newSession, xp_awarded: parseInt(e.target.value) || 0 })}
                        className="min-h-[44px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="session-act">Atto</Label>
                      <Select
                        value={newSession.act_id || 'none'}
                        onValueChange={(value) => setNewSession({ ...newSession, act_id: value === 'none' ? null : value })}
                      >
                        <SelectTrigger className="min-h-[44px]">
                          <SelectValue placeholder="Seleziona atto..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nessun atto</SelectItem>
                          {acts.sort((a, b) => a.act_number - b.act_number).map((act) => (
                            <SelectItem key={act.id} value={act.id}>
                              Atto {act.act_number}: {act.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="session-summary">Riassunto</Label>
                      <Textarea
                        id="session-summary"
                        placeholder="Cosa è successo in questa sessione..."
                        value={newSession.summary}
                        onChange={(e) => setNewSession({ ...newSession, summary: e.target.value })}
                        rows={6}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={resetSessionForm} className="min-h-[44px]">
                      Annulla
                    </Button>
                    <Button onClick={createOrUpdateSession} className="btn-primary min-h-[44px]">
                      {editingSession ? 'Salva Modifiche' : 'Crea Sessione'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {sessions.length === 0 ? (
              <Card className="parchment-card">
                <CardContent className="py-12 text-center text-[var(--ink-light)]">
                  <GameIcon name="scroll" category="ui" size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Nessuna sessione registrata</p>
                  <p className="text-sm">Clicca "Nuova Sessione" per registrare la prima sessione di gioco</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {sessions.map((session) => (
                  <Card key={session.id} className="parchment-card hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <GameIcon name="scroll" category="ui" size={20} className="text-[var(--ink-light)]" />
                          <CardTitle className="text-lg">Sessione #{session.session_number}</CardTitle>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {session.play_date && (
                          <Badge variant="outline" className="text-xs">
                            {new Date(session.play_date).toLocaleDateString('it-IT', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </Badge>
                        )}
                        {session.act_id && (() => {
                          const act = acts.find(a => a.id === session.act_id)
                          return act ? (
                            <Badge variant="secondary" className="text-xs bg-[var(--teal)]/10 text-[var(--teal)]">
                              Atto {act.act_number}
                            </Badge>
                          ) : null
                        })()}
                        {session.xp_awarded > 0 && (
                          <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800">
                            {session.xp_awarded} XP
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {session.summary ? (
                        <div>
                          <p className={`text-sm text-[var(--ink-light)] whitespace-pre-wrap ${expandedSessions.has(session.id) ? '' : 'line-clamp-3'}`}>
                            {session.summary}
                          </p>
                          {session.summary.length > 150 && (
                            <button
                              onClick={() => {
                                const newSet = new Set(expandedSessions)
                                if (newSet.has(session.id)) {
                                  newSet.delete(session.id)
                                } else {
                                  newSet.add(session.id)
                                }
                                setExpandedSessions(newSet)
                              }}
                              className="text-xs text-[var(--teal)] hover:text-[var(--teal-dark)] mt-1 font-medium"
                            >
                              {expandedSessions.has(session.id) ? '▲ Mostra meno' : '▼ Leggi tutto'}
                            </button>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-[var(--ink-faded)] italic">
                          Nessun riassunto
                        </p>
                      )}
                      <div className="flex gap-2 mt-4 pt-3 border-t border-[var(--border)]">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 min-h-[36px]"
                          onClick={() => openEditSession(session)}
                        >
                          Modifica
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 min-h-[36px]"
                          onClick={() => {
                            if (confirm('Eliminare questa sessione?')) {
                              deleteSession(session.id)
                            }
                          }}
                        >
                          Elimina
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ENCOUNTERS TAB */}
          <TabsContent value="encounters">
            {/* Header with filters and add button */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl md:text-2xl font-semibold text-[var(--ink)]">Incontri</h2>

                {/* Act filter */}
                <Select
                  value={encounterFilter.act?.toString() || 'all'}
                  onValueChange={(v) => setEncounterFilter({ ...encounterFilter, act: v === 'all' ? null : parseInt(v) })}
                >
                  <SelectTrigger className="w-[120px] h-10">
                    <SelectValue placeholder="Atto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti gli Atti</SelectItem>
                    {availableActs.map(act => {
                      const title = getActTitle(act)
                      return (
                        <SelectItem key={act} value={act?.toString() || '1'}>
                          Atto {act}{title ? `: ${title}` : ''}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>

                {/* Status filter */}
                <Select
                  value={encounterFilter.status || 'all'}
                  onValueChange={(v) => setEncounterFilter({ ...encounterFilter, status: v === 'all' ? null : v })}
                >
                  <SelectTrigger className="w-[140px] h-10">
                    <SelectValue placeholder="Stato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti gli Stati</SelectItem>
                    {STATUSES.map(status => (
                      <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Dialog open={isEncounterDialogOpen} onOpenChange={(open) => {
                setIsEncounterDialogOpen(open)
                if (!open) resetEncounterForm()
              }}>
                <DialogTrigger asChild>
                  <Button className="btn-primary min-h-[44px]">
                    + Nuovo Incontro
                  </Button>
                </DialogTrigger>
                <DialogContent className="parchment-card max-w-lg">
                  <DialogHeader>
                    <DialogTitle>{editingEncounter ? 'Modifica Incontro' : 'Nuovo Incontro'}</DialogTitle>
                    <DialogDescription>
                      {editingEncounter ? 'Modifica i dettagli dell\'incontro' : 'Pianifica un nuovo incontro per la campagna'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="encounter-name">Nome *</Label>
                        <Input
                          id="encounter-name"
                          placeholder="es. Agguato dei Goblin"
                          value={newEncounter.name}
                          onChange={(e) => setNewEncounter({ ...newEncounter, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="encounter-location">Luogo</Label>
                        <Input
                          id="encounter-location"
                          placeholder="es. Strada per Phandalin"
                          value={newEncounter.location}
                          onChange={(e) => setNewEncounter({ ...newEncounter, location: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Atto</Label>
                        <Select
                          value={newEncounter.act.toString()}
                          onValueChange={(v) => setNewEncounter({ ...newEncounter, act: parseInt(v) })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5].map(act => {
                              const title = getActTitle(act)
                              return (
                                <SelectItem key={act} value={act.toString()}>
                                  Atto {act}{title ? `: ${title}` : ''}
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Difficoltà</Label>
                        <Select
                          value={newEncounter.difficulty}
                          onValueChange={(v) => setNewEncounter({ ...newEncounter, difficulty: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DIFFICULTIES.map(diff => (
                              <SelectItem key={diff.value} value={diff.value}>{diff.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Stato</Label>
                        <Select
                          value={newEncounter.status}
                          onValueChange={(v) => setNewEncounter({ ...newEncounter, status: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUSES.map(status => (
                              <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="encounter-description">Descrizione</Label>
                      <Textarea
                        id="encounter-description"
                        placeholder="Descrivi l'incontro..."
                        rows={3}
                        value={newEncounter.description}
                        onChange={(e) => setNewEncounter({ ...newEncounter, description: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="encounter-notes">Note DM</Label>
                      <Textarea
                        id="encounter-notes"
                        placeholder="Note private per il DM..."
                        rows={2}
                        value={newEncounter.notes}
                        onChange={(e) => setNewEncounter({ ...newEncounter, notes: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={resetEncounterForm} className="btn-secondary min-h-[44px]">
                      Annulla
                    </Button>
                    <Button
                      onClick={createOrUpdateEncounter}
                      disabled={!newEncounter.name.trim()}
                      className="btn-primary min-h-[44px]"
                    >
                      {editingEncounter ? 'Salva Modifiche' : 'Crea Incontro'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Encounters list */}
            {filteredEncounters.length === 0 ? (
              <Card className="parchment-card text-center py-12 px-6">
                <CardContent>
                  <div className="mb-4"><GameIcon name="dragon" category="ui" size={64} className="text-[var(--teal)]" /></div>
                  <h3 className="text-xl font-semibold mb-2 text-[var(--ink)]">
                    {encounters.length === 0 ? 'Nessun incontro' : 'Nessun incontro con questi filtri'}
                  </h3>
                  <p className="text-[var(--ink-light)] mb-6">
                    {encounters.length === 0
                      ? 'Pianifica gli incontri per la tua campagna'
                      : 'Prova a cambiare i filtri'}
                  </p>
                  {encounters.length === 0 && (
                    <Button onClick={() => setIsEncounterDialogOpen(true)} className="btn-primary min-h-[44px]">
                      + Crea Primo Incontro
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3 card-stagger">
                {filteredEncounters.map((encounter) => {
                  const difficulty = DIFFICULTIES.find(d => d.value === encounter.difficulty)
                  const status = STATUSES.find(s => s.value === encounter.status)
                  return (
                    <Card key={encounter.id} className="parchment-card hover:shadow-lg transition-all">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-[var(--coral)]/10">
                              <GameIcon name="combat" category="ui" size={20} className="text-[var(--coral)]" />
                            </div>
                            <div>
                              <CardTitle className="text-lg text-[var(--ink)]">{encounter.name}</CardTitle>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <Badge variant="outline" className="text-xs" title={getActTitle(encounter.act) || undefined}>Atto {encounter.act}{getActTitle(encounter.act) ? `: ${getActTitle(encounter.act)}` : ''}</Badge>
                                <Badge className={`text-xs ${status?.color}`}>{status?.label}</Badge>
                                <Badge variant="outline" className={`text-xs ${difficulty?.color}`}>{difficulty?.label}</Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {encounter.location && (
                          <p className="text-sm text-[var(--teal)] mb-2 flex items-center gap-1">
                            <GameIcon name="scroll" category="ui" size={14} className="text-current" />
                            {encounter.location}
                          </p>
                        )}
                        <p className="text-sm text-[var(--ink-light)] line-clamp-2 whitespace-pre-wrap">
                          {encounter.description || 'Nessuna descrizione'}
                        </p>

                        {/* Quick status change */}
                        <div className="flex gap-1 mt-4 pt-3 border-t border-[var(--border-decorative)]">
                          {STATUSES.map(s => (
                            <button
                              key={s.value}
                              onClick={() => updateEncounterStatus(encounter.id, s.value)}
                              className={`flex-1 py-1.5 px-2 rounded text-xs font-medium transition-all ${
                                encounter.status === s.value
                                  ? s.color
                                  : 'bg-[var(--cream)] text-[var(--ink-faded)] hover:bg-[var(--cream-dark)]'
                              }`}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>

                        <div className="flex gap-2 mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditEncounter(encounter)}
                            className="flex-1 min-h-[40px]"
                          >
                            Modifica
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm('Eliminare questo incontro?')) deleteEncounter(encounter.id)
                            }}
                            className="min-h-[40px] text-[var(--coral)] hover:bg-[var(--coral)]/10"
                          >
                            Elimina
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* BESTIARY TAB */}
          <TabsContent value="bestiary">
            <div className="space-y-6">
              {/* Search Open5e Section */}
              <Card className="parchment-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-[var(--ink)] flex items-center gap-2">
                    <GameIcon name="book" category="ui" size={20} className="text-[var(--teal)]" />
                    Cerca Mostri (Open5e SRD)
                  </CardTitle>
                  <CardDescription>
                    Cerca mostri dal manuale base e importali nel tuo bestiario
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    <Input
                      placeholder="Cerca mostro... (es. Goblin, Dragon, Wolf)"
                      value={monsterSearch}
                      onChange={(e) => setMonsterSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') searchOpen5eMonsters(monsterSearch)
                      }}
                      className="flex-1"
                    />
                    <Button
                      onClick={() => searchOpen5eMonsters(monsterSearch)}
                      disabled={searchingOpen5e || !monsterSearch.trim()}
                      className="btn-primary min-h-[44px]"
                    >
                      {searchingOpen5e ? 'Cerco...' : 'Cerca'}
                    </Button>
                  </div>

                  {/* Open5e Results */}
                  {open5eResults.length > 0 && (
                    <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3 max-h-[400px] overflow-y-auto p-1">
                      {open5eResults.map((monster) => (
                        <div
                          key={monster.slug}
                          className="p-3 rounded-lg border-2 border-[var(--border-decorative)] bg-[var(--cream-light)] hover:border-[var(--teal)] transition-all"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-semibold text-[var(--ink)]">{monster.name}</h4>
                              <p className="text-xs text-[var(--ink-faded)]">
                                {monster.size} {monster.type} • CR {monster.cr}
                              </p>
                              <div className="flex gap-3 mt-1 text-xs text-[var(--ink-light)]">
                                <span>HP {monster.hit_points}</span>
                                <span>CA {monster.armor_class}</span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => viewMonsterDetails(monster)}
                                className="text-xs h-8"
                              >
                                Dettagli
                              </Button>
                              <Button
                                size="sm"
                                onClick={async () => {
                                  const result = await importFromOpen5e(monster)
                                  if (result.data) {
                                    alert(`${monster.name} importato!`)
                                  }
                                }}
                                className="btn-primary text-xs h-8"
                              >
                                + Importa
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* My Monsters Section */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h2 className="text-xl md:text-2xl font-semibold text-[var(--ink)]">
                  Il Mio Bestiario ({monsters.length})
                </h2>
                <Dialog open={isMonsterDialogOpen} onOpenChange={(open) => {
                  setIsMonsterDialogOpen(open)
                  if (!open) resetMonsterForm()
                }}>
                  <DialogTrigger asChild>
                    <Button className="btn-primary min-h-[44px]">
                      + Crea Mostro/NPC
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="parchment-card max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Nuovo Mostro/NPC</DialogTitle>
                      <DialogDescription>
                        Crea un mostro o NPC personalizzato
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="monster-name">Nome *</Label>
                          <Input
                            id="monster-name"
                            placeholder="es. Bandito Capo"
                            value={newMonster.name}
                            onChange={(e) => setNewMonster({ ...newMonster, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="monster-cr">Grado Sfida</Label>
                          <Select
                            value={newMonster.cr}
                            onValueChange={(v) => setNewMonster({ ...newMonster, cr: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {['0', '1/8', '1/4', '1/2', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'].map(cr => (
                                <SelectItem key={cr} value={cr}>CR {cr}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="monster-hp">HP</Label>
                          <Input
                            id="monster-hp"
                            type="number"
                            min={1}
                            value={newMonster.max_hp}
                            onChange={(e) => setNewMonster({ ...newMonster, max_hp: parseInt(e.target.value) || 10 })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="monster-ac">CA</Label>
                          <Input
                            id="monster-ac"
                            type="number"
                            min={1}
                            value={newMonster.armor_class}
                            onChange={(e) => setNewMonster({ ...newMonster, armor_class: parseInt(e.target.value) || 10 })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="monster-speed">Velocità</Label>
                          <Input
                            id="monster-speed"
                            placeholder="30 ft."
                            value={newMonster.speed}
                            onChange={(e) => setNewMonster({ ...newMonster, speed: e.target.value })}
                          />
                        </div>
                      </div>

                      {/* Ability Scores */}
                      <div className="space-y-2">
                        <Label>Caratteristiche</Label>
                        <div className="grid grid-cols-6 gap-2">
                          {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).map(stat => (
                            <div key={stat} className="text-center">
                              <div className="text-xs font-semibold text-[var(--ink-faded)] mb-1">
                                {stat.toUpperCase()}
                              </div>
                              <Input
                                type="number"
                                min={1}
                                max={30}
                                value={newMonster[stat]}
                                onChange={(e) => setNewMonster({ ...newMonster, [stat]: parseInt(e.target.value) || 10 })}
                                className="text-center p-1 h-9"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="monster-abilities">Abilità e Azioni</Label>
                        <Textarea
                          id="monster-abilities"
                          placeholder="Descrivi le abilità speciali e le azioni..."
                          rows={4}
                          value={newMonster.abilities}
                          onChange={(e) => setNewMonster({ ...newMonster, abilities: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="monster-source">Fonte</Label>
                        <Input
                          id="monster-source"
                          placeholder="es. Homebrew, MM p.123"
                          value={newMonster.source}
                          onChange={(e) => setNewMonster({ ...newMonster, source: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                      <Button variant="outline" onClick={resetMonsterForm} className="btn-secondary min-h-[44px]">
                        Annulla
                      </Button>
                      <Button
                        onClick={createCustomMonster}
                        disabled={!newMonster.name.trim()}
                        className="btn-primary min-h-[44px]"
                      >
                        Crea Mostro
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Monsters List */}
              {monsters.length === 0 ? (
                <Card className="parchment-card text-center py-12 px-6">
                  <CardContent>
                    <div className="mb-4"><GameIcon name="skull" category="ui" size={64} className="text-[var(--teal)]" /></div>
                    <h3 className="text-xl font-semibold mb-2 text-[var(--ink)]">Bestiario vuoto</h3>
                    <p className="text-[var(--ink-light)] mb-6">
                      Cerca mostri da Open5e o crea i tuoi NPC personalizzati
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3 card-stagger">
                  {monsters.map((monster) => (
                    <Card key={monster.id} className="parchment-card hover:shadow-lg transition-all">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-[var(--coral)]/10">
                              <GameIcon name="skull" category="ui" size={20} className="text-[var(--coral)]" />
                            </div>
                            <div>
                              <CardTitle className="text-lg text-[var(--ink)]">{monster.name}</CardTitle>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <Badge variant="outline" className="text-xs">CR {monster.cr}</Badge>
                                <Badge variant="outline" className="text-xs text-[var(--ink-faded)]">{monster.source}</Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {/* Stats row */}
                        <div className="grid grid-cols-4 gap-2 mb-3 text-center">
                          <div className="p-2 rounded bg-[var(--cream-dark)]">
                            <div className="text-sm font-bold text-[var(--ink)]">{monster.max_hp}</div>
                            <div className="text-xs text-[var(--ink-faded)]">HP</div>
                          </div>
                          <div className="p-2 rounded bg-[var(--cream-dark)]">
                            <div className="text-sm font-bold text-[var(--ink)]">{monster.armor_class}</div>
                            <div className="text-xs text-[var(--ink-faded)]">CA</div>
                          </div>
                          <div className="p-2 rounded bg-[var(--cream-dark)] col-span-2">
                            <div className="text-sm font-bold text-[var(--ink)]">{monster.speed}</div>
                            <div className="text-xs text-[var(--ink-faded)]">Velocità</div>
                          </div>
                        </div>

                        {/* Ability scores */}
                        <div className="grid grid-cols-6 gap-1 mb-3 text-center text-xs">
                          <div>
                            <div className="font-semibold text-[var(--ink-faded)]">FOR</div>
                            <div className="text-[var(--ink)]">{monster.str} ({calcMod(monster.str || 10)})</div>
                          </div>
                          <div>
                            <div className="font-semibold text-[var(--ink-faded)]">DES</div>
                            <div className="text-[var(--ink)]">{monster.dex} ({calcMod(monster.dex || 10)})</div>
                          </div>
                          <div>
                            <div className="font-semibold text-[var(--ink-faded)]">COS</div>
                            <div className="text-[var(--ink)]">{monster.con} ({calcMod(monster.con || 10)})</div>
                          </div>
                          <div>
                            <div className="font-semibold text-[var(--ink-faded)]">INT</div>
                            <div className="text-[var(--ink)]">{monster.int} ({calcMod(monster.int || 10)})</div>
                          </div>
                          <div>
                            <div className="font-semibold text-[var(--ink-faded)]">SAG</div>
                            <div className="text-[var(--ink)]">{monster.wis} ({calcMod(monster.wis || 10)})</div>
                          </div>
                          <div>
                            <div className="font-semibold text-[var(--ink-faded)]">CAR</div>
                            <div className="text-[var(--ink)]">{monster.cha} ({calcMod(monster.cha || 10)})</div>
                          </div>
                        </div>

                        {monster.abilities && (
                          <p className="text-xs text-[var(--ink-light)] line-clamp-2 whitespace-pre-wrap mb-3">
                            {monster.abilities}
                          </p>
                        )}

                        <div className="flex gap-2 pt-3 border-t border-[var(--border-decorative)]">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewMonsterDetails(monster)}
                            className="flex-1 min-h-[40px]"
                          >
                            Dettagli
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm('Eliminare questo mostro?')) deleteMonster(monster.id)
                            }}
                            className="min-h-[40px] text-[var(--coral)] hover:bg-[var(--coral)]/10"
                          >
                            Elimina
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* SPELLS TAB */}
          <TabsContent value="spells">
            <div className="space-y-6">
              {/* Search and Filters */}
              <div className="parchment-card p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Cerca incantesimo..."
                      value={spellSearch}
                      onChange={(e) => setSpellSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSpellSearch()}
                      className="bg-[var(--cream-light)]"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select
                      value={spellFilters.level?.toString() ?? 'all'}
                      onValueChange={(v) => setSpellFilters(f => ({ ...f, level: v === 'all' ? null : parseInt(v) }))}
                    >
                      <SelectTrigger className="w-[140px] bg-[var(--cream-light)]">
                        <SelectValue placeholder="Livello" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tutti i livelli</SelectItem>
                        {SPELL_LEVELS.map(l => (
                          <SelectItem key={l.value} value={l.value.toString()}>{l.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={spellFilters.school ?? 'all'}
                      onValueChange={(v) => setSpellFilters(f => ({ ...f, school: v === 'all' ? null : v }))}
                    >
                      <SelectTrigger className="w-[150px] bg-[var(--cream-light)]">
                        <SelectValue placeholder="Scuola" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tutte le scuole</SelectItem>
                        {SPELL_SCHOOLS.map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={handleSpellSearch}
                      disabled={searchingSpells}
                      className="btn-primary"
                    >
                      {searchingSpells ? 'Cercando...' : 'Cerca'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Spell Results */}
              {spells.length === 0 && !searchingSpells ? (
                <div className="parchment-card p-12 text-center">
                  <div className="text-4xl mb-4">📜</div>
                  <p className="text-[var(--ink-light)]">
                    Cerca un incantesimo per nome, livello o scuola di magia.
                  </p>
                  <p className="text-sm text-[var(--ink-faded)] mt-2">
                    I risultati vengono salvati in cache per un accesso più veloce.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {spells.map((spell) => (
                    <Card
                      key={spell.id}
                      className="parchment-card cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => viewSpellDetails(spell)}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg text-[var(--teal)]">{spell.name}</CardTitle>
                        <CardDescription>
                          {formatSpellLevel(spell.level_int)} • {spell.school}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                          <div>
                            <span className="text-[var(--ink-faded)]">Tempo:</span>{' '}
                            <span className="text-[var(--ink)]">{spell.casting_time}</span>
                          </div>
                          <div>
                            <span className="text-[var(--ink-faded)]">Gittata:</span>{' '}
                            <span className="text-[var(--ink)]">{spell.range}</span>
                          </div>
                          <div>
                            <span className="text-[var(--ink-faded)]">Durata:</span>{' '}
                            <span className="text-[var(--ink)]">{spell.duration}</span>
                          </div>
                          <div>
                            <span className="text-[var(--ink-faded)]">Comp.:</span>{' '}
                            <span className="text-[var(--ink)]">{spell.components}</span>
                          </div>
                        </div>
                        {spell.requires_concentration && (
                          <span className="inline-block px-2 py-1 text-xs rounded bg-[var(--amber-light)] text-[var(--amber-dark)] mb-2">
                            Concentrazione
                          </span>
                        )}
                        <p className="text-xs text-[var(--ink-light)] line-clamp-3">
                          {spell.description}
                        </p>
                        {spell.dnd_class && (
                          <p className="text-xs text-[var(--ink-faded)] mt-2">
                            Classi: {spell.dnd_class}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* RACES & CLASSES TAB */}
          <TabsContent value="races-classes">
            <div className="space-y-6">
              {/* Sub-tabs for Races/Classes */}
              <div className="parchment-card p-4">
                <div className="flex gap-2">
                  <Button
                    variant={raceClassTab === 'races' ? 'default' : 'outline'}
                    onClick={() => {
                      setRaceClassTab('races')
                      loadRaces()
                    }}
                    className={raceClassTab === 'races' ? 'btn-primary' : ''}
                  >
                    Razze
                  </Button>
                  <Button
                    variant={raceClassTab === 'classes' ? 'default' : 'outline'}
                    onClick={() => {
                      setRaceClassTab('classes')
                      loadClasses()
                    }}
                    className={raceClassTab === 'classes' ? 'btn-primary' : ''}
                  >
                    Classi
                  </Button>
                </div>
              </div>

              {/* Races Section */}
              {raceClassTab === 'races' && (
                <>
                  {loadingRaces ? (
                    <div className="parchment-card p-12 text-center">
                      <div className="text-4xl mb-4 animate-pulse">🧝</div>
                      <p className="text-[var(--ink-light)]">Caricamento razze...</p>
                    </div>
                  ) : races.length === 0 ? (
                    <div className="parchment-card p-12 text-center">
                      <div className="text-4xl mb-4">🧝</div>
                      <p className="text-[var(--ink-light)]">
                        Clicca &quot;Razze&quot; per caricare le razze da Open5e.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {races.map((race) => (
                        <Card
                          key={race.id}
                          className="parchment-card cursor-pointer hover:shadow-lg transition-shadow"
                          onClick={() => viewRaceDetails(race)}
                        >
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg text-[var(--teal)]">{race.name}</CardTitle>
                            <CardDescription>
                              {race.size_raw} • {race.document_title}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="pt-0">
                            {race.asi_desc && (
                              <p className="text-xs text-[var(--ink)] mb-2">
                                <span className="font-semibold">Bonus:</span> {race.asi_desc}
                              </p>
                            )}
                            {race.speed && (
                              <p className="text-xs text-[var(--ink-light)] mb-2">
                                <span className="font-semibold text-[var(--ink-faded)]">Velocità:</span>{' '}
                                {typeof race.speed === 'object'
                                  ? Object.entries(race.speed).map(([k, v]) => `${k}: ${v} ft`).join(', ')
                                  : race.speed}
                              </p>
                            )}
                            {race.traits && (
                              <p className="text-xs text-[var(--ink-light)] line-clamp-3">
                                {race.traits.substring(0, 150)}...
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Classes Section */}
              {raceClassTab === 'classes' && (
                <>
                  {loadingClasses ? (
                    <div className="parchment-card p-12 text-center">
                      <div className="text-4xl mb-4 animate-pulse">⚔️</div>
                      <p className="text-[var(--ink-light)]">Caricamento classi...</p>
                    </div>
                  ) : classes.length === 0 ? (
                    <div className="parchment-card p-12 text-center">
                      <div className="text-4xl mb-4">⚔️</div>
                      <p className="text-[var(--ink-light)]">
                        Clicca &quot;Classi&quot; per caricare le classi da Open5e.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {classes.map((cls) => (
                        <Card
                          key={cls.id}
                          className="parchment-card cursor-pointer hover:shadow-lg transition-shadow"
                          onClick={() => viewClassDetails(cls)}
                        >
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg text-[var(--coral)]">{cls.name}</CardTitle>
                            <CardDescription>
                              {cls.hit_dice} • {cls.document_title}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="pt-0">
                            {cls.prof_saving_throws && (
                              <p className="text-xs text-[var(--ink)] mb-2">
                                <span className="font-semibold">Tiri Salvezza:</span> {cls.prof_saving_throws}
                              </p>
                            )}
                            {cls.prof_armor && (
                              <p className="text-xs text-[var(--ink-light)] mb-1">
                                <span className="font-semibold text-[var(--ink-faded)]">Armature:</span> {cls.prof_armor}
                              </p>
                            )}
                            {cls.prof_weapons && (
                              <p className="text-xs text-[var(--ink-light)] mb-1">
                                <span className="font-semibold text-[var(--ink-faded)]">Armi:</span> {cls.prof_weapons}
                              </p>
                            )}
                            {cls.spellcasting_ability && (
                              <p className="text-xs text-[var(--teal)] mt-2">
                                Incantatore: {cls.spellcasting_ability}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Race Details Dialog */}
      <Dialog open={viewingRace} onOpenChange={setViewingRace}>
        <DialogContent className="parchment-card max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl text-[var(--teal)]">
              {selectedRace?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedRace?.size_raw} • {selectedRace?.document_title}
            </DialogDescription>
          </DialogHeader>

          {selectedRace && (
            <div className="space-y-4">
              {/* Speed */}
              {selectedRace.speed && (
                <div className="p-3 rounded-lg bg-[var(--cream-dark)]">
                  <div className="text-xs text-[var(--ink-faded)]">Velocità</div>
                  <div className="font-semibold text-[var(--ink)]">
                    {typeof selectedRace.speed === 'object'
                      ? Object.entries(selectedRace.speed).map(([k, v]) => `${k}: ${v} ft`).join(', ')
                      : selectedRace.speed}
                  </div>
                </div>
              )}

              {/* Ability Score Increase */}
              {selectedRace.asi_desc && (
                <div>
                  <h4 className="font-semibold text-[var(--coral)] mb-2">Incremento Punteggi Caratteristica</h4>
                  <p className="text-sm text-[var(--ink-light)]">{selectedRace.asi_desc}</p>
                </div>
              )}

              {/* Traits */}
              {selectedRace.traits && (
                <div>
                  <h4 className="font-semibold text-[var(--coral)] mb-2">Tratti Razziali</h4>
                  <p className="text-sm text-[var(--ink-light)] whitespace-pre-wrap">{selectedRace.traits}</p>
                </div>
              )}

              {/* Languages */}
              {selectedRace.languages && (
                <div>
                  <h4 className="font-semibold text-[var(--coral)] mb-2">Linguaggi</h4>
                  <p className="text-sm text-[var(--ink-light)]">{selectedRace.languages}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Class Details Dialog */}
      <Dialog open={viewingClass} onOpenChange={setViewingClass}>
        <DialogContent className="parchment-card max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl text-[var(--coral)]">
              {selectedClass?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedClass?.hit_dice} • {selectedClass?.document_title}
            </DialogDescription>
          </DialogHeader>

          {selectedClass && (
            <div className="space-y-4">
              {/* Hit Points */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-[var(--cream-dark)]">
                  <div className="text-xs text-[var(--ink-faded)]">Dado Vita</div>
                  <div className="font-semibold text-[var(--ink)]">{selectedClass.hit_dice}</div>
                </div>
                <div className="p-3 rounded-lg bg-[var(--cream-dark)]">
                  <div className="text-xs text-[var(--ink-faded)]">PF al 1° Livello</div>
                  <div className="font-semibold text-[var(--ink)]">{selectedClass.hp_at_1st_level}</div>
                </div>
              </div>

              {/* Proficiencies */}
              {selectedClass.prof_armor && (
                <div>
                  <h4 className="font-semibold text-[var(--teal)] mb-2">Competenza: Armature</h4>
                  <p className="text-sm text-[var(--ink-light)]">{selectedClass.prof_armor}</p>
                </div>
              )}

              {selectedClass.prof_weapons && (
                <div>
                  <h4 className="font-semibold text-[var(--teal)] mb-2">Competenza: Armi</h4>
                  <p className="text-sm text-[var(--ink-light)]">{selectedClass.prof_weapons}</p>
                </div>
              )}

              {selectedClass.prof_saving_throws && (
                <div>
                  <h4 className="font-semibold text-[var(--teal)] mb-2">Tiri Salvezza</h4>
                  <p className="text-sm text-[var(--ink-light)]">{selectedClass.prof_saving_throws}</p>
                </div>
              )}

              {/* Spellcasting */}
              {selectedClass.spellcasting_ability && (
                <div className="p-3 rounded-lg bg-[var(--amber-light)]">
                  <div className="text-xs text-[var(--amber-dark)]">Caratteristica da Incantatore</div>
                  <div className="font-semibold text-[var(--amber-dark)]">{selectedClass.spellcasting_ability}</div>
                </div>
              )}

              {/* Archetypes */}
              {selectedClass.archetypes && selectedClass.archetypes.length > 0 && (
                <div>
                  <h4 className="font-semibold text-[var(--coral)] mb-2">Archetipi/Sottoclassi</h4>
                  <div className="space-y-2">
                    {selectedClass.archetypes.map((arch: any, i: number) => (
                      <div key={i} className="text-sm">
                        <span className="font-semibold text-[var(--ink)]">{arch.name}</span>
                        {arch.desc && (
                          <p className="text-[var(--ink-light)] text-xs mt-1 line-clamp-2">{arch.desc}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Spell Details Dialog */}
      <Dialog open={viewingSpell} onOpenChange={setViewingSpell}>
        <DialogContent className="parchment-card max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl text-[var(--teal)]">
              {selectedSpell?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedSpell && formatSpellLevel(selectedSpell.level_int)} • {selectedSpell?.school}
              {selectedSpell?.requires_concentration && ' • Concentrazione'}
            </DialogDescription>
          </DialogHeader>

          {selectedSpell && (
            <div className="space-y-4">
              {/* Spell Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-[var(--cream-dark)]">
                  <div className="text-xs text-[var(--ink-faded)]">Tempo di Lancio</div>
                  <div className="font-semibold text-[var(--ink)]">{selectedSpell.casting_time}</div>
                </div>
                <div className="p-3 rounded-lg bg-[var(--cream-dark)]">
                  <div className="text-xs text-[var(--ink-faded)]">Gittata</div>
                  <div className="font-semibold text-[var(--ink)]">{selectedSpell.range}</div>
                </div>
                <div className="p-3 rounded-lg bg-[var(--cream-dark)]">
                  <div className="text-xs text-[var(--ink-faded)]">Componenti</div>
                  <div className="font-semibold text-[var(--ink)]">{selectedSpell.components}</div>
                </div>
                <div className="p-3 rounded-lg bg-[var(--cream-dark)]">
                  <div className="text-xs text-[var(--ink-faded)]">Durata</div>
                  <div className="font-semibold text-[var(--ink)]">{selectedSpell.duration}</div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="font-semibold text-[var(--coral)] mb-2">Descrizione</h4>
                <p className="text-sm text-[var(--ink-light)] whitespace-pre-wrap">
                  {selectedSpell.description}
                </p>
              </div>

              {/* At Higher Levels */}
              {selectedSpell.higher_level && (
                <div>
                  <h4 className="font-semibold text-[var(--coral)] mb-2">A Livelli Superiori</h4>
                  <p className="text-sm text-[var(--ink-light)] whitespace-pre-wrap">
                    {selectedSpell.higher_level}
                  </p>
                </div>
              )}

              {/* Classes */}
              {selectedSpell.dnd_class && (
                <div>
                  <h4 className="font-semibold text-[var(--coral)] mb-2">Classi</h4>
                  <p className="text-sm text-[var(--ink-light)]">{selectedSpell.dnd_class}</p>
                </div>
              )}

              {/* Source */}
              {selectedSpell.document_title && (
                <p className="text-xs text-[var(--ink-faded)] pt-2 border-t border-[var(--border-decorative)]">
                  Fonte: {selectedSpell.document_title}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Monster Details Dialog */}
      <Dialog open={viewingMonster} onOpenChange={setViewingMonster}>
        <DialogContent className="parchment-card max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl text-[var(--coral)]">
              {selectedMonster?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedMonster?.size} {selectedMonster?.type} • CR {selectedMonster?.cr || selectedMonster?.challenge_rating}
            </DialogDescription>
          </DialogHeader>

          {selectedMonster && (
            <div className="space-y-4">
              {/* Basic stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-[var(--cream-dark)] text-center">
                  <div className="text-xl font-bold text-[var(--coral)]">
                    {selectedMonster.hit_points || selectedMonster.max_hp}
                  </div>
                  <div className="text-xs text-[var(--ink-faded)]">Punti Ferita</div>
                </div>
                <div className="p-3 rounded-lg bg-[var(--cream-dark)] text-center">
                  <div className="text-xl font-bold text-[var(--teal)]">
                    {selectedMonster.armor_class}
                  </div>
                  <div className="text-xs text-[var(--ink-faded)]">Classe Armatura</div>
                </div>
                <div className="p-3 rounded-lg bg-[var(--cream-dark)] text-center">
                  <div className="text-xl font-bold text-[var(--ink)]">
                    {selectedMonster.speed?.walk || selectedMonster.speed}
                  </div>
                  <div className="text-xs text-[var(--ink-faded)]">Velocità</div>
                </div>
              </div>

              {/* Ability scores */}
              <div className="grid grid-cols-6 gap-2 text-center">
                {[
                  { key: 'str', label: 'FOR', value: selectedMonster.strength || selectedMonster.str },
                  { key: 'dex', label: 'DES', value: selectedMonster.dexterity || selectedMonster.dex },
                  { key: 'con', label: 'COS', value: selectedMonster.constitution || selectedMonster.con },
                  { key: 'int', label: 'INT', value: selectedMonster.intelligence || selectedMonster.int },
                  { key: 'wis', label: 'SAG', value: selectedMonster.wisdom || selectedMonster.wis },
                  { key: 'cha', label: 'CAR', value: selectedMonster.charisma || selectedMonster.cha },
                ].map(stat => (
                  <div key={stat.key} className="p-2 rounded bg-[var(--cream-dark)]">
                    <div className="text-xs font-semibold text-[var(--ink-faded)]">{stat.label}</div>
                    <div className="text-lg font-bold text-[var(--ink)]">{stat.value || 10}</div>
                    <div className="text-xs text-[var(--teal)]">{calcMod(stat.value || 10)}</div>
                  </div>
                ))}
              </div>

              {/* Special abilities (Open5e format) */}
              {selectedMonster.special_abilities?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-[var(--coral)] mb-2">Abilità Speciali</h4>
                  <div className="space-y-2">
                    {selectedMonster.special_abilities.map((ability: any, i: number) => (
                      <div key={i} className="text-sm">
                        <span className="font-semibold text-[var(--ink)]">{ability.name}:</span>{' '}
                        <span className="text-[var(--ink-light)]">{ability.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions (Open5e format) */}
              {selectedMonster.actions?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-[var(--coral)] mb-2">Azioni</h4>
                  <div className="space-y-2">
                    {selectedMonster.actions.map((action: any, i: number) => (
                      <div key={i} className="text-sm">
                        <span className="font-semibold text-[var(--ink)]">{action.name}:</span>{' '}
                        <span className="text-[var(--ink-light)]">{action.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Abilities (local DB format) */}
              {selectedMonster.abilities && !selectedMonster.actions && (
                <div>
                  <h4 className="font-semibold text-[var(--coral)] mb-2">Abilità e Azioni</h4>
                  <p className="text-sm text-[var(--ink-light)] whitespace-pre-wrap">
                    {selectedMonster.abilities}
                  </p>
                </div>
              )}

              {/* Legendary Actions */}
              {selectedMonster.legendary_actions?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-[var(--coral)] mb-2">Azioni Leggendarie</h4>
                  <div className="space-y-2">
                    {selectedMonster.legendary_actions.map((action: any, i: number) => (
                      <div key={i} className="text-sm">
                        <span className="font-semibold text-[var(--ink)]">{action.name}:</span>{' '}
                        <span className="text-[var(--ink-light)]">{action.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Source */}
              <div className="pt-3 border-t border-[var(--border-decorative)]">
                <p className="text-xs text-[var(--ink-faded)]">
                  Fonte: {selectedMonster.source || selectedMonster.document__title || 'Sconosciuta'}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Avatar Upload Dialog */}
      <Dialog open={avatarDialogOpen} onOpenChange={(open) => {
        setAvatarDialogOpen(open)
        if (!open) {
          setSelectedCharacter(null)
          setAvatarPreview(null)
        }
      }}>
        <DialogContent className="parchment-card max-w-sm">
          <DialogHeader>
            <DialogTitle>Avatar di {selectedCharacter?.name}</DialogTitle>
            <DialogDescription>
              Carica un&apos;immagine personalizzata per il tuo personaggio
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {/* Preview area */}
            <div className="flex justify-center mb-4">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Preview"
                  className="avatar-preview"
                />
              ) : (
                <div
                  className="avatar-preview flex items-center justify-center"
                  style={{
                    backgroundColor: selectedCharacter?.class ?
                      DND_CLASSES[selectedCharacter.class as keyof typeof DND_CLASSES]?.color :
                      'var(--teal)'
                  }}
                >
                  {selectedCharacter?.class && DND_CLASSES[selectedCharacter.class as keyof typeof DND_CLASSES]?.icon ? (
                    <GameIcon
                      name={DND_CLASSES[selectedCharacter.class as keyof typeof DND_CLASSES].icon}
                      category="classes"
                      size={48}
                      className="text-white"
                    />
                  ) : (
                    <span className="text-4xl text-white font-bold">
                      {selectedCharacter?.name.charAt(0)}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Upload zone */}
            <div
              className="avatar-upload-zone"
              onClick={() => fileInputRef.current?.click()}
            >
              <GameIcon name="masks" category="ui" size={32} className="mx-auto mb-2 text-[var(--teal)]" />
              <p className="text-sm text-[var(--ink)]">
                Clicca per scegliere un&apos;immagine
              </p>
              <p className="text-xs text-[var(--ink-faded)] mt-1">
                JPG, PNG, WebP - Max 2MB
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
            {avatarPreview && selectedCharacter?.avatar_url && (
              <Button
                variant="outline"
                onClick={removeAvatar}
                disabled={uploadingAvatar}
                className="btn-secondary min-h-[44px] text-[var(--coral)]"
              >
                Rimuovi
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setAvatarDialogOpen(false)}
              className="btn-secondary min-h-[44px]"
            >
              Annulla
            </Button>
            <Button
              onClick={saveAvatar}
              disabled={!avatarPreview || uploadingAvatar || avatarPreview === selectedCharacter?.avatar_url}
              className="btn-primary min-h-[44px]"
            >
              {uploadingAvatar ? 'Salvataggio...' : 'Salva Avatar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Character Details Dialog */}
      <Dialog open={viewingCharacterDetails} onOpenChange={(open) => {
        setViewingCharacterDetails(open)
        if (!open) {
          setSelectedCharacter(null)
          setCharacterRaceData(null)
          setCharacterClassData(null)
          setEditingCharacter(false)
          setEditedCharacter(null)
        }
      }}>
        <DialogContent className="parchment-card max-w-2xl max-h-[85vh] flex flex-col p-0">
          {selectedCharacter && (() => {
            // Use editedCharacter when editing, otherwise selectedCharacter
            const char = editingCharacter && editedCharacter ? editedCharacter : selectedCharacter
            const classInfo = char.class
              ? DND_CLASSES[char.class as keyof typeof DND_CLASSES]
              : null
            const hpPercentage = (char.current_hp / char.max_hp) * 100
            const profBonus = getProficiencyBonus(char.level)

            return (
              <>
                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6">
                <DialogHeader>
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div
                      className="character-avatar-compact shrink-0"
                      style={{
                        backgroundColor: classInfo?.color || 'var(--teal)',
                        width: '72px',
                        height: '72px',
                        fontSize: '28px'
                      }}
                    >
                      {char.avatar_url ? (
                        <img
                          src={char.avatar_url}
                          alt={char.name}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : classInfo?.icon ? (
                        <GameIcon
                          name={classInfo.icon}
                          category="classes"
                          size={36}
                          className="text-white"
                        />
                      ) : (
                        char.name.charAt(0)
                      )}
                    </div>
                    <div className="flex-1">
                      {editingCharacter && editedCharacter ? (
                        <>
                          <Input
                            value={editedCharacter.name}
                            onChange={(e) => setEditedCharacter({ ...editedCharacter, name: e.target.value })}
                            className="text-xl font-bold mb-2"
                            placeholder="Nome personaggio"
                          />
                          <div className="grid grid-cols-3 gap-2 mb-2">
                            <Select
                              value={editedCharacter.race || ''}
                              onValueChange={(value) => setEditedCharacter({ ...editedCharacter, race: value })}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Razza" />
                              </SelectTrigger>
                              <SelectContent className="max-h-60">
                                {Object.entries(DND_RACES).map(([key, race]) => (
                                  <SelectItem key={key} value={key}>
                                    {race.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select
                              value={editedCharacter.class || ''}
                              onValueChange={(value) => setEditedCharacter({ ...editedCharacter, class: value })}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Classe" />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(DND_CLASSES).map(([key, cls]) => (
                                  <SelectItem key={key} value={key}>
                                    {cls.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              type="number"
                              min={1}
                              max={20}
                              value={editedCharacter.level}
                              onChange={(e) => setEditedCharacter({ ...editedCharacter, level: parseInt(e.target.value) || 1 })}
                              className="h-9"
                              placeholder="Lv"
                            />
                          </div>
                          <Input
                            value={editedCharacter.player_name || ''}
                            onChange={(e) => setEditedCharacter({ ...editedCharacter, player_name: e.target.value })}
                            className="h-9 text-sm"
                            placeholder="Nome giocatore"
                          />
                        </>
                      ) : (
                        <>
                          <DialogTitle className="text-2xl font-bold text-[var(--ink)]">
                            {char.name}
                          </DialogTitle>
                          <DialogDescription className="text-base mt-1">
                            {char.race} {classInfo?.name || char.class} Lv.{char.level}
                            {char.player_name && (
                              <span className="block text-sm mt-1 text-[var(--ink-light)]">
                                Giocatore: {char.player_name}
                              </span>
                            )}
                          </DialogDescription>
                        </>
                      )}
                    </div>
                  </div>
                </DialogHeader>

                {/* Quick Stats Bar */}
                <div className="grid grid-cols-4 gap-3 mt-6 p-4 bg-[var(--parchment-light)] rounded-lg border border-[var(--border-decorative)]">
                  <div className="text-center">
                    {editingCharacter && editedCharacter ? (
                      <>
                        <Input
                          type="number"
                          value={editedCharacter.armor_class}
                          onChange={(e) => setEditedCharacter({ ...editedCharacter, armor_class: parseInt(e.target.value) || 10 })}
                          className="text-center h-10 text-lg font-bold"
                        />
                        <div className="text-xs text-[var(--ink-light)] uppercase mt-1">CA</div>
                      </>
                    ) : (
                      <>
                        <div className="text-2xl font-bold text-[var(--ink)]">{char.armor_class}</div>
                        <div className="text-xs text-[var(--ink-light)] uppercase">CA</div>
                      </>
                    )}
                  </div>
                  <div className="text-center">
                    {editingCharacter && editedCharacter ? (
                      <>
                        <Input
                          type="number"
                          value={editedCharacter.max_hp}
                          onChange={(e) => setEditedCharacter({ ...editedCharacter, max_hp: parseInt(e.target.value) || 1 })}
                          className="text-center h-10 text-lg font-bold"
                        />
                        <div className="text-xs text-[var(--ink-light)] uppercase mt-1">PF Max</div>
                      </>
                    ) : (
                      <>
                        <div className={`text-2xl font-bold ${
                          hpPercentage > 50 ? 'text-[var(--teal)]' :
                          hpPercentage > 25 ? 'text-amber-600' :
                          'text-[var(--coral)]'
                        }`}>
                          {char.current_hp}/{char.max_hp}
                        </div>
                        <div className="text-xs text-[var(--ink-light)] uppercase">PF</div>
                      </>
                    )}
                  </div>
                  <div className="text-center">
                    {editingCharacter && editedCharacter ? (
                      <>
                        <Input
                          type="number"
                          value={editedCharacter.initiative_bonus}
                          onChange={(e) => setEditedCharacter({ ...editedCharacter, initiative_bonus: parseInt(e.target.value) || 0 })}
                          className="text-center h-10 text-lg font-bold"
                        />
                        <div className="text-xs text-[var(--ink-light)] uppercase mt-1">Init</div>
                      </>
                    ) : (
                      <>
                        <div className="text-2xl font-bold text-[var(--ink)]">
                          {formatModifier(char.initiative_bonus)}
                        </div>
                        <div className="text-xs text-[var(--ink-light)] uppercase">Init</div>
                      </>
                    )}
                  </div>
                  <div className="text-center">
                    {editingCharacter && editedCharacter ? (
                      <>
                        <Input
                          type="number"
                          value={editedCharacter.speed || 30}
                          onChange={(e) => setEditedCharacter({ ...editedCharacter, speed: parseInt(e.target.value) || 30 })}
                          className="text-center h-10 text-lg font-bold"
                        />
                        <div className="text-xs text-[var(--ink-light)] uppercase mt-1">Vel</div>
                      </>
                    ) : (
                      <>
                        <div className="text-2xl font-bold text-[var(--ink)]">{char.speed || 30}ft</div>
                        <div className="text-xs text-[var(--ink-light)] uppercase">Velocità</div>
                      </>
                    )}
                  </div>
                </div>

                {/* Ability Scores */}
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-[var(--ink)] mb-3 uppercase tracking-wide">
                    Caratteristiche
                  </h4>
                  <div className="grid grid-cols-6 gap-2">
                    {[
                      { key: 'str' as const, label: 'FOR', value: char.str },
                      { key: 'dex' as const, label: 'DES', value: char.dex },
                      { key: 'con' as const, label: 'COS', value: char.con },
                      { key: 'int' as const, label: 'INT', value: char.int },
                      { key: 'wis' as const, label: 'SAG', value: char.wis },
                      { key: 'cha' as const, label: 'CAR', value: char.cha },
                    ].map((stat) => (
                      <div
                        key={stat.key}
                        className="text-center p-3 bg-[var(--parchment-dark)] rounded-lg border border-[var(--border-decorative)]"
                      >
                        <div className="text-xs text-[var(--ink-light)] font-semibold mb-1">{stat.label}</div>
                        {editingCharacter && editedCharacter ? (
                          <Input
                            type="number"
                            min={1}
                            max={30}
                            value={editedCharacter[stat.key]}
                            onChange={(e) => setEditedCharacter({ ...editedCharacter, [stat.key]: parseInt(e.target.value) || 10 })}
                            className="text-center h-8 text-lg font-bold p-1"
                          />
                        ) : (
                          <>
                            <div className="text-xl font-bold text-[var(--ink)]">{stat.value}</div>
                            <div className="text-sm font-semibold text-[var(--teal)]">
                              {formatModifier(abilityModifier(stat.value))}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Proficiency & Spell Save DC */}
                <div className="mt-4 flex gap-4">
                  <div className="flex-1 p-3 bg-[var(--parchment-light)] rounded-lg border border-[var(--border-decorative)] text-center">
                    <div className="text-xs text-[var(--ink-light)] uppercase">Bonus Competenza</div>
                    <div className="text-xl font-bold text-[var(--teal)]">+{profBonus}</div>
                  </div>
                  {(editingCharacter || char.spell_save_dc) && (
                    <div className="flex-1 p-3 bg-[var(--parchment-light)] rounded-lg border border-[var(--border-decorative)] text-center">
                      <div className="text-xs text-[var(--ink-light)] uppercase">CD Incantesimi</div>
                      {editingCharacter && editedCharacter ? (
                        <Input
                          type="number"
                          value={editedCharacter.spell_save_dc || ''}
                          onChange={(e) => setEditedCharacter({ ...editedCharacter, spell_save_dc: parseInt(e.target.value) || null })}
                          className="text-center h-8 text-lg font-bold"
                          placeholder="-"
                        />
                      ) : (
                        <div className="text-xl font-bold text-[var(--purple-dark)]">{char.spell_save_dc}</div>
                      )}
                    </div>
                  )}
                  <div className="flex-1 p-3 bg-[var(--parchment-light)] rounded-lg border border-[var(--border-decorative)] text-center">
                    <div className="text-xs text-[var(--ink-light)] uppercase">Perc. Passiva</div>
                    {editingCharacter && editedCharacter ? (
                      <Input
                        type="number"
                        value={editedCharacter.passive_perception || 10}
                        onChange={(e) => setEditedCharacter({ ...editedCharacter, passive_perception: parseInt(e.target.value) || 10 })}
                        className="text-center h-8 text-lg font-bold"
                      />
                    ) : (
                      <div className="text-xl font-bold text-[var(--ink)]">{char.passive_perception || 10}</div>
                    )}
                  </div>
                </div>

                {/* Concentration */}
                {char.is_concentrating && char.concentration_spell && (
                  <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 text-[var(--purple-dark)]">
                      <GameIcon name="concentration" category="ui" size={20} />
                      <span className="font-semibold">Concentrazione:</span>
                      <span>{char.concentration_spell}</span>
                    </div>
                  </div>
                )}

                {/* Conditions */}
                {char.conditions.length > 0 && (
                  <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <h4 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
                      <GameIcon name="alert" category="ui" size={18} />
                      Condizioni Attive
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {char.conditions.map((condition: string) => {
                        const condInfo = CONDITIONS[condition as keyof typeof CONDITIONS] as { name: string; nameIt: string; icon: string; iconSvg: string; description: string } | undefined
                        return (
                          <span key={condition} className="condition-badge">
                            {condInfo?.iconSvg && (
                              <GameIcon
                                name={condInfo.iconSvg}
                                category="conditions"
                                size={16}
                                className="text-current"
                              />
                            )}
                            <span className="ml-1">{condInfo?.nameIt || condInfo?.name || condition}</span>
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Death Saves */}
                {char.current_hp === 0 && (
                  <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                    <h4 className="text-sm font-semibold text-[var(--coral)] mb-3 text-center flex items-center justify-center gap-2">
                      <GameIcon name="skull" category="ui" size={18} />
                      Tiri Salvezza vs Morte
                    </h4>
                    <div className="flex justify-center gap-8">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[var(--teal)]">Successi:</span>
                        {[0, 1, 2].map((i) => (
                          <div
                            key={`success-${i}`}
                            className={`w-4 h-4 rounded-full border-2 ${
                              i < char.death_save_successes
                                ? 'bg-[var(--teal)] border-[var(--teal)]'
                                : 'border-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[var(--coral)]">Fallimenti:</span>
                        {[0, 1, 2].map((i) => (
                          <div
                            key={`failure-${i}`}
                            className={`w-4 h-4 rounded-full border-2 ${
                              i < char.death_save_failures
                                ? 'bg-[var(--coral)] border-[var(--coral)]'
                                : 'border-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Racial Traits */}
                {char.race && DND_RACES[char.race] && (() => {
                  const raceData = DND_RACES[char.race]
                  const asiBonuses = Object.entries(raceData.asi)
                    .filter(([, value]) => value !== undefined && value !== 0)
                    .map(([ability, bonus]) => `${ability.toUpperCase()} +${bonus}`)
                    .join(', ')
                  return (
                    <div className="mt-6">
                      <h4 className="text-sm font-semibold text-[var(--ink)] mb-3 uppercase tracking-wide flex items-center gap-2">
                        <GameIcon name="races" category="ui" size={18} className="text-[var(--teal)]" />
                        Tratti Razziali ({raceData.name})
                      </h4>
                      <div className="p-4 bg-[var(--parchment-light)] rounded-lg border border-[var(--border-decorative)] space-y-3">
                        <div>
                          <span className="text-xs text-[var(--ink-light)] uppercase">Taglia:</span>
                          <span className="ml-2 text-sm text-[var(--ink)]">{raceData.size}</span>
                        </div>
                        <div>
                          <span className="text-xs text-[var(--ink-light)] uppercase">Velocità:</span>
                          <span className="ml-2 text-sm text-[var(--ink)]">{raceData.speed}ft</span>
                        </div>
                        {raceData.darkvision && (
                          <div>
                            <span className="text-xs text-[var(--ink-light)] uppercase">Scurovisione:</span>
                            <span className="ml-2 text-sm text-[var(--ink)]">{raceData.darkvision}ft</span>
                          </div>
                        )}
                        {asiBonuses && (
                          <div>
                            <span className="text-xs text-[var(--ink-light)] uppercase">Incremento Caratteristiche:</span>
                            <span className="ml-2 text-sm text-[var(--ink)]">{asiBonuses}</span>
                            {raceData.asiChoice && (
                              <span className="ml-2 text-xs text-amber-600">
                                (+{raceData.asiChoice.count}×{raceData.asiChoice.bonus} a scelta)
                              </span>
                            )}
                          </div>
                        )}
                        <div>
                          <span className="text-xs text-[var(--ink-light)] uppercase">Linguaggi:</span>
                          <span className="ml-2 text-sm text-[var(--ink)]">{raceData.languages.join(', ')}</span>
                        </div>
                        <div>
                          <span className="text-xs text-[var(--ink-light)] uppercase block mb-1">Tratti:</span>
                          <p className="text-sm text-[var(--ink)]">{raceData.traits.join(', ')}</p>
                        </div>
                      </div>
                    </div>
                  )
                })()}

                {/* Class Features */}
                {characterClassData && (
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-[var(--ink)] mb-3 uppercase tracking-wide flex items-center gap-2">
                      <GameIcon name={classInfo?.icon || 'classes'} category="classes" size={18} className="text-[var(--coral)]" />
                      Feature di Classe ({characterClassData.name})
                    </h4>
                    <div className="p-4 bg-[var(--parchment-light)] rounded-lg border border-[var(--border-decorative)] space-y-3">
                      {characterClassData.hit_dice && (
                        <div>
                          <span className="text-xs text-[var(--ink-light)] uppercase">Dado Vita:</span>
                          <span className="ml-2 text-sm font-semibold text-[var(--ink)]">
                            {char.level}{characterClassData.hit_dice}
                          </span>
                        </div>
                      )}
                      {characterClassData.hp_at_1st_level && (
                        <div>
                          <span className="text-xs text-[var(--ink-light)] uppercase">PF al 1° Livello:</span>
                          <span className="ml-2 text-sm text-[var(--ink)]">{characterClassData.hp_at_1st_level}</span>
                        </div>
                      )}
                      {characterClassData.prof_armor && (
                        <div>
                          <span className="text-xs text-[var(--ink-light)] uppercase">Armature:</span>
                          <span className="ml-2 text-sm text-[var(--ink)]">{characterClassData.prof_armor}</span>
                        </div>
                      )}
                      {characterClassData.prof_weapons && (
                        <div>
                          <span className="text-xs text-[var(--ink-light)] uppercase">Armi:</span>
                          <span className="ml-2 text-sm text-[var(--ink)]">{characterClassData.prof_weapons}</span>
                        </div>
                      )}
                      {characterClassData.prof_saving_throws && (
                        <div>
                          <span className="text-xs text-[var(--ink-light)] uppercase">Tiri Salvezza:</span>
                          <span className="ml-2 text-sm font-semibold text-[var(--teal)]">{characterClassData.prof_saving_throws}</span>
                        </div>
                      )}
                      {characterClassData.spellcasting_ability && (
                        <div>
                          <span className="text-xs text-[var(--ink-light)] uppercase">Caratteristica da Incantatore:</span>
                          <span className="ml-2 text-sm font-semibold text-[var(--purple-dark)]">{characterClassData.spellcasting_ability}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Class Resources */}
                {char.class && (
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-[var(--ink)] mb-3 uppercase tracking-wide flex items-center gap-2">
                      <GameIcon name={classInfo?.icon || 'classes'} category="classes" size={18} className="text-amber-500" />
                      Risorse di Classe
                    </h4>
                    <div className="p-4 bg-[var(--parchment-light)] rounded-lg border border-[var(--border-decorative)]">
                      {(() => {
                        const resources = (char.class_resources as ClassResource[] | null) || []

                        if (resources.length === 0) {
                          return (
                            <div className="text-center py-4">
                              <p className="text-sm text-[var(--ink-light)] mb-3">
                                Nessuna risorsa inizializzata
                              </p>
                              <Button
                                onClick={() => initializeResources(char)}
                                className="btn-secondary text-sm"
                              >
                                Inizializza Risorse
                              </Button>
                            </div>
                          )
                        }

                        return (
                          <div className="space-y-4">
                            {/* Resource List */}
                            {resources.map((resource) => (
                              <div key={resource.id} className="flex items-center justify-between gap-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm text-[var(--ink)]">{resource.name}</span>
                                    <span
                                      className="text-xs px-2 py-0.5 rounded-full"
                                      style={{
                                        backgroundColor: getRechargeColor(resource.recharge) + '20',
                                        color: getRechargeColor(resource.recharge)
                                      }}
                                    >
                                      {getRechargeLabel(resource.recharge)}
                                    </span>
                                  </div>
                                  {resource.description && (
                                    <p className="text-xs text-[var(--ink-light)] mt-0.5">{resource.description}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleUseResource(char.id, resources, resource.id)}
                                    disabled={resource.current <= 0}
                                    className="w-8 h-8 p-0 text-lg font-bold"
                                  >
                                    −
                                  </Button>
                                  <span className="font-mono font-bold text-lg min-w-[60px] text-center">
                                    <span style={{ color: resource.current > 0 ? 'var(--ink)' : 'var(--coral)' }}>
                                      {resource.current}
                                    </span>
                                    <span className="text-[var(--ink-light)]">/{resource.max}</span>
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRestoreResource(char.id, resources, resource.id)}
                                    disabled={resource.current >= resource.max}
                                    className="w-8 h-8 p-0 text-lg font-bold"
                                  >
                                    +
                                  </Button>
                                </div>
                              </div>
                            ))}

                            {/* Rest Buttons */}
                            <div className="flex gap-2 pt-3 mt-3 border-t border-[var(--border-decorative)]">
                              <Button
                                variant="outline"
                                onClick={() => handleShortRest(char.id, resources)}
                                className="flex-1 text-sm"
                                style={{ borderColor: '#f59e0b', color: '#d97706' }}
                              >
                                <GameIcon name="hourglass" category="ui" size={16} className="mr-2" />
                                Riposo Breve
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => handleLongRest(char.id, resources)}
                                className="flex-1 text-sm"
                                style={{ borderColor: '#3b82f6', color: '#2563eb' }}
                              >
                                <GameIcon name="rest" category="ui" size={16} className="mr-2" />
                                Riposo Lungo
                              </Button>
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                )}

                {/* Character Spells */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-[var(--ink)] uppercase tracking-wide flex items-center gap-2">
                      <GameIcon name="magic" category="ui" size={18} className="text-[var(--purple-dark)]" />
                      Incantesimi
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAddSpellDialogOpen(true)}
                      className="text-xs"
                    >
                      + Aggiungi
                    </Button>
                  </div>
                  <div className="p-4 bg-[var(--parchment-light)] rounded-lg border border-[var(--border-decorative)]">
                    {loadingCharacterSpells ? (
                      <p className="text-sm text-[var(--ink-light)] text-center py-4">Caricamento...</p>
                    ) : characterSpells.length === 0 ? (
                      <p className="text-sm text-[var(--ink-light)] text-center py-4">
                        Nessun incantesimo assegnato
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {/* Group spells by level */}
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(level => {
                          const spellsAtLevel = characterSpells.filter(s => s.spell_level === level)
                          if (spellsAtLevel.length === 0) return null
                          return (
                            <div key={level}>
                              <h5 className="text-xs font-semibold text-[var(--ink-light)] uppercase mb-2">
                                {level === 0 ? 'Trucchetti' : `${level}° Livello`}
                              </h5>
                              <div className="flex flex-wrap gap-2">
                                {spellsAtLevel.map(spell => (
                                  <div
                                    key={spell.id}
                                    className="group flex items-center gap-1 px-2 py-1 bg-[var(--purple-dark)]/10 text-[var(--purple-dark)] rounded text-sm cursor-pointer hover:bg-[var(--purple-dark)]/20"
                                    onClick={async () => {
                                      const fullSpell = await getSpellBySlug(spell.spell_slug)
                                      if (fullSpell) {
                                        setSelectedSpell(fullSpell)
                                        setViewingSpell(true)
                                      }
                                    }}
                                  >
                                    <span>{spell.spell_name}</span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        removeSpellFromCharacter(spell.id)
                                      }}
                                      className="opacity-0 group-hover:opacity-100 ml-1 text-[var(--coral)] hover:text-red-600"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Add Spell Dialog */}
                <Dialog open={addSpellDialogOpen} onOpenChange={setAddSpellDialogOpen}>
                  <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Aggiungi Incantesimo</DialogTitle>
                      <DialogDescription>
                        Cerca un incantesimo da aggiungere a {char.name}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Cerca incantesimo..."
                          value={spellSearch}
                          onChange={(e) => setSpellSearch(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSpellSearch()}
                        />
                        <Button onClick={handleSpellSearch} disabled={searchingSpells}>
                          {searchingSpells ? '...' : 'Cerca'}
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Select
                          value={spellFilters.level?.toString() || 'all'}
                          onValueChange={(v) => setSpellFilters({ ...spellFilters, level: v === 'all' ? null : parseInt(v) })}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Livello" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tutti</SelectItem>
                            {SPELL_LEVELS.map(l => (
                              <SelectItem key={l.value} value={l.value.toString()}>{l.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={spellFilters.school || 'all'}
                          onValueChange={(v) => setSpellFilters({ ...spellFilters, school: v === 'all' ? null : v })}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Scuola" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tutte</SelectItem>
                            {SPELL_SCHOOLS.map(s => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {spells.length > 0 && (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                          {spells.map(spell => {
                            const alreadyAdded = characterSpells.some(cs => cs.spell_slug === spell.slug)
                            return (
                              <div
                                key={spell.id}
                                className={`p-3 border rounded-lg ${alreadyAdded ? 'bg-gray-100 opacity-50' : 'hover:bg-gray-50 cursor-pointer'}`}
                                onClick={() => !alreadyAdded && addSpellToCharacter(spell)}
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium text-sm">{spell.name}</p>
                                    <p className="text-xs text-gray-500">
                                      {spell.level_int === 0 ? 'Trucchetto' : `${spell.level_int}° livello`} • {spell.school}
                                    </p>
                                  </div>
                                  {alreadyAdded ? (
                                    <span className="text-xs text-gray-400">Già aggiunto</span>
                                  ) : (
                                    <Button size="sm" variant="outline" disabled={addingSpellToCharacter}>
                                      {addingSpellToCharacter ? '...' : 'Aggiungi'}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Notes */}
                {(editingCharacter || char.notes) && (
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-[var(--ink)] mb-3 uppercase tracking-wide flex items-center gap-2">
                      <GameIcon name="quill" category="ui" size={18} className="text-[var(--ink-light)]" />
                      Note
                    </h4>
                    <div className="p-4 bg-[var(--parchment-light)] rounded-lg border border-[var(--border-decorative)]">
                      {editingCharacter && editedCharacter ? (
                        <textarea
                          value={editedCharacter.notes || ''}
                          onChange={(e) => setEditedCharacter({ ...editedCharacter, notes: e.target.value })}
                          className="w-full min-h-[100px] p-2 border border-[var(--border-decorative)] rounded bg-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--teal)]"
                          placeholder="Note sul personaggio..."
                        />
                      ) : (
                        <p className="text-sm text-[var(--ink)] whitespace-pre-wrap">{char.notes}</p>
                      )}
                    </div>
                  </div>
                )}

                </div>
                {/* End Scrollable Content */}

                {/* Sticky Action Buttons */}
                <div className="shrink-0 border-t border-[var(--border-decorative)] bg-[var(--parchment)] p-4 flex justify-end gap-3">
                  {editingCharacter ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={cancelEditingCharacter}
                        className="btn-secondary min-h-[44px]"
                      >
                        Annulla
                      </Button>
                      <Button
                        onClick={updateCharacter}
                        className="btn-primary min-h-[44px]"
                      >
                        Salva Modifiche
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => setViewingCharacterDetails(false)}
                        className="btn-secondary min-h-[44px]"
                      >
                        Chiudi
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setLevelUpWizardOpen(true)}
                        disabled={char.level >= 20}
                        className="btn-secondary min-h-[44px]"
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Level Up
                      </Button>
                      <Button
                        onClick={startEditingCharacter}
                        className="btn-primary min-h-[44px]"
                      >
                        <GameIcon name="quill" category="ui" size={18} className="mr-2" />
                        Modifica
                      </Button>
                    </>
                  )}
                </div>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* Level Up Wizard */}
      {selectedCharacter && (
        <LevelUpWizard
          open={levelUpWizardOpen}
          character={selectedCharacter}
          onComplete={handleLevelUpComplete}
          onCancel={() => setLevelUpWizardOpen(false)}
        />
      )}

      {/* Character Sheet Preview Dialog (Player View) */}
      <Dialog open={!!viewingCharacterSheet} onOpenChange={() => setViewingCharacterSheet(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GameIcon name="scroll" category="ui" size={20} className="text-[var(--teal)]" />
              Vista Giocatore
            </DialogTitle>
            <DialogDescription>
              Questa è la scheda come la vede il giocatore
            </DialogDescription>
          </DialogHeader>
          {viewingCharacterSheet && (
            <CharacterSheet character={viewingCharacterSheet as Character} />
          )}
        </DialogContent>
      </Dialog>
    </main>
  )
}
