'use client'

import { Monster } from '@/types/database'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { GameIcon } from '@/components/icons/GameIcon'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Partial monster stats for NPC editing
export interface NPCStats {
  armor_class: number | null
  max_hp: number | null
  speed: string | null
  str: number | null
  dex: number | null
  con: number | null
  int: number | null
  wis: number | null
  cha: number | null
  cr: string | null
  monster_type: string | null
  size: string | null
  abilities: string | null
}

export const DEFAULT_NPC_STATS: NPCStats = {
  armor_class: 10,
  max_hp: 10,
  speed: '30 ft',
  str: 10,
  dex: 10,
  con: 10,
  int: 10,
  wis: 10,
  cha: 10,
  cr: '0',
  monster_type: 'humanoid',
  size: 'Medium',
  abilities: null,
}

// Extract stats from Monster object
export function monsterToStats(monster: Monster | null | undefined): NPCStats {
  if (!monster) return { ...DEFAULT_NPC_STATS }
  return {
    armor_class: monster.armor_class,
    max_hp: monster.max_hp,
    speed: monster.speed,
    str: monster.str,
    dex: monster.dex,
    con: monster.con,
    int: monster.int,
    wis: monster.wis,
    cha: monster.cha,
    cr: monster.cr,
    monster_type: monster.monster_type,
    size: monster.size,
    abilities: monster.abilities,
  }
}

interface NPCStatsEditorProps {
  stats: NPCStats
  onChange: (stats: NPCStats) => void
}

const SIZES = ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan']
const TYPES = ['aberration', 'beast', 'celestial', 'construct', 'dragon', 'elemental', 'fey', 'fiend', 'giant', 'humanoid', 'monstrosity', 'ooze', 'plant', 'undead']
const CRS = ['0', '1/8', '1/4', '1/2', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20']

export function NPCStatsEditor({ stats, onChange }: NPCStatsEditorProps) {
  const updateStat = <K extends keyof NPCStats>(key: K, value: NPCStats[K]) => {
    onChange({ ...stats, [key]: value })
  }

  const updateNumberStat = (key: keyof NPCStats, value: string) => {
    const num = parseInt(value, 10)
    updateStat(key, isNaN(num) ? null : num)
  }

  return (
    <div className="space-y-4 p-4 rounded-lg border border-[var(--coral)]/30 bg-[var(--coral)]/5">
      <div className="flex items-center gap-2 text-sm font-medium text-[var(--coral)]">
        <GameIcon name="combat" category="ui" size={16} />
        Statistiche Combattimento
      </div>

      {/* Type, Size, CR */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Taglia</Label>
          <Select value={stats.size || 'Medium'} onValueChange={(v) => updateStat('size', v)}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SIZES.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Tipo</Label>
          <Select value={stats.monster_type || 'humanoid'} onValueChange={(v) => updateStat('monster_type', v)}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPES.map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">CR</Label>
          <Select value={stats.cr || '0'} onValueChange={(v) => updateStat('cr', v)}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CRS.map(cr => (
                <SelectItem key={cr} value={cr}>{cr}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* AC, HP, Speed */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-xs flex items-center gap-1">
            <GameIcon name="shield" category="ui" size={12} />
            AC
          </Label>
          <Input
            type="number"
            value={stats.armor_class ?? ''}
            onChange={(e) => updateNumberStat('armor_class', e.target.value)}
            className="h-9"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs flex items-center gap-1">
            <GameIcon name="heart" category="ui" size={12} />
            HP
          </Label>
          <Input
            type="number"
            value={stats.max_hp ?? ''}
            onChange={(e) => updateNumberStat('max_hp', e.target.value)}
            className="h-9"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs flex items-center gap-1">
            <GameIcon name="boot" category="ui" size={12} />
            Speed
          </Label>
          <Input
            type="text"
            value={stats.speed ?? ''}
            onChange={(e) => updateStat('speed', e.target.value)}
            placeholder="30 ft"
            className="h-9"
          />
        </div>
      </div>

      {/* Ability Scores */}
      <div className="grid grid-cols-6 gap-2">
        {[
          { key: 'str', label: 'STR' },
          { key: 'dex', label: 'DEX' },
          { key: 'con', label: 'CON' },
          { key: 'int', label: 'INT' },
          { key: 'wis', label: 'WIS' },
          { key: 'cha', label: 'CHA' },
        ].map(({ key, label }) => (
          <div key={key} className="space-y-1">
            <Label className="text-xs text-center block">{label}</Label>
            <Input
              type="number"
              min={1}
              max={30}
              value={stats[key as keyof NPCStats] ?? ''}
              onChange={(e) => updateNumberStat(key as keyof NPCStats, e.target.value)}
              className="h-9 text-center"
            />
          </div>
        ))}
      </div>

      {/* Abilities */}
      <div className="space-y-1">
        <Label className="text-xs">Abilità e Azioni</Label>
        <Textarea
          value={stats.abilities ?? ''}
          onChange={(e) => updateStat('abilities', e.target.value || null)}
          placeholder="Multiattacco. L'NPC effettua due attacchi con la spada..."
          rows={3}
          className="resize-none text-sm"
        />
      </div>
    </div>
  )
}
