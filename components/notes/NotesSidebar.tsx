'use client'

import { useState } from 'react'
import { StoryNote } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { GameIcon } from '@/components/icons/GameIcon'
import { ChevronRight, Plus } from 'lucide-react'
import { NotesSidebarItem } from './NotesSidebarItem'
import { NotesSearch } from './NotesSearch'
import { useNotes, NOTE_TYPES, NoteType, NoteTypeValue } from './hooks/useNotesContext'
import { cn } from '@/lib/utils'

interface NotesSidebarProps {
  onCreateNote?: (type: NoteTypeValue) => void
}

export function NotesSidebar({ onCreateNote }: NotesSidebarProps) {
  const {
    notesByType,
    filteredNotes,
    selectedNoteId,
    selectNote,
    searchQuery,
    setSearchQuery,
    activeTypeFilter,
    setActiveTypeFilter,
  } = useNotes()

  // Track which groups are expanded
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    NOTE_TYPES.forEach(type => {
      initial[type.value] = true // All expanded by default
    })
    return initial
  })

  const toggleGroup = (type: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [type]: !prev[type],
    }))
  }

  // When searching, show flat list instead of grouped
  const isSearching = searchQuery.trim().length > 0

  return (
    <div className="h-full flex flex-col bg-white border-r border-[var(--border)]">
      {/* Search */}
      <div className="p-3 border-b border-[var(--border)]">
        <NotesSearch
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Cerca note..."
        />
      </div>

      {/* Type Filters - horizontal scroll on mobile */}
      <div className="px-3 py-2 border-b border-[var(--border)] overflow-x-auto">
        <div className="flex gap-1.5 min-w-max">
          <button
            onClick={() => setActiveTypeFilter('all')}
            className={cn(
              'px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
              activeTypeFilter === 'all'
                ? 'bg-[var(--ink)] text-white'
                : 'bg-[var(--paper)] text-[var(--ink-light)] hover:text-[var(--ink)]'
            )}
          >
            Tutti
          </button>
          {NOTE_TYPES.map(type => {
            const count = notesByType[type.value]?.length || 0
            return (
              <button
                key={type.value}
                onClick={() => setActiveTypeFilter(type.value)}
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5',
                  activeTypeFilter === type.value
                    ? 'text-white'
                    : 'bg-[var(--paper)] text-[var(--ink-light)] hover:text-[var(--ink)]'
                )}
                style={{
                  backgroundColor: activeTypeFilter === type.value ? type.color : undefined,
                }}
              >
                <GameIcon name={type.icon} category="ui" size={12} />
                {type.label}
                {count > 0 && (
                  <span className={cn(
                    'text-[10px] px-1.5 rounded-full',
                    activeTypeFilter === type.value
                      ? 'bg-white/20'
                      : 'bg-[var(--border)]'
                  )}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto p-2">
        {isSearching || activeTypeFilter !== 'all' ? (
          // Flat filtered list
          <div className="space-y-1">
            {filteredNotes.length === 0 ? (
              <div className="text-center py-8 text-[var(--ink-light)] text-sm">
                Nessuna nota trovata
              </div>
            ) : (
              filteredNotes.map(note => (
                <NotesSidebarItem
                  key={note.id}
                  note={note}
                  isSelected={note.id === selectedNoteId}
                  onClick={() => selectNote(note.id)}
                />
              ))
            )}
          </div>
        ) : (
          // Grouped by type
          <div className="space-y-2">
            {NOTE_TYPES.map(type => {
              const typeNotes = notesByType[type.value] || []
              if (typeNotes.length === 0) return null

              return (
                <Collapsible
                  key={type.value}
                  open={expandedGroups[type.value]}
                  onOpenChange={() => toggleGroup(type.value)}
                >
                  <div className="flex items-center group">
                    <CollapsibleTrigger asChild>
                      <button className="flex-1 flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[var(--paper)] transition-colors">
                        <ChevronRight
                          size={14}
                          className={cn(
                            'text-[var(--ink-light)] transition-transform',
                            expandedGroups[type.value] && 'rotate-90'
                          )}
                        />
                        <span style={{ color: type.color }}>
                          <GameIcon
                            name={type.icon}
                            category="ui"
                            size={16}
                          />
                        </span>
                        <span className="flex-1 text-left text-sm font-medium text-[var(--ink)]">
                          {type.label}
                        </span>
                        <span className="text-xs text-[var(--ink-light)] bg-[var(--paper)] px-1.5 py-0.5 rounded">
                          {typeNotes.length}
                        </span>
                      </button>
                    </CollapsibleTrigger>
                    {onCreateNote && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onCreateNote(type.value)
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[var(--teal)]/10 text-[var(--teal)] transition-opacity"
                      >
                        <Plus size={14} />
                      </button>
                    )}
                  </div>
                  <CollapsibleContent>
                    <div className="ml-4 mt-1 space-y-0.5">
                      {typeNotes.map(note => (
                        <NotesSidebarItem
                          key={note.id}
                          note={note}
                          isSelected={note.id === selectedNoteId}
                          onClick={() => selectNote(note.id)}
                        />
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )
            })}
          </div>
        )}
      </div>

      {/* Create Note Button */}
      {onCreateNote && (
        <div className="p-3 border-t border-[var(--border)]">
          <Button
            onClick={() => onCreateNote('general')}
            variant="outline"
            className="w-full gap-2"
          >
            <Plus size={16} />
            Nuova Nota
          </Button>
        </div>
      )}
    </div>
  )
}
