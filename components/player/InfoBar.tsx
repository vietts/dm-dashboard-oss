'use client'

import { useState } from 'react'
import { Character, ClassResource } from '@/types/database'
import TactileCard from '@/components/ui/TactileCard'
import { Heart, Shield, Zap, ChevronDown, ChevronUp } from 'lucide-react'

interface InfoBarProps {
  character: Character
}

/**
 * InfoBar - Sticky read-only info display for mobile gameplay
 *
 * Shows critical character information at a glance:
 * - HP (current/max)
 * - AC (Armor Class)
 * - Spell Slots (total/used)
 * - Proficiency Bonus
 * - Passive Perception
 *
 * READ-ONLY: No HP management, no resource tracking.
 * This is a reference tool for in-person sessions where
 * players use physical dice and paper sheets.
 */
export default function InfoBar({ character }: InfoBarProps) {
  const [collapsed, setCollapsed] = useState(false)

  // Calculate proficiency bonus from level
  const proficiencyBonus = character.level
    ? Math.floor((character.level - 1) / 4) + 2
    : 2

  // Parse class resources to count spell slots
  const classResources = Array.isArray(character.class_resources)
    ? (character.class_resources as unknown as ClassResource[])
    : []
  const spellSlots = classResources.filter((r) =>
    r.name?.toLowerCase().includes('slot')
  )

  // Calculate total and used spell slots
  const totalSpellSlots = spellSlots.reduce((sum, slot) => sum + slot.max, 0)
  const usedSpellSlots = spellSlots.reduce(
    (sum, slot) => sum + (slot.max - slot.current),
    0
  )
  const remainingSlots = totalSpellSlots - usedSpellSlots

  // HP percentage for color coding
  const hpPercentage = character.max_hp
    ? ((character.current_hp || 0) / character.max_hp) * 100
    : 100

  const hpColor =
    hpPercentage > 50
      ? 'text-[var(--health-full)]'
      : hpPercentage > 25
      ? 'text-[var(--health-mid)]'
      : 'text-[var(--health-low)]'

  if (collapsed) {
    return (
      <div className="sticky top-0 z-50 p-2">
        <TactileCard variant="elevated" className="p-2">
          <button
            onClick={() => setCollapsed(false)}
            className="w-full flex items-center justify-between text-[var(--ink)] hover:text-[var(--teal)] transition-colors"
          >
            <span className="text-sm font-semibold">
              {character.name} - HP {character.current_hp}/{character.max_hp}
            </span>
            <ChevronDown size={16} />
          </button>
        </TactileCard>
      </div>
    )
  }

  return (
    <div className="sticky top-0 z-50 p-2">
      <TactileCard variant="elevated" className="p-4">
        {/* Header with collapse button */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-display font-bold text-[var(--ink)] text-lg leading-tight">
              {character.name}
            </h3>
            <p className="text-xs text-[var(--ink-light)] mt-1">
              Livello {character.level || 1} {character.class || 'Avventuriero'}
            </p>
          </div>
          <button
            onClick={() => setCollapsed(true)}
            className="p-1 hover:bg-[var(--cream-dark)] rounded transition-colors"
          >
            <ChevronUp size={18} className="text-[var(--ink-light)]" />
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          {/* HP */}
          <div className="flex items-center gap-2 bg-[var(--cream)] rounded-lg p-3">
            <Heart size={16} className={hpColor} />
            <div className="flex-1">
              <div className="text-xs text-[var(--ink-faded)]">HP</div>
              <div className="flex items-center gap-2">
                <div className={`font-bold leading-tight ${hpColor}`}>
                  {character.current_hp || 0}/{character.max_hp || 0}
                </div>
                {hpPercentage <= 25 && (
                  <span className="text-xs font-semibold text-[var(--health-low)]">
                    CRITICO
                  </span>
                )}
                {hpPercentage > 25 && hpPercentage <= 50 && (
                  <span className="text-xs text-[var(--health-mid)]">
                    Ferito
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* AC */}
          <div className="flex items-center gap-2 bg-[var(--cream)] rounded-lg p-3">
            <Shield size={16} className="text-[var(--teal)]" />
            <div>
              <div className="text-xs text-[var(--ink-faded)]">AC</div>
              <div className="font-bold leading-tight text-[var(--teal)]">
                {character.armor_class || 10}
              </div>
            </div>
          </div>

          {/* Spell Slots (only show if caster) */}
          {totalSpellSlots > 0 && (
            <div className="flex items-center gap-2 bg-[var(--cream)] rounded-lg p-3">
              <Zap size={16} className="text-blue-600" />
              <div>
                <div className="text-xs text-[var(--ink-faded)]">Spell Slots</div>
                <div className="font-bold leading-tight text-blue-600">
                  {remainingSlots}/{totalSpellSlots}
                </div>
              </div>
            </div>
          )}

          {/* Secondary Stats */}
          <div className="flex items-center gap-2 bg-[var(--cream)] rounded-lg p-3">
            <div className="flex-1">
              <div className="text-xs text-[var(--ink-faded)]">PF / PP</div>
              <div className="font-semibold leading-tight text-[var(--ink)]">
                +{proficiencyBonus} / {character.passive_perception || 10}
              </div>
            </div>
          </div>
        </div>
      </TactileCard>
    </div>
  )
}
