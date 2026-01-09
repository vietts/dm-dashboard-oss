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
import type { Spell2024 } from '@/lib/spells-2024'

// Spell classes available in D&D 2024
const SPELLCASTING_CLASSES = [
  'wizard', 'bard', 'ranger', 'paladin',
  'warlock', 'cleric', 'druid', 'sorcerer'
]

export function SpellsStep({ character, state, updateState }: SpellsStepProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [spells, setSpells] = useState<Spell2024[]>([])

  const normalizedClass = normalizeClassName(character.class || 'wizard')
  const spellClass = SPELLCASTING_CLASSES.includes(normalizedClass) ? normalizedClass : null

  // Get spell slot info for the new level
  const slotProgression = SPELL_SLOT_PROGRESSION[normalizedClass]?.[state.targetLevel]
  const prevSlotProgression = SPELL_SLOT_PROGRESSION[normalizedClass]?.[character.level ?? 1]

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
          .from('dnd_2024_spells')
          .select('*')
          .contains('classes', [spellClass])
          .lte('level', maxSpellLevel)
          .order('level', { ascending: true })
          .order('name', { ascending: true })

        if (searchQuery.trim()) {
          query = query.or(`name.ilike.%${searchQuery}%,name_it.ilike.%${searchQuery}%`)
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

  const handleSpellToggle = (spell: Spell2024, checked: boolean) => {
    if (checked && state.newSpells.length < state.newSpellsCount) {
      updateState({ newSpells: [...state.newSpells, spell as any] })
    } else if (!checked) {
      updateState({ newSpells: state.newSpells.filter(s => s.id !== spell.id) })
    }
  }

  const handleRemoveSpell = (spellId: string) => {
    updateState({ newSpells: state.newSpells.filter(s => s.id !== spellId) })
  }

  const formatSpellLevel = (level: number): string => {
    if (level === 0) return 'Trucchetto'
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
                      <span className="font-medium">{spell.name_it || spell.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {formatSpellLevel(spell.level)}
                      </Badge>
                      {spell.school && (
                        <Badge variant="secondary" className="text-xs">
                          {spell.school}
                        </Badge>
                      )}
                      {spell.concentration && (
                        <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                          C
                        </Badge>
                      )}
                      {spell.ritual && (
                        <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
                          R
                        </Badge>
                      )}
                    </div>
                    {spell.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {spell.description_it || spell.description}
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
