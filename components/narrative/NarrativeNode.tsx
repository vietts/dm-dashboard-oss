'use client'

import { useState } from 'react'
import { NarrativeNode as NarrativeNodeType, NarrativeEdge, StoryNote, Encounter, Monster } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GameIcon } from '@/components/icons/GameIcon'
import { cn } from '@/lib/utils'

interface NarrativeNodeProps {
  node: NarrativeNodeType
  outgoingEdges: NarrativeEdge[]
  linkedNotes: StoryNote[]
  linkedEncounters: Encounter[]
  linkedMonsters: Monster[]
  isLiveMode: boolean
  onEdit: () => void
  onAddChild: () => void
  onTakePath: (edgeId: string) => void
  onSetCurrent: () => void
  onDelete: () => void
  children?: React.ReactNode
  depth?: number
}

export function NarrativeNode({
  node,
  outgoingEdges,
  linkedNotes,
  linkedEncounters,
  linkedMonsters,
  isLiveMode,
  onEdit,
  onAddChild,
  onTakePath,
  onSetCurrent,
  onDelete,
  children,
  depth = 0
}: NarrativeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const hasChildren = outgoingEdges.length > 0

  // Determine visual state
  const isCurrent = node.is_current
  const isVisited = node.was_visited
  const isRoot = node.is_root

  return (
    <div className="relative">
      {/* Node card */}
      <div
        className={cn(
          "bg-[var(--paper)] rounded-lg border-2 transition-all duration-200",
          "hover:shadow-md",
          isCurrent && "border-[var(--coral)] shadow-lg shadow-[var(--coral)]/20 animate-pulse-subtle",
          isVisited && !isCurrent && "border-green-400 bg-green-50/30",
          !isCurrent && !isVisited && "border-[var(--ink-faded)]/20",
          isRoot && "ring-2 ring-[var(--teal)]/30"
        )}
      >
        {/* Header */}
        <div
          className="flex items-center gap-2 p-3 cursor-pointer"
          onClick={() => hasChildren && setIsExpanded(!isExpanded)}
        >
          {/* Expand/Collapse icon */}
          {hasChildren ? (
            <span
              className="text-[var(--ink-light)] transition-transform duration-200 text-sm"
              style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
            >
              ▸
            </span>
          ) : (
            <span className="w-3" />
          )}

          {/* Status icon */}
          {isCurrent && (
            <span className="w-2 h-2 rounded-full bg-[var(--coral)] animate-pulse" />
          )}
          {isVisited && !isCurrent && (
            <GameIcon name="check" category="ui" size={14} className="text-green-600" />
          )}
          {isRoot && (
            <GameIcon name="flag" category="ui" size={14} className="text-[var(--teal)]" />
          )}

          {/* Title */}
          <span className="flex-1 font-medium text-[var(--ink)] truncate">
            {node.title}
          </span>

          {/* Badges */}
          <div className="flex items-center gap-1">
            {linkedNotes.length > 0 && (
              <Badge variant="outline" className="text-xs py-0 px-1">
                <GameIcon name="scroll" category="ui" size={10} className="mr-0.5" />
                {linkedNotes.length}
              </Badge>
            )}
            {linkedEncounters.length > 0 && (
              <Badge variant="outline" className="text-xs py-0 px-1 text-[var(--coral)]">
                <GameIcon name="swords" category="ui" size={10} className="mr-0.5" />
                {linkedEncounters.length}
              </Badge>
            )}
            {outgoingEdges.length > 0 && (
              <Badge variant="outline" className="text-xs py-0 px-1 text-[var(--ink-light)]">
                {outgoingEdges.length} →
              </Badge>
            )}
          </div>
        </div>

        {/* Description (if exists) */}
        {node.description && (
          <div className="px-3 pb-2 text-sm text-[var(--ink-light)] line-clamp-2">
            {node.description}
          </div>
        )}

        {/* Linked content preview */}
        {(linkedNotes.length > 0 || linkedEncounters.length > 0 || linkedMonsters.length > 0) && (
          <div className="px-3 pb-2 flex flex-wrap gap-1">
            {linkedNotes.slice(0, 3).map(note => (
              <Badge key={note.id} variant="secondary" className="text-xs">
                {note.title}
              </Badge>
            ))}
            {linkedEncounters.slice(0, 2).map(enc => (
              <Badge key={enc.id} variant="secondary" className="text-xs text-[var(--coral)]">
                {enc.name}
              </Badge>
            ))}
            {linkedMonsters.slice(0, 2).map(mon => (
              <Badge key={mon.id} variant="secondary" className="text-xs text-purple-600">
                {mon.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 p-2 border-t border-[var(--ink-faded)]/10">
          <Button variant="ghost" size="sm" onClick={onEdit} className="h-7 px-2 text-xs">
            <GameIcon name="quill" category="ui" size={12} className="mr-1" />
            Modifica
          </Button>
          <Button variant="ghost" size="sm" onClick={onAddChild} className="h-7 px-2 text-xs">
            <GameIcon name="plus" category="ui" size={12} className="mr-1" />
            Aggiungi
          </Button>
          {isLiveMode && !isCurrent && (
            <Button variant="ghost" size="sm" onClick={onSetCurrent} className="h-7 px-2 text-xs text-[var(--coral)]">
              Vai qui
            </Button>
          )}
          {!isRoot && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-7 px-2 text-xs text-red-500 hover:text-red-600 ml-auto"
            >
              <GameIcon name="trash" category="ui" size={12} />
            </Button>
          )}
        </div>
      </div>

      {/* Outgoing edges (paths) - shown only in live mode when current */}
      {isLiveMode && isCurrent && outgoingEdges.length > 0 && (
        <div className="mt-2 ml-6 space-y-1">
          <p className="text-xs text-[var(--ink-light)] font-medium mb-1">Scegli il percorso:</p>
          {outgoingEdges.map(edge => (
            <Button
              key={edge.id}
              variant="outline"
              size="sm"
              onClick={() => onTakePath(edge.id)}
              className={cn(
                "w-full justify-start h-8 text-xs",
                edge.was_taken && "border-green-400 bg-green-50"
              )}
            >
              <span className="mr-2">→</span>
              {edge.label || 'Prosegui'}
              {edge.was_taken && (
                <GameIcon name="check" category="ui" size={12} className="ml-auto text-green-600" />
              )}
            </Button>
          ))}
        </div>
      )}

      {/* Children (expanded tree) */}
      {isExpanded && children && (
        <div className="ml-6 mt-2 pl-4 border-l-2 border-[var(--ink-faded)]/10 space-y-2">
          {children}
        </div>
      )}
    </div>
  )
}
