'use client'

import { useState, useMemo, useCallback } from 'react'
import { useNarrativeTree } from './hooks/useNarrativeTree'
import { useNarrativeActions } from './hooks/useNarrativeActions'
import { NarrativeNode } from './NarrativeNode'
import { NarrativeNodeDialog, QuickBranchDialog } from './NarrativeNodeDialog'
import { NarrativeNode as NarrativeNodeType, NarrativeEdge, StoryNote, Encounter, Monster } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GameIcon } from '@/components/icons/GameIcon'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'

interface NarrativeTreeListProps {
  actId: string
  campaignId: string
  actNumber: number
}

export function NarrativeTreeList({ actId, campaignId, actNumber }: NarrativeTreeListProps) {
  // Data hooks
  const {
    nodes,
    edges,
    links,
    rootNode,
    currentNode,
    visitedPath,
    loading,
    error,
    refetch,
    notes: linkedNotes,
    encounters: linkedEncounters,
    monsters: linkedMonsters
  } = useNarrativeTree({ actId })

  const actions = useNarrativeActions({ actId, refetch })

  // UI state
  const [isLiveMode, setIsLiveMode] = useState(false)
  const [editingNode, setEditingNode] = useState<NarrativeNodeType | null>(null)
  const [addingChildTo, setAddingChildTo] = useState<string | null>(null)
  const [showQuickBranch, setShowQuickBranch] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  // Available content for linking (fetch from act)
  const [availableNotes, setAvailableNotes] = useState<StoryNote[]>([])
  const [availableEncounters, setAvailableEncounters] = useState<Encounter[]>([])
  const [availableMonsters, setAvailableMonsters] = useState<Monster[]>([])

  // Fetch available content when dialog opens
  const fetchAvailableContent = useCallback(async () => {
    // Fetch notes for this act
    const { data: notesData } = await supabase
      .from('dnd_story_notes')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('act', actNumber)

    // Fetch encounters for this act
    const { data: encountersData } = await supabase
      .from('dnd_encounters')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('act', actNumber)

    // Fetch monsters for this campaign
    const { data: monstersData } = await supabase
      .from('dnd_monsters')
      .select('*')
      .eq('campaign_id', campaignId)

    setAvailableNotes(notesData || [])
    setAvailableEncounters(encountersData || [])
    setAvailableMonsters(monstersData || [])
  }, [campaignId, actNumber])

  // Build tree structure from flat nodes
  const nodeTree = useMemo(() => {
    if (!rootNode) return null

    const nodeMap = new Map<string, NarrativeNodeType>()
    nodes.forEach(n => nodeMap.set(n.id, n))

    const childrenMap = new Map<string, NarrativeEdge[]>()
    edges.forEach(e => {
      const existing = childrenMap.get(e.from_node_id) || []
      childrenMap.set(e.from_node_id, [...existing, e])
    })

    return { nodeMap, childrenMap }
  }, [nodes, edges, rootNode])

  // Get links for a specific node
  const getLinksForNode = useCallback((nodeId: string) => {
    const nodeLinks = links.filter(l => l.node_id === nodeId)
    return {
      noteIds: nodeLinks.filter(l => l.link_type === 'note').map(l => l.link_id),
      encounterIds: nodeLinks.filter(l => l.link_type === 'encounter').map(l => l.link_id),
      monsterIds: nodeLinks.filter(l => l.link_type === 'monster').map(l => l.link_id),
      notes: linkedNotes.filter(n => nodeLinks.some(l => l.link_type === 'note' && l.link_id === n.id)),
      encounters: linkedEncounters.filter(e => nodeLinks.some(l => l.link_type === 'encounter' && l.link_id === e.id)),
      monsters: linkedMonsters.filter(m => nodeLinks.some(l => l.link_type === 'monster' && l.link_id === m.id))
    }
  }, [links, linkedNotes, linkedEncounters, linkedMonsters])

  // Render a node and its children recursively
  const renderNode = useCallback((nodeId: string, depth: number = 0): React.ReactNode => {
    if (!nodeTree) return null

    const node = nodeTree.nodeMap.get(nodeId)
    if (!node) return null

    const outgoingEdges = nodeTree.childrenMap.get(nodeId) || []
    const nodeLinks = getLinksForNode(nodeId)

    return (
      <NarrativeNode
        key={node.id}
        node={node}
        outgoingEdges={outgoingEdges}
        linkedNotes={nodeLinks.notes}
        linkedEncounters={nodeLinks.encounters}
        linkedMonsters={nodeLinks.monsters}
        isLiveMode={isLiveMode}
        onEdit={() => {
          setEditingNode(node)
          fetchAvailableContent()
        }}
        onAddChild={() => {
          setAddingChildTo(node.id)
          fetchAvailableContent()
        }}
        onTakePath={(edgeId) => actions.takePath(edgeId)}
        onSetCurrent={() => actions.setCurrentNode(node.id)}
        onDelete={() => setConfirmDelete(node.id)}
        depth={depth}
      >
        {outgoingEdges.map(edge => {
          const childNode = nodeTree.nodeMap.get(edge.to_node_id)
          if (!childNode) return null

          return (
            <div key={edge.id} className="relative">
              {/* Edge label */}
              {edge.label && (
                <div className="text-xs text-[var(--ink-light)] italic mb-1 flex items-center gap-1">
                  <span>↳</span>
                  {edge.label}
                  {edge.was_taken && (
                    <Badge variant="outline" className="text-xs py-0 px-1 text-green-600 border-green-300">
                      preso
                    </Badge>
                  )}
                </div>
              )}
              {renderNode(edge.to_node_id, depth + 1)}
            </div>
          )
        })}
      </NarrativeNode>
    )
  }, [nodeTree, getLinksForNode, isLiveMode, actions, fetchAvailableContent])

  // Handlers
  async function handleCreateRoot() {
    await actions.createRootNode('Inizio della storia')
  }

  async function handleSaveNode(data: { title: string; description: string | null; edgeLabel?: string }) {
    if (editingNode) {
      // Update existing node
      await actions.updateNode(editingNode.id, {
        title: data.title,
        description: data.description
      })
    } else if (addingChildTo) {
      // Create new child node
      await actions.quickBranch(data.title, addingChildTo, data.edgeLabel, false)
      // Update description if provided
      // Note: quickBranch doesn't support description, we'd need to update after
    }
    setEditingNode(null)
    setAddingChildTo(null)
  }

  async function handleLinkToggle(type: 'note' | 'encounter' | 'monster', id: string, isLinked: boolean) {
    if (!editingNode) return

    if (isLinked) {
      await actions.removeLink(editingNode.id, type, id)
    } else {
      await actions.addLink(editingNode.id, type, id)
    }
  }

  async function handleQuickBranch(title: string, edgeLabel?: string) {
    if (!currentNode) return
    await actions.quickBranch(title, currentNode.id, edgeLabel, true)
  }

  async function handleDelete() {
    if (!confirmDelete) return
    await actions.deleteNode(confirmDelete)
    setConfirmDelete(null)
  }

  async function handleReset() {
    await actions.resetSession()
    setConfirmReset(false)
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-[var(--ink-light)]">Caricamento...</div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <p className="font-medium">Errore</p>
        <p className="text-sm">{error}</p>
        <Button variant="outline" size="sm" onClick={refetch} className="mt-2">
          Riprova
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 p-3 bg-[var(--paper)] rounded-lg border border-[var(--ink-faded)]/10">
        <div className="flex items-center gap-2">
          <GameIcon name="path" category="ui" size={20} className="text-[var(--teal)]" />
          <span className="font-medium text-[var(--ink)]">Albero Narrativo</span>
          <Badge variant="outline" className="text-xs">
            {nodes.length} nodi
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode toggle */}
          <Button
            variant={isLiveMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsLiveMode(!isLiveMode)}
            className={isLiveMode ? 'bg-[var(--coral)] hover:bg-[var(--coral)]/90' : ''}
          >
            <GameIcon name={isLiveMode ? 'flame' : 'quill'} category="ui" size={14} className="mr-1" />
            {isLiveMode ? 'Sessione Live' : 'Preparazione'}
          </Button>

          {/* Quick branch (live mode only) */}
          {isLiveMode && currentNode && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowQuickBranch(true)}
            >
              <GameIcon name="lightning" category="ui" size={14} className="mr-1" />
              Branch Rapido
            </Button>
          )}

          {/* Reset session */}
          {isLiveMode && visitedPath.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmReset(true)}
              className="text-red-500 hover:text-red-600"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Current position indicator (live mode) */}
      {isLiveMode && currentNode && (
        <div className="flex items-center gap-2 p-2 bg-[var(--coral)]/10 rounded-lg border border-[var(--coral)]/20">
          <span className="w-2 h-2 rounded-full bg-[var(--coral)] animate-pulse" />
          <span className="text-sm text-[var(--ink)]">
            Posizione attuale: <strong>{currentNode.title}</strong>
          </span>
          {visitedPath.length > 0 && (
            <Badge variant="outline" className="text-xs ml-auto">
              {visitedPath.length} nodi visitati
            </Badge>
          )}
        </div>
      )}

      {/* Empty state */}
      {nodes.length === 0 && (
        <div className="text-center py-12 bg-[var(--paper)] rounded-lg border-2 border-dashed border-[var(--ink-faded)]/20">
          <GameIcon name="path" category="ui" size={48} className="mx-auto text-[var(--ink-faded)] mb-4" />
          <h3 className="text-lg font-medium text-[var(--ink)] mb-2">
            Nessun nodo narrativo
          </h3>
          <p className="text-[var(--ink-light)] mb-4 max-w-md mx-auto">
            Crea il primo nodo per iniziare a costruire l'albero delle possibilità narrative di questo atto.
          </p>
          <Button onClick={handleCreateRoot}>
            <GameIcon name="plus" category="ui" size={14} className="mr-1" />
            Crea Nodo Iniziale
          </Button>
        </div>
      )}

      {/* Tree */}
      {rootNode && (
        <div className="space-y-2">
          {renderNode(rootNode.id)}
        </div>
      )}

      {/* Edit/Add dialog */}
      <NarrativeNodeDialog
        open={!!editingNode || !!addingChildTo}
        onClose={() => {
          setEditingNode(null)
          setAddingChildTo(null)
        }}
        node={editingNode}
        parentNodeId={addingChildTo || undefined}
        availableNotes={availableNotes}
        availableEncounters={availableEncounters}
        availableMonsters={availableMonsters}
        linkedNoteIds={editingNode ? getLinksForNode(editingNode.id).noteIds : []}
        linkedEncounterIds={editingNode ? getLinksForNode(editingNode.id).encounterIds : []}
        linkedMonsterIds={editingNode ? getLinksForNode(editingNode.id).monsterIds : []}
        onSave={handleSaveNode}
        onLinkToggle={handleLinkToggle}
      />

      {/* Quick branch dialog */}
      <QuickBranchDialog
        open={showQuickBranch}
        onClose={() => setShowQuickBranch(false)}
        onSave={handleQuickBranch}
      />

      {/* Delete confirmation */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminare questo nodo?</DialogTitle>
            <DialogDescription>
              Questo eliminerà anche tutti i nodi figli e i collegamenti. L'azione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Annulla
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Elimina
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset confirmation */}
      <Dialog open={confirmReset} onOpenChange={setConfirmReset}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset sessione?</DialogTitle>
            <DialogDescription>
              Questo cancellerà lo stato della sessione corrente (nodi visitati, percorsi presi).
              La struttura dell'albero rimarrà intatta.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmReset(false)}>
              Annulla
            </Button>
            <Button variant="destructive" onClick={handleReset}>
              Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
