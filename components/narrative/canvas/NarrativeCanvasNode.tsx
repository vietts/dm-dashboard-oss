'use client'

import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import { GameIcon } from '@/components/icons/GameIcon'
import { CanvasNodeData } from '../hooks/useCanvasSync'

interface NarrativeCanvasNodeProps {
  data: CanvasNodeData
  selected?: boolean
}

// ============================================
// Custom Node Component
// ============================================
export const NarrativeCanvasNode = memo(function NarrativeCanvasNode({
  data,
  selected
}: NarrativeCanvasNodeProps) {
  const { label, description, isRoot, isCurrent, wasVisited, linkedNotes, linkedEncounters } = data

  // Determine border/ring color based on state
  let borderColor = 'border-[var(--ink-faded)]/30'
  let ringClass = ''
  let bgClass = 'bg-[var(--paper)]'

  if (isCurrent) {
    borderColor = 'border-[var(--coral)]'
    ringClass = 'ring-2 ring-[var(--coral)]/30'
    bgClass = 'bg-[var(--coral)]/5'
  } else if (wasVisited) {
    borderColor = 'border-[var(--health-full)]'
    bgClass = 'bg-[var(--health-full)]/5'
  } else if (isRoot) {
    borderColor = 'border-[var(--teal)]'
    ringClass = 'ring-2 ring-[var(--teal)]/20'
  }

  if (selected) {
    ringClass = 'ring-2 ring-[var(--teal)]'
  }

  return (
    <div
      className={`
        min-w-[160px] max-w-[220px]
        rounded-lg border-2 ${borderColor} ${bgClass} ${ringClass}
        shadow-md hover:shadow-lg transition-all duration-200
        cursor-grab active:cursor-grabbing
      `}
    >
      {/* Incoming edge handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-[var(--teal)] !border-[var(--paper)] !border-2 !w-3 !h-3"
      />

      {/* Header with icon */}
      <div className={`
        px-3 py-2 border-b border-[var(--ink-faded)]/10
        flex items-center gap-2
        ${isCurrent ? 'bg-[var(--coral)]/10' : wasVisited ? 'bg-[var(--health-full)]/10' : isRoot ? 'bg-[var(--teal)]/10' : ''}
      `}>
        {/* Status icon */}
        {isRoot && (
          <GameIcon name="flag" category="ui" size={14} className="text-[var(--teal)]" />
        )}
        {isCurrent && !isRoot && (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--coral)] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--coral)]"></span>
          </span>
        )}
        {wasVisited && !isCurrent && !isRoot && (
          <GameIcon name="checkmark" category="ui" size={14} className="text-[var(--health-full)]" />
        )}
        {!isRoot && !isCurrent && !wasVisited && (
          <GameIcon name="scroll" category="ui" size={14} className="text-[var(--ink-light)]" />
        )}

        {/* Title */}
        <span className="font-medium text-[var(--ink)] text-sm truncate flex-1">
          {label}
        </span>
      </div>

      {/* Content */}
      <div className="px-3 py-2 space-y-1">
        {/* Description preview */}
        {description && (
          <p className="text-xs text-[var(--ink-light)] line-clamp-2">
            {description}
          </p>
        )}

        {/* Linked content badges */}
        {(linkedNotes > 0 || linkedEncounters > 0) && (
          <div className="flex gap-2 pt-1">
            {linkedNotes > 0 && (
              <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 bg-[var(--teal)]/10 text-[var(--teal)] rounded border border-[var(--teal)]/20">
                <GameIcon name="scroll" category="ui" size={10} />
                {linkedNotes}
              </span>
            )}
            {linkedEncounters > 0 && (
              <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 bg-[var(--coral)]/10 text-[var(--coral)] rounded border border-[var(--coral)]/20">
                <GameIcon name="combat" category="ui" size={10} />
                {linkedEncounters}
              </span>
            )}
          </div>
        )}

        {/* Empty state */}
        {!description && linkedNotes === 0 && linkedEncounters === 0 && (
          <p className="text-xs text-[var(--ink-faded)] italic">
            Nessun contenuto
          </p>
        )}
      </div>

      {/* Outgoing edge handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-[var(--teal)] !border-[var(--paper)] !border-2 !w-3 !h-3"
      />
    </div>
  )
})
