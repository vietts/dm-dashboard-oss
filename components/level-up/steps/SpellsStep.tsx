'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, Loader2, Wand2, X, BookOpen } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { normalizeClassName, SPELL_SLOT_PROGRESSION } from '@/lib/class-features'
import type { SpellsStepProps } from '../types'
import type { CachedSpell } from '@/types/database'

// Spell class mapping for Open5e
const CLASS_SPELL_LISTS: Record<string, string> = {
  wizard: 'wizard',
  bard: 'bard',
  ranger: 'ranger',
  paladin: 'paladin',
  warlock: 'warlock',
  cleric: 'cleric',
  druid: 'druid',
  sorcerer: 'sorcerer',
}

export function SpellsStep({ character, state, updateState }: SpellsStepProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [spells, setSpells] = useState<CachedSpell[]>([])

  const normalizedClass = normalizeClassName(character.class || 'wizard')
  const spellClass = CLASS_SPELL_LISTS[normalizedClass]

  // Get spell slot info for the new level
  const slotProgression = SPELL_SLOT_PROGRESSION[normalizedClass]?.[state.targetLevel]
  const prevSlotProgression = SPELL_SLOT_PROGRESSION[normalizedClass]?.[character.level]

  // Determine max spell level the character can cast
  const maxSpellLevel = slotProgression
    ? Math.max(...Object.keys(slotProgression.slots).map(Number))
    : 1

  // Load spells on mount and when search changes
  useEffect(() => {
    const loadSpells = async () => {
      if (!spellClass) return

      setIsLoading(true)
      try {
        let query = supabase
          .from('open5e_spells')
          .select('*')
          .ilike('dnd_class', `%${spellClass}%`)
          .lte('level_int', maxSpellLevel)
          .order('level_int', { ascending: true })
          .order('name', { ascending: true })

        if (searchQuery.trim()) {
          query = query.ilike('name', `%${searchQuery}%`)
        }

        const { data, error } = await query.limit(50)

        if (error) throw error
        setSpells(data || [])
      } catch (error) {
        console.error('Failed to load spells:', error)
        setSpells([])
      } finally {
        setIsLoading(false)
      }
    }

    const debounce = setTimeout(loadSpells, 300)
    return () => clearTimeout(debounce)
  }, [searchQuery, spellClass, maxSpellLevel, supabase])

  const handleSpellToggle = (spell: CachedSpell, checked: boolean) => {
    if (checked && state.newSpells.length < state.newSpellsCount) {
      updateState({ newSpells: [...state.newSpells, spell] })
    } else if (!checked) {
      updateState({ newSpells: state.newSpells.filter(s => s.id !== spell.id) })
    }
  }

  const handleRemoveSpell = (spellId: string) => {
    updateState({ newSpells: state.newSpells.filter(s => s.id !== spellId) })
  }

  const formatSpellLevel = (level: number | null): string => {
    if (level === null || level === 0) return 'Trucchetto'
    return `${level}° livello`
  }

  // For Wizard: show info about adding to spellbook
  const isWizard = normalizedClass === 'wizard'

  return (
    <div className="space-y-6">
      {/* Spell Slots Info */}
      {slotProgression && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-5 h-5 text-primary" />
              <h4 className="font-medium">Slot Incantesimo</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(slotProgression.slots).map(([level, count]) => {
                const prevCount = prevSlotProgression?.slots[parseInt(level)] || 0
                const isNew = count > prevCount
                return (
                  <Badge
                    key={level}
                    variant={isNew ? 'default' : 'secondary'}
                    className={isNew ? 'bg-green-500' : ''}
                  >
                    {level}° liv: {count} slot
                    {isNew && prevCount > 0 && ` (+${count - prevCount})`}
                    {isNew && prevCount === 0 && ' (nuovo!)'}
                  </Badge>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Spell Selection Info */}
      <div>
        <h4 className="font-medium flex items-center gap-2 mb-2">
          <Wand2 className="w-5 h-5 text-purple-500" />
          {isWizard ? 'Aggiungi al Libro degli Incantesimi' : 'Scegli Nuovi Incantesimi'}
        </h4>
        <p className="text-sm text-muted-foreground">
          {isWizard
            ? `Come mago, aggiungi 2 incantesimi al tuo libro (fino al ${maxSpellLevel}° livello).`
            : `Seleziona ${state.newSpellsCount} incantesimi da imparare (fino al ${maxSpellLevel}° livello).`}
        </p>
      </div>

      {/* Selected Spells */}
      {state.newSpells.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm">
            Incantesimi selezionati ({state.newSpells.length}/{state.newSpellsCount})
          </Label>
          <div className="flex flex-wrap gap-2">
            {state.newSpells.map(spell => (
              <Badge
                key={spell.id}
                variant="secondary"
                className="gap-1 pr-1"
              >
                {spell.name}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 hover:bg-destructive/20"
                  onClick={() => handleRemoveSpell(spell.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Cerca incantesimi..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Spell List */}
      <ScrollArea className="h-[300px] border rounded-lg">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : spells.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Wand2 className="w-8 h-8 mb-2" />
            <p>Nessun incantesimo trovato</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {spells.map(spell => {
              const isSelected = state.newSpells.some(s => s.id === spell.id)
              const isDisabled = !isSelected && state.newSpells.length >= state.newSpellsCount

              return (
                <div
                  key={spell.id}
                  className={`flex items-start gap-3 p-3 rounded-lg ${
                    isSelected
                      ? 'bg-primary/10 border border-primary'
                      : isDisabled
                      ? 'opacity-50'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <Checkbox
                    id={spell.id}
                    checked={isSelected}
                    onCheckedChange={(checked) =>
                      handleSpellToggle(spell, checked as boolean)
                    }
                    disabled={isDisabled}
                    className="mt-1"
                  />
                  <Label htmlFor={spell.id} className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{spell.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {formatSpellLevel(spell.level_int)}
                      </Badge>
                      {spell.school && (
                        <Badge variant="secondary" className="text-xs">
                          {spell.school}
                        </Badge>
                      )}
                    </div>
                    {spell.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {spell.description}
                      </p>
                    )}
                  </Label>
                </div>
              )
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
