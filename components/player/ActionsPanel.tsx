'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Character } from '@/types/database'
import { GameIcon } from '@/components/icons/GameIcon'
import { Plus, Sword, Zap, Shield, Sparkles, ChevronDown, ChevronUp, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { toast } from 'sonner'
import ActionEconomyGuide from './ActionEconomyGuide'
import { UseDots } from './UseDots'

interface CharacterAction {
  id: string
  character_id: string
  name: string
  description: string | null
  action_type: 'action' | 'bonus_action' | 'reaction' | 'other'
  attack_type: 'melee' | 'ranged' | 'spell' | null
  range_value: string | null
  hit_bonus: number | null
  damage_dice: string | null
  damage_type: string | null
  limited_uses: number | null
  uses_remaining: number | null
  recharge_on: 'short_rest' | 'long_rest' | 'dawn' | 'turn' | null
  source: string | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

interface ActionsPanelProps {
  character: Character
  onUpdate?: () => void
  readOnly?: boolean
}

type ActionFilter = 'all' | 'available_now' | 'attack' | 'action' | 'bonus_action' | 'reaction' | 'limited_use'

export default function ActionsPanel({ character, onUpdate, readOnly = false }: ActionsPanelProps) {
  const characterId = character.id
  const [actions, setActions] = useState<CharacterAction[]>([])
  const [filter, setFilter] = useState<ActionFilter>('all')
  const [expandedActions, setExpandedActions] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [justUsedAction, setJustUsedAction] = useState<string | null>(null)
  const [lastActionAnnouncement, setLastActionAnnouncement] = useState<string>('')
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['action']))

  // Load actions
  const loadActions = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('dnd_character_actions')
      .select('*')
      .eq('character_id', characterId)
      .eq('is_active', true)
      .order('sort_order')
      .order('name')

    if (!error && data) {
      setActions(data as CharacterAction[])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadActions()
  }, [characterId])

  // Setup realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('character-actions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dnd_character_actions',
          filter: `character_id=eq.${characterId}`,
        },
        () => loadActions()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [characterId])

  // Filter actions
  const filteredActions = actions.filter((action) => {
    switch (filter) {
      case 'all':
        return true
      case 'available_now':
        // Show actions that are currently available:
        // - If has limited uses: must have uses_remaining > 0
        // - If no limited uses: always available (always show)
        if (action.limited_uses === null) {
          return true // Always available
        }
        return (action.uses_remaining || 0) > 0
      case 'attack':
        return action.attack_type !== null
      case 'action':
        return action.action_type === 'action'
      case 'bonus_action':
        return action.action_type === 'bonus_action'
      case 'reaction':
        return action.action_type === 'reaction'
      case 'limited_use':
        return action.limited_uses !== null
      default:
        return true
    }
  })

  // Toggle action expansion
  const toggleExpanded = (actionId: string) => {
    const newExpanded = new Set(expandedActions)
    if (newExpanded.has(actionId)) {
      newExpanded.delete(actionId)
    } else {
      newExpanded.add(actionId)
    }
    setExpandedActions(newExpanded)
  }

  // Use action (decrement uses)
  const useAction = async (action: CharacterAction) => {
    if (readOnly || !action.limited_uses || !action.uses_remaining) return

    // Trigger animation
    setJustUsedAction(action.id)
    setTimeout(() => setJustUsedAction(null), 600) // Match animation duration

    const previousUses = action.uses_remaining
    const newUses = Math.max(0, action.uses_remaining - 1)

    const { error } = await supabase
      .from('dnd_character_actions')
      .update({ uses_remaining: newUses })
      .eq('id', action.id)

    if (!error) {
      // Announce for screen readers
      setLastActionAnnouncement(`${action.name} usata. ${newUses} usi rimanenti su ${action.limited_uses}.`)

      toast.success(`${action.name} usata!`, {
        description: `Usi rimanenti: ${newUses}/${action.limited_uses}`,
        action: {
          label: 'Annulla',
          onClick: async () => {
            await supabase
              .from('dnd_character_actions')
              .update({ uses_remaining: previousUses })
              .eq('id', action.id)
            loadActions()
          },
        },
        duration: 5000,
      })
    }

    loadActions()
  }

  // Reset action uses
  const resetAction = async (action: CharacterAction) => {
    if (readOnly || !action.limited_uses) return

    const { error } = await supabase
      .from('dnd_character_actions')
      .update({ uses_remaining: action.limited_uses })
      .eq('id', action.id)

    if (!error) {
      // Announce for screen readers
      setLastActionAnnouncement(`${action.name} ripristinata. ${action.limited_uses} usi disponibili.`)

      toast.success(`${action.name} ripristinata!`, {
        description: `Usi ripristinati: ${action.limited_uses}/${action.limited_uses}`,
        duration: 3000,
      })
    }

    loadActions()
  }

  // Get action type badge - Enhanced for mobile readability
  const getActionTypeBadge = (actionType: string) => {
    const badges = {
      action: { label: 'AZIONE', fullLabel: 'Azione', color: 'bg-[var(--teal)]', icon: Sword },
      bonus_action: { label: 'BONUS', fullLabel: 'Azione Bonus', color: 'bg-blue-600', icon: Zap },
      reaction: { label: 'REAZIONE', fullLabel: 'Reazione', color: 'bg-purple-600', icon: Shield },
      other: { label: 'ALTRA', fullLabel: 'Altra', color: 'bg-gray-600', icon: Sparkles },
    }

    const badge = badges[actionType as keyof typeof badges] || badges.other
    const IconComponent = badge.icon

    return (
      <div className={`${badge.color} text-white text-sm font-extrabold rounded px-3 py-2 flex items-center gap-2 shadow-sm`}>
        <IconComponent size={14} />
        <span>{badge.label}</span>
      </div>
    )
  }

  // Action type configuration for accordion headers
  const actionTypeConfig = {
    action: { label: 'Azioni', icon: Sword, color: 'text-[var(--teal)]', bgColor: 'bg-[var(--teal)]' },
    bonus_action: { label: 'Azioni Bonus', icon: Zap, color: 'text-blue-600', bgColor: 'bg-blue-600' },
    reaction: { label: 'Reazioni', icon: Shield, color: 'text-purple-600', bgColor: 'bg-purple-600' },
    other: { label: 'Altre', icon: Sparkles, color: 'text-gray-600', bgColor: 'bg-gray-600' },
  }

  // Group actions by type
  const groupedActions = {
    action: filteredActions.filter(a => a.action_type === 'action'),
    bonus_action: filteredActions.filter(a => a.action_type === 'bonus_action'),
    reaction: filteredActions.filter(a => a.action_type === 'reaction'),
    other: filteredActions.filter(a => a.action_type === 'other'),
  }

  // Toggle accordion group
  const toggleGroup = (group: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(group)) {
      newExpanded.delete(group)
    } else {
      newExpanded.add(group)
    }
    setExpandedGroups(newExpanded)
  }

  // Get current filter label for mobile button
  const getFilterLabel = () => {
    const labels: Record<ActionFilter, string> = {
      all: 'Tutti',
      available_now: 'Disponibili',
      attack: 'Attacchi',
      action: 'Azioni',
      bonus_action: 'Bonus',
      reaction: 'Reazioni',
      limited_use: 'Limitati',
    }
    return labels[filter]
  }

  // Filter buttons component (shared between mobile sheet and desktop)
  const FilterButtons = ({ onSelect }: { onSelect?: () => void }) => (
    <div className="flex flex-col md:flex-row md:flex-wrap gap-2">
      <Button
        onClick={() => { setFilter('available_now'); onSelect?.() }}
        variant={filter === 'available_now' ? 'default' : 'outline'}
        size="sm"
        className={`min-h-[44px] font-bold transition-all justify-start md:justify-center ${
          filter === 'available_now'
            ? 'bg-[var(--teal)] text-white shadow-lg'
            : 'hover:bg-[var(--cream)]'
        }`}
      >
        <Sparkles size={14} className="mr-2" />
        DISPONIBILI ORA
      </Button>
      <Button
        onClick={() => { setFilter('all'); onSelect?.() }}
        variant={filter === 'all' ? 'default' : 'outline'}
        size="sm"
        className="min-h-[44px] justify-start md:justify-center"
      >
        TUTTI
      </Button>
      <Button
        onClick={() => { setFilter('attack'); onSelect?.() }}
        variant={filter === 'attack' ? 'default' : 'outline'}
        size="sm"
        className="min-h-[44px] justify-start md:justify-center"
      >
        <Sword size={14} className="mr-2" />
        ATTACCHI
      </Button>
      <Button
        onClick={() => { setFilter('action'); onSelect?.() }}
        variant={filter === 'action' ? 'default' : 'outline'}
        size="sm"
        className="min-h-[44px] justify-start md:justify-center"
      >
        AZIONI
      </Button>
      <Button
        onClick={() => { setFilter('bonus_action'); onSelect?.() }}
        variant={filter === 'bonus_action' ? 'default' : 'outline'}
        size="sm"
        className="min-h-[44px] justify-start md:justify-center"
      >
        <Zap size={14} className="mr-2" />
        BONUS
      </Button>
      <Button
        onClick={() => { setFilter('reaction'); onSelect?.() }}
        variant={filter === 'reaction' ? 'default' : 'outline'}
        size="sm"
        className="min-h-[44px] justify-start md:justify-center"
      >
        <Shield size={14} className="mr-2" />
        REAZIONI
      </Button>
      <Button
        onClick={() => { setFilter('limited_use'); onSelect?.() }}
        variant={filter === 'limited_use' ? 'default' : 'outline'}
        size="sm"
        className="min-h-[44px] justify-start md:justify-center"
      >
        USI LIMITATI
      </Button>
    </div>
  )

  if (loading) {
    return (
      <div className="parchment-card p-8 text-center">
        <GameIcon name="d20" category="ui" size={40} className="text-[var(--teal)] animate-pulse mx-auto mb-4" />
        <p className="text-sm text-[var(--ink-light)]">Caricamento azioni...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* ARIA Live Region for Screen Readers */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {lastActionAnnouncement}
      </div>

      {/* Action Economy Educational Guide */}
      <ActionEconomyGuide character={character} />

      {/* Filter Buttons - Mobile: Bottom Sheet, Desktop: Inline */}
      {/* Mobile: Bottom Sheet */}
      <div className="md:hidden">
        <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full min-h-[44px] justify-between">
              <div className="flex items-center gap-2">
                <Filter size={16} />
                <span>Filtra: {getFilterLabel()}</span>
              </div>
              {filter !== 'all' && (
                <span className="bg-[var(--teal)] text-white text-xs px-2 py-0.5 rounded-full">
                  Attivo
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="bg-[var(--paper)] rounded-t-xl">
            <SheetHeader className="pb-2">
              <SheetTitle className="font-display text-[var(--ink)]">Filtra Azioni</SheetTitle>
            </SheetHeader>
            <div className="pb-6">
              <FilterButtons onSelect={() => setFilterSheetOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: Inline buttons */}
      <div className="hidden md:block">
        <FilterButtons />
      </div>

      {/* Actions List - Grouped by Type with Accordion */}
      {filteredActions.length === 0 ? (
        <div className="parchment-card p-8 text-center">
          <GameIcon name="sword" category="ui" size={48} className="text-[var(--ink-faded)] mx-auto mb-4" />
          <h3 className="text-lg font-display font-bold text-[var(--ink)] mb-2">Nessuna azione trovata</h3>
          <p className="text-[var(--ink-light)] text-sm">
            {filter === 'all'
              ? 'Non ci sono ancora azioni disponibili per questo personaggio.'
              : filter === 'available_now'
              ? 'Tutte le azioni con usi limitati sono esaurite. Effettua un riposo per recuperarle.'
              : `Nessuna azione corrisponde al filtro "${filter}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {(Object.entries(groupedActions) as [keyof typeof actionTypeConfig, CharacterAction[]][]).map(([type, actionsInGroup]) => {
            if (actionsInGroup.length === 0) return null

            const config = actionTypeConfig[type]
            const IconComponent = config.icon
            const isGroupExpanded = expandedGroups.has(type)

            return (
              <Collapsible key={type} open={isGroupExpanded} onOpenChange={() => toggleGroup(type)}>
                {/* Accordion Header */}
                <CollapsibleTrigger className="w-full">
                  <div className={`parchment-card p-4 flex items-center justify-between hover:bg-[var(--cream)] transition-colors`}>
                    <div className="flex items-center gap-3">
                      <div className={`${config.bgColor} text-white p-2 rounded-lg`}>
                        <IconComponent size={18} />
                      </div>
                      <div className="text-left">
                        <h3 className="font-display font-bold text-[var(--ink)] text-base">
                          {config.label}
                        </h3>
                        <span className="text-xs text-[var(--ink-light)]">
                          {actionsInGroup.length} {actionsInGroup.length === 1 ? 'azione' : 'azioni'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${config.color}`}>
                        {actionsInGroup.length}
                      </span>
                      {isGroupExpanded ? (
                        <ChevronUp size={20} className="text-[var(--ink-light)]" />
                      ) : (
                        <ChevronDown size={20} className="text-[var(--ink-light)]" />
                      )}
                    </div>
                  </div>
                </CollapsibleTrigger>

                {/* Accordion Content - Action Cards */}
                <CollapsibleContent>
                  <div className="space-y-2 mt-2 ml-2 pl-4 border-l-2 border-[var(--border-decorative)]">
                    {actionsInGroup.map((action) => {
                      const isExpanded = expandedActions.has(action.id)
                      const isExhausted = action.limited_uses !== null && (action.uses_remaining || 0) === 0

                      return (
                        <div
                          key={action.id}
                          className={`parchment-card p-3 md:p-4 transition-all duration-200 relative ${
                            isExhausted
                              ? 'opacity-60 hover:opacity-75'
                              : 'opacity-95 hover:opacity-100 hover:shadow-lg'
                          } ${justUsedAction === action.id ? 'card-use-animation' : ''}`}
                        >
                          {/* ESAURITO Badge */}
                          {isExhausted && (
                            <div className="absolute top-2 right-2 bg-[var(--coral)] text-white text-xs font-bold px-2 py-1 rounded shadow-sm z-10">
                              ESAURITO
                            </div>
                          )}

                          {/* Action Header - Compact on mobile */}
                          <button
                            onClick={() => toggleExpanded(action.id)}
                            className="w-full text-left"
                          >
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <h4 className="font-display font-bold text-[var(--ink)] text-base leading-tight flex-1 pr-2">
                                {action.name}
                              </h4>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {action.limited_uses !== null && (
                                  <div className="flex items-center gap-1">
                                    <UseDots
                                      current={action.uses_remaining || 0}
                                      max={action.limited_uses}
                                      size="sm"
                                      className={
                                        (action.uses_remaining || 0) === 0
                                          ? 'text-[var(--coral)]'
                                          : 'text-[var(--teal)]'
                                      }
                                    />
                                  </div>
                                )}
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </div>
                            </div>

                            {/* Compact Stats Row */}
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--ink-light)]">
                              {action.hit_bonus !== null && (
                                <span>
                                  <span className="text-[var(--ink)] font-semibold">
                                    {action.hit_bonus >= 0 ? '+' : ''}{action.hit_bonus}
                                  </span> hit
                                </span>
                              )}
                              {action.damage_dice && (
                                <span>
                                  <span className="text-[var(--ink)] font-semibold">{action.damage_dice}</span>
                                  {action.damage_type && ` ${action.damage_type}`}
                                </span>
                              )}
                              {action.range_value && (
                                <span className="text-[var(--ink-faded)]">{action.range_value}</span>
                              )}
                            </div>
                          </button>

                          {/* Expanded Content */}
                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-[var(--border-decorative)] space-y-3">
                              {action.description && (
                                <p className="text-sm leading-relaxed text-[var(--ink-light)] whitespace-pre-wrap">
                                  {action.description}
                                </p>
                              )}
                              {action.source && (
                                <p className="text-xs text-[var(--ink-faded)]">Fonte: {action.source}</p>
                              )}

                              {/* Limited Use Controls */}
                              {!readOnly && action.limited_uses !== null && (
                                <div className="flex gap-2">
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      useAction(action)
                                    }}
                                    disabled={(action.uses_remaining || 0) === 0}
                                    size="sm"
                                    className="min-h-[44px]"
                                  >
                                    Usa (-1)
                                  </Button>
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      resetAction(action)
                                    }}
                                    variant="outline"
                                    size="sm"
                                    className="min-h-[44px]"
                                  >
                                    Reset
                                    {action.recharge_on && ` (${action.recharge_on.replace('_', ' ')})`}
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )
          })}
        </div>
      )}
    </div>
  )
}
