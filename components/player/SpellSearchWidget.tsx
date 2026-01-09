'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Search, Sparkles, Zap } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { GameIcon } from '@/components/icons/GameIcon'
import { supabase } from '@/lib/supabase'
import { formatSchool, formatSpellLevel, type Spell2024 } from '@/lib/spells-2024'

// School colors (from SpellManager)
const SCHOOL_COLORS: Record<string, string> = {
  abjuration: '#2563eb',
  conjuration: '#9333ea',
  divination: '#4f46e5',
  enchantment: '#ec4899',
  evocation: '#dc2626',
  illusion: '#7c3aed',
  necromancy: '#1f2937',
  transmutation: '#059669',
}

function getSchoolColor(school: string | undefined): string {
  if (!school) return '#8A857E'
  return SCHOOL_COLORS[school.toLowerCase()] || '#8A857E'
}

interface SpellSearchWidgetProps {
  defaultCollapsed?: boolean
}

/**
 * SpellSearchWidget - Read-only spell search for quick reference
 *
 * Allows players to search and view spell details without adding them to their character.
 */
export default function SpellSearchWidget({ defaultCollapsed = true }: SpellSearchWidgetProps) {
  const [expanded, setExpanded] = useState(!defaultCollapsed)
  const [searchQuery, setSearchQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState<number | null>(null)
  const [results, setResults] = useState<Spell2024[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedSpell, setSelectedSpell] = useState<Spell2024 | null>(null)

  // Debounced search
  useEffect(() => {
    if (!expanded) return
    if (!searchQuery.trim() && levelFilter === null) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      setIsLoading(true)
      try {
        let query = supabase
          .from('dnd_2024_spells')
          .select('*')
          .order('level', { ascending: true })
          .order('name', { ascending: true })
          .limit(6)

        if (searchQuery.trim()) {
          query = query.or(`name.ilike.%${searchQuery}%,name_it.ilike.%${searchQuery}%`)
        }

        if (levelFilter !== null) {
          query = query.eq('level', levelFilter)
        }

        const { data, error } = await query

        if (error) throw error
        setResults(data || [])
      } catch (error) {
        console.error('Error searching spells:', error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, levelFilter, expanded])

  // Reset when collapsed
  useEffect(() => {
    if (!expanded) {
      setSearchQuery('')
      setLevelFilter(null)
      setResults([])
    }
  }, [expanded])

  // Check if spell has combat info
  const hasSpellCombatInfo = (spell: Spell2024): boolean => {
    return !!(spell.saving_throw || spell.attack_roll || spell.damage || spell.area_of_effect)
  }

  return (
    <div className="spell-search-widget parchment-card p-4">
      {/* Collapsible Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between group"
      >
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-purple-500" />
          <h3 className="font-display font-bold text-[var(--ink)]">
            Cerca Incantesimo
          </h3>
        </div>
        <div className="text-[var(--ink-light)] group-hover:text-[var(--ink)] transition-colors">
          {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-light)]" />
            <Input
              placeholder="Nome incantesimo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Level Filter Chips */}
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setLevelFilter(null)}
              className={`px-2 py-1 text-xs rounded-full transition-colors ${
                levelFilter === null
                  ? 'bg-purple-500 text-white'
                  : 'bg-[var(--cream-dark)] text-[var(--ink-light)] hover:bg-purple-100'
              }`}
            >
              Tutti
            </button>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((level) => (
              <button
                key={level}
                onClick={() => setLevelFilter(level === levelFilter ? null : level)}
                className={`px-2 py-1 text-xs rounded-full transition-colors ${
                  levelFilter === level
                    ? 'bg-purple-500 text-white'
                    : 'bg-[var(--cream-dark)] text-[var(--ink-light)] hover:bg-purple-100'
                }`}
              >
                {level === 0 ? 'C' : level}
              </button>
            ))}
          </div>

          {/* Results */}
          {isLoading ? (
            <div className="text-center py-4 text-[var(--ink-light)] text-sm">
              Caricamento...
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {results.map((spell) => (
                <button
                  key={spell.id}
                  onClick={() => setSelectedSpell(spell)}
                  className="text-left p-2 rounded-lg bg-[var(--cream-dark)] hover:bg-purple-100 transition-colors border border-transparent hover:border-purple-300"
                >
                  <div className="font-medium text-sm text-[var(--ink)] truncate">
                    {spell.name_it || spell.name}
                  </div>
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded text-white"
                      style={{ backgroundColor: getSchoolColor(spell.school) }}
                    >
                      {formatSpellLevel(spell.level)}
                    </span>
                    {spell.concentration && (
                      <span className="text-[10px] px-1 py-0.5 rounded bg-amber-100 text-amber-700">C</span>
                    )}
                    {spell.ritual && (
                      <span className="text-[10px] px-1 py-0.5 rounded bg-blue-100 text-blue-700">R</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : searchQuery || levelFilter !== null ? (
            <div className="text-center py-4 text-[var(--ink-light)] text-sm">
              Nessun incantesimo trovato
            </div>
          ) : (
            <div className="text-center py-4 text-[var(--ink-light)] text-sm">
              Cerca un incantesimo per nome o filtra per livello
            </div>
          )}
        </div>
      )}

      {/* Spell Detail Modal */}
      {selectedSpell && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedSpell(null)}
        >
          <div
            className="parchment-card max-w-lg w-full max-h-[80vh] overflow-y-auto border-l-4"
            onClick={(e) => e.stopPropagation()}
            style={{ borderLeftColor: getSchoolColor(selectedSpell.school) }}
          >
            {/* Header */}
            <div className="sticky top-0 bg-[var(--paper)] border-b border-[var(--border-decorative)] p-4 flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-start gap-2 mb-1">
                  <h4 className="text-lg font-display font-semibold text-purple-600">
                    {selectedSpell.name_it || selectedSpell.name}
                  </h4>
                  {selectedSpell.concentration && (
                    <div className="flex items-center gap-1 bg-amber-100 border border-amber-400 text-amber-700 px-2 py-0.5 rounded-full text-xs font-bold">
                      <Zap size={12} />
                      <span>CONC</span>
                    </div>
                  )}
                  {selectedSpell.ritual && (
                    <div className="bg-blue-100 border border-blue-400 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold">
                      RITUALE
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-[var(--ink-light)]">
                    {selectedSpell.level === 0
                      ? `${formatSchool(selectedSpell.school)} cantrip`
                      : `${selectedSpell.level}° livello ${formatSchool(selectedSpell.school).toLowerCase()}`}
                  </p>
                  <div
                    className="w-3 h-3 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: getSchoolColor(selectedSpell.school) }}
                    title={formatSchool(selectedSpell.school)}
                  />
                </div>
              </div>
              <button
                onClick={() => setSelectedSpell(null)}
                className="text-[var(--ink-light)] hover:text-[var(--ink)] text-xl transition-colors p-1 ml-2"
              >
                x
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3 text-sm">
              {/* Mechanics Grid */}
              <div className="grid grid-cols-2 gap-2 text-[var(--ink-light)]">
                <div>
                  <span className="text-[var(--ink-faded)]">Tempo:</span>{' '}
                  <span className="text-[var(--ink)]">{selectedSpell.action_type || '-'}</span>
                </div>
                <div>
                  <span className="text-[var(--ink-faded)]">Gittata:</span>{' '}
                  <span className="text-[var(--ink)]">{selectedSpell.range || '-'}</span>
                </div>
                <div>
                  <span className="text-[var(--ink-faded)]">Componenti:</span>{' '}
                  <span className="text-[var(--ink)]">
                    {selectedSpell.components?.join(', ') || '-'}
                    {selectedSpell.material && ` (${selectedSpell.material})`}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--ink-faded)]">Durata:</span>{' '}
                  <span className="text-[var(--ink)]">{selectedSpell.duration || '-'}</span>
                </div>
              </div>

              {/* Combat Mechanics */}
              {hasSpellCombatInfo(selectedSpell) && (
                <div className="border-t border-[var(--border-decorative)] pt-3">
                  <div className="text-sm font-medium text-[var(--ink)] mb-2 flex items-center gap-1">
                    <GameIcon name="crossed-swords" category="ui" size={14} className="text-purple-500" />
                    Meccaniche di Combattimento
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    {selectedSpell.saving_throw && (
                      <div className="flex items-center gap-2">
                        <GameIcon name="shield" category="ui" size={14} className="text-orange-500" />
                        <span className="text-[var(--ink-faded)]">TS:</span>
                        <span className="text-[var(--ink)] font-medium">{selectedSpell.saving_throw}</span>
                      </div>
                    )}
                    {selectedSpell.attack_roll && (
                      <div className="flex items-center gap-2">
                        <GameIcon name="crossed-swords" category="ui" size={14} className="text-red-500" />
                        <span className="text-[var(--ink)]">Tiro per colpire</span>
                      </div>
                    )}
                    {selectedSpell.damage && (
                      <div className="flex items-center gap-2">
                        <GameIcon name="lightning" category="ui" size={14} className="text-purple-500" />
                        <span className="text-[var(--ink-faded)]">Danno:</span>
                        <span className="text-[var(--ink)] font-medium">{selectedSpell.damage}</span>
                      </div>
                    )}
                    {selectedSpell.area_of_effect && (
                      <div className="flex items-center gap-2">
                        <GameIcon name="hexagon" category="ui" size={14} className="text-blue-500" />
                        <span className="text-[var(--ink-faded)]">Area:</span>
                        <span className="text-[var(--ink)] font-medium">{selectedSpell.area_of_effect}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="border-t border-[var(--border-decorative)] pt-3 text-sm leading-relaxed text-[var(--ink)] whitespace-pre-wrap">
                {selectedSpell.description_it || selectedSpell.description || 'Nessuna descrizione disponibile.'}
              </div>

              {/* Higher Level */}
              {selectedSpell.higher_level_slot && (
                <div className="border-t border-[var(--border-decorative)] pt-3">
                  <div className="text-sm font-semibold text-[var(--health-mid)] mb-2">A livelli superiori:</div>
                  <div className="text-sm leading-relaxed text-[var(--ink-light)]">
                    {selectedSpell.higher_level_slot}
                  </div>
                </div>
              )}

              {/* Cantrip Upgrade */}
              {selectedSpell.level === 0 && selectedSpell.cantrip_upgrade && (
                <div className="border-t border-[var(--border-decorative)] pt-3">
                  <div className="text-sm font-semibold text-[var(--teal)] mb-2">Potenziamento per livello:</div>
                  <div className="text-sm leading-relaxed text-[var(--ink-light)]">
                    {selectedSpell.cantrip_upgrade}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
