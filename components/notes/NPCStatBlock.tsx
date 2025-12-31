'use client'

import Image from 'next/image'
import { StoryNote, Monster } from '@/types/database'
import { GameIcon } from '@/components/icons/GameIcon'
import { Badge } from '@/components/ui/badge'

interface NPCStatBlockProps {
  note: StoryNote
  monster?: Monster | null
}

// Calculate ability modifier
function getModifier(score: number): string {
  const mod = Math.floor((score - 10) / 2)
  return mod >= 0 ? `+${mod}` : `${mod}`
}

// Parse abilities text to extract key abilities
function parseAbilities(abilities: string | null): string[] {
  if (!abilities) return []

  // Try to split by common separators
  const lines = abilities.split(/\n|\.(?=\s*[A-Z])/).filter(Boolean)
  return lines.slice(0, 3).map(line => line.trim().substring(0, 60))
}

// Parse dm_notes to extract motivations/relationships
function parseNpcInfo(dmNotes: string | null): { motivations: string[], relationships: string[] } {
  const result = { motivations: [] as string[], relationships: [] as string[] }

  if (!dmNotes) return result

  const lines = dmNotes.split('\n')

  lines.forEach(line => {
    const lower = line.toLowerCase()
    if (lower.includes('motivazione') || lower.includes('obiettivo') || lower.includes('vuole')) {
      result.motivations.push(line.replace(/^[^:]+:\s*/i, '').trim())
    }
    if (lower.includes('relazione') || lower.includes('alleato') || lower.includes('nemico') || lower.includes('conosce')) {
      result.relationships.push(line.replace(/^[^:]+:\s*/i, '').trim())
    }
  })

  return result
}

// CR to XP mapping
const CR_XP: Record<string, number> = {
  '0': 10, '1/8': 25, '1/4': 50, '1/2': 100,
  '1': 200, '2': 450, '3': 700, '4': 1100, '5': 1800,
  '6': 2300, '7': 2900, '8': 3900, '9': 5000, '10': 5900,
  '11': 7200, '12': 8400, '13': 10000, '14': 11500, '15': 13000,
  '16': 15000, '17': 18000, '18': 20000, '19': 22000, '20': 25000,
}

export function NPCStatBlock({ note, monster }: NPCStatBlockProps) {
  const { motivations, relationships } = parseNpcInfo(note.dm_notes)
  const hasMonster = monster !== null && monster !== undefined

  // Always show for NPC notes - provides visual distinction and place to link monster

  return (
    <div className="bg-[var(--paper)] border border-[var(--border)] rounded-lg overflow-hidden">
      {/* Header with image */}
      <div className="flex gap-4 p-4 border-b border-[var(--border)] bg-gradient-to-r from-[var(--coral)]/5 to-transparent">
        {/* Avatar */}
        <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-[var(--coral)]/10 flex items-center justify-center">
          {note.image_url ? (
            <Image
              src={note.image_url}
              alt={note.title}
              fill
              className="object-cover"
            />
          ) : (
            <GameIcon name="masks" category="ui" size={32} className="text-[var(--coral)]" />
          )}
        </div>

        {/* Name and type */}
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-lg text-[var(--ink)] truncate">
            {note.title}
          </h3>
          {hasMonster ? (
            <>
              <p className="text-sm text-[var(--ink-light)]">
                {monster.size} {monster.monster_type}
              </p>
              <Badge variant="outline" className="mt-1 text-xs bg-[var(--coral)]/10 text-[var(--coral)] border-[var(--coral)]/30">
                CR {monster.cr} ({(CR_XP[monster.cr || '0'] || 0).toLocaleString()} XP)
              </Badge>
            </>
          ) : (
            <p className="text-sm text-[var(--ink-light)]">
              Personaggio Non Giocante
            </p>
          )}
        </div>
      </div>

      {/* Combat Stats - only if monster linked */}
      {hasMonster && (
        <>
          <div className="grid grid-cols-3 divide-x divide-[var(--border)] border-b border-[var(--border)]">
            <div className="p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-[var(--ink-light)] text-xs mb-1">
                <GameIcon name="shield" category="ui" size={12} />
                AC
              </div>
              <div className="font-display text-xl text-[var(--ink)]">
                {monster.armor_class || '?'}
              </div>
            </div>
            <div className="p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-[var(--ink-light)] text-xs mb-1">
                <GameIcon name="heart" category="ui" size={12} />
                HP
              </div>
              <div className="font-display text-xl text-[var(--ink)]">
                {monster.max_hp || '?'}
              </div>
            </div>
            <div className="p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-[var(--ink-light)] text-xs mb-1">
                <GameIcon name="boot" category="ui" size={12} />
                Speed
              </div>
              <div className="font-display text-sm text-[var(--ink)]">
                {monster.speed || '30 ft'}
              </div>
            </div>
          </div>

          {/* Ability Scores */}
          <div className="grid grid-cols-6 divide-x divide-[var(--border)] border-b border-[var(--border)] text-center">
            {[
              { label: 'STR', value: monster.str },
              { label: 'DEX', value: monster.dex },
              { label: 'CON', value: monster.con },
              { label: 'INT', value: monster.int },
              { label: 'WIS', value: monster.wis },
              { label: 'CHA', value: monster.cha },
            ].map(stat => (
              <div key={stat.label} className="p-2">
                <div className="text-[10px] font-medium text-[var(--ink-light)]">{stat.label}</div>
                <div className="text-sm font-medium text-[var(--ink)]">
                  {stat.value || 10}
                  <span className="text-[var(--ink-light)] text-xs ml-0.5">
                    ({getModifier(stat.value || 10)})
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Abilities */}
          {parseAbilities(monster.abilities).length > 0 && (
            <div className="p-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--ink-light)] mb-2">
                <GameIcon name="combat" category="ui" size={12} />
                Abilità
              </div>
              <ul className="space-y-1">
                {parseAbilities(monster.abilities).map((ability, i) => (
                  <li key={i} className="text-sm text-[var(--ink)]">
                    {ability}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {/* Motivations & Relationships (from dm_notes) - always shown if present */}
      {(motivations.length > 0 || relationships.length > 0) && (
        <div className="p-3 space-y-3">
          {motivations.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--coral)] mb-1">
                <GameIcon name="skull" category="ui" size={12} />
                <span>Motivazione</span>
              </div>
              {motivations.map((m, i) => (
                <p key={i} className="text-sm text-[var(--ink)]">{m}</p>
              ))}
            </div>
          )}
          {relationships.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--teal)] mb-1">
                <GameIcon name="masks" category="ui" size={12} />
                <span>Relazioni</span>
              </div>
              {relationships.map((r, i) => (
                <p key={i} className="text-sm text-[var(--ink)]">{r}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
