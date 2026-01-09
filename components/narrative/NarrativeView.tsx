'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useNarrativeTree } from './hooks/useNarrativeTree'
import { useNarrativeActions } from './hooks/useNarrativeActions'
import { NarrativeTimeline } from './NarrativeTimeline'
import { NarrativeCanvas } from './canvas'
import { NarrativeNode, NarrativeEdge, StoryNote, Encounter, NarrativeCheck, DND_SKILLS, DND_ABILITIES, DND_ABILITY_LABELS, DndAbility } from '@/types/database'
import { Button } from '@/components/ui/button'
import { GameIcon } from '@/components/icons/GameIcon'
import { Maximize2, X, Dices, Shield, HelpCircle, Trash2, Plus, Eye, EyeOff } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { supabase } from '@/lib/supabase'

// DC color helpers
function getDCBadgeClass(dc: number | null): string {
  if (!dc) return 'bg-[var(--ink-faded)]/20 text-[var(--ink-light)]'
  if (dc <= 10) return 'bg-green-100 text-green-700 border-green-300'
  if (dc <= 15) return 'bg-yellow-100 text-yellow-700 border-yellow-300'
  return 'bg-red-100 text-red-700 border-red-300'
}

type ViewMode = 'timeline' | 'canvas'

interface NarrativeViewProps {
  actId: string
  campaignId: string
  actNumber: number
}

export function NarrativeView({ actId, campaignId, actNumber }: NarrativeViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('canvas')
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Lazy load canvas to prevent mobile scroll issues
  const [isCanvasVisible, setIsCanvasVisible] = useState(false)
  const canvasContainerRef = useRef<HTMLDivElement>(null)

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

  // Intersection Observer for lazy loading canvas
  useEffect(() => {
    if (viewMode !== 'canvas' || isCanvasVisible) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsCanvasVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    )

    if (canvasContainerRef.current) {
      observer.observe(canvasContainerRef.current)
    }

    return () => observer.disconnect()
  }, [viewMode, isCanvasVisible])

  // Data hooks (shared)
  const {
    nodes,
    edges,
    links,
    checks,
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

  // Edit node state
  const [isEditingContent, setIsEditingContent] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')

  // Check form state
  const [showCheckForm, setShowCheckForm] = useState(false)
  const [checkForm, setCheckForm] = useState({
    check_type: 'ability' as 'ability' | 'save' | 'condition',
    skill: '',
    ability: '' as 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha' | '',
    dc: 12,
    condition_text: '',
    success_text: '',
    failure_text: '',
    critical_text: '',
    is_hidden: false
  })
  const [savingCheck, setSavingCheck] = useState(false)

  // Handlers
  const handleNodeSelect = useCallback((node: NarrativeNode | null) => {
    setSelectedNode(node)
    setSelectedEdge(null)
    if (node) {
      setShowNodeDialog(true)
      setEditTitle(node.title)
      setEditDescription(node.description || '')
      setIsEditingContent(false)
    }
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
      position_x: createPosition?.x ?? ((parentNode.position_x ?? 100) + siblingCount * 200),
      position_y: createPosition?.y ?? ((parentNode.position_y ?? 100) + 150),
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

  // Check handlers
  const handleCheckCreate = useCallback(async () => {
    if (!selectedNode) return
    if (!checkForm.success_text.trim() || !checkForm.failure_text.trim()) return

    // Validate based on check type
    if (checkForm.check_type === 'ability' && !checkForm.skill) return
    if (checkForm.check_type === 'save' && !checkForm.ability) return
    if (checkForm.check_type === 'condition' && !checkForm.condition_text.trim()) return

    setSavingCheck(true)
    await actions.createCheck(selectedNode.id, {
      check_type: checkForm.check_type,
      skill: checkForm.check_type === 'ability' ? checkForm.skill : null,
      ability: checkForm.check_type === 'save' ? checkForm.ability as 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha' : null,
      dc: checkForm.check_type !== 'condition' ? checkForm.dc : null,
      condition_text: checkForm.check_type === 'condition' ? checkForm.condition_text : null,
      success_text: checkForm.success_text.trim(),
      failure_text: checkForm.failure_text.trim(),
      critical_text: checkForm.critical_text.trim() || null,
      is_hidden: checkForm.is_hidden
    })
    setSavingCheck(false)
    setShowCheckForm(false)
    setCheckForm({
      check_type: 'ability',
      skill: '',
      ability: '',
      dc: 12,
      condition_text: '',
      success_text: '',
      failure_text: '',
      critical_text: '',
      is_hidden: false
    })
  }, [selectedNode, checkForm, actions])

  const handleCheckDelete = useCallback(async (checkId: string) => {
    await actions.deleteCheck(checkId)
  }, [actions])

  // Get checks for selected node
  const nodeChecks = useMemo(() => {
    if (!selectedNode) return []
    return checks.filter(c => c.node_id === selectedNode.id)
  }, [selectedNode, checks])

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
        <div
          ref={canvasContainerRef}
          className={`${isFullscreen ? 'fixed inset-4 z-50 bg-[var(--cream)]' : 'h-[calc(100vh-220px)] min-h-[400px] max-h-[800px]'} rounded-lg overflow-hidden border-2 border-[var(--ink-faded)]/20`}
        >
          {isCanvasVisible ? (
            <NarrativeCanvas
              nodes={nodes}
              edges={edges}
              links={links}
              checks={checks}
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
          ) : (
            <div className="h-full flex items-center justify-center bg-[var(--cream)]">
              <div className="flex flex-col items-center gap-3">
                <GameIcon name="scroll" category="ui" size={32} className="text-[var(--teal)] animate-pulse" />
                <p className="text-[var(--ink-light)] text-sm">Caricamento canvas...</p>
              </div>
            </div>
          )}
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
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
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

          <div className="flex-1 overflow-y-auto space-y-4 py-2">
            {/* Edit form or display mode */}
            {isEditingContent ? (
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-[var(--ink-light)] mb-1 block">Titolo</label>
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Titolo del nodo"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-sm text-[var(--ink-light)] mb-1 block">Descrizione</label>
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Descrizione del nodo..."
                    rows={6}
                    className="resize-none"
                  />
                </div>
              </div>
            ) : selectedNode?.description ? (
              <div className="text-[var(--ink)] text-sm bg-[var(--cream)] p-3 rounded-lg border border-[var(--ink-faded)]/20">
                {selectedNode.description}
              </div>
            ) : null}

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
              {nodeChecks.length > 0 && (
                <span className="flex items-center gap-1 text-purple-600">
                  <Dices size={12} />
                  {nodeChecks.length} check
                </span>
              )}
            </div>

            {/* Checks Section */}
            {(nodeChecks.length > 0 || showCheckForm) && (
              <div className="border-t border-[var(--ink-faded)]/10 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-[var(--ink)] flex items-center gap-2">
                    <Dices size={14} className="text-purple-600" />
                    Check Abilità
                  </h4>
                  {!showCheckForm && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCheckForm(true)}
                    >
                      <Plus size={12} className="mr-1" />
                      Aggiungi
                    </Button>
                  )}
                </div>

                {/* Check Form */}
                {showCheckForm && (
                  <div className="border border-[var(--teal)] rounded-lg p-4 space-y-3 bg-[var(--teal)]/5 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[var(--ink)]">Nuovo Check</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowCheckForm(false)
                          setCheckForm({
                            check_type: 'ability', skill: '', ability: '', dc: 12,
                            condition_text: '', success_text: '', failure_text: '',
                            critical_text: '', is_hidden: false
                          })
                        }}
                      >
                        <X size={14} />
                      </Button>
                    </div>

                    {/* Check Type */}
                    <div className="flex gap-2">
                      <Button
                        variant={checkForm.check_type === 'ability' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCheckForm(prev => ({ ...prev, check_type: 'ability' }))}
                        className="flex-1"
                      >
                        <Dices size={12} className="mr-1" />
                        Skill
                      </Button>
                      <Button
                        variant={checkForm.check_type === 'save' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCheckForm(prev => ({ ...prev, check_type: 'save' }))}
                        className="flex-1"
                      >
                        <Shield size={12} className="mr-1" />
                        Salvezza
                      </Button>
                      <Button
                        variant={checkForm.check_type === 'condition' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCheckForm(prev => ({ ...prev, check_type: 'condition' }))}
                        className="flex-1"
                      >
                        <HelpCircle size={12} className="mr-1" />
                        Condizione
                      </Button>
                    </div>

                    {/* Skill/Ability/Condition inputs */}
                    {checkForm.check_type === 'ability' && (
                      <div className="flex gap-2">
                        <Select
                          value={checkForm.skill}
                          onValueChange={(v) => setCheckForm(prev => ({ ...prev, skill: v }))}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Skill" />
                          </SelectTrigger>
                          <SelectContent>
                            {DND_SKILLS.map(skill => (
                              <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          min={1}
                          max={30}
                          value={checkForm.dc}
                          onChange={(e) => setCheckForm(prev => ({ ...prev, dc: parseInt(e.target.value) || 10 }))}
                          className="w-20"
                          placeholder="CD"
                        />
                      </div>
                    )}

                    {checkForm.check_type === 'save' && (
                      <div className="flex gap-2">
                        <Select
                          value={checkForm.ability}
                          onValueChange={(v) => setCheckForm(prev => ({ ...prev, ability: v as typeof prev.ability }))}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Caratteristica" />
                          </SelectTrigger>
                          <SelectContent>
                            {DND_ABILITIES.map(ab => (
                              <SelectItem key={ab} value={ab}>{DND_ABILITY_LABELS[ab]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          min={1}
                          max={30}
                          value={checkForm.dc}
                          onChange={(e) => setCheckForm(prev => ({ ...prev, dc: parseInt(e.target.value) || 10 }))}
                          className="w-20"
                          placeholder="CD"
                        />
                      </div>
                    )}

                    {checkForm.check_type === 'condition' && (
                      <Input
                        value={checkForm.condition_text}
                        onChange={(e) => setCheckForm(prev => ({ ...prev, condition_text: e.target.value }))}
                        placeholder="es. 'Se hanno l'anello della Faglia'"
                      />
                    )}

                    {/* Outcomes */}
                    <div className="grid grid-cols-2 gap-2">
                      <Textarea
                        value={checkForm.success_text}
                        onChange={(e) => setCheckForm(prev => ({ ...prev, success_text: e.target.value }))}
                        placeholder="✓ Successo..."
                        rows={2}
                        className="resize-none text-sm"
                      />
                      <Textarea
                        value={checkForm.failure_text}
                        onChange={(e) => setCheckForm(prev => ({ ...prev, failure_text: e.target.value }))}
                        placeholder="✗ Fallimento..."
                        rows={2}
                        className="resize-none text-sm"
                      />
                    </div>

                    {/* Save button */}
                    <Button
                      onClick={handleCheckCreate}
                      disabled={savingCheck || !checkForm.success_text.trim() || !checkForm.failure_text.trim()}
                      className="w-full"
                      size="sm"
                    >
                      {savingCheck ? 'Salvataggio...' : 'Aggiungi Check'}
                    </Button>
                  </div>
                )}

                {/* Existing checks list */}
                <div className="space-y-2">
                  {nodeChecks.map(check => (
                    <div
                      key={check.id}
                      className="border rounded-lg p-3 bg-[var(--paper)] hover:border-[var(--teal)] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {check.check_type === 'ability' && <Dices size={14} className="text-[var(--teal)]" />}
                          {check.check_type === 'save' && <Shield size={14} className="text-purple-600" />}
                          {check.check_type === 'condition' && <HelpCircle size={14} className="text-orange-600" />}

                          <div>
                            {check.check_type === 'ability' && (
                              <span className="font-medium text-sm">
                                {check.skill}
                                <Badge className={`ml-2 ${getDCBadgeClass(check.dc)}`}>CD {check.dc}</Badge>
                              </span>
                            )}
                            {check.check_type === 'save' && (
                              <span className="font-medium text-sm">
                                TS {check.ability ? DND_ABILITY_LABELS[check.ability as DndAbility] : '?'}
                                <Badge className={`ml-2 ${getDCBadgeClass(check.dc)}`}>CD {check.dc}</Badge>
                              </span>
                            )}
                            {check.check_type === 'condition' && (
                              <span className="font-medium text-sm text-orange-700">{check.condition_text}</span>
                            )}
                          </div>

                          {check.is_hidden && <EyeOff size={10} className="text-[var(--ink-faded)]" />}
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCheckDelete(check.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-6 w-6 p-0"
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>

                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-green-50 rounded p-1.5 border border-green-200">
                          <span className="text-green-700 font-medium">✓</span>
                          <span className="text-green-800 ml-1 line-clamp-2">{check.success_text}</span>
                        </div>
                        <div className="bg-red-50 rounded p-1.5 border border-red-200">
                          <span className="text-red-700 font-medium">✗</span>
                          <span className="text-red-800 ml-1 line-clamp-2">{check.failure_text}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add check button when no checks exist */}
            {nodeChecks.length === 0 && !showCheckForm && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCheckForm(true)}
                className="w-full border-dashed"
              >
                <Dices size={14} className="mr-2" />
                Aggiungi Check Abilità
              </Button>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 border-t border-[var(--ink-faded)]/10 pt-4">
            {isEditingContent ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditingContent(false)
                    setEditTitle(selectedNode?.title || '')
                    setEditDescription(selectedNode?.description || '')
                  }}
                >
                  Annulla
                </Button>
                <Button
                  onClick={async () => {
                    await handleUpdateNode({
                      title: editTitle,
                      description: editDescription || null
                    })
                    setIsEditingContent(false)
                  }}
                  disabled={!editTitle.trim()}
                >
                  Salva Modifiche
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsEditingContent(true)}
                >
                  <GameIcon name="quill" category="ui" size={12} className="mr-1" />
                  Modifica
                </Button>
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
              </>
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
