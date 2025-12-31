'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useNarrativeTree } from './hooks/useNarrativeTree'
import { useNarrativeActions } from './hooks/useNarrativeActions'
import { NarrativeTimeline } from './NarrativeTimeline'
import { NarrativeCanvas } from './canvas'
import { NarrativeNode, NarrativeEdge, StoryNote, Encounter } from '@/types/database'
import { Button } from '@/components/ui/button'
import { GameIcon } from '@/components/icons/GameIcon'
import { Maximize2, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'

type ViewMode = 'timeline' | 'canvas'

interface NarrativeViewProps {
  actId: string
  campaignId: string
  actNumber: number
}

export function NarrativeView({ actId, campaignId, actNumber }: NarrativeViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('canvas')
  const [isFullscreen, setIsFullscreen] = useState(false)

  // ESC key to exit fullscreen
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false)
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isFullscreen])

  // Data hooks (shared)
  const {
    nodes,
    edges,
    links,
    rootNode,
    currentNode,
    loading,
    error,
    refetch,
    notes,
    encounters,
    monsters
  } = useNarrativeTree({ actId })

  const actions = useNarrativeActions({ actId, refetch })

  // Canvas-specific state
  const [selectedNode, setSelectedNode] = useState<NarrativeNode | null>(null)
  const [selectedEdge, setSelectedEdge] = useState<NarrativeEdge | null>(null)
  const [showNodeDialog, setShowNodeDialog] = useState(false)
  const [showEdgeDialog, setShowEdgeDialog] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createFromNodeId, setCreateFromNodeId] = useState<string | null>(null)
  const [createPosition, setCreatePosition] = useState<{ x: number; y: number } | null>(null)
  const [newNodeTitle, setNewNodeTitle] = useState('')
  const [newNodeDescription, setNewNodeDescription] = useState('')
  const [newEdgeLabel, setNewEdgeLabel] = useState('')

  // Handlers
  const handleNodeSelect = useCallback((node: NarrativeNode | null) => {
    setSelectedNode(node)
    setSelectedEdge(null)
    if (node) setShowNodeDialog(true)
  }, [])

  const handleEdgeSelect = useCallback((edge: NarrativeEdge | null) => {
    setSelectedEdge(edge)
    setSelectedNode(null)
    if (edge) setShowEdgeDialog(true)
  }, [])

  const handleCreateNode = useCallback((parentId: string, position?: { x: number; y: number }) => {
    setCreateFromNodeId(parentId)
    setCreatePosition(position || null)
    setNewNodeTitle('')
    setNewNodeDescription('')
    setNewEdgeLabel('')
    setShowCreateDialog(true)
  }, [])

  const handleCreateEdge = useCallback(async (sourceId: string, targetId: string) => {
    // Check if edge already exists
    const existingEdge = edges.find(
      e => e.from_node_id === sourceId && e.to_node_id === targetId
    )
    if (existingEdge) return

    await actions.createEdge({
      from_node_id: sourceId,
      to_node_id: targetId,
      label: null
    })
  }, [edges, actions])

  const handleTakePath = useCallback(async (edgeId: string) => {
    await actions.takePath(edgeId)
    setShowEdgeDialog(false)
    setSelectedEdge(null)
  }, [actions])

  const handleDeleteNode = useCallback(async (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId)
    if (!node || node.is_root) return

    await actions.deleteNode(nodeId)
    setShowNodeDialog(false)
    setSelectedNode(null)
  }, [nodes, actions])

  const handleDeleteEdge = useCallback(async (edgeId: string) => {
    await actions.deleteEdge(edgeId)
    setShowEdgeDialog(false)
    setSelectedEdge(null)
  }, [actions])

  const handlePositionUpdate = useCallback(async (nodeId: string, position: { x: number; y: number }) => {
    return await actions.updateNodePosition(nodeId, position)
  }, [actions])

  const handleConfirmCreate = useCallback(async () => {
    if (!newNodeTitle.trim() || !createFromNodeId) return

    const parentNode = nodes.find(n => n.id === createFromNodeId)
    if (!parentNode) return

    // Get sibling count for positioning
    const siblingEdges = edges.filter(e => e.from_node_id === createFromNodeId)
    const siblingCount = siblingEdges.length

    const newNodeId = await actions.createNode({
      title: newNodeTitle.trim(),
      description: newNodeDescription.trim() || null,
      position_x: createPosition?.x ?? (parentNode.position_x + siblingCount * 200),
      position_y: createPosition?.y ?? (parentNode.position_y + 150),
      is_root: false,
      is_current: false
    })

    if (newNodeId) {
      await actions.createEdge({
        from_node_id: createFromNodeId,
        to_node_id: newNodeId,
        label: newEdgeLabel.trim() || null
      })
    }

    setShowCreateDialog(false)
    setCreateFromNodeId(null)
    setNewNodeTitle('')
    setNewNodeDescription('')
    setNewEdgeLabel('')
  }, [newNodeTitle, newNodeDescription, newEdgeLabel, createFromNodeId, createPosition, nodes, edges, actions])

  const handleUpdateNode = useCallback(async (updates: Partial<NarrativeNode>) => {
    if (!selectedNode) return

    await actions.updateNode(selectedNode.id, updates)
    setSelectedNode(null)
    setShowNodeDialog(false)
  }, [selectedNode, actions])

  const handleSetCurrent = useCallback(async () => {
    if (!selectedNode) return
    await actions.setCurrentNode(selectedNode.id)
    setShowNodeDialog(false)
  }, [selectedNode, actions])

  // Create root node if none exists
  const handleCreateRootNode = useCallback(async () => {
    await actions.createRootNode('Inizio')
  }, [actions])

  // Loading/error states
  if (loading) {
    return (
      <div className="h-[500px] flex items-center justify-center bg-[var(--cream)] rounded-lg border-2 border-[var(--ink-faded)]/20">
        <div className="flex flex-col items-center gap-3">
          <GameIcon name="d20" category="ui" size={32} className="text-[var(--teal)] animate-spin" />
          <p className="text-[var(--ink-light)]">Caricamento narrativa...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-[300px] flex items-center justify-center bg-[var(--cream)] rounded-lg border-2 border-[var(--coral)]/30">
        <div className="flex flex-col items-center gap-3 text-center">
          <GameIcon name="skull" category="ui" size={32} className="text-[var(--coral)]" />
          <p className="text-[var(--ink)]">Errore nel caricamento</p>
          <p className="text-sm text-[var(--ink-light)]">{error}</p>
          <Button variant="outline" onClick={refetch}>Riprova</Button>
        </div>
      </div>
    )
  }

  // No root node yet
  if (!rootNode) {
    return (
      <div className="h-[300px] flex items-center justify-center bg-[var(--cream)] rounded-lg border-2 border-dashed border-[var(--teal)]/30">
        <div className="flex flex-col items-center gap-4 text-center">
          <GameIcon name="path" category="ui" size={48} className="text-[var(--teal)]" />
          <div>
            <h3 className="text-lg font-display text-[var(--ink)]">Nessun nodo narrativo</h3>
            <p className="text-sm text-[var(--ink-light)] mt-1">Crea il primo nodo per iniziare la storia</p>
          </div>
          <Button onClick={handleCreateRootNode}>
            <GameIcon name="flag" category="ui" size={14} className="mr-2" />
            Crea Nodo Iniziale
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 bg-[var(--cream)] rounded-lg p-1 border border-[var(--ink-faded)]/20">
          <button
            onClick={() => setViewMode('canvas')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              viewMode === 'canvas'
                ? 'bg-[var(--teal)] text-white'
                : 'text-[var(--ink-light)] hover:text-[var(--ink)]'
            }`}
          >
            <GameIcon name="scroll" category="ui" size={14} className="inline mr-1.5" />
            Canvas
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              viewMode === 'timeline'
                ? 'bg-[var(--teal)] text-white'
                : 'text-[var(--ink-light)] hover:text-[var(--ink)]'
            }`}
          >
            <GameIcon name="path" category="ui" size={14} className="inline mr-1.5" />
            Timeline
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm text-[var(--ink-light)]">
            {nodes.length} nodi • {edges.length} connessioni
          </div>
          {viewMode === 'canvas' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Esci fullscreen (ESC)' : 'Espandi canvas'}
              className="h-8 w-8 p-0"
            >
              {isFullscreen ? <X size={16} /> : <Maximize2 size={16} />}
            </Button>
          )}
        </div>
      </div>

      {/* View Content */}
      {viewMode === 'canvas' ? (
        <div className={`${isFullscreen ? 'fixed inset-4 z-50 bg-[var(--cream)]' : 'h-[800px]'} rounded-lg overflow-hidden border-2 border-[var(--ink-faded)]/20`}>
          <NarrativeCanvas
            nodes={nodes}
            edges={edges}
            links={links}
            notes={notes}
            encounters={encounters}
            onPositionUpdate={handlePositionUpdate}
            onNodeSelect={handleNodeSelect}
            onEdgeSelect={handleEdgeSelect}
            onCreateNode={handleCreateNode}
            onCreateEdge={handleCreateEdge}
            onTakePath={handleTakePath}
            onDeleteNode={handleDeleteNode}
            onDeleteEdge={handleDeleteEdge}
          />
        </div>
      ) : (
        <NarrativeTimeline
          actId={actId}
          campaignId={campaignId}
          actNumber={actNumber}
        />
      )}

      {/* Node Details Dialog */}
      <Dialog open={showNodeDialog} onOpenChange={setShowNodeDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedNode?.is_root && <GameIcon name="flag" category="ui" size={16} className="text-[var(--teal)]" />}
              {selectedNode?.is_current && <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--coral)] opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--coral)]"></span></span>}
              {selectedNode?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedNode?.was_visited ? 'Visitato' : 'Non visitato'}
              {selectedNode?.is_current && ' • Posizione attuale'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedNode?.description && (
              <div className="text-[var(--ink)] text-sm bg-[var(--cream)] p-3 rounded-lg border border-[var(--ink-faded)]/20">
                {selectedNode.description}
              </div>
            )}

            {/* Linked content count */}
            <div className="flex gap-3 text-sm">
              {links.filter(l => l.node_id === selectedNode?.id && l.link_type === 'note').length > 0 && (
                <span className="flex items-center gap-1 text-[var(--teal)]">
                  <GameIcon name="scroll" category="ui" size={12} />
                  {links.filter(l => l.node_id === selectedNode?.id && l.link_type === 'note').length} note
                </span>
              )}
              {links.filter(l => l.node_id === selectedNode?.id && l.link_type === 'encounter').length > 0 && (
                <span className="flex items-center gap-1 text-[var(--coral)]">
                  <GameIcon name="combat" category="ui" size={12} />
                  {links.filter(l => l.node_id === selectedNode?.id && l.link_type === 'encounter').length} incontri
                </span>
              )}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => handleCreateNode(selectedNode!.id)}
            >
              <GameIcon name="path" category="ui" size={12} className="mr-1" />
              Aggiungi Figlio
            </Button>
            {!selectedNode?.is_current && (
              <Button
                variant="outline"
                onClick={handleSetCurrent}
              >
                Imposta Corrente
              </Button>
            )}
            {!selectedNode?.is_root && (
              <Button
                variant="outline"
                className="text-red-500 hover:text-red-600"
                onClick={() => selectedNode && handleDeleteNode(selectedNode.id)}
              >
                Elimina
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edge Details Dialog */}
      <Dialog open={showEdgeDialog} onOpenChange={setShowEdgeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connessione</DialogTitle>
            <DialogDescription>
              {selectedEdge?.label || 'Senza etichetta'}
              {selectedEdge?.was_taken && ' • Percorso effettuato'}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            {!selectedEdge?.was_taken && (
              <Button onClick={() => selectedEdge && handleTakePath(selectedEdge.id)}>
                <GameIcon name="path" category="ui" size={12} className="mr-1" />
                Prendi questo percorso
              </Button>
            )}
            <Button
              variant="outline"
              className="text-red-500 hover:text-red-600"
              onClick={() => selectedEdge && handleDeleteEdge(selectedEdge.id)}
            >
              Elimina Connessione
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Node Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <GameIcon name="scroll" category="ui" size={16} className="inline mr-2 text-[var(--teal)]" />
              Nuovo Nodo
            </DialogTitle>
            <DialogDescription>
              Aggiungi un nuovo nodo narrativo
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm text-[var(--ink-light)] mb-1 block">Titolo *</label>
              <Input
                value={newNodeTitle}
                onChange={(e) => setNewNodeTitle(e.target.value)}
                placeholder="Titolo del nodo"
                autoFocus
              />
            </div>

            <div>
              <label className="text-sm text-[var(--ink-light)] mb-1 block">Descrizione</label>
              <Textarea
                value={newNodeDescription}
                onChange={(e) => setNewNodeDescription(e.target.value)}
                placeholder="Descrizione opzionale..."
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm text-[var(--ink-light)] mb-1 block">Etichetta Connessione</label>
              <Input
                value={newEdgeLabel}
                onChange={(e) => setNewEdgeLabel(e.target.value)}
                placeholder="es. 'Se il gruppo accetta...'"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Annulla
            </Button>
            <Button onClick={handleConfirmCreate} disabled={!newNodeTitle.trim()}>
              Crea Nodo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
