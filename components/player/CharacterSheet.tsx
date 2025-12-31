'use client'

import { Character } from '@/types/database'
import { GameIcon, CLASS_ICONS } from '@/components/icons/GameIcon'

interface CharacterSheetProps {
  character: Character
}

// Calculate ability modifier
function getModifier(score: number): string {
  const mod = Math.floor((score - 10) / 2)
  return mod >= 0 ? `+${mod}` : `${mod}`
}

export default function CharacterSheet({ character }: CharacterSheetProps) {
  const abilities = [
    { name: 'FOR', key: 'str', score: character.str },
    { name: 'DES', key: 'dex', score: character.dex },
    { name: 'COS', key: 'con', score: character.con },
    { name: 'INT', key: 'int', score: character.int },
    { name: 'SAG', key: 'wis', score: character.wis },
    { name: 'CAR', key: 'cha', score: character.cha },
  ]

  // Get class icon name
  const classIconName = CLASS_ICONS[character.class?.toLowerCase() || ''] || 'masks'

  // HP color based on percentage
  const hpColor = character.current_hp <= character.max_hp * 0.25
    ? 'text-[var(--coral)]'
    : character.current_hp <= character.max_hp * 0.5
      ? 'text-[var(--health-mid)]'
      : 'text-[var(--teal)]'

  return (
    <div className="parchment-card p-4">
      {/* Header - Avatar + Name + HP inline */}
      <div className="flex items-start gap-4 mb-4">
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
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-display font-bold text-[var(--ink)] truncate">{character.name}</h2>
          <p className="text-[var(--ink-light)] flex items-center gap-1.5 text-sm">
            <GameIcon name={classIconName} category="classes" size={14} className="text-[var(--teal)]" />
            {character.race} {character.class} Lv.{character.level}
          </p>
          {/* HP inline */}
          <div className="flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1 text-sm">
              <GameIcon name="heart" category="ui" size={14} className={hpColor} />
              <span className={`font-bold ${hpColor}`}>{character.current_hp}</span>
              <span className="text-[var(--ink-faded)]">/{character.max_hp}</span>
              {character.temp_hp > 0 && (
                <span className="text-blue-600 text-xs">(+{character.temp_hp})</span>
              )}
            </span>
            <span className="text-[var(--ink-faded)]">|</span>
            <span className="text-sm text-[var(--ink-light)]">
              CA <span className="font-bold text-[var(--ink)]">{character.armor_class}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Ability Scores - Compact row */}
      <div className="grid grid-cols-6 gap-1 mb-3">
        {abilities.map((ability) => (
          <div key={ability.key} className="bg-[var(--cream-dark)] rounded p-1.5 text-center">
            <div className="text-[10px] text-[var(--ink-faded)] uppercase tracking-wide">{ability.name}</div>
            <div className="text-base font-display font-bold text-[var(--ink)] leading-tight">{ability.score}</div>
            <div className="text-xs text-[var(--teal)] font-medium">{getModifier(ability.score)}</div>
          </div>
        ))}
      </div>

      {/* Combat Stats - Inline row */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--ink-light)] border-t border-[var(--border-decorative)] pt-3">
        <span>
          Velocità: <span className="text-[var(--ink)] font-medium">{character.speed} ft</span>
        </span>
        <span>
          Iniziativa: <span className="text-[var(--ink)] font-medium">{character.initiative_bonus >= 0 ? '+' : ''}{character.initiative_bonus}</span>
        </span>
        <span>
          PP: <span className="text-[var(--ink)] font-medium">{character.passive_perception}</span>
        </span>
        {character.spell_save_dc && (
          <span>
            DC: <span className="text-[var(--ink)] font-medium">{character.spell_save_dc}</span>
          </span>
        )}
      </div>

      {/* Conditions */}
      {character.conditions && character.conditions.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[var(--border-decorative)]">
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
        </div>
      )}

      {/* Concentration */}
      {character.is_concentrating && character.concentration_spell && (
        <div className="mt-3 pt-3 border-t border-[var(--border-decorative)]">
          <div className="flex items-center gap-2 text-sm">
            <GameIcon name="book" category="ui" size={14} className="text-purple-600" />
            <span className="text-[var(--ink-faded)]">Concentrazione:</span>
            <span className="text-purple-600 font-medium">{character.concentration_spell}</span>
          </div>
        </div>
      )}
    </div>
  )
}
