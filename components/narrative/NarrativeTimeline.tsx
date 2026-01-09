'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useNarrativeTree } from './hooks/useNarrativeTree'
import { useNarrativeActions } from './hooks/useNarrativeActions'
import { NarrativeNodeDialog, QuickBranchDialog } from './NarrativeNodeDialog'
import { NarrativeNode as NarrativeNodeType, NarrativeEdge, NarrativeCheck, NarrativeCheckInsert, StoryNote, Encounter, Monster } from '@/types/database'
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
import { cn } from '@/lib/utils'

interface NarrativeTimelineProps {
  actId: string
  campaignId: string
  actNumber: number
}

interface TimelineNode extends NarrativeNodeType {
  sequence: number
  hierarchicalNumber: string // e.g. "1", "1.1", "1.2", "2"
  branches: TimelineNode[]
  edgeLabel?: string
}

export function NarrativeTimeline({ actId, campaignId, actNumber }: NarrativeTimelineProps) {
  // Data hooks
  const {
    nodes,
    edges,
    links,
    checks,
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
  const [selectedNode, setSelectedNode] = useState<NarrativeNodeType | null>(null)
  const [editingNode, setEditingNode] = useState<NarrativeNodeType | null>(null)
  const [addingChildTo, setAddingChildTo] = useState<string | null>(null)
  const [showQuickBranch, setShowQuickBranch] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  // Scroll container ref
  const scrollRef = useRef<HTMLDivElement>(null)

  // Available content for linking
  const [availableNotes, setAvailableNotes] = useState<StoryNote[]>([])
  const [availableEncounters, setAvailableEncounters] = useState<Encounter[]>([])
  const [availableMonsters, setAvailableMonsters] = useState<Monster[]>([])

  // Fetch available content when dialog opens
  const fetchAvailableContent = useCallback(async () => {
    const { data: notesData } = await supabase
      .from('dnd_story_notes')
      .select('*')
      .eq('campaign_id', campaignId)
      .contains('acts', [actNumber])

    const { data: encountersData } = await supabase
      .from('dnd_encounters')
      .select('*')
      .eq('campaign_id', campaignId)
      .contains('acts', [actNumber])

    const { data: monstersData } = await supabase
      .from('dnd_monsters')
      .select('*')
      .eq('campaign_id', campaignId)

    setAvailableNotes(notesData || [])
    setAvailableEncounters(encountersData || [])
    setAvailableMonsters(monstersData || [])
  }, [campaignId, actNumber])

  // Build linear timeline from tree
  const timeline = useMemo(() => {
    if (!rootNode || nodes.length === 0) return []

    const nodeMap = new Map<string, NarrativeNodeType>()
    nodes.forEach(n => nodeMap.set(n.id, n))

    const childrenMap = new Map<string, NarrativeEdge[]>()
    edges.forEach(e => {
      const existing = childrenMap.get(e.from_node_id) || []
      childrenMap.set(e.from_node_id, [...existing, e])
    })

    // Find parent map
    const parentMap = new Map<string, string>()
    edges.forEach(e => {
      parentMap.set(e.to_node_id, e.from_node_id)
    })

    // Build main path (follow first/visited path)
    const mainPath: TimelineNode[] = []
    let currentId: string | null = rootNode.id
    let sequence = 1

    const processedNodes = new Set<string>()

    while (currentId && !processedNodes.has(currentId)) {
      processedNodes.add(currentId)
      const node = nodeMap.get(currentId)
      if (!node) break

      const outEdges = childrenMap.get(currentId) || []

      // Find branches (non-main path children)
      const branches: TimelineNode[] = []
      let nextId: string | null = null
      let nextEdgeLabel: string | undefined

      // Sort edges: visited first, then by creation
      const sortedEdges = [...outEdges].sort((a, b) => {
        if (a.was_taken && !b.was_taken) return -1
        if (!a.was_taken && b.was_taken) return 1
        return 0
      })

      sortedEdges.forEach((edge, idx) => {
        const childNode = nodeMap.get(edge.to_node_id)
        if (!childNode) return

        if (idx === 0) {
          // First/primary path continues as main timeline
          nextId = edge.to_node_id
          nextEdgeLabel = edge.label || undefined
        } else {
          // Secondary paths are branches with hierarchical numbering
          branches.push({
            ...childNode,
            sequence: 0, // Will be set relative
            hierarchicalNumber: `${sequence}.${idx}`, // e.g. "1.1", "1.2"
            branches: [],
            edgeLabel: edge.label || undefined
          })
        }
      })

      mainPath.push({
        ...node,
        sequence,
        hierarchicalNumber: String(sequence), // Main path: "1", "2", "3"
        branches,
        edgeLabel: sequence > 1 ? mainPath[mainPath.length - 1]?.edgeLabel : undefined
      })

      // Update edge label for next iteration
      if (nextEdgeLabel && mainPath.length > 0) {
        // Store for next node
      }

      currentId = nextId
      sequence++
    }

    // Fix edge labels (they should be on the node they lead TO)
    for (let i = 0; i < mainPath.length - 1; i++) {
      const outEdges = childrenMap.get(mainPath[i].id) || []
      const edgeToNext = outEdges.find(e => e.to_node_id === mainPath[i + 1]?.id)
      if (edgeToNext?.label) {
        mainPath[i + 1].edgeLabel = edgeToNext.label
      }
    }

    return mainPath
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

  // Get checks for a specific node
  const getChecksForNode = useCallback((nodeId: string): NarrativeCheck[] => {
    return checks.filter(c => c.node_id === nodeId)
  }, [checks])

  // Scroll to current node on load
  useEffect(() => {
    if (currentNode && scrollRef.current) {
      const currentIndex = timeline.findIndex(n => n.id === currentNode.id)
      if (currentIndex >= 0) {
        const nodeWidth = 120 // Approximate node width including spacing
        scrollRef.current.scrollLeft = Math.max(0, currentIndex * nodeWidth - scrollRef.current.clientWidth / 2)
      }
    }
  }, [currentNode, timeline])

  // Handlers
  async function handleCreateRoot() {
    await actions.createRootNode('Inizio della storia')
  }

  async function handleSaveNode(data: { title: string; description: string | null; edgeLabel?: string }) {
    if (editingNode) {
      await actions.updateNode(editingNode.id, {
        title: data.title,
        description: data.description
      })
    } else if (addingChildTo) {
      await actions.quickBranch(data.title, addingChildTo, data.edgeLabel, false)
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

  // Check handlers
  async function handleCheckCreate(check: Omit<NarrativeCheckInsert, 'node_id'>) {
    if (!editingNode) return
    await actions.createCheck(editingNode.id, check)
  }

  async function handleCheckDelete(checkId: string) {
    await actions.deleteCheck(checkId)
  }

  async function handleCheckUpdate(checkId: string, updates: Partial<NarrativeCheck>) {
    await actions.updateCheck(checkId, updates)
  }

  async function handleQuickBranch(title: string, edgeLabel?: string) {
    if (!currentNode) return
    await actions.quickBranch(title, currentNode.id, edgeLabel, true)
  }

  async function handleDelete() {
    if (!confirmDelete) return
    await actions.deleteNode(confirmDelete)
    setConfirmDelete(null)
    setSelectedNode(null)
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
          <span className="font-medium text-[var(--ink)]">Timeline Narrativa</span>
          <Badge variant="outline" className="text-xs">
            {nodes.length} nodi
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={isLiveMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsLiveMode(!isLiveMode)}
            className={isLiveMode ? 'bg-[var(--coral)] hover:bg-[var(--coral)]/90' : ''}
          >
            <GameIcon name={isLiveMode ? 'flame' : 'quill'} category="ui" size={14} className="mr-1" />
            {isLiveMode ? 'Sessione Live' : 'Preparazione'}
          </Button>

          {isLiveMode && currentNode && (
            <Button variant="outline" size="sm" onClick={() => setShowQuickBranch(true)}>
              <GameIcon name="lightning" category="ui" size={14} className="mr-1" />
              Branch Rapido
            </Button>
          )}

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

      {/* Current position indicator */}
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
            Crea il primo nodo per iniziare a costruire la timeline narrativa di questo atto.
          </p>
          <Button onClick={handleCreateRoot}>
            <GameIcon name="plus" category="ui" size={14} className="mr-1" />
            Crea Nodo Iniziale
          </Button>
        </div>
      )}

      {/* Timeline */}
      {timeline.length > 0 && (
        <div className="bg-[var(--paper)] rounded-lg border border-[var(--ink-faded)]/10 p-4">
          {/* Scrollable container */}
          <div
            ref={scrollRef}
            className="overflow-x-auto pb-4"
            style={{ scrollBehavior: 'smooth' }}
          >
            <div className="relative min-w-max">
              {/* Main timeline line */}
              <div className="absolute top-8 left-8 right-8 h-1 bg-[var(--ink-faded)]/20 rounded-full" />

              {/* Visited path line overlay */}
              {visitedPath.length > 0 && (
                <div
                  className="absolute top-8 left-8 h-1 bg-green-400 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(0, (timeline.findIndex(n => n.id === currentNode?.id) + 1) * 120 - 16)}px`
                  }}
                />
              )}

              {/* Nodes */}
              <div className="flex items-start gap-4 px-8 pt-2">
                {timeline.map((node, idx) => {
                  const isCurrent = node.id === currentNode?.id
                  const isVisited = node.was_visited
                  const nodeLinks = getLinksForNode(node.id)
                  const hasLinks = nodeLinks.notes.length > 0 || nodeLinks.encounters.length > 0

                  return (
                    <div key={node.id} className="relative flex flex-col items-center" style={{ minWidth: '100px' }}>
                      {/* Edge label (above line) */}
                      {node.edgeLabel && idx > 0 && (
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs text-[var(--ink-light)] italic whitespace-nowrap">
                          {node.edgeLabel}
                        </div>
                      )}

                      {/* Node circle */}
                      <button
                        onClick={() => setSelectedNode(selectedNode?.id === node.id ? null : node)}
                        className={cn(
                          "relative w-12 h-12 rounded-full border-4 transition-all duration-200 flex items-center justify-center",
                          "hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2",
                          isCurrent && "border-[var(--teal)] bg-[var(--teal)]/20 ring-4 ring-[var(--teal)]/30 animate-pulse",
                          isVisited && !isCurrent && "border-green-400 bg-green-100",
                          !isVisited && !isCurrent && "border-[var(--ink-faded)]/30 bg-[var(--cream)]",
                          node.is_root && "ring-2 ring-[var(--coral)]/50"
                        )}
                      >
                        {/* Hierarchical number */}
                        <span className={cn(
                          "font-bold text-sm",
                          isCurrent && "text-[var(--teal)]",
                          isVisited && !isCurrent && "text-green-700",
                          !isVisited && !isCurrent && "text-[var(--ink-faded)]"
                        )}>
                          {node.hierarchicalNumber}
                        </span>

                        {/* Link indicator */}
                        {hasLinks && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--coral)] rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">{nodeLinks.notes.length + nodeLinks.encounters.length}</span>
                          </span>
                        )}

                        {/* Root flag */}
                        {node.is_root && (
                          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2">
                            <GameIcon name="flag" category="ui" size={12} className="text-[var(--coral)]" />
                          </span>
                        )}
                      </button>

                      {/* Node title */}
                      <div className="mt-2 text-center max-w-[100px]">
                        <p className={cn(
                          "text-xs font-medium truncate",
                          isCurrent && "text-[var(--teal)]",
                          isVisited && !isCurrent && "text-green-700",
                          !isVisited && !isCurrent && "text-[var(--ink-light)]"
                        )}>
                          {node.title}
                        </p>
                      </div>

                      {/* Branches (below) */}
                      {node.branches.length > 0 && (
                        <div className="mt-4 flex flex-col gap-2">
                          {node.branches.map((branch, bIdx) => (
                            <button
                              key={branch.id}
                              onClick={() => setSelectedNode(selectedNode?.id === branch.id ? null : branch)}
                              className="flex items-center gap-2 px-2 py-1 bg-[var(--cream-dark)] rounded border border-[var(--ink-faded)]/10 hover:bg-[var(--ink-faded)]/5 transition-colors"
                            >
                              <span className="min-w-[24px] text-xs font-mono text-[var(--ink-faded)]">
                                {branch.hierarchicalNumber}
                              </span>
                              <span className="text-xs text-[var(--ink-light)] truncate max-w-[80px]">
                                {branch.edgeLabel || branch.title}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Add new node button at end */}
                {timeline.length > 0 && !isLiveMode && (
                  <div className="flex flex-col items-center" style={{ minWidth: '100px' }}>
                    <button
                      onClick={() => {
                        setAddingChildTo(timeline[timeline.length - 1].id)
                        fetchAvailableContent()
                      }}
                      className="w-12 h-12 rounded-full border-2 border-dashed border-[var(--ink-faded)]/30 flex items-center justify-center hover:border-[var(--teal)] hover:bg-[var(--teal)]/10 transition-colors"
                    >
                      <GameIcon name="plus" category="ui" size={16} className="text-[var(--ink-faded)]" />
                    </button>
                    <p className="mt-2 text-xs text-[var(--ink-faded)]">Aggiungi</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-[var(--ink-faded)]/10 text-xs">
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-green-400" />
              <span className="text-[var(--ink-light)]">Visitato</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-[var(--teal)] ring-2 ring-[var(--teal)]/30" />
              <span className="text-[var(--ink-light)]">Corrente</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-[var(--cream)] border-2 border-[var(--ink-faded)]/30" />
              <span className="text-[var(--ink-light)]">Non visitato</span>
            </div>
            <div className="flex items-center gap-1">
              <GameIcon name="flag" category="ui" size={12} className="text-[var(--coral)]" />
              <span className="text-[var(--ink-light)]">Inizio</span>
            </div>
          </div>
        </div>
      )}

      {/* Selected node details panel */}
      {selectedNode && (
        <div className="bg-[var(--paper)] rounded-lg border border-[var(--ink-faded)]/10 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-display text-lg text-[var(--ink)]">{selectedNode.title}</h3>
                {selectedNode.is_current && (
                  <Badge className="bg-[var(--teal)]">Corrente</Badge>
                )}
                {selectedNode.was_visited && !selectedNode.is_current && (
                  <Badge variant="outline" className="text-green-600 border-green-400">Visitato</Badge>
                )}
              </div>
              {selectedNode.description && (
                <p className="text-sm text-[var(--ink-light)] mb-3">{selectedNode.description}</p>
              )}

              {/* Linked content */}
              {(() => {
                const nodeLinks = getLinksForNode(selectedNode.id)
                return (nodeLinks.notes.length > 0 || nodeLinks.encounters.length > 0) && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {nodeLinks.notes.map(note => (
                      <Badge key={note.id} variant="secondary">
                        <GameIcon name="scroll" category="ui" size={10} className="mr-1" />
                        {note.title}
                      </Badge>
                    ))}
                    {nodeLinks.encounters.map(enc => (
                      <Badge key={enc.id} variant="secondary" className="text-[var(--coral)]">
                        <GameIcon name="swords" category="ui" size={10} className="mr-1" />
                        {enc.name}
                      </Badge>
                    ))}
                  </div>
                )
              })()}
            </div>

            <button
              onClick={() => setSelectedNode(null)}
              className="p-1 text-[var(--ink-light)] hover:text-[var(--ink)]"
            >
              <GameIcon name="x" category="ui" size={16} />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-3 border-t border-[var(--ink-faded)]/10">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingNode(selectedNode)
                fetchAvailableContent()
              }}
            >
              <GameIcon name="quill" category="ui" size={12} className="mr-1" />
              Modifica
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setAddingChildTo(selectedNode.id)
                fetchAvailableContent()
              }}
            >
              <GameIcon name="plus" category="ui" size={12} className="mr-1" />
              Aggiungi Figlio
            </Button>
            {isLiveMode && !selectedNode.is_current && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => actions.setCurrentNode(selectedNode.id)}
                className="text-[var(--coral)]"
              >
                Vai qui
              </Button>
            )}
            {!selectedNode.is_root && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmDelete(selectedNode.id)}
                className="ml-auto text-red-500 hover:text-red-600"
              >
                <GameIcon name="trash" category="ui" size={12} />
              </Button>
            )}
          </div>
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
        checks={editingNode ? getChecksForNode(editingNode.id) : []}
        onSave={handleSaveNode}
        onLinkToggle={handleLinkToggle}
        onCheckCreate={handleCheckCreate}
        onCheckDelete={handleCheckDelete}
        onCheckUpdate={handleCheckUpdate}
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
              La struttura della timeline rimarrà intatta.
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
