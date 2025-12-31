'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import {
  NarrativeNode,
  NarrativeEdge,
  NarrativeNodeLink,
  NarrativeTree,
  StoryNote,
  Encounter,
  Monster
} from '@/types/database'

interface UseNarrativeTreeOptions {
  actId: string
}

interface UseNarrativeTreeResult {
  tree: NarrativeTree | null
  nodes: NarrativeNode[]
  edges: NarrativeEdge[]
  links: NarrativeNodeLink[]
  rootNode: NarrativeNode | null
  currentNode: NarrativeNode | null
  visitedPath: NarrativeNode[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  // Linked content (resolved)
  notes: StoryNote[]
  encounters: Encounter[]
  monsters: Monster[]
}

export function useNarrativeTree({ actId }: UseNarrativeTreeOptions): UseNarrativeTreeResult {
  const [nodes, setNodes] = useState<NarrativeNode[]>([])
  const [edges, setEdges] = useState<NarrativeEdge[]>([])
  const [links, setLinks] = useState<NarrativeNodeLink[]>([])
  const [notes, setNotes] = useState<StoryNote[]>([])
  const [encounters, setEncounters] = useState<Encounter[]>([])
  const [monsters, setMonsters] = useState<Monster[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTree = useCallback(async () => {
    if (!actId) return

    setLoading(true)
    setError(null)

    try {
      // Fetch nodes for this act
      const { data: nodesData, error: nodesError } = await supabase
        .from('dnd_narrative_nodes')
        .select('*')
        .eq('act_id', actId)
        .order('position_y', { ascending: true })

      if (nodesError) throw nodesError

      // Fetch edges for these nodes
      const nodeIds = nodesData?.map((n: { id: string }) => n.id) || []
      let edgesData: NarrativeEdge[] = []

      if (nodeIds.length > 0) {
        const { data: edgesResult, error: edgesError } = await supabase
          .from('dnd_narrative_edges')
          .select('*')
          .or(`from_node_id.in.(${nodeIds.join(',')}),to_node_id.in.(${nodeIds.join(',')})`)

        if (edgesError) throw edgesError
        edgesData = edgesResult || []
      }

      // Fetch links for these nodes
      let linksData: NarrativeNodeLink[] = []

      if (nodeIds.length > 0) {
        const { data: linksResult, error: linksError } = await supabase
          .from('dnd_narrative_node_links')
          .select('*')
          .in('node_id', nodeIds)

        if (linksError) throw linksError
        linksData = linksResult || []
      }

      // Get linked content IDs
      const noteIds = linksData.filter(l => l.link_type === 'note').map(l => l.link_id)
      const encounterIds = linksData.filter(l => l.link_type === 'encounter').map(l => l.link_id)
      const monsterIds = linksData.filter(l => l.link_type === 'monster').map(l => l.link_id)

      // Fetch linked notes
      let notesData: StoryNote[] = []
      if (noteIds.length > 0) {
        const { data: notesResult } = await supabase
          .from('dnd_story_notes')
          .select('*')
          .in('id', noteIds)
        notesData = notesResult || []
      }

      // Fetch linked encounters
      let encountersData: Encounter[] = []
      if (encounterIds.length > 0) {
        const { data: encountersResult } = await supabase
          .from('dnd_encounters')
          .select('*')
          .in('id', encounterIds)
        encountersData = encountersResult || []
      }

      // Fetch linked monsters
      let monstersData: Monster[] = []
      if (monsterIds.length > 0) {
        const { data: monstersResult } = await supabase
          .from('dnd_monsters')
          .select('*')
          .in('id', monsterIds)
        monstersData = monstersResult || []
      }

      setNodes(nodesData || [])
      setEdges(edgesData)
      setLinks(linksData)
      setNotes(notesData)
      setEncounters(encountersData)
      setMonsters(monstersData)
    } catch (err) {
      console.error('Error fetching narrative tree:', err)
      setError(err instanceof Error ? err.message : 'Errore nel caricamento')
    } finally {
      setLoading(false)
    }
  }, [actId, supabase])

  useEffect(() => {
    fetchTree()
  }, [fetchTree])

  // Computed values
  const rootNode = useMemo(() => {
    return nodes.find(n => n.is_root) || null
  }, [nodes])

  const currentNode = useMemo(() => {
    return nodes.find(n => n.is_current) || null
  }, [nodes])

  const visitedPath = useMemo(() => {
    return nodes
      .filter(n => n.was_visited && n.visited_at)
      .sort((a, b) => {
        const aTime = a.visited_at ? new Date(a.visited_at).getTime() : 0
        const bTime = b.visited_at ? new Date(b.visited_at).getTime() : 0
        return aTime - bTime
      })
  }, [nodes])

  const tree = useMemo((): NarrativeTree | null => {
    if (loading) return null

    return {
      nodes,
      edges,
      links,
      root_node: rootNode,
      current_node: currentNode,
      visited_path: visitedPath.map(n => n.id)
    }
  }, [nodes, edges, links, rootNode, currentNode, visitedPath, loading])

  return {
    tree,
    nodes,
    edges,
    links,
    rootNode,
    currentNode,
    visitedPath,
    loading,
    error,
    refetch: fetchTree,
    notes,
    encounters,
    monsters
  }
}
