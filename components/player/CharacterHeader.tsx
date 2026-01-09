'use client'

import { useState } from 'react'
import { Character } from '@/types/database'
import { GameIcon, CLASS_ICONS } from '@/components/icons/GameIcon'
import { supabase } from '@/lib/supabase'
import { Plus, Minus, Heart, Shield, Zap, Footprints, Star } from 'lucide-react'

interface CharacterHeaderProps {
  character: Character
  onUpdate?: () => void
  readOnly?: boolean
}

// Calculate ability modifier
function getModifier(score: number): string {
  const mod = Math.floor((score - 10) / 2)
  return mod >= 0 ? `+${mod}` : `${mod}`
}

export default function CharacterHeader({ character, onUpdate, readOnly = false }: CharacterHeaderProps) {
  const [updating, setUpdating] = useState(false)

  // Get class icon name
  const classIconName = CLASS_ICONS[character.class?.toLowerCase() || ''] || 'masks'

  // HP color based on percentage
  const hpPercentage = (character.current_hp ?? 10) / (character.max_hp ?? 10)
  const hpColor = hpPercentage <= 0.25
    ? 'text-[var(--coral)]'
    : hpPercentage <= 0.5
      ? 'text-[var(--health-mid)]'
      : 'text-[var(--teal)]'

  const hpBgColor = hpPercentage <= 0.25
    ? 'bg-[var(--coral)]'
    : hpPercentage <= 0.5
      ? 'bg-[var(--health-mid)]'
      : 'bg-[var(--teal)]'

  // Calculate proficiency bonus based on level
  const proficiencyBonus = Math.floor(((character.level ?? 1) - 1) / 4) + 2

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

  return (
    <div className="sticky top-0 z-30 bg-[var(--paper)] border-b-2 border-[var(--border-decorative)] shadow-md">
      <div className="p-4 space-y-3">
        {/* Character Info Row */}
        <div className="flex items-center gap-3">
          {character.avatar_url ? (
            <img
              src={character.avatar_url}
              alt={character.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-[var(--teal)] flex-shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-[var(--cream-dark)] flex items-center justify-center border-2 border-[var(--border-decorative)] flex-shrink-0">
              <GameIcon name={classIconName} category="classes" size={24} className="text-[var(--teal)]" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-display font-bold text-[var(--ink)] truncate">{character.name}</h1>
            <p className="text-sm text-[var(--ink-light)] flex items-center gap-1.5">
              <GameIcon name={classIconName} category="classes" size={12} className="text-[var(--teal)]" />
              {character.race} {character.class} Lv.{character.level}
            </p>
          </div>
        </div>

        {/* HP Bar with Controls */}
        <div className="space-y-2">
          {/* HP Display */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className={`${hpColor}`} size={20} />
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
          <div className="h-2 bg-[var(--cream-dark)] rounded-full overflow-hidden">
            <div
              className={`h-full ${hpBgColor} transition-all duration-300`}
              style={{ width: `${Math.max(0, Math.min(100, ((character.current_hp ?? 10) / (character.max_hp ?? 10)) * 100))}%` }}
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

        {/* Key Stats Row */}
        <div className="grid grid-cols-5 gap-2 text-center">
          {/* Initiative */}
          <div className="bg-[var(--cream-dark)] rounded-lg p-2">
            <Zap size={16} className="text-[var(--teal)] mx-auto mb-1" />
            <div className="text-xs text-[var(--ink-faded)]">Init</div>
            <div className="text-sm font-bold text-[var(--ink)]">
              {(character.initiative_bonus ?? 0) >= 0 ? '+' : ''}{character.initiative_bonus ?? 0}
            </div>
          </div>

          {/* Armor Class */}
          <div className="bg-[var(--cream-dark)] rounded-lg p-2">
            <Shield size={16} className="text-[var(--teal)] mx-auto mb-1" />
            <div className="text-xs text-[var(--ink-faded)]">AC</div>
            <div className="text-sm font-bold text-[var(--ink)]">{character.armor_class}</div>
          </div>

          {/* Speed */}
          <div className="bg-[var(--cream-dark)] rounded-lg p-2">
            <Footprints size={16} className="text-[var(--teal)] mx-auto mb-1" />
            <div className="text-xs text-[var(--ink-faded)]">Speed</div>
            <div className="text-sm font-bold text-[var(--ink)]">{character.speed}ft</div>
          </div>

          {/* Proficiency */}
          <div className="bg-[var(--cream-dark)] rounded-lg p-2">
            <GameIcon name="d20" category="ui" size={16} className="text-[var(--teal)] mx-auto mb-1" />
            <div className="text-xs text-[var(--ink-faded)]">Prof</div>
            <div className="text-sm font-bold text-[var(--ink)]">+{proficiencyBonus}</div>
          </div>

          {/* Inspiration */}
          <button
            onClick={toggleInspiration}
            disabled={readOnly || updating}
            className={`rounded-lg p-2 transition-all ${
              character.inspiration
                ? 'bg-yellow-400/20 border-2 border-yellow-400'
                : 'bg-[var(--cream-dark)] border-2 border-transparent'
            } ${!readOnly ? 'hover:bg-yellow-400/10 cursor-pointer' : 'cursor-default'}`}
          >
            <Star
              size={16}
              className={`mx-auto mb-1 ${character.inspiration ? 'text-yellow-500 fill-yellow-500' : 'text-[var(--ink-faded)]'}`}
            />
            <div className="text-xs text-[var(--ink-faded)]">Insp</div>
            <div className={`text-xs font-bold ${character.inspiration ? 'text-yellow-600' : 'text-[var(--ink-faded)]'}`}>
              {character.inspiration ? 'ON' : 'OFF'}
            </div>
          </button>
        </div>

        {/* Conditions */}
        {character.conditions && character.conditions.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {character.conditions.map((condition) => (
              <span
                key={condition}
                className="px-2 py-1 bg-[var(--coral)]/10 text-[var(--coral)] rounded text-xs flex items-center gap-1"
              >
                <GameIcon name={condition.toLowerCase()} category="conditions" size={12} />
                {condition}
              </span>
            ))}
          </div>
        )}

        {/* Concentration */}
        {character.is_concentrating && character.concentration_spell && (
          <div className="flex items-center gap-2 text-sm bg-purple-600/10 p-2 rounded-lg">
            <GameIcon name="book" category="ui" size={14} className="text-purple-600" />
            <span className="text-[var(--ink-faded)]">Concentrazione:</span>
            <span className="text-purple-600 font-medium">{character.concentration_spell}</span>
          </div>
        )}
      </div>
    </div>
  )
}
