'use client'

import { useMemo, useCallback, useRef, useEffect, useState } from 'react'
import { Node, Edge, NodeChange, EdgeChange, applyNodeChanges, applyEdgeChanges, XYPosition } from '@xyflow/react'
import { NarrativeNode, NarrativeEdge, NarrativeNodeLink, StoryNote, Encounter } from '@/types/database'
import dagre from '@dagrejs/dagre'

// Default grid spacing for auto-layout
const GRID_X = 200
const GRID_Y = 150
const DEFAULT_START_X = 100
const DEFAULT_START_Y = 100

// ============================================
// Types for React Flow
// ============================================
export interface CanvasNodeData {
  dbNode: NarrativeNode
  isRoot: boolean
  isCurrent: boolean
  wasVisited: boolean
  linkedNotes: number
  linkedEncounters: number
  label: string
  description: string | null
  [key: string]: unknown // Index signature for React Flow compatibility
}

export interface CanvasEdgeData {
  dbEdge: NarrativeEdge
  wasTaken: boolean
  label: string | null
  [key: string]: unknown // Index signature for React Flow compatibility
}

// Use base Node and Edge types for broader compatibility
export type CanvasNode = Node<CanvasNodeData>
export type CanvasEdge = Edge<CanvasEdgeData>

// ============================================
// Transform DB → React Flow
// ============================================
interface TransformOptions {
  nodes: NarrativeNode[]
  edges: NarrativeEdge[]
  links: NarrativeNodeLink[]
}

export function transformToCanvasNodes(options: TransformOptions): CanvasNode[] {
  const { nodes, edges, links } = options

  // Count links per node
  const linkCounts = new Map<string, { notes: number; encounters: number }>()
  links.forEach(link => {
    const existing = linkCounts.get(link.node_id) || { notes: 0, encounters: 0 }
    if (link.link_type === 'note') existing.notes++
    else if (link.link_type === 'encounter') existing.encounters++
    linkCounts.set(link.node_id, existing)
  })

  return nodes.map(node => {
    const counts = linkCounts.get(node.id) || { notes: 0, encounters: 0 }

    // Use stored positions, or auto-calculate based on index
    const position: XYPosition = {
      x: node.position_x !== 0 ? node.position_x : DEFAULT_START_X,
      y: node.position_y !== 0 ? node.position_y : DEFAULT_START_Y
    }

    return {
      id: node.id,
      type: 'narrative',
      position,
      data: {
        dbNode: node,
        isRoot: node.is_root,
        isCurrent: node.is_current,
        wasVisited: node.was_visited,
        linkedNotes: counts.notes,
        linkedEncounters: counts.encounters,
        label: node.title,
        description: node.description
      }
    }
  })
}

export function transformToCanvasEdges(edges: NarrativeEdge[]): CanvasEdge[] {
  return edges.map(edge => ({
    id: edge.id,
    source: edge.from_node_id,
    target: edge.to_node_id,
    type: 'narrative',
    animated: edge.was_taken, // Animate taken paths
    data: {
      dbEdge: edge,
      wasTaken: edge.was_taken,
      label: edge.label
    }
  }))
}

// ============================================
// Hook: useCanvasSync
// ============================================
interface UseCanvasSyncOptions {
  nodes: NarrativeNode[]
  edges: NarrativeEdge[]
  links: NarrativeNodeLink[]
  onPositionUpdate: (nodeId: string, position: { x: number; y: number }) => Promise<boolean>
}

interface UseCanvasSyncResult {
  canvasNodes: CanvasNode[]
  canvasEdges: CanvasEdge[]
  onNodesChange: (changes: NodeChange<CanvasNode>[]) => void
  onEdgesChange: (changes: EdgeChange<CanvasEdge>[]) => void
}

export function useCanvasSync({
  nodes,
  edges,
  links,
  onPositionUpdate
}: UseCanvasSyncOptions): UseCanvasSyncResult {
  // Local state for positions during drag (for smooth UI)
  const [localPositions, setLocalPositions] = useState<Map<string, XYPosition>>(new Map())

  // Track pending position updates for debouncing
  const pendingUpdates = useRef<Map<string, { x: number; y: number }>>(new Map())
  const updateTimeout = useRef<NodeJS.Timeout | null>(null)

  // Reset local positions when DB data changes
  useEffect(() => {
    setLocalPositions(new Map())
  }, [nodes])

  // Transform DB data to React Flow format, merging with local positions
  const canvasNodes = useMemo(() => {
    const baseNodes = transformToCanvasNodes({ nodes, edges, links })

    // Override positions with local state during drag
    return baseNodes.map(node => {
      const localPos = localPositions.get(node.id)
      if (localPos) {
        return { ...node, position: localPos }
      }
      return node
    })
  }, [nodes, edges, links, localPositions])

  const canvasEdges = useMemo(() => {
    return transformToCanvasEdges(edges)
  }, [edges])

  // Debounced save function
  const flushUpdates = useCallback(async () => {
    const updates = Array.from(pendingUpdates.current.entries())
    pendingUpdates.current.clear()

    for (const [nodeId, position] of updates) {
      await onPositionUpdate(nodeId, {
        x: Math.round(position.x),
        y: Math.round(position.y)
      })
    }
  }, [onPositionUpdate])

  // Schedule debounced update
  const scheduleUpdate = useCallback((nodeId: string, position: { x: number; y: number }) => {
    pendingUpdates.current.set(nodeId, position)

    if (updateTimeout.current) {
      clearTimeout(updateTimeout.current)
    }

    updateTimeout.current = setTimeout(() => {
      flushUpdates()
    }, 300) // 300ms debounce
  }, [flushUpdates])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (updateTimeout.current) {
        clearTimeout(updateTimeout.current)
      }
    }
  }, [])

  // Handle node changes (position, selection, etc.)
  const onNodesChange = useCallback((changes: NodeChange<CanvasNode>[]) => {
    changes.forEach(change => {
      if (change.type === 'position' && change.position) {
        // Update local position immediately for smooth drag
        setLocalPositions(prev => {
          const next = new Map(prev)
          next.set(change.id, change.position!)
          return next
        })

        // Only save to DB when drag ends
        if (change.dragging === false) {
          scheduleUpdate(change.id, change.position)
        }
      }
    })
  }, [scheduleUpdate])

  // Handle edge changes
  const onEdgesChange = useCallback((changes: EdgeChange<CanvasEdge>[]) => {
    // For now, just log changes - edge deletion will be handled separately
    changes.forEach(change => {
      if (change.type === 'remove') {
        console.log('Edge remove requested:', change.id)
      }
    })
  }, [])

  return {
    canvasNodes,
    canvasEdges,
    onNodesChange,
    onEdgesChange
  }
}

// ============================================
// Auto-layout helper
// ============================================
export function calculateNewNodePosition(
  parentNode: NarrativeNode,
  siblingCount: number
): { x: number; y: number } {
  return {
    x: parentNode.position_x + (siblingCount * GRID_X),
    y: parentNode.position_y + GRID_Y
  }
}

// ============================================
// Re-layout all nodes (Dagre algorithm)
// ============================================
export function calculateAutoLayout(
  nodes: NarrativeNode[],
  edges: NarrativeEdge[]
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>()

  if (nodes.length === 0) return positions

  // Create dagre graph
  const g = new dagre.graphlib.Graph()

  g.setGraph({
    rankdir: 'TB',      // Top to Bottom
    nodesep: 180,       // Horizontal spacing between nodes (+80% for Bezier curves)
    ranksep: 200,       // Vertical spacing between ranks (+67% for labels)
    edgesep: 80,        // Spacing between edges (+60% to avoid overlap)
    marginx: 80,
    marginy: 80
  })

  g.setDefaultEdgeLabel(() => ({}))

  // Add nodes with dimensions matching CSS (max-w-[220px])
  nodes.forEach(node => {
    g.setNode(node.id, {
      width: 220,   // Match CSS max-width
      height: 100   // Include padding and badges
    })
  })

  // Add edges
  edges.forEach(edge => {
    g.setEdge(edge.from_node_id, edge.to_node_id)
  })

  // Calculate layout
  dagre.layout(g)

  // Extract positions
  nodes.forEach(node => {
    const nodeLayout = g.node(node.id)
    if (nodeLayout) {
      positions.set(node.id, {
        x: Math.round(nodeLayout.x),
        y: Math.round(nodeLayout.y)
      })
    }
  })

  return positions
}
