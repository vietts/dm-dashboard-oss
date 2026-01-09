'use client'

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react'

// Breakpoint per 13" MacBook con sidebar aperta (~1024px utili)
const COMPACT_BREAKPOINT = 1024

// ============================================
// Layout settings per modalita
// ============================================
export interface CanvasLayoutSettings {
  // Dagre spacing
  nodesep: number    // Horizontal spacing tra nodi
  ranksep: number    // Vertical spacing tra livelli
  edgesep: number    // Spacing tra edge
  marginx: number
  marginy: number

  // Node dimensions
  nodeWidth: number
  nodeHeight: number

  // FitView settings
  fitViewPadding: number
  maxZoom: number
}

const COMPACT_SETTINGS: CanvasLayoutSettings = {
  nodesep: 100,
  ranksep: 120,
  edgesep: 50,
  marginx: 40,
  marginy: 40,
  nodeWidth: 160,
  nodeHeight: 70,
  fitViewPadding: 0.3,
  maxZoom: 1.2
}

const NORMAL_SETTINGS: CanvasLayoutSettings = {
  nodesep: 160,
  ranksep: 160,
  edgesep: 70,
  marginx: 60,
  marginy: 60,
  nodeWidth: 200,
  nodeHeight: 90,
  fitViewPadding: 0.2,
  maxZoom: 1.5
}

// ============================================
// Hook
// ============================================
interface UseResponsiveCanvasResult {
  isCompact: boolean
  isAutoCompact: boolean      // True se compact e attivo per viewport
  isManualOverride: boolean   // True se l'utente ha forzato una modalita
  settings: CanvasLayoutSettings
  toggleCompact: () => void
  setCompact: (value: boolean) => void
  resetToAuto: () => void
}

const STORAGE_KEY = 'narrative-canvas-compact-override'

export function useResponsiveCanvas(): UseResponsiveCanvasResult {
  // Auto-detect based on viewport
  const [isAutoCompact, setIsAutoCompact] = useState(false)

  // Manual override: null = auto, true/false = forced
  const [manualOverride, setManualOverride] = useState<boolean | null>(null)

  // Detect viewport on mount and resize
  useEffect(() => {
    const checkViewport = () => {
      const shouldBeCompact = window.innerWidth < COMPACT_BREAKPOINT
      setIsAutoCompact(shouldBeCompact)
    }

    // Check initial
    checkViewport()

    // Listen for resize
    window.addEventListener('resize', checkViewport)
    return () => window.removeEventListener('resize', checkViewport)
  }, [])

  // Load saved preference
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved !== null) {
      setManualOverride(saved === 'true')
    }
  }, [])

  // Save preference when changed manually
  const setCompact = useCallback((value: boolean) => {
    setManualOverride(value)
    localStorage.setItem(STORAGE_KEY, String(value))
  }, [])

  // Toggle between compact/normal
  const toggleCompact = useCallback(() => {
    const currentValue = manualOverride !== null ? manualOverride : isAutoCompact
    setCompact(!currentValue)
  }, [manualOverride, isAutoCompact, setCompact])

  // Reset to auto mode
  const resetToAuto = useCallback(() => {
    setManualOverride(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  // Final computed value
  const isCompact = manualOverride !== null ? manualOverride : isAutoCompact
  const settings = isCompact ? COMPACT_SETTINGS : NORMAL_SETTINGS

  return {
    isCompact,
    isAutoCompact,
    isManualOverride: manualOverride !== null,
    settings,
    toggleCompact,
    setCompact,
    resetToAuto
  }
}

// ============================================
// Context per condividere isCompact coi nodi
// ============================================
interface CanvasCompactContextValue {
  isCompact: boolean
}

const CanvasCompactContext = createContext<CanvasCompactContextValue>({ isCompact: false })

export function CanvasCompactProvider({
  children,
  isCompact
}: {
  children: ReactNode
  isCompact: boolean
}) {
  return (
    <CanvasCompactContext.Provider value={{ isCompact }}>
      {children}
    </CanvasCompactContext.Provider>
  )
}

export function useCanvasCompact() {
  return useContext(CanvasCompactContext)
}
