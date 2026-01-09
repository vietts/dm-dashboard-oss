'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { GameIcon } from '@/components/icons/GameIcon'
import { Monster, MonsterSpell } from '@/types/database'
import { searchSpells, CachedSpell, SPELL_LEVELS } from '@/lib/open5e'
import { Trash2, Plus, Upload, Image as ImageIcon, Loader2, X } from 'lucide-react'

interface MonsterEditDialogProps {
  monster: Monster | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (monster: Monster) => void
  onDelete?: (monsterId: string) => void
}

const MONSTER_SIZES = ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan']
const MONSTER_TYPES = ['aberration', 'beast', 'celestial', 'construct', 'dragon', 'elemental', 'fey', 'fiend', 'giant', 'humanoid', 'monstrosity', 'ooze', 'plant', 'undead']
const CR_OPTIONS = ['0', '1/8', '1/4', '1/2', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30']

export function MonsterEditDialog({ monster, open, onOpenChange, onSave, onDelete }: MonsterEditDialogProps) {
  const [activeTab, setActiveTab] = useState('stats')
  const [saving, setSaving] = useState(false)
  const [editedMonster, setEditedMonster] = useState<Partial<Monster>>({})

  // Spells state
  const [monsterSpells, setMonsterSpells] = useState<MonsterSpell[]>([])
  const [loadingSpells, setLoadingSpells] = useState(false)
  const [spellSearch, setSpellSearch] = useState('')
  const [spellResults, setSpellResults] = useState<CachedSpell[]>([])
  const [searchingSpells, setSearchingSpells] = useState(false)
  const [addingSpell, setAddingSpell] = useState(false)

  // Image state
  const [uploadingImage, setUploadingImage] = useState(false)
  const [existingImages, setExistingImages] = useState<{ url: string; name: string; bucket: string }[]>([])
  const [loadingImages, setLoadingImages] = useState(false)
  const [showImagePicker, setShowImagePicker] = useState(false)

  // Initialize form when monster changes
  useEffect(() => {
    if (monster) {
      setEditedMonster({ ...monster })
      fetchMonsterSpells(monster.id)
    } else {
      setEditedMonster({})
      setMonsterSpells([])
    }
    setActiveTab('stats')
  }, [monster])

  // Fetch monster spells
  async function fetchMonsterSpells(monsterId: string) {
    setLoadingSpells(true)
    try {
      const res = await fetch(`/api/monster-spells?monsterId=${monsterId}`)
      const data = await res.json()
      if (data.success) {
        setMonsterSpells(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching monster spells:', error)
    }
    setLoadingSpells(false)
  }

  // Search spells
  async function handleSpellSearch() {
    if (!spellSearch.trim()) return
    setSearchingSpells(true)
    try {
      const results = await searchSpells(spellSearch)
      setSpellResults(results)
    } catch (error) {
      console.error('Error searching spells:', error)
    }
    setSearchingSpells(false)
  }

  // Add spell to monster
  async function addSpellToMonster(spell: CachedSpell) {
    if (!monster) return
    setAddingSpell(true)
    try {
      const res = await fetch('/api/monster-spells', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monster_id: monster.id,
          spell_slug: spell.slug,
          spell_name: spell.name,
          spell_level: spell.level_int || 0
        })
      })
      const data = await res.json()
      if (data.success) {
        setMonsterSpells([...monsterSpells, data.data])
        setSpellSearch('')
        setSpellResults([])
      }
    } catch (error) {
      console.error('Error adding spell:', error)
    }
    setAddingSpell(false)
  }

  // Remove spell from monster
  async function removeSpell(spellId: string) {
    try {
      const res = await fetch(`/api/monster-spells?id=${spellId}`, { method: 'DELETE' })
      if (res.ok) {
        setMonsterSpells(monsterSpells.filter(s => s.id !== spellId))
      }
    } catch (error) {
      console.error('Error removing spell:', error)
    }
  }

  // Load existing images
  async function loadExistingImages() {
    setLoadingImages(true)
    try {
      const res = await fetch('/api/monster-image')
      const data = await res.json()
      if (data.success) {
        setExistingImages(data.images || [])
      }
    } catch (error) {
      console.error('Error loading images:', error)
    }
    setLoadingImages(false)
  }

  // Upload new image
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !monster) return

    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('monsterId', monster.id)

      const res = await fetch('/api/monster-image', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (data.success) {
        setEditedMonster({ ...editedMonster, image_url: data.url })
      }
    } catch (error) {
      console.error('Error uploading image:', error)
    }
    setUploadingImage(false)
  }

  // Select existing image
  function selectExistingImage(url: string) {
    setEditedMonster({ ...editedMonster, image_url: url })
    setShowImagePicker(false)
  }

  // Save monster
  async function handleSave() {
    if (!monster) return
    setSaving(true)
    try {
      const res = await fetch('/api/monsters', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: monster.id,
          ...editedMonster
        })
      })
      const data = await res.json()
      if (data.success) {
        onSave(data.data)
        onOpenChange(false)
      }
    } catch (error) {
      console.error('Error saving monster:', error)
    }
    setSaving(false)
  }

  // Delete monster
  async function handleDelete() {
    if (!monster || !onDelete) return
    if (!confirm(`Eliminare ${monster.name}?`)) return

    try {
      const res = await fetch(`/api/monsters?id=${monster.id}`, { method: 'DELETE' })
      if (res.ok) {
        onDelete(monster.id)
        onOpenChange(false)
      }
    } catch (error) {
      console.error('Error deleting monster:', error)
    }
  }

  // Helper to calculate modifier
  function getModifier(score: number): string {
    const mod = Math.floor((score - 10) / 2)
    return mod >= 0 ? `+${mod}` : `${mod}`
  }

  if (!monster) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="parchment-card max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-display text-[var(--ink)] flex items-center gap-2">
            <GameIcon name="skull" category="ui" size={24} className="text-[var(--coral)]" />
            Modifica: {monster.name}
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="stats">Statistiche</TabsTrigger>
            <TabsTrigger value="spells">Incantesimi</TabsTrigger>
            <TabsTrigger value="image">Immagine</TabsTrigger>
          </TabsList>

          {/* STATS TAB */}
          <TabsContent value="stats" className="space-y-4 mt-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome</Label>
                <Input
                  value={editedMonster.name || ''}
                  onChange={(e) => setEditedMonster({ ...editedMonster, name: e.target.value })}
                />
              </div>
              <div>
                <Label>CR</Label>
                <Select
                  value={editedMonster.cr || '0'}
                  onValueChange={(v) => setEditedMonster({ ...editedMonster, cr: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CR_OPTIONS.map(cr => (
                      <SelectItem key={cr} value={cr}>{cr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Taglia</Label>
                <Select
                  value={editedMonster.size || 'Medium'}
                  onValueChange={(v) => setEditedMonster({ ...editedMonster, size: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONSTER_SIZES.map(size => (
                      <SelectItem key={size} value={size}>{size}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tipo</Label>
                <Select
                  value={editedMonster.monster_type || 'humanoid'}
                  onValueChange={(v) => setEditedMonster({ ...editedMonster, monster_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONSTER_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Velocita</Label>
                <Input
                  value={editedMonster.speed || ''}
                  onChange={(e) => setEditedMonster({ ...editedMonster, speed: e.target.value })}
                  placeholder="30 ft"
                />
              </div>
            </div>

            {/* Combat Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>CA (Armor Class)</Label>
                <Input
                  type="number"
                  value={editedMonster.armor_class || 10}
                  onChange={(e) => setEditedMonster({ ...editedMonster, armor_class: parseInt(e.target.value) || 10 })}
                />
              </div>
              <div>
                <Label>HP Massimi</Label>
                <Input
                  type="number"
                  value={editedMonster.max_hp || 10}
                  onChange={(e) => setEditedMonster({ ...editedMonster, max_hp: parseInt(e.target.value) || 10 })}
                />
              </div>
            </div>

            {/* Ability Scores */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Caratteristiche</Label>
              <div className="grid grid-cols-6 gap-2">
                {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).map(stat => (
                  <div key={stat} className="text-center">
                    <Label className="text-xs uppercase text-[var(--ink-light)]">{stat}</Label>
                    <Input
                      type="number"
                      className="text-center"
                      value={editedMonster[stat] || 10}
                      onChange={(e) => setEditedMonster({ ...editedMonster, [stat]: parseInt(e.target.value) || 10 })}
                    />
                    <span className="text-xs text-[var(--ink-light)]">
                      {getModifier(editedMonster[stat] || 10)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Abilities */}
            <div>
              <Label>Abilita e Azioni</Label>
              <Textarea
                value={editedMonster.abilities || ''}
                onChange={(e) => setEditedMonster({ ...editedMonster, abilities: e.target.value })}
                rows={6}
                placeholder="**Abilità Speciali**&#10;• Descrizione...&#10;&#10;**Azioni**&#10;• Attacco: +X to hit..."
              />
            </div>

            {/* Legendary Actions */}
            <div>
              <Label>Azioni Leggendarie</Label>
              <Textarea
                value={editedMonster.legendary_actions || ''}
                onChange={(e) => setEditedMonster({ ...editedMonster, legendary_actions: e.target.value })}
                rows={3}
                placeholder="Opzionale - solo per creature leggendarie"
              />
            </div>
          </TabsContent>

          {/* SPELLS TAB */}
          <TabsContent value="spells" className="space-y-4 mt-4">
            <div className="flex gap-2">
              <Input
                placeholder="Cerca incantesimo..."
                value={spellSearch}
                onChange={(e) => setSpellSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSpellSearch()}
                className="flex-1"
              />
              <Button onClick={handleSpellSearch} disabled={searchingSpells}>
                {searchingSpells ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cerca'}
              </Button>
            </div>

            {/* Search Results */}
            {spellResults.length > 0 && (
              <div className="border rounded-lg p-2 max-h-48 overflow-y-auto bg-white">
                {spellResults.map(spell => {
                  const alreadyAdded = monsterSpells.some(s => s.spell_slug === spell.slug)
                  return (
                    <div
                      key={spell.id}
                      className={`flex items-center justify-between p-2 rounded ${alreadyAdded ? 'opacity-50' : 'hover:bg-gray-50 cursor-pointer'}`}
                      onClick={() => !alreadyAdded && addSpellToMonster(spell)}
                    >
                      <div>
                        <span className="font-medium">{spell.name}</span>
                        <span className="text-sm text-gray-500 ml-2">
                          {spell.level_int === 0 ? 'Trucchetto' : `${spell.level_int}° livello`}
                        </span>
                      </div>
                      {!alreadyAdded && (
                        <Button size="sm" variant="outline" disabled={addingSpell}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Current Monster Spells */}
            <div className="border rounded-lg p-4 bg-white">
              <h4 className="font-medium mb-3">Incantesimi Assegnati</h4>
              {loadingSpells ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Caricamento...
                </div>
              ) : monsterSpells.length === 0 ? (
                <p className="text-gray-500 text-sm">Nessun incantesimo assegnato</p>
              ) : (
                <div className="space-y-1">
                  {SPELL_LEVELS.map(levelObj => {
                    const spellsAtLevel = monsterSpells.filter(s => s.spell_level === levelObj.value)
                    if (spellsAtLevel.length === 0) return null
                    return (
                      <div key={levelObj.value}>
                        <span className="text-xs font-medium text-[var(--ink-light)] uppercase">
                          {levelObj.label}
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {spellsAtLevel.map(spell => (
                            <Badge
                              key={spell.id}
                              variant="secondary"
                              className="flex items-center gap-1 cursor-pointer hover:bg-red-100"
                              onClick={() => removeSpell(spell.id)}
                            >
                              {spell.spell_name}
                              <X className="w-3 h-3" />
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* IMAGE TAB */}
          <TabsContent value="image" className="space-y-4 mt-4">
            {/* Current Image */}
            {editedMonster.image_url && (
              <div className="relative inline-block">
                <img
                  src={editedMonster.image_url}
                  alt={monster.name}
                  className="max-w-xs max-h-64 rounded-lg border shadow"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2"
                  onClick={() => setEditedMonster({ ...editedMonster, image_url: null })}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}

            <div className="flex gap-4">
              {/* Upload New */}
              <div>
                <Label className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
                    {uploadingImage ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    Carica Nuova
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                  />
                </Label>
              </div>

              {/* Select from Library */}
              <Button
                variant="outline"
                onClick={() => {
                  setShowImagePicker(!showImagePicker)
                  if (!showImagePicker) loadExistingImages()
                }}
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Scegli da Libreria
              </Button>
            </div>

            {/* Image Picker */}
            {showImagePicker && (
              <div className="border rounded-lg p-4 bg-white max-h-64 overflow-y-auto">
                {loadingImages ? (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Caricamento immagini...
                  </div>
                ) : existingImages.length === 0 ? (
                  <p className="text-gray-500 text-sm">Nessuna immagine nella libreria</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {existingImages.map(img => (
                      <img
                        key={img.url}
                        src={img.url}
                        alt={img.name}
                        className="w-full h-20 object-cover rounded cursor-pointer border-2 border-transparent hover:border-[var(--teal)]"
                        onClick={() => selectExistingImage(img.url)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
        </div>

        {/* Footer - fixed at bottom */}
        <div className="flex justify-between pt-4 border-t">
          <div>
            {onDelete && (
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                Elimina
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Salva
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
