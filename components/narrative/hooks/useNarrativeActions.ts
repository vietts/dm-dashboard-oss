'use client'

import { useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import {
  NarrativeNodeInsert,
  NarrativeNodeUpdate,
  NarrativeEdgeInsert,
  NarrativeNodeLinkInsert,
  NarrativeNode
} from '@/types/database'

interface UseNarrativeActionsOptions {
  actId: string
  refetch: () => Promise<void>
}

export function useNarrativeActions({ actId, refetch }: UseNarrativeActionsOptions) {

  // ============================================
  // NODE OPERATIONS
  // ============================================

  const createNode = useCallback(async (
    data: Omit<NarrativeNodeInsert, 'act_id'>
  ): Promise<string | null> => {
    const { data: newNode, error } = await supabase
      .from('dnd_narrative_nodes')
      .insert({
        ...data,
        act_id: actId
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error creating node:', error)
      return null
    }

    await refetch()
    return newNode.id
  }, [actId, supabase, refetch])

  const updateNode = useCallback(async (
    nodeId: string,
    updates: NarrativeNodeUpdate
  ): Promise<boolean> => {
    const { error } = await supabase
      .from('dnd_narrative_nodes')
      .update(updates)
      .eq('id', nodeId)

    if (error) {
      console.error('Error updating node:', error)
      return false
    }

    await refetch()
    return true
  }, [supabase, refetch])

  // Update node position (for canvas drag & drop) - does NOT refetch to avoid flicker
  const updateNodePosition = useCallback(async (
    nodeId: string,
    position: { x: number; y: number }
  ): Promise<boolean> => {
    const { error } = await supabase
      .from('dnd_narrative_nodes')
      .update({
        position_x: position.x,
        position_y: position.y
      })
      .eq('id', nodeId)

    if (error) {
      console.error('Error updating node position:', error)
      return false
    }

    // Don't refetch - positions are already updated optimistically in the canvas
    return true
  }, [supabase])

  const deleteNode = useCallback(async (nodeId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('dnd_narrative_nodes')
      .delete()
      .eq('id', nodeId)

    if (error) {
      console.error('Error deleting node:', error)
      return false
    }

    await refetch()
    return true
  }, [supabase, refetch])

  // Create a root node for a new act
  const createRootNode = useCallback(async (title: string): Promise<string | null> => {
    return createNode({
      title,
      is_root: true,
      is_current: true,
      position_x: 0,
      position_y: 0
    })
  }, [createNode])

  // ============================================
  // EDGE OPERATIONS
  // ============================================

  const createEdge = useCallback(async (
    data: NarrativeEdgeInsert
  ): Promise<string | null> => {
    const { data: newEdge, error } = await supabase
      .from('dnd_narrative_edges')
      .insert(data)
      .select('id')
      .single()

    if (error) {
      console.error('Error creating edge:', error)
      return null
    }

    await refetch()
    return newEdge.id
  }, [supabase, refetch])

  const updateEdge = useCallback(async (
    edgeId: string,
    updates: Partial<NarrativeEdgeInsert>
  ): Promise<boolean> => {
    const { error } = await supabase
      .from('dnd_narrative_edges')
      .update(updates)
      .eq('id', edgeId)

    if (error) {
      console.error('Error updating edge:', error)
      return false
    }

    await refetch()
    return true
  }, [supabase, refetch])

  const deleteEdge = useCallback(async (edgeId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('dnd_narrative_edges')
      .delete()
      .eq('id', edgeId)

    if (error) {
      console.error('Error deleting edge:', error)
      return false
    }

    await refetch()
    return true
  }, [supabase, refetch])

  // ============================================
  // LINK OPERATIONS
  // ============================================

  const addLink = useCallback(async (
    nodeId: string,
    linkType: 'note' | 'encounter' | 'monster',
    linkId: string
  ): Promise<boolean> => {
    const { error } = await supabase
      .from('dnd_narrative_node_links')
      .insert({
        node_id: nodeId,
        link_type: linkType,
        link_id: linkId
      })

    if (error) {
      console.error('Error adding link:', error)
      return false
    }

    await refetch()
    return true
  }, [supabase, refetch])

  const removeLink = useCallback(async (
    nodeId: string,
    linkType: 'note' | 'encounter' | 'monster',
    linkId: string
  ): Promise<boolean> => {
    const { error } = await supabase
      .from('dnd_narrative_node_links')
      .delete()
      .eq('node_id', nodeId)
      .eq('link_type', linkType)
      .eq('link_id', linkId)

    if (error) {
      console.error('Error removing link:', error)
      return false
    }

    await refetch()
    return true
  }, [supabase, refetch])

  // ============================================
  // LIVE SESSION OPERATIONS
  // ============================================

  // Take a path (mark edge as taken, update current node)
  const takePath = useCallback(async (
    edgeId: string,
    sessionId?: string
  ): Promise<boolean> => {
    // Get the edge to find from/to nodes
    const { data: edge, error: edgeError } = await supabase
      .from('dnd_narrative_edges')
      .select('from_node_id, to_node_id')
      .eq('id', edgeId)
      .single()

    if (edgeError || !edge) {
      console.error('Error finding edge:', edgeError)
      return false
    }

    const now = new Date().toISOString()

    // 1. Mark edge as taken
    const { error: updateEdgeError } = await supabase
      .from('dnd_narrative_edges')
      .update({
        was_taken: true,
        taken_at: now
      })
      .eq('id', edgeId)

    if (updateEdgeError) {
      console.error('Error updating edge:', updateEdgeError)
      return false
    }

    // 2. Mark from_node as visited (if not already)
    const { error: visitFromError } = await supabase
      .from('dnd_narrative_nodes')
      .update({
        was_visited: true,
        visited_at: now,
        is_current: false,
        session_id: sessionId || null
      })
      .eq('id', edge.from_node_id)

    if (visitFromError) {
      console.error('Error marking from node visited:', visitFromError)
    }

    // 3. Set to_node as current
    const { error: setCurrentError } = await supabase
      .from('dnd_narrative_nodes')
      .update({
        is_current: true
      })
      .eq('id', edge.to_node_id)

    if (setCurrentError) {
      console.error('Error setting current node:', setCurrentError)
      return false
    }

    await refetch()
    return true
  }, [supabase, refetch])

  // Set a specific node as current (manual navigation)
  const setCurrentNode = useCallback(async (nodeId: string): Promise<boolean> => {
    // First, clear current from all nodes in this act
    const { error: clearError } = await supabase
      .from('dnd_narrative_nodes')
      .update({ is_current: false })
      .eq('act_id', actId)

    if (clearError) {
      console.error('Error clearing current:', clearError)
      return false
    }

    // Then set the new current
    const { error: setError } = await supabase
      .from('dnd_narrative_nodes')
      .update({ is_current: true })
      .eq('id', nodeId)

    if (setError) {
      console.error('Error setting current:', setError)
      return false
    }

    await refetch()
    return true
  }, [actId, supabase, refetch])

  // Quick branch: create a new node from current and optionally take the path
  const quickBranch = useCallback(async (
    title: string,
    fromNodeId: string,
    edgeLabel?: string,
    autoTake: boolean = false
  ): Promise<string | null> => {
    // Get the parent node to calculate position
    const { data: parentNode } = await supabase
      .from('dnd_narrative_nodes')
      .select('position_x, position_y')
      .eq('id', fromNodeId)
      .single()

    // Count existing children to offset horizontally
    const { count } = await supabase
      .from('dnd_narrative_edges')
      .select('*', { count: 'exact', head: true })
      .eq('from_node_id', fromNodeId)

    const childCount = count || 0

    // Create the new node
    const newNodeId = await createNode({
      title,
      position_x: (parentNode?.position_x || 0) + childCount,
      position_y: (parentNode?.position_y || 0) + 1,
      is_root: false,
      is_current: false
    })

    if (!newNodeId) return null

    // Create edge from parent
    const edgeId = await createEdge({
      from_node_id: fromNodeId,
      to_node_id: newNodeId,
      label: edgeLabel || null
    })

    if (!edgeId) {
      // Rollback: delete the node
      await deleteNode(newNodeId)
      return null
    }

    // Optionally take the path immediately
    if (autoTake) {
      await takePath(edgeId)
    }

    return newNodeId
  }, [supabase, createNode, createEdge, deleteNode, takePath])

  // Reset session: clear all visited/current states
  const resetSession = useCallback(async (): Promise<boolean> => {
    // Reset all nodes
    const { error: nodesError } = await supabase
      .from('dnd_narrative_nodes')
      .update({
        is_current: false,
        was_visited: false,
        visited_at: null,
        session_id: null
      })
      .eq('act_id', actId)

    if (nodesError) {
      console.error('Error resetting nodes:', nodesError)
      return false
    }

    // Reset all edges
    const { data: nodeIds } = await supabase
      .from('dnd_narrative_nodes')
      .select('id')
      .eq('act_id', actId)

    if (nodeIds && nodeIds.length > 0) {
      const ids = nodeIds.map((n: { id: string }) => n.id)
      await supabase
        .from('dnd_narrative_edges')
        .update({
          was_taken: false,
          taken_at: null
        })
        .in('from_node_id', ids)
    }

    // Set root as current
    const { data: rootNode } = await supabase
      .from('dnd_narrative_nodes')
      .select('id')
      .eq('act_id', actId)
      .eq('is_root', true)
      .single()

    if (rootNode) {
      await supabase
        .from('dnd_narrative_nodes')
        .update({ is_current: true })
        .eq('id', rootNode.id)
    }

    await refetch()
    return true
  }, [actId, supabase, refetch])

  return {
    // Node operations
    createNode,
    updateNode,
    updateNodePosition,
    deleteNode,
    createRootNode,
    // Edge operations
    createEdge,
    updateEdge,
    deleteEdge,
    // Link operations
    addLink,
    removeLink,
    // Live session operations
    takePath,
    setCurrentNode,
    quickBranch,
    resetSession
  }
}
