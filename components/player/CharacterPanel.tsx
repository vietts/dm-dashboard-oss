'use client'

import { useState, useEffect, useMemo } from 'react'
import { Character, ClassResource } from '@/types/database'
import { GameIcon, CLASS_ICONS } from '@/components/icons/GameIcon'
import { ResourceCard } from './ResourceCard'
import { PassiveFeatureCard } from './PassiveFeatureCard'
import { getPassiveFeatures } from '@/lib/class-features'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Plus, Minus, Star } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface CharacterPanelProps {
  character: Character
  onUpdate?: () => void
  readOnly?: boolean
}

// Calculate ability modifier
function getModifier(score: number): string {
  const mod = Math.floor((score - 10) / 2)
  return mod >= 0 ? `+${mod}` : `${mod}`
}

// Spell slot structure by class level (simplified for common casters)
const SPELL_SLOTS_BY_LEVEL: Record<number, number[]> = {
  1: [2],
  2: [3],
  3: [4, 2],
  4: [4, 3],
  5: [4, 3, 2],
  6: [4, 3, 3],
  7: [4, 3, 3, 1],
  8: [4, 3, 3, 2],
  9: [4, 3, 3, 3, 1],
  10: [4, 3, 3, 3, 2],
  11: [4, 3, 3, 3, 2, 1],
  12: [4, 3, 3, 3, 2, 1],
  13: [4, 3, 3, 3, 2, 1, 1],
  14: [4, 3, 3, 3, 2, 1, 1],
  15: [4, 3, 3, 3, 2, 1, 1, 1],
  16: [4, 3, 3, 3, 2, 1, 1, 1],
  17: [4, 3, 3, 3, 2, 1, 1, 1, 1],
  18: [4, 3, 3, 3, 3, 1, 1, 1, 1],
  19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
  20: [4, 3, 3, 3, 3, 2, 2, 1, 1],
}

// Check if class is a full caster
function isFullCaster(className: string | null): boolean {
  if (!className) return false
  const casterClasses = ['wizard', 'sorcerer', 'cleric', 'druid', 'bard', 'warlock']
  return casterClasses.some(c => className.toLowerCase().includes(c))
}

// Get hit die based on class
function getHitDie(className: string | null): number {
  if (!className) return 8
  const cl = className.toLowerCase()
  if (cl.includes('barbarian')) return 12
  if (cl.includes('fighter') || cl.includes('paladin') || cl.includes('ranger')) return 10
  if (cl.includes('sorcerer') || cl.includes('wizard')) return 6
  return 8 // Default for most classes
}

export default function CharacterPanel({ character, onUpdate, readOnly = false }: CharacterPanelProps) {
  // State for optimistic updates
  const [localResources, setLocalResources] = useState<ClassResource[]>(
    (character.class_resources as ClassResource[] | null) || []
  )
  const [isRestLoading, setIsRestLoading] = useState(false)
  const [restDialogOpen, setRestDialogOpen] = useState<'short' | 'long' | null>(null)
  const [lastRestAnnouncement, setLastRestAnnouncement] = useState<string>('')
  const [updating, setUpdating] = useState(false)

  // Sync with prop changes (Supabase real-time updates)
  useEffect(() => {
    setLocalResources((character.class_resources as ClassResource[] | null) || [])
  }, [character.class_resources])

  // Calculate passive features
  const passiveFeatures = useMemo(
    () => getPassiveFeatures({ class: character.class, level: character.level ?? 1 }),
    [character.class, character.level]
  )

  // Ability scores
  const abilities = [
    { name: 'FOR', key: 'str', score: character.str ?? 10 },
    { name: 'DES', key: 'dex', score: character.dex ?? 10 },
    { name: 'COS', key: 'con', score: character.con ?? 10 },
    { name: 'INT', key: 'int', score: character.int ?? 10 },
    { name: 'SAG', key: 'wis', score: character.wis ?? 10 },
    { name: 'CAR', key: 'cha', score: character.cha ?? 10 },
  ]

  // Get class icon name
  const classIconName = CLASS_ICONS[character.class?.toLowerCase() || ''] || 'masks'

  // HP calculations
  const hpPercent = (character.current_hp ?? 10) / (character.max_hp ?? 10)
  const hpColor = hpPercent <= 0.25
    ? 'text-[var(--coral)]'
    : hpPercent <= 0.5
      ? 'text-[var(--health-mid)]'
      : 'text-[var(--teal)]'
  const hpBgColor = hpPercent <= 0.25
    ? 'bg-[var(--coral)]'
    : hpPercent <= 0.5
      ? 'bg-[var(--health-mid)]'
      : 'bg-[var(--teal)]'

  // Proficiency bonus
  const proficiencyBonus = Math.floor(((character.level ?? 1) - 1) / 4) + 2

  // Get spell slots for casters
  const spellSlots = isFullCaster(character.class) ? SPELL_SLOTS_BY_LEVEL[character.level ?? 1] || [] : []
  const hitDie = getHitDie(character.class)

  // HP Management Functions
  const updateHP = async (amount: number) => {
    if (readOnly || updating) return

    setUpdating(true)
    const newHP = Math.max(0, Math.min(character.max_hp ?? 10, (character.current_hp ?? 10) + amount))

    const { error } = await supabase
      .from('dnd_characters')
      .update({ current_hp: newHP })
      .eq('id', character.id)

    if (!error && onUpdate) {
      onUpdate()
    }
    setUpdating(false)
  }

  const updateTempHP = async (amount: number) => {
    if (readOnly || updating) return

    setUpdating(true)
    const newTempHP = Math.max(0, (character.temp_hp || 0) + amount)

    const { error } = await supabase
      .from('dnd_characters')
      .update({ temp_hp: newTempHP })
      .eq('id', character.id)

    if (!error && onUpdate) {
      onUpdate()
    }
    setUpdating(false)
  }

  const toggleInspiration = async () => {
    if (readOnly || updating) return

    setUpdating(true)
    const { error } = await supabase
      .from('dnd_characters')
      .update({ inspiration: !character.inspiration })
      .eq('id', character.id)

    if (!error && onUpdate) {
      onUpdate()
    }
    setUpdating(false)
  }

  // Handler for resource updates (spend/recover)
  async function handleResourceUpdate(
    resourceId: string,
    operation: 'spend' | 'recover'
  ) {
    // 1. Optimistic update (UI immediate)
    setLocalResources(prev => {
      const index = prev.findIndex(r => r.id === resourceId)
      if (index === -1) return prev

      const resource = prev[index]
      let newCurrent = resource.current

      if (operation === 'spend') {
        newCurrent = Math.max(0, resource.current - 1)
      } else {
        newCurrent = Math.min(resource.max, resource.current + 1)
      }

      const updated = [...prev]
      updated[index] = { ...resource, current: newCurrent }
      return updated
    })

    // 2. API call
    try {
      const res = await fetch('/api/player-resources', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resourceId, operation, amount: 1 })
      })

      if (!res.ok) {
        setLocalResources((character.class_resources as ClassResource[] | null) || [])
      }
    } catch (error) {
      console.error('Resource update error:', error)
      setLocalResources((character.class_resources as ClassResource[] | null) || [])
    }
  }

  // Handler per Riposo Breve
  const handleShortRest = async () => {
    if (!character?.id) return

    setIsRestLoading(true)

    try {
      const response = await fetch('/api/player-rest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId: character.id,
          restType: 'short',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Errore durante il riposo')
      }

      setLastRestAnnouncement('Riposo Breve completato. Risorse con ricarica breve ripristinate.')

      toast.success('Riposo Breve Completato!', {
        description: 'Risorse con ricarica "short rest" ripristinate',
        icon: <GameIcon name="hourglass" category="ui" size={20} />,
        duration: 4000,
      })

      onUpdate?.()
    } catch (error) {
      console.error('Errore riposo breve:', error)
      toast.error('Errore durante il riposo breve', {
        description: error instanceof Error ? error.message : 'Errore sconosciuto',
      })
    } finally {
      setIsRestLoading(false)
    }
  }

  // Handler per Riposo Lungo
  const handleLongRest = async () => {
    if (!character?.id) return

    setIsRestLoading(true)

    try {
      const response = await fetch('/api/player-rest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId: character.id,
          restType: 'long',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Errore durante il riposo')
      }

      setLastRestAnnouncement('Riposo Lungo completato. HP al massimo. Tutte le risorse ripristinate.')

      toast.success('Riposo Lungo Completato!', {
        description: 'HP al massimo + tutte le risorse ripristinate',
        icon: <GameIcon name="rest" category="ui" size={20} />,
        duration: 4000,
      })

      onUpdate?.()
    } catch (error) {
      console.error('Errore riposo lungo:', error)
      toast.error('Errore durante il riposo lungo', {
        description: error instanceof Error ? error.message : 'Errore sconosciuto',
      })
    } finally {
      setIsRestLoading(false)
    }
  }

  return (
    <div className="parchment-card p-4 space-y-4">
      {/* ARIA Live Region for Screen Readers */}
      <div
        role="status"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {lastRestAnnouncement}
      </div>

      {/* === SECTION 1: Identity Header === */}
      <div className="flex items-start gap-4">
        {/* Avatar */}
        {character.avatar_url ? (
          <img
            src={character.avatar_url}
            alt={character.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-[var(--teal)] flex-shrink-0"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-[var(--cream-dark)] flex items-center justify-center border-2 border-[var(--border-decorative)] flex-shrink-0">
            <GameIcon name={classIconName} category="classes" size={32} className="text-[var(--teal)]" />
          </div>
        )}

        {/* Name + Class */}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-display font-bold text-[var(--ink)] truncate">{character.name}</h2>
          <p className="text-[var(--ink-light)] flex items-center gap-1.5 text-sm">
            <GameIcon name={classIconName} category="classes" size={14} className="text-[var(--teal)]" />
            {character.race} {character.class} Lv.{character.level}
          </p>
        </div>

        {/* Inspiration Toggle */}
        <button
          onClick={toggleInspiration}
          disabled={readOnly || updating}
          className={`rounded-lg p-2 transition-all flex-shrink-0 ${
            character.inspiration
              ? 'bg-yellow-400/20 border-2 border-yellow-400'
              : 'bg-[var(--cream-dark)] border-2 border-transparent'
          } ${!readOnly ? 'hover:bg-yellow-400/10 cursor-pointer' : 'cursor-default'}`}
          title={character.inspiration ? 'Ispirazione attiva' : 'Ispirazione non attiva'}
        >
          <Star
            size={20}
            className={character.inspiration ? 'text-yellow-500 fill-yellow-500' : 'text-[var(--ink-faded)]'}
          />
        </button>
      </div>

      {/* === SECTION 2: HP with Progress Bar and Controls === */}
      <div className="space-y-2">
        {/* HP Display */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GameIcon name="heart" category="ui" size={18} className={hpColor} />
            <span className="text-sm text-[var(--ink-faded)]">Hit Points</span>
          </div>
          <div className="text-right">
            <span className={`text-2xl font-display font-bold ${hpColor}`}>
              {character.current_hp}
            </span>
            <span className="text-lg text-[var(--ink-faded)]">/{character.max_hp}</span>
            {(character.temp_hp ?? 0) > 0 && (
              <span className="ml-1 text-sm text-blue-600">(+{character.temp_hp})</span>
            )}
          </div>
        </div>

        {/* HP Bar */}
        <div className="h-2.5 bg-[var(--cream-dark)] rounded-full overflow-hidden">
          <div
            className={`h-full ${hpBgColor} transition-all duration-300`}
            style={{ width: `${Math.max(0, Math.min(100, hpPercent * 100))}%` }}
          />
        </div>

        {/* HP Controls - Large touch targets */}
        {!readOnly && (
          <div className="flex gap-2">
            <div className="flex-1 flex gap-1">
              <button
                onClick={() => updateHP(-5)}
                disabled={updating}
                className="flex-1 min-h-[44px] bg-[var(--coral)]/10 hover:bg-[var(--coral)]/20 text-[var(--coral)] rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
              >
                <Minus size={16} />
                <span className="text-sm">5</span>
              </button>
              <button
                onClick={() => updateHP(-1)}
                disabled={updating}
                className="flex-1 min-h-[44px] bg-[var(--coral)]/10 hover:bg-[var(--coral)]/20 text-[var(--coral)] rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
              >
                <Minus size={16} />
                <span className="text-sm">1</span>
              </button>
            </div>

            <div className="flex-1 flex gap-1">
              <button
                onClick={() => updateHP(1)}
                disabled={updating}
                className="flex-1 min-h-[44px] bg-[var(--teal)]/10 hover:bg-[var(--teal)]/20 text-[var(--teal)] rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
              >
                <Plus size={16} />
                <span className="text-sm">1</span>
              </button>
              <button
                onClick={() => updateHP(5)}
                disabled={updating}
                className="flex-1 min-h-[44px] bg-[var(--teal)]/10 hover:bg-[var(--teal)]/20 text-[var(--teal)] rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
              >
                <Plus size={16} />
                <span className="text-sm">5</span>
              </button>
            </div>
          </div>
        )}

        {/* Temp HP Controls */}
        {!readOnly && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[var(--ink-faded)]">Temp HP:</span>
            <span className="font-bold text-blue-600">{character.temp_hp || 0}</span>
            <div className="flex gap-1">
              <button
                onClick={() => updateTempHP(-1)}
                disabled={updating}
                className="px-3 py-1 bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 rounded transition-colors disabled:opacity-50"
              >
                <Minus size={14} />
              </button>
              <button
                onClick={() => updateTempHP(1)}
                disabled={updating}
                className="px-3 py-1 bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 rounded transition-colors disabled:opacity-50"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Conditions */}
      {character.conditions && character.conditions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {character.conditions.map((condition) => (
            <span
              key={condition}
              className="px-2 py-0.5 bg-[var(--coral)]/10 text-[var(--coral)] rounded text-xs flex items-center gap-1"
            >
              <GameIcon name={condition.toLowerCase()} category="conditions" size={12} />
              {condition}
            </span>
          ))}
        </div>
      )}

      {/* Concentration */}
      {character.is_concentrating && character.concentration_spell && (
        <div className="flex items-center gap-2 text-sm bg-purple-500/10 border border-purple-400/30 px-3 py-2 rounded">
          <GameIcon name="book" category="ui" size={14} className="text-purple-600" />
          <span className="text-[var(--ink-faded)]">Concentrazione:</span>
          <span className="text-purple-600 font-medium">{character.concentration_spell}</span>
        </div>
      )}

      {/* === SECTION 3: Key Stats Row === */}
      <div className="flex flex-wrap justify-center gap-2 text-center border-t border-[var(--border-decorative)] pt-3">
        {/* CA */}
        <div className="bg-[var(--cream-dark)] rounded-lg p-2 min-w-[48px]">
          <div className="text-[10px] text-[var(--ink-faded)] uppercase">CA</div>
          <div className="text-sm font-bold text-[var(--ink)]">{character.armor_class}</div>
        </div>

        {/* CD (solo caster) */}
        {character.spell_save_dc && (
          <div className="bg-[var(--cream-dark)] rounded-lg p-2 min-w-[48px]">
            <div className="text-[10px] text-[var(--ink-faded)] uppercase">CD</div>
            <div className="text-sm font-bold text-purple-600">{character.spell_save_dc}</div>
          </div>
        )}

        {/* Velocità (metri) */}
        <div className="bg-[var(--cream-dark)] rounded-lg p-2 min-w-[48px]">
          <div className="text-[10px] text-[var(--ink-faded)] uppercase">Vel</div>
          <div className="text-sm font-bold text-[var(--ink)]">{Math.round((character.speed ?? 30) * 0.3)}m</div>
        </div>

        {/* Initiative */}
        <div className="bg-[var(--cream-dark)] rounded-lg p-2 min-w-[48px]">
          <div className="text-[10px] text-[var(--ink-faded)] uppercase">Init</div>
          <div className="text-sm font-bold text-[var(--ink)]">
            {(character.initiative_bonus ?? 0) >= 0 ? '+' : ''}{character.initiative_bonus ?? 0}
          </div>
        </div>

        {/* Passive Perception */}
        <div className="bg-[var(--cream-dark)] rounded-lg p-2 min-w-[48px]">
          <div className="text-[10px] text-[var(--ink-faded)] uppercase">PP</div>
          <div className="text-sm font-bold text-[var(--ink)]">{character.passive_perception}</div>
        </div>

        {/* Proficiency */}
        <div className="bg-[var(--cream-dark)] rounded-lg p-2 min-w-[48px]">
          <div className="text-[10px] text-[var(--ink-faded)] uppercase">Prof</div>
          <div className="text-sm font-bold text-[var(--ink)]">+{proficiencyBonus}</div>
        </div>

        {/* Dadi Vita */}
        <div className="bg-[var(--cream-dark)] rounded-lg p-2 min-w-[48px]">
          <div className="text-[10px] text-[var(--ink-faded)] uppercase">DV</div>
          <div className="text-sm font-bold text-[var(--teal)]">{character.level ?? 1}d{hitDie}</div>
        </div>
      </div>

      {/* === SECTION 4: Ability Scores === */}
      <div className="grid grid-cols-6 gap-1 border-t border-[var(--border-decorative)] pt-3">
        {abilities.map((ability) => (
          <div key={ability.key} className="bg-[var(--cream-dark)] rounded p-1.5 text-center">
            <div className="text-[10px] text-[var(--ink-faded)] uppercase tracking-wide">{ability.name}</div>
            <div className="text-base font-display font-bold text-[var(--ink)] leading-tight">{ability.score}</div>
            <div className="text-xs text-[var(--teal)] font-medium">{getModifier(ability.score)}</div>
          </div>
        ))}
      </div>

      {/* === SECTION 5: Spell Slots (solo caster) === */}
      {spellSlots.length > 0 && (
        <div className="border-t border-[var(--border-decorative)] pt-3">
          <div className="flex items-center gap-2 mb-2">
            <GameIcon name="book" category="ui" size={16} className="text-purple-500" />
            <span className="text-sm font-semibold text-[var(--ink)]">Slot Incantesimo</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {spellSlots.map((slots, index) => (
              <div key={index} className="flex items-center gap-1.5">
                <span className="text-xs text-[var(--ink-faded)] w-4">{index + 1}°</span>
                <div className="flex gap-0.5">
                  {Array.from({ length: slots }).map((_, i) => (
                    <div
                      key={i}
                      className="w-3.5 h-3.5 rounded-full bg-purple-500 border border-purple-400"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* === SECTION 6: Rest Buttons === */}
      {!readOnly && (
        <div className="border-t border-[var(--border-decorative)] pt-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setRestDialogOpen('short')}
              disabled={isRestLoading}
              className="parchment-card p-3 hover:bg-[var(--cream)] transition-colors disabled:opacity-50"
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-base">🌙</span>
                <span className="font-bold text-sm text-[var(--ink)]">Riposo Breve</span>
              </div>
              <div className="text-[10px] text-[var(--ink-light)] mt-1">
                Ricarica breve
              </div>
            </button>

            <button
              onClick={() => setRestDialogOpen('long')}
              disabled={isRestLoading}
              className="parchment-card p-3 hover:bg-[var(--cream)] transition-colors disabled:opacity-50"
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-base">☀️</span>
                <span className="font-bold text-sm text-[var(--ink)]">Riposo Lungo</span>
              </div>
              <div className="text-[10px] text-[var(--ink-light)] mt-1">
                Reset completo
              </div>
            </button>
          </div>

          {/* Warlock Warning */}
          {character.class?.toLowerCase().includes('warlock') && (
            <div className="text-xs bg-purple-500/10 border border-purple-400/30 p-2 rounded mt-2">
              ⚡ <strong>Warlock</strong>: Slot Patto recuperano con Riposo Breve!
            </div>
          )}
        </div>
      )}

      {/* === SECTION 7: Class Resources + Passive Features === */}
      {(localResources.length > 0 || passiveFeatures.length > 0) && (
        <div className="border-t border-[var(--border-decorative)] pt-3">
          <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
            {/* Active Class Resources */}
            {localResources
              .filter(r => r.recharge !== 'passive')
              .map(resource => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  onUpdate={handleResourceUpdate}
                />
              ))
            }

            {/* Passive Features */}
            {passiveFeatures.map(feature => (
              <PassiveFeatureCard
                key={feature.id}
                feature={feature}
              />
            ))}
          </div>
        </div>
      )}

      {/* === SECTION 8: Death Saves (only when at 0 HP) === */}
      {(character.current_hp ?? 10) <= 0 && (
        <div className="border-t border-[var(--border-decorative)] pt-3">
          <div className="flex items-center gap-4">
            <div className="text-sm text-[var(--coral)] flex items-center gap-1">
              <GameIcon name="skull" category="ui" size={16} />
              Tiri Morte
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--ink-light)]">✓</span>
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-full ${
                      i < (character.death_save_successes ?? 0)
                        ? 'bg-[var(--teal)]'
                        : 'bg-[var(--cream)] border-2 border-[var(--border-decorative)]'
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--ink-light)]">✗</span>
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-full ${
                      i < (character.death_save_failures ?? 0)
                        ? 'bg-[var(--coral)]'
                        : 'bg-[var(--cream)] border-2 border-[var(--border-decorative)]'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rest Confirmation Dialog */}
      <AlertDialog open={restDialogOpen !== null} onOpenChange={(open) => !open && setRestDialogOpen(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {restDialogOpen === 'short' ? '🌙 Riposo Breve' : '☀️ Riposo Lungo'}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                {restDialogOpen === 'short' ? (
                  <>
                    Vuoi completare un riposo breve? Verranno ripristinate:
                    <ul className="list-disc list-inside mt-2 text-[var(--ink)]">
                      <li>Azioni e risorse con ricarica "short rest"</li>
                      <li>Puoi usare dadi vita per recuperare HP</li>
                    </ul>
                  </>
                ) : (
                  <>
                    Vuoi completare un riposo lungo? Verranno ripristinati:
                    <ul className="list-disc list-inside mt-2 text-[var(--ink)]">
                      <li>HP al massimo</li>
                      <li>Tutti i dadi vita (meta del totale minimo)</li>
                      <li>Tutte le azioni e risorse</li>
                      <li>Tutti gli slot incantesimo</li>
                    </ul>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (restDialogOpen === 'short') {
                  handleShortRest()
                } else {
                  handleLongRest()
                }
                setRestDialogOpen(null)
              }}
              className="bg-[var(--teal)] hover:bg-[var(--teal-dark)]"
            >
              Riposa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
