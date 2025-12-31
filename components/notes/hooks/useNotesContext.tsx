'use client'

import { createContext, useContext, useState, useMemo, useCallback, ReactNode } from 'react'
import { StoryNote, Monster } from '@/types/database'

// Note types configuration
export const NOTE_TYPES = [
  { value: 'general', label: 'Generale', icon: 'book', color: 'var(--ink-light)' },
  { value: 'npc', label: 'PNG', icon: 'masks', color: 'var(--coral)' },
  { value: 'location', label: 'Luogo', icon: 'scroll', color: 'var(--teal)' },
  { value: 'quest', label: 'Quest', icon: 'combat', color: '#eab308' },
  { value: 'secret', label: 'Segreto', icon: 'skull', color: '#a855f7' },
  { value: 'lore', label: 'Lore', icon: 'dragon', color: '#3b82f6' },
] as const

export type NoteType = typeof NOTE_TYPES[number]
export type NoteTypeValue = NoteType['value']

interface NotesContextValue {
  // Data
  notes: StoryNote[]
  monsters: Monster[]
  noteTypes: readonly NoteType[]
  campaignId: string

  // Selection
  selectedNoteId: string | null
  selectedNote: StoryNote | null
  selectedNoteMonster: Monster | null
  selectNote: (id: string | null) => void

  // Filters
  searchQuery: string
  setSearchQuery: (query: string) => void
  activeTypeFilter: NoteTypeValue | 'all'
  setActiveTypeFilter: (type: NoteTypeValue | 'all') => void
  filteredNotes: StoryNote[]
  notesByType: Record<string, StoryNote[]>

  // CRUD
  createNote: (data: Partial<StoryNote>) => Promise<void>
  updateNote: (id: string, updates: Partial<StoryNote>) => Promise<void>
  deleteNote: (id: string) => Promise<void>
  onMonsterCreated?: (monster: Monster) => void

  // UI State
  isEditing: boolean
  setIsEditing: (value: boolean) => void
  isMobilePanelOpen: boolean
  setIsMobilePanelOpen: (value: boolean) => void
}

const NotesContext = createContext<NotesContextValue | null>(null)

interface NotesProviderProps {
  children: ReactNode
  campaignId: string
  notes: StoryNote[]
  monsters: Monster[]
  onCreateNote: (data: Partial<StoryNote>) => Promise<void>
  onUpdateNote: (id: string, updates: Partial<StoryNote>) => Promise<void>
  onDeleteNote: (id: string) => Promise<void>
  onMonsterCreated?: (monster: Monster) => void
}

export function NotesProvider({
  children,
  campaignId,
  notes,
  monsters,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
  onMonsterCreated,
}: NotesProviderProps) {
  // Selection state
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTypeFilter, setActiveTypeFilter] = useState<NoteTypeValue | 'all'>('all')

  // UI state
  const [isEditing, setIsEditing] = useState(false)
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false)

  // Computed: selected note
  const selectedNote = useMemo(() => {
    return notes.find(n => n.id === selectedNoteId) || null
  }, [notes, selectedNoteId])

  // Computed: monster linked to selected NPC note
  const selectedNoteMonster = useMemo(() => {
    if (!selectedNote || selectedNote.note_type !== 'npc' || !selectedNote.monster_id) {
      return null
    }
    return monsters.find(m => m.id === selectedNote.monster_id) || null
  }, [selectedNote, monsters])

  // Computed: notes grouped by type
  const notesByType = useMemo(() => {
    const grouped: Record<string, StoryNote[]> = {}
    NOTE_TYPES.forEach(type => {
      grouped[type.value] = notes.filter(n => n.note_type === type.value)
    })
    return grouped
  }, [notes])

  // Computed: filtered notes
  const filteredNotes = useMemo(() => {
    let result = notes

    // Filter by type
    if (activeTypeFilter !== 'all') {
      result = result.filter(n => n.note_type === activeTypeFilter)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(n =>
        n.title.toLowerCase().includes(query) ||
        (n.content && n.content.toLowerCase().includes(query)) ||
        (n.dm_notes && n.dm_notes.toLowerCase().includes(query))
      )
    }

    return result
  }, [notes, activeTypeFilter, searchQuery])

  // Select note handler
  const selectNote = useCallback((id: string | null) => {
    setSelectedNoteId(id)
    setIsEditing(false)
    // On mobile, open the detail panel
    if (id) {
      setIsMobilePanelOpen(true)
    }
  }, [])

  // CRUD wrappers
  const createNote = useCallback(async (data: Partial<StoryNote>) => {
    await onCreateNote(data)
  }, [onCreateNote])

  const updateNote = useCallback(async (id: string, updates: Partial<StoryNote>) => {
    await onUpdateNote(id, updates)
  }, [onUpdateNote])

  const deleteNote = useCallback(async (id: string) => {
    await onDeleteNote(id)
    // Clear selection if deleted note was selected
    if (selectedNoteId === id) {
      setSelectedNoteId(null)
      setIsMobilePanelOpen(false)
    }
  }, [onDeleteNote, selectedNoteId])

  const value: NotesContextValue = {
    notes,
    monsters,
    noteTypes: NOTE_TYPES,
    campaignId,
    selectedNoteId,
    selectedNote,
    selectedNoteMonster,
    selectNote,
    searchQuery,
    setSearchQuery,
    activeTypeFilter,
    setActiveTypeFilter,
    filteredNotes,
    notesByType,
    createNote,
    updateNote,
    deleteNote,
    onMonsterCreated,
    isEditing,
    setIsEditing,
    isMobilePanelOpen,
    setIsMobilePanelOpen,
  }

  return (
    <NotesContext.Provider value={value}>
      {children}
    </NotesContext.Provider>
  )
}

export function useNotes() {
  const context = useContext(NotesContext)
  if (!context) {
    throw new Error('useNotes must be used within a NotesProvider')
  }
  return context
}

// Helper to get note type config
export function getNoteTypeConfig(type: string): NoteType {
  return NOTE_TYPES.find(t => t.value === type) || NOTE_TYPES[0]
}
