'use client'

import { memo } from 'react'
import {
  getBezierPath,
  EdgeLabelRenderer,
  BaseEdge,
  Position
} from '@xyflow/react'
import { CanvasEdgeData } from '../hooks/useCanvasSync'

interface NarrativeCanvasEdgeProps {
  id: string
  sourceX: number
  sourceY: number
  targetX: number
  targetY: number
  sourcePosition: Position
  targetPosition: Position
  data?: CanvasEdgeData
  selected?: boolean
  markerEnd?: string
}

// ============================================
// Custom Edge Component
// ============================================
export const NarrativeCanvasEdge = memo(function NarrativeCanvasEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  markerEnd
}: NarrativeCanvasEdgeProps) {
  const wasTaken = data?.wasTaken ?? false
  const label = data?.label

  // Calculate bezier path
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.25
  })

  // Edge styling
  const strokeColor = wasTaken ? 'var(--health-full)' : 'var(--ink-faded)'
  const strokeWidth = wasTaken ? 3 : 2
  const strokeDasharray = wasTaken ? 'none' : '5,5'
  const strokeOpacity = selected ? 1 : wasTaken ? 0.9 : 0.6

  return (
    <>
      {/* Main path */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: strokeColor,
          strokeWidth,
          strokeDasharray,
          opacity: strokeOpacity,
          transition: 'stroke 0.2s, stroke-width 0.2s, opacity 0.2s'
        }}
      />

      {/* Animated overlay for taken paths */}
      {wasTaken && (
        <path
          d={edgePath}
          fill="none"
          stroke="var(--health-full)"
          strokeWidth={strokeWidth}
          strokeOpacity={0.3}
          className="animate-pulse"
        />
      )}

      {/* Selection highlight */}
      {selected && (
        <path
          d={edgePath}
          fill="none"
          stroke="var(--teal)"
          strokeWidth={strokeWidth + 4}
          strokeOpacity={0.3}
        />
      )}

      {/* Edge Label */}
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all'
            }}
            className={`
              px-2 py-1 rounded-full text-xs font-medium
              ${wasTaken
                ? 'bg-[var(--health-full)]/20 text-[var(--health-full)] border border-[var(--health-full)]/30'
                : 'bg-[var(--paper)] text-[var(--ink-light)] border border-[var(--ink-faded)]/30'
              }
              shadow-sm
              ${selected ? 'ring-1 ring-[var(--teal)]' : ''}
            `}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
})
