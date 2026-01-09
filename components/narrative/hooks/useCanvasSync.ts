'use client'

import { useMemo, useCallback, useRef, useEffect, useState } from 'react'
import { Node, Edge, NodeChange, EdgeChange, applyNodeChanges, applyEdgeChanges, XYPosition } from '@xyflow/react'
import { NarrativeNode, NarrativeEdge, NarrativeNodeLink, NarrativeCheck, StoryNote, Encounter } from '@/types/database'
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
  isRoot: boolean | null
  isCurrent: boolean | null
  wasVisited: boolean | null
  linkedNotes: number
  linkedEncounters: number
  checksCount: number
  label: string
  description: string | null
  [key: string]: unknown // Index signature for React Flow compatibility
}

export interface CanvasEdgeData {
  dbEdge: NarrativeEdge
  wasTaken: boolean | null
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
  checks: NarrativeCheck[]
}

export function transformToCanvasNodes(options: TransformOptions): CanvasNode[] {
  const { nodes, edges, links, checks } = options

  // Count links per node
  const linkCounts = new Map<string, { notes: number; encounters: number }>()
  links.forEach(link => {
    const existing = linkCounts.get(link.node_id) || { notes: 0, encounters: 0 }
    if (link.link_type === 'note') existing.notes++
    else if (link.link_type === 'encounter') existing.encounters++
    linkCounts.set(link.node_id, existing)
  })

  // Count checks per node
  const checkCounts = new Map<string, number>()
  checks.forEach(check => {
    const existing = checkCounts.get(check.node_id) || 0
    checkCounts.set(check.node_id, existing + 1)
  })

  return nodes.map(node => {
    const counts = linkCounts.get(node.id) || { notes: 0, encounters: 0 }
    const checksCount = checkCounts.get(node.id) || 0

    // Use stored positions, or auto-calculate based on index
    const position: XYPosition = {
      x: (node.position_x !== null && node.position_x !== 0) ? node.position_x : DEFAULT_START_X,
      y: (node.position_y !== null && node.position_y !== 0) ? node.position_y : DEFAULT_START_Y
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
        checksCount,
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
    animated: edge.was_taken ?? false, // Animate taken paths
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
  checks: NarrativeCheck[]
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
  checks,
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
    const baseNodes = transformToCanvasNodes({ nodes, edges, links, checks })

    // Override positions with local state during drag
    return baseNodes.map(node => {
      const localPos = localPositions.get(node.id)
      if (localPos) {
        return { ...node, position: localPos }
      }
      return node
    })
  }, [nodes, edges, links, checks, localPositions])

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
    x: (parentNode.position_x ?? DEFAULT_START_X) + (siblingCount * GRID_X),
    y: (parentNode.position_y ?? DEFAULT_START_Y) + GRID_Y
  }
}

// ============================================
// Re-layout all nodes (Dagre algorithm)
// ============================================
export interface DagreLayoutSettings {
  nodesep: number
  ranksep: number
  edgesep: number
  marginx: number
  marginy: number
  nodeWidth: number
  nodeHeight: number
}

// Default settings (normal mode)
const DEFAULT_DAGRE_SETTINGS: DagreLayoutSettings = {
  nodesep: 160,
  ranksep: 160,
  edgesep: 70,
  marginx: 60,
  marginy: 60,
  nodeWidth: 200,
  nodeHeight: 90
}

export function calculateAutoLayout(
  nodes: NarrativeNode[],
  edges: NarrativeEdge[],
  settings?: Partial<DagreLayoutSettings>
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>()

  if (nodes.length === 0) return positions

  // Merge with defaults
  const s = { ...DEFAULT_DAGRE_SETTINGS, ...settings }

  // Create dagre graph
  const g = new dagre.graphlib.Graph()

  g.setGraph({
    rankdir: 'TB',      // Top to Bottom
    nodesep: s.nodesep,
    ranksep: s.ranksep,
    edgesep: s.edgesep,
    marginx: s.marginx,
    marginy: s.marginy
  })

  g.setDefaultEdgeLabel(() => ({}))

  // Add nodes with dimensions
  nodes.forEach(node => {
    g.setNode(node.id, {
      width: s.nodeWidth,
      height: s.nodeHeight
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
