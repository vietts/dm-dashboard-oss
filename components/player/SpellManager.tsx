'use client'

import { useState } from 'react'
import { CharacterSpell, CachedSpell } from '@/types/database'
import { GameIcon } from '@/components/icons/GameIcon'

interface SpellManagerProps {
  characterId: string
  spells: CharacterSpell[]
  onUpdate: () => void
}

// Group spells by level
function groupSpellsByLevel(spells: CharacterSpell[]): Map<number, CharacterSpell[]> {
  const groups = new Map<number, CharacterSpell[]>()
  spells.forEach((spell) => {
    const level = spell.spell_level
    if (!groups.has(level)) groups.set(level, [])
    groups.get(level)!.push(spell)
  })
  return new Map([...groups.entries()].sort((a, b) => a[0] - b[0]))
}

const TAB_LABELS: Record<number, string> = {
  0: 'Cantrip', 1: '1°', 2: '2°', 3: '3°',
  4: '4°', 5: '5°', 6: '6°', 7: '7°', 8: '8°', 9: '9°',
}

export default function SpellManager({ characterId, spells, onUpdate }: SpellManagerProps) {
  const [viewingSpell, setViewingSpell] = useState<CachedSpell | null>(null)
  const [loadingSpell, setLoadingSpell] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const groupedSpells = groupSpellsByLevel(spells)
  const availableLevels = Array.from(groupedSpells.keys())
  const [activeTab, setActiveTab] = useState<number>(availableLevels[0] ?? 0)

  const preparedCount = spells.filter((s) => s.is_prepared).length
  const currentSpells = groupedSpells.get(activeTab) || []

  async function togglePrepared(spell: CharacterSpell) {
    setLoading(true)
    try {
      await fetch('/api/player-spells', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: spell.id, is_prepared: !spell.is_prepared }),
      })
      onUpdate()
    } finally {
      setLoading(false)
    }
  }

  async function viewSpellDetails(spell: CharacterSpell) {
    setLoadingSpell(spell.id)
    try {
      const res = await fetch(`/api/spells/${spell.spell_slug}`)
      if (res.ok) {
        const data = await res.json()
        setViewingSpell(data)
      }
    } finally {
      setLoadingSpell(null)
    }
  }

  return (
    <div className="parchment-card p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-display font-semibold text-[var(--ink)] flex items-center gap-2">
          <GameIcon name="book" category="ui" size={20} className="text-[var(--teal)]" />
          Incantesimi
        </h3>
        <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded font-medium">
          {preparedCount} preparati
        </span>
      </div>

      {spells.length === 0 ? (
        <p className="text-[var(--ink-faded)] text-sm text-center py-4">Nessun incantesimo conosciuto</p>
      ) : (
        <>
          {/* Level Tabs */}
          <div className="flex gap-1 mb-3 flex-wrap">
            {availableLevels.map((level) => {
              const count = groupedSpells.get(level)?.length || 0
              return (
                <button
                  key={level}
                  onClick={() => setActiveTab(level)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    activeTab === level
                      ? 'bg-purple-500 text-white'
                      : 'bg-[var(--cream-dark)] text-[var(--ink-light)] hover:bg-purple-100'
                  }`}
                >
                  {TAB_LABELS[level]} <span className="text-xs opacity-70">({count})</span>
                </button>
              )
            })}
          </div>

          {/* Spell Grid - NO scroll, all visible */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {currentSpells.map((spell) => (
              <div
                key={spell.id}
                className={`relative rounded-lg p-2 transition-colors ${
                  spell.is_prepared
                    ? 'bg-purple-100 border border-purple-300'
                    : 'bg-[var(--cream-dark)] border border-transparent'
                }`}
              >
                {/* Prepare toggle (only for non-cantrips) */}
                {activeTab > 0 && (
                  <button
                    onClick={() => togglePrepared(spell)}
                    disabled={loading}
                    className={`absolute top-1 right-1 w-5 h-5 rounded border flex items-center justify-center text-xs transition-colors ${
                      spell.is_prepared
                        ? 'bg-purple-500 border-purple-500 text-white'
                        : 'bg-[var(--paper)] border-[var(--border-decorative)] text-[var(--ink-light)] hover:border-purple-400'
                    }`}
                    title={spell.is_prepared ? 'Preparato' : 'Non preparato'}
                  >
                    {spell.is_prepared ? '✓' : ''}
                  </button>
                )}

                {/* Cantrip indicator */}
                {activeTab === 0 && (
                  <div className="absolute top-1 right-1 w-5 h-5 rounded bg-[var(--teal)] flex items-center justify-center text-xs text-white" title="Cantrip - sempre disponibile">
                    ∞
                  </div>
                )}

                {/* Spell name button */}
                <button
                  onClick={() => viewSpellDetails(spell)}
                  className="w-full text-left pr-6"
                >
                  <span className="text-sm text-[var(--ink)] hover:text-purple-600 transition-colors block truncate">
                    {spell.spell_name}
                  </span>
                  {loadingSpell === spell.id && (
                    <span className="text-xs text-[var(--ink-faded)]">...</span>
                  )}
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Spell Details Modal */}
      {viewingSpell && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={() => setViewingSpell(null)}>
          <div className="parchment-card max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-[var(--paper)] border-b border-[var(--border-decorative)] p-4 flex justify-between items-start">
              <div>
                <h4 className="text-lg font-display font-semibold text-purple-600">{viewingSpell.name}</h4>
                <p className="text-sm text-[var(--ink-light)]">
                  {viewingSpell.level_int === 0
                    ? `${viewingSpell.school} cantrip`
                    : `${viewingSpell.level_int}° livello ${viewingSpell.school?.toLowerCase()}`}
                </p>
              </div>
              <button
                onClick={() => setViewingSpell(null)}
                className="text-[var(--ink-light)] hover:text-[var(--ink)] text-xl transition-colors p-1"
              >
                ×
              </button>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2 text-[var(--ink-light)]">
                <div><span className="text-[var(--ink-faded)]">Tempo:</span> <span className="text-[var(--ink)]">{viewingSpell.casting_time}</span></div>
                <div><span className="text-[var(--ink-faded)]">Gittata:</span> <span className="text-[var(--ink)]">{viewingSpell.range}</span></div>
                <div><span className="text-[var(--ink-faded)]">Componenti:</span> <span className="text-[var(--ink)]">{viewingSpell.components}</span></div>
                <div>
                  <span className="text-[var(--ink-faded)]">Durata:</span>{' '}
                  <span className="text-[var(--ink)]">
                    {viewingSpell.requires_concentration && (
                      <GameIcon name="book" category="ui" size={12} className="inline mr-1 text-purple-500" />
                    )}
                    {viewingSpell.duration}
                  </span>
                </div>
              </div>
              <div className="border-t border-[var(--border-decorative)] pt-3 text-[var(--ink)] whitespace-pre-wrap">
                {viewingSpell.description}
              </div>
              {viewingSpell.higher_level && (
                <div className="border-t border-[var(--border-decorative)] pt-3">
                  <div className="text-[var(--health-mid)] font-medium mb-1">A livelli superiori:</div>
                  <div className="text-[var(--ink-light)]">{viewingSpell.higher_level}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
