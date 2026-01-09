'use client'

import { useState } from 'react'
import { CharacterSpell, CachedSpell } from '@/types/database'
import { GameIcon } from '@/components/icons/GameIcon'
import { SpellPicker } from './SpellPicker'
import { Zap } from 'lucide-react'
import {
  getSpellcastingSummary,
  canCastSpells,
  getModifier,
  getSpellcastingAbilityScore,
  normalizeClassName
} from '@/lib/spell-rules'
import type { Spell2024 } from '@/lib/spells-2024'

// D&D Beyond-style school colors
const SCHOOL_COLORS: Record<string, string> = {
  abjuration: '#2563eb',       // blue-600
  conjuration: '#9333ea',      // purple-600
  divination: '#4f46e5',       // indigo-600
  enchantment: '#ec4899',      // pink-600
  evocation: '#dc2626',        // red-600
  illusion: '#7c3aed',         // violet-600
  necromancy: '#1f2937',       // gray-800
  transmutation: '#059669',    // green-600
}

function getSchoolColor(school: string | undefined): string {
  if (!school) return '#8A857E' // Default ink-faded
  const normalized = school.toLowerCase().trim()
  return SCHOOL_COLORS[normalized] || '#8A857E'
}

interface SpellManagerProps {
  characterId: string
  characterClass: string
  characterLevel: number
  stats: { int: number; wis: number; cha: number }
  spells: CharacterSpell[]
  onUpdate: () => void
  readOnly?: boolean  // Disable editing in DM preview mode
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

// Helper: check if spell has any combat info
function hasSpellCombatInfo(spell: any): boolean {
  return !!(spell.saving_throw || spell.attack_roll || spell.damage || spell.area_of_effect)
}

export default function SpellManager({
  characterId,
  characterClass,
  characterLevel,
  stats,
  spells,
  onUpdate,
  readOnly = false
}: SpellManagerProps) {
  const [viewingSpell, setViewingSpell] = useState<CachedSpell | null>(null)
  const [loadingSpell, setLoadingSpell] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showSpellPicker, setShowSpellPicker] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<CharacterSpell | null>(null)

  const groupedSpells = groupSpellsByLevel(spells)
  const availableLevels = Array.from(groupedSpells.keys())
  const [activeTab, setActiveTab] = useState<number>(availableLevels[0] ?? 0)

  // Spellcasting calculations
  const normalizedClass = normalizeClassName(characterClass)
  const canCast = canCastSpells(normalizedClass)
  const abilityScore = getSpellcastingAbilityScore(normalizedClass, stats)
  const abilityMod = getModifier(abilityScore)
  const summary = getSpellcastingSummary(normalizedClass, characterLevel, abilityMod)

  // Counts
  const spellCount = spells.filter(s => s.spell_level > 0).length
  const cantripCount = spells.filter(s => s.spell_level === 0).length
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

  async function handleAddSpell(spell: Spell2024) {
    try {
      const res = await fetch('/api/player-spells', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character_id: characterId,
          spell_slug: spell.slug,
          spell_name: spell.name_it || spell.name,
          spell_level: spell.level
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Errore durante l\'aggiunta')
      }

      onUpdate()
    } catch (error) {
      console.error('Failed to add spell:', error)
      throw error
    }
  }

  async function handleRemoveSpell(spell: CharacterSpell) {
    setLoading(true)
    try {
      const res = await fetch(`/api/player-spells?id=${spell.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Errore durante la rimozione')
      }

      onUpdate()
    } catch (error) {
      console.error('Failed to remove spell:', error)
      alert('Errore durante la rimozione dell\'incantesimo')
    } finally {
      setLoading(false)
      setConfirmDelete(null)
    }
  }

  // Non-caster message
  if (!canCast) {
    return (
      <div className="parchment-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <GameIcon name="book" category="ui" size={20} className="text-[var(--ink-faded)]" />
          <h3 className="text-lg font-display font-semibold text-[var(--ink)]">Incantesimi</h3>
        </div>
        <p className="text-[var(--ink-faded)] text-sm text-center py-4">
          La classe {characterClass} non lancia incantesimi
        </p>
      </div>
    )
  }

  return (
    <div className="parchment-card p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-display font-bold leading-tight text-[var(--ink)] flex items-center gap-2">
          <GameIcon name="book" category="ui" size={20} className="text-[var(--teal)]" />
          Incantesimi
        </h3>
        <div className="flex items-center gap-2">
          {/* Spell count badge */}
          {summary.maxKnown !== null && (
            <span className={`text-xs px-2 py-1 rounded font-medium ${
              spellCount >= summary.maxKnown
                ? 'bg-red-100 text-red-600'
                : 'bg-purple-100 text-purple-600'
            }`}>
              {spellCount}/{summary.maxKnown} spell
            </span>
          )}
          {summary.cantripsKnown > 0 && (
            <span className={`text-xs px-2 py-1 rounded font-medium ${
              cantripCount >= summary.cantripsKnown
                ? 'bg-red-100 text-red-600'
                : 'bg-teal-100 text-teal-600'
            }`}>
              {cantripCount}/{summary.cantripsKnown} cantrip
            </span>
          )}
          {/* Add button */}
          {summary.canAddSpells && !readOnly && (
            <button
              onClick={() => setShowSpellPicker(true)}
              className="text-xs bg-purple-500 text-white px-2 py-1 rounded font-medium hover:bg-purple-600 transition-colors flex items-center gap-2"
            >
              <GameIcon name="plus" category="ui" size={12} />
              Aggiungi
            </button>
          )}
        </div>
      </div>

      {/* Prepared count for prepared casters */}
      {summary.type === 'prepared' && summary.maxPrepared && (
        <div className="text-xs text-[var(--ink-light)] mb-3">
          {preparedCount}/{summary.maxPrepared} preparati
        </div>
      )}

      {spells.length === 0 ? (
        <div className="text-center py-8">
          <GameIcon name="book" category="ui" size={32} className="mx-auto mb-4 text-[var(--ink-faded)] opacity-50" />
          <p className="text-sm text-[var(--ink-faded)] mb-4">Nessun incantesimo conosciuto</p>
          {summary.canAddSpells && !readOnly && (
            <button
              onClick={() => setShowSpellPicker(true)}
              className="text-sm bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors"
            >
              Aggiungi il tuo primo incantesimo
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Level Tabs */}
          <div className="flex gap-2 mb-3 flex-wrap">
            {availableLevels.map((level) => {
              const count = groupedSpells.get(level)?.length || 0
              return (
                <button
                  key={level}
                  onClick={() => setActiveTab(level)}
                  className={`px-3 py-2 text-sm rounded-lg transition-colors ${
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

          {/* Spell Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {currentSpells.map((spell) => (
              <div
                key={spell.id}
                className={`relative rounded-lg p-2 transition-all duration-200 group ${
                  spell.is_prepared
                    ? 'bg-purple-100 border-2 border-purple-400 shadow-sm'
                    : 'bg-[var(--cream-dark)] border-2 border-transparent hover:border-purple-200'
                }`}
              >
                {/* PREPARATO Badge - top left for better visibility */}
                {spell.is_prepared && activeTab > 0 && (
                  <div className="absolute top-1 left-1 bg-purple-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm z-10">
                    PREP
                  </div>
                )}

                {/* Top right buttons */}
                <div className="absolute top-1 right-1 flex items-center gap-1">
                  {/* Remove button (shown on hover) - hidden in read-only mode */}
                  {!readOnly && (
                    <button
                      onClick={() => setConfirmDelete(spell)}
                      disabled={loading}
                      className="w-5 h-5 rounded bg-red-100 border border-red-200 text-red-500 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200"
                      title="Rimuovi incantesimo"
                    >
                      ×
                    </button>
                  )}

                  {/* Prepare toggle (only for non-cantrips) - hidden in read-only mode */}
                  {activeTab > 0 && !readOnly && (
                    <button
                      onClick={() => togglePrepared(spell)}
                      disabled={loading}
                      className={`w-5 h-5 rounded border flex items-center justify-center text-xs transition-colors ${
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
                    <div className="w-5 h-5 rounded bg-[var(--teal)] flex items-center justify-center text-xs text-white" title="Cantrip - sempre disponibile">
                      ∞
                    </div>
                  )}
                </div>

                {/* Spell name button */}
                <button
                  onClick={() => viewSpellDetails(spell)}
                  className="w-full text-left pr-12"
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

      {/* Spell Picker Dialog */}
      <SpellPicker
        open={showSpellPicker}
        onClose={() => setShowSpellPicker(false)}
        onAddSpell={handleAddSpell}
        characterClass={characterClass}
        characterLevel={characterLevel}
        abilityModifier={abilityMod}
        currentSpells={spells.map(s => ({ spell_level: s.spell_level }))}
        existingSpellSlugs={spells.map(s => s.spell_slug)}
      />

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={() => setConfirmDelete(null)}>
          <div className="parchment-card max-w-sm w-full p-4" onClick={(e) => e.stopPropagation()}>
            <h4 className="text-lg font-display font-semibold text-[var(--ink)] mb-2">
              Rimuovere incantesimo?
            </h4>
            <p className="text-sm text-[var(--ink-light)] mb-4">
              Vuoi rimuovere <strong>{confirmDelete.spell_name}</strong> dalla tua lista di incantesimi?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm rounded-lg bg-[var(--cream-dark)] text-[var(--ink)] hover:bg-[var(--cream)]"
              >
                Annulla
              </button>
              <button
                onClick={() => handleRemoveSpell(confirmDelete)}
                disabled={loading}
                className="px-4 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
              >
                {loading ? '...' : 'Rimuovi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spell Details Modal */}
      {viewingSpell && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={() => setViewingSpell(null)}>
          <div
            className="parchment-card max-w-lg w-full max-h-[80vh] overflow-y-auto border-l-4"
            onClick={(e) => e.stopPropagation()}
            style={{ borderLeftColor: getSchoolColor(viewingSpell.school || undefined) }}
          >
            <div className="sticky top-0 bg-[var(--paper)] border-b border-[var(--border-decorative)] p-4 flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-start gap-2 mb-1">
                  <h4 className="text-lg font-display font-semibold text-purple-600">{viewingSpell.name}</h4>
                  {/* Concentration Badge */}
                  {viewingSpell.requires_concentration && (
                    <div className="flex items-center gap-1 bg-amber-100 border border-amber-400 text-amber-700 px-2 py-0.5 rounded-full text-xs font-bold">
                      <Zap size={12} />
                      <span>CONCENTRAZIONE</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm text-[var(--ink-light)]">
                    {viewingSpell.level_int === 0
                      ? `${viewingSpell.school} cantrip`
                      : `${viewingSpell.level_int}° livello ${viewingSpell.school?.toLowerCase()}`}
                  </p>
                  {/* School Color Indicator */}
                  {viewingSpell.school && (
                    <div
                      className="w-3 h-3 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: getSchoolColor(viewingSpell.school) }}
                      title={viewingSpell.school}
                    />
                  )}
                </div>
              </div>
              <button
                onClick={() => setViewingSpell(null)}
                className="text-[var(--ink-light)] hover:text-[var(--ink)] text-xl transition-colors p-1 ml-2"
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
                  <span className="text-[var(--ink)]">{viewingSpell.duration}</span>
                </div>
              </div>

              {/* Combat & Mechanics Section */}
              {hasSpellCombatInfo(viewingSpell) && (
                <div className="border-t border-[var(--border-decorative)] pt-3">
                  <div className="text-sm font-medium text-[var(--ink)] mb-2 flex items-center gap-1">
                    <GameIcon name="crossed-swords" category="ui" size={14} className="text-purple-500" />
                    Meccaniche di Combattimento
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">

                    {/* Tiro Salvezza */}
                    {viewingSpell.saving_throw && (
                      <div className="flex items-center gap-2">
                        <GameIcon name="shield" category="ui" size={14} className="text-orange-500" />
                        <span className="text-[var(--ink-faded)]">Tiro salvezza:</span>
                        <span className="text-[var(--ink)] font-medium">{viewingSpell.saving_throw}</span>
                      </div>
                    )}

                    {/* Tiro per Colpire */}
                    {viewingSpell.attack_roll && (
                      <div className="flex items-center gap-2">
                        <GameIcon name="crossed-swords" category="ui" size={14} className="text-red-500" />
                        <span className="text-[var(--ink)]">Richiede tiro per colpire</span>
                      </div>
                    )}

                    {/* Danno */}
                    {viewingSpell.damage && (
                      <div className="flex items-center gap-2">
                        <GameIcon name="lightning" category="ui" size={14} className="text-purple-500" />
                        <span className="text-[var(--ink-faded)]">Danno:</span>
                        <span className="text-[var(--ink)] font-medium">{viewingSpell.damage}</span>
                      </div>
                    )}

                    {/* Area d'Effetto */}
                    {viewingSpell.area_of_effect && (
                      <div className="flex items-center gap-2">
                        <GameIcon name="hexagon" category="ui" size={14} className="text-blue-500" />
                        <span className="text-[var(--ink-faded)]">Area:</span>
                        <span className="text-[var(--ink)] font-medium">{viewingSpell.area_of_effect}</span>
                      </div>
                    )}

                  </div>
                </div>
              )}

              <div className="border-t border-[var(--border-decorative)] pt-3 text-sm leading-relaxed text-[var(--ink)] whitespace-pre-wrap">
                {viewingSpell.description}
              </div>
              {viewingSpell.higher_level && (
                <div className="border-t border-[var(--border-decorative)] pt-3">
                  <div className="text-sm font-semibold text-[var(--health-mid)] mb-2">A livelli superiori:</div>
                  <div className="text-sm leading-relaxed text-[var(--ink-light)]">{viewingSpell.higher_level}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
