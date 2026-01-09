'use client'

import { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { GameIcon } from '@/components/icons/GameIcon'
import { supabase } from '@/lib/supabase'
import {
  getSpellcastingSummary,
  canLearnSpell,
  getMaxSpellLevel,
  normalizeClassName
} from '@/lib/spell-rules'
import { formatSchool, formatSpellLevel, SPELL_SCHOOLS_2024 } from '@/lib/spells-2024'
import type { Spell2024 } from '@/lib/spells-2024'

interface SpellPickerProps {
  open: boolean
  onClose: () => void
  onAddSpell: (spell: Spell2024) => Promise<void>
  characterClass: string
  characterLevel: number
  abilityModifier: number
  currentSpells: { spell_level: number }[]  // Already known spells
  existingSpellSlugs: string[]  // To prevent duplicates
}

export function SpellPicker({
  open,
  onClose,
  onAddSpell,
  characterClass,
  characterLevel,
  abilityModifier,
  currentSpells,
  existingSpellSlugs
}: SpellPickerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLevel, setSelectedLevel] = useState<string>('all')
  const [selectedSchool, setSelectedSchool] = useState<string>('all')
  const [spells, setSpells] = useState<Spell2024[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [addingSpell, setAddingSpell] = useState<string | null>(null)

  const normalizedClass = normalizeClassName(characterClass)
  const maxSpellLevel = getMaxSpellLevel(normalizedClass, characterLevel)
  const summary = getSpellcastingSummary(normalizedClass, characterLevel, abilityModifier)

  // Count current spells and cantrips
  const currentSpellCount = currentSpells.filter(s => s.spell_level > 0).length
  const currentCantripCount = currentSpells.filter(s => s.spell_level === 0).length

  // Available spell levels for filter
  const availableLevels = useMemo(() => {
    const levels = []
    for (let i = 0; i <= maxSpellLevel; i++) {
      levels.push({
        value: i.toString(),
        label: i === 0 ? 'Trucchetti' : `${i}° livello`
      })
    }
    return levels
  }, [maxSpellLevel])

  // Load spells when dialog opens or filters change
  useEffect(() => {
    if (!open) return

    const loadSpells = async () => {
      setIsLoading(true)
      try {
        let query = supabase
          .from('dnd_2024_spells')
          .select('*')
          .overlaps('classes', [normalizedClass])  // Check if array contains class
          .lte('level', maxSpellLevel)
          .order('level', { ascending: true })
          .order('name', { ascending: true })

        // Apply level filter
        if (selectedLevel !== 'all') {
          query = query.eq('level', parseInt(selectedLevel))
        }

        // Apply school filter
        if (selectedSchool !== 'all') {
          query = query.eq('school', selectedSchool)
        }

        // Apply search
        if (searchQuery.trim()) {
          query = query.or(`name.ilike.%${searchQuery}%,name_it.ilike.%${searchQuery}%`)
        }

        const { data, error } = await query.limit(100)

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
  }, [open, searchQuery, selectedLevel, selectedSchool, normalizedClass, maxSpellLevel])

  // Reset filters when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('')
      setSelectedLevel('all')
      setSelectedSchool('all')
    }
  }, [open])

  async function handleAddSpell(spell: Spell2024) {
    // Check if spell can be learned
    const check = canLearnSpell(
      normalizedClass,
      characterLevel,
      spell.level,
      spell.classes,
      currentSpellCount,
      currentCantripCount
    )

    if (!check.allowed) {
      alert(check.reason)
      return
    }

    setAddingSpell(spell.slug)
    try {
      await onAddSpell(spell)
    } catch (error) {
      console.error('Failed to add spell:', error)
    } finally {
      setAddingSpell(null)
    }
  }

  // Check if a specific spell can be added
  function canAddSpell(spell: Spell2024): { allowed: boolean; reason?: string } {
    // Already have this spell
    if (existingSpellSlugs.includes(spell.slug)) {
      return { allowed: false, reason: 'Incantesimo gi\u00e0 conosciuto' }
    }

    return canLearnSpell(
      normalizedClass,
      characterLevel,
      spell.level,
      spell.classes,
      currentSpellCount,
      currentCantripCount
    )
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GameIcon name="book" category="ui" size={20} className="text-purple-500" />
            Aggiungi Incantesimo
          </DialogTitle>
          <DialogDescription>
            {summary.description}
          </DialogDescription>
        </DialogHeader>

        {/* Stats summary */}
        <div className="flex flex-wrap gap-2 py-2 border-b">
          {summary.maxKnown !== null && (
            <Badge variant={currentSpellCount >= summary.maxKnown ? 'destructive' : 'secondary'}>
              Incantesimi: {currentSpellCount}/{summary.maxKnown}
            </Badge>
          )}
          {summary.cantripsKnown > 0 && (
            <Badge variant={currentCantripCount >= summary.cantripsKnown ? 'destructive' : 'secondary'}>
              Trucchetti: {currentCantripCount}/{summary.cantripsKnown}
            </Badge>
          )}
          <Badge variant="outline">
            Max livello: {maxSpellLevel}°
          </Badge>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Cerca incantesimo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <Select value={selectedLevel} onValueChange={setSelectedLevel}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Livello" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i livelli</SelectItem>
              {availableLevels.map(lvl => (
                <SelectItem key={lvl.value} value={lvl.value}>
                  {lvl.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedSchool} onValueChange={setSelectedSchool}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Scuola" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutte le scuole</SelectItem>
              {SPELL_SCHOOLS_2024.map(school => (
                <SelectItem key={school.value} value={school.value}>
                  {school.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Spell list */}
        <ScrollArea className="flex-1 min-h-0 border rounded-lg">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-[var(--ink-light)]">Caricamento...</div>
            </div>
          ) : spells.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-[var(--ink-light)]">
              <GameIcon name="book" category="ui" size={32} className="mb-2 opacity-50" />
              <p>Nessun incantesimo trovato</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {spells.map(spell => {
                const addCheck = canAddSpell(spell)
                const isAdding = addingSpell === spell.slug

                return (
                  <div
                    key={spell.id}
                    className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                      addCheck.allowed
                        ? 'hover:bg-purple-50 cursor-pointer'
                        : 'opacity-50'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-[var(--ink)]">
                          {spell.name_it || spell.name}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {formatSpellLevel(spell.level)}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {formatSchool(spell.school)}
                        </Badge>
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
                        {spell.saving_throw && (
                          <Badge variant="outline" className="text-xs text-orange-600 border-orange-300" title={`TS: ${spell.saving_throw}`}>
                            TS
                          </Badge>
                        )}
                        {spell.attack_roll && (
                          <Badge variant="outline" className="text-xs text-red-600 border-red-300" title="Tiro per colpire">
                            ATK
                          </Badge>
                        )}
                        {spell.damage && (
                          <Badge variant="outline" className="text-xs text-purple-600 border-purple-300" title={spell.damage}>
                            DMG
                          </Badge>
                        )}
                        {spell.area_of_effect && (
                          <Badge variant="outline" className="text-xs text-blue-600 border-blue-300" title={spell.area_of_effect}>
                            AOE
                          </Badge>
                        )}
                      </div>
                      {spell.description && (
                        <p className="text-sm text-[var(--ink-light)] line-clamp-2 mt-1">
                          {spell.description_it || spell.description}
                        </p>
                      )}
                      {!addCheck.allowed && addCheck.reason && (
                        <p className="text-xs text-red-500 mt-1">{addCheck.reason}</p>
                      )}
                    </div>
                    <Button
                      variant={addCheck.allowed ? 'default' : 'outline'}
                      size="sm"
                      disabled={!addCheck.allowed || isAdding}
                      onClick={() => handleAddSpell(spell)}
                      className="shrink-0"
                    >
                      {isAdding ? (
                        <span className="animate-spin">...</span>
                      ) : (
                        <>
                          <GameIcon name="plus" category="ui" size={14} className="mr-1" />
                          Aggiungi
                        </>
                      )}
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t">
          <Button variant="outline" onClick={onClose}>
            Chiudi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
