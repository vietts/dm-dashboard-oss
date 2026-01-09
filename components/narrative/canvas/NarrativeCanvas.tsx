'use client'

import { useCallback, useMemo, useState, useRef } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useReactFlow,
  ReactFlowProvider,
  Connection,
  Node,
  Edge
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { NarrativeNode, NarrativeEdge, NarrativeNodeLink, NarrativeCheck, StoryNote, Encounter } from '@/types/database'
import { useCanvasSync, CanvasNode, CanvasEdge, calculateAutoLayout } from '../hooks/useCanvasSync'
import { useResponsiveCanvas, CanvasCompactProvider } from '../hooks/useResponsiveCanvas'
import { NarrativeCanvasNode } from './NarrativeCanvasNode'
import { NarrativeCanvasEdge } from './NarrativeCanvasEdge'
import { GameIcon } from '@/components/icons/GameIcon'
import { Button } from '@/components/ui/button'
import { Minimize2, Maximize2 } from 'lucide-react'

// ============================================
// Node & Edge Types
// ============================================
const nodeTypes = {
  narrative: NarrativeCanvasNode
}

const edgeTypes = {
  narrative: NarrativeCanvasEdge
}

// ============================================
// Props
// ============================================
interface NarrativeCanvasProps {
  nodes: NarrativeNode[]
  edges: NarrativeEdge[]
  links: NarrativeNodeLink[]
  checks: NarrativeCheck[]
  notes: StoryNote[]
  encounters: Encounter[]
  onPositionUpdate: (nodeId: string, position: { x: number; y: number }) => Promise<boolean>
  onNodeSelect: (node: NarrativeNode | null) => void
  onEdgeSelect: (edge: NarrativeEdge | null) => void
  onCreateNode: (parentId: string, position?: { x: number; y: number }) => void
  onCreateEdge: (sourceId: string, targetId: string) => void
  onTakePath: (edgeId: string) => void
  onDeleteNode: (nodeId: string) => void
  onDeleteEdge: (edgeId: string) => void
}

// ============================================
// Inner Component (needs ReactFlowProvider)
// ============================================
function NarrativeCanvasInner({
  nodes,
  edges,
  links,
  checks,
  notes,
  encounters,
  onPositionUpdate,
  onNodeSelect,
  onEdgeSelect,
  onCreateNode,
  onCreateEdge,
  onTakePath,
  onDeleteNode,
  onDeleteEdge
}: NarrativeCanvasProps) {
  const reactFlowInstance = useReactFlow()
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)

  // Responsive canvas settings
  const { isCompact, isManualOverride, settings, toggleCompact } = useResponsiveCanvas()

  // Transform DB data to React Flow format
  const {
    canvasNodes,
    canvasEdges,
    onNodesChange,
    onEdgesChange
  } = useCanvasSync({
    nodes,
    edges,
    links,
    checks,
    onPositionUpdate
  })

  // Handle node click
  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id)
    setSelectedEdgeId(null)
    const dbNode = nodes.find(n => n.id === node.id)
    onNodeSelect(dbNode || null)
  }, [nodes, onNodeSelect])

  // Handle edge click
  const handleEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setSelectedEdgeId(edge.id)
    setSelectedNodeId(null)
    const dbEdge = edges.find(e => e.id === edge.id)
    onEdgeSelect(dbEdge || null)
  }, [edges, onEdgeSelect])

  // Handle pane click (deselect)
  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null)
    setSelectedEdgeId(null)
    onNodeSelect(null)
    onEdgeSelect(null)
  }, [onNodeSelect, onEdgeSelect])

  // Handle new edge creation via drag
  const handleConnect = useCallback((connection: Connection) => {
    if (connection.source && connection.target) {
      onCreateEdge(connection.source, connection.target)
    }
  }, [onCreateEdge])

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Ignora se focus su input/textarea
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

    const key = e.key.toLowerCase()

    switch (key) {
      case 'f':
        // Fit view - centra tutto
        reactFlowInstance.fitView({ padding: settings.fitViewPadding, maxZoom: settings.maxZoom })
        break
      case 'c':
        // Toggle compact mode
        toggleCompact()
        break
      case 'home':
        // Go to root node
        const rootNode = nodes.find(n => n.is_root)
        if (rootNode) {
          reactFlowInstance.setCenter(
            rootNode.position_x || 0,
            rootNode.position_y || 0,
            { zoom: 1, duration: 300 }
          )
        }
        break
      case 'delete':
      case 'backspace':
        if (selectedNodeId) {
          const node = nodes.find(n => n.id === selectedNodeId)
          if (node && !node.is_root) {
            onDeleteNode(selectedNodeId)
            setSelectedNodeId(null)
          }
        } else if (selectedEdgeId) {
          onDeleteEdge(selectedEdgeId)
          setSelectedEdgeId(null)
        }
        break
    }
  }, [selectedNodeId, selectedEdgeId, nodes, onDeleteNode, onDeleteEdge, reactFlowInstance, settings, toggleCompact])

  // Fit view on mount
  const onInit = useCallback(() => {
    setTimeout(() => {
      reactFlowInstance.fitView({ padding: settings.fitViewPadding, maxZoom: settings.maxZoom })
    }, 100)
  }, [reactFlowInstance, settings.fitViewPadding, settings.maxZoom])

  // Auto-layout button
  const handleAutoLayout = useCallback(async () => {
    const newPositions = calculateAutoLayout(nodes, edges, {
      nodesep: settings.nodesep,
      ranksep: settings.ranksep,
      edgesep: settings.edgesep,
      marginx: settings.marginx,
      marginy: settings.marginy,
      nodeWidth: settings.nodeWidth,
      nodeHeight: settings.nodeHeight
    })

    // Update all positions
    for (const [nodeId, position] of newPositions) {
      await onPositionUpdate(nodeId, position)
    }

    // Fit view after layout
    setTimeout(() => {
      reactFlowInstance.fitView({ padding: settings.fitViewPadding, maxZoom: settings.maxZoom })
    }, 100)
  }, [nodes, edges, onPositionUpdate, reactFlowInstance, settings])

  // Minimap colors
  const nodeColor = useCallback((node: Node) => {
    const data = (node as unknown as CanvasNode).data
    if (data?.isCurrent) return 'var(--coral)'
    if (data?.wasVisited) return 'var(--health-full)'
    if (data?.isRoot) return 'var(--teal)'
    return 'var(--ink-light)'
  }, [])

  return (
    <CanvasCompactProvider isCompact={isCompact}>
    <div
      className="w-full h-full bg-[var(--cream)]"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <ReactFlow
        nodes={canvasNodes}
        edges={canvasEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        onPaneClick={handlePaneClick}
        onInit={onInit}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        snapToGrid
        snapGrid={[20, 20]}
        defaultEdgeOptions={{
          type: 'narrative'
        }}
        proOptions={{ hideAttribution: true }}
      >
        {/* Background grid */}
        <Background
          color="var(--ink-faded)"
          gap={20}
          size={1}
        />

        {/* Zoom controls */}
        <Controls
          showZoom
          showFitView
          showInteractive={false}
          position="bottom-right"
          className="!bg-[var(--paper)] !border-[var(--teal)] !rounded-lg !shadow-md"
        />

        {/* Minimap - hover to expand */}
        <MiniMap
          nodeColor={nodeColor}
          nodeStrokeColor={() => 'var(--ink-faded)'}
          maskColor="rgba(0, 0, 0, 0.1)"
          className="!bg-[var(--cream-dark)] !border-2 !border-[var(--teal)] !rounded-lg transition-transform duration-200 hover:scale-125 origin-bottom-left"
          position="bottom-left"
        />

        {/* Toolbar */}
        <Panel position="top-right" className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleCompact}
            className={`bg-[var(--paper)] border-[var(--teal)] hover:bg-[var(--cream)] ${isCompact ? 'ring-2 ring-[var(--teal)]' : ''}`}
            title={isCompact ? 'Espandi nodi' : 'Compatta nodi'}
          >
            {isCompact ? <Maximize2 size={14} className="mr-1" /> : <Minimize2 size={14} className="mr-1" />}
            {isCompact ? 'Espandi' : 'Compatta'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAutoLayout}
            className="bg-[var(--paper)] border-[var(--teal)] hover:bg-[var(--cream)]"
          >
            <GameIcon name="scroll" category="ui" size={14} className="mr-1" />
            Auto-layout
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => reactFlowInstance.fitView({ padding: settings.fitViewPadding, maxZoom: settings.maxZoom })}
            className="bg-[var(--paper)] border-[var(--teal)] hover:bg-[var(--cream)]"
          >
            <GameIcon name="compass" category="ui" size={14} className="mr-1" />
            Centra
          </Button>
        </Panel>

        {/* Legend */}
        <Panel position="top-left" className="text-xs text-[var(--ink-light)] bg-[var(--paper)]/80 p-2 rounded-lg border border-[var(--ink-faded)]/20">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[var(--teal)]" />
              <span>Root</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[var(--coral)]" />
              <span>Corrente</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[var(--health-full)]" />
              <span>Visitato</span>
            </div>
            <div className="mt-1.5 pt-1.5 border-t border-[var(--ink-faded)]/20 space-y-0.5">
              <span className="text-[10px] text-[var(--ink-faded)] block">
                💡 Trascina ● → ● per collegare
              </span>
              <span className="text-[10px] text-[var(--ink-faded)] block">
                ⌨️ F=Centra • C=Compatta • Home=Root
              </span>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
    </CanvasCompactProvider>
  )
}

// ============================================
// Main Export (with Provider)
// ============================================
export function NarrativeCanvas(props: NarrativeCanvasProps) {
  return (
    <ReactFlowProvider>
      <NarrativeCanvasInner {...props} />
    </ReactFlowProvider>
  )
}
