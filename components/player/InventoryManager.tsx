'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { GameIcon } from '@/components/icons/GameIcon'
import { Package, Sparkles, Star, ChevronDown, ChevronUp, Plus } from 'lucide-react'

interface InventoryItem {
  id: string
  character_id: string
  item_name: string
  quantity: number | null
  weight: number | null
  notes: string | null
  is_equipped: boolean | null
  sort_order: number | null
  // New fields
  container: string | null
  item_type: string | null
  rarity: string | null
  requires_attunement: boolean | null
  is_attuned: boolean | null
  tags: string[] | null
  is_magical: boolean | null
}

interface Container {
  id: string
  character_id: string
  container_name: string
  capacity_lb: number | null
  current_weight_lb: number
  sort_order: number
}

interface InventoryManagerProps {
  characterId: string
  items: InventoryItem[]
  onUpdate: () => void
}

const RARITY_COLORS = {
  common: 'text-gray-600',
  uncommon: 'text-green-600',
  rare: 'text-blue-600',
  very_rare: 'text-purple-600',
  legendary: 'text-orange-600',
  artifact: 'text-red-600',
}

const ITEM_TYPE_ICONS = {
  weapon: 'sword',
  armor: 'shield',
  consumable: 'potion',
  tool: 'hammer',
  treasure: 'coins',
  quest: 'scroll',
  misc: 'bag',
}

export default function InventoryManager({ characterId, items, onUpdate }: InventoryManagerProps) {
  const [containers, setContainers] = useState<Container[]>([])
  const [expandedContainers, setExpandedContainers] = useState<Set<string>>(new Set(['equipment']))
  const [isAdding, setIsAdding] = useState(false)
  const [selectedContainer, setSelectedContainer] = useState('equipment')
  const [loading, setLoading] = useState(false)

  // Attunement state
  const [attunementSlots] = useState(3) // Max 3 attunement slots per character
  const attunedItems = items.filter(i => i.is_attuned)
  const itemsRequiringAttunement = items.filter(i => i.requires_attunement && !i.is_attuned)

  // New item form
  const [newItem, setNewItem] = useState({
    item_name: '',
    quantity: 1,
    weight: 0,
    notes: '',
    item_type: 'misc',
    rarity: 'common',
    requires_attunement: false,
    is_magical: false,
  })

  // Load containers
  const loadContainers = async () => {
    const { data, error } = await supabase
      .from('dnd_inventory_containers')
      .select('*')
      .eq('character_id', characterId)
      .eq('is_active', true)
      .order('sort_order')

    if (!error && data) {
      setContainers(data as Container[])
    }
  }

  useEffect(() => {
    loadContainers()
  }, [characterId])

  // Toggle container expansion
  const toggleContainer = (containerName: string) => {
    const newExpanded = new Set(expandedContainers)
    if (newExpanded.has(containerName)) {
      newExpanded.delete(containerName)
    } else {
      newExpanded.add(containerName)
    }
    setExpandedContainers(newExpanded)
  }

  // Group items by container
  const itemsByContainer = items.reduce((acc, item) => {
    const container = item.container || 'equipment'
    if (!acc[container]) acc[container] = []
    acc[container].push(item)
    return acc
  }, {} as Record<string, InventoryItem[]>)

  // Calculate total weight
  const totalWeight = items.reduce((sum, item) => sum + ((item.weight || 0) * (item.quantity || 1)), 0)

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault()
    if (!newItem.item_name.trim()) return

    setLoading(true)
    try {
      const res = await fetch('/api/player-inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId,
          ...newItem,
          container: selectedContainer,
        }),
      })

      if (res.ok) {
        setNewItem({
          item_name: '',
          quantity: 1,
          weight: 0,
          notes: '',
          item_type: 'misc',
          rarity: 'common',
          requires_attunement: false,
          is_magical: false,
        })
        setIsAdding(false)
        onUpdate()
        loadContainers() // Refresh container weights
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateItem(item: InventoryItem) {
    setLoading(true)
    try {
      await fetch('/api/player-inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      })
      onUpdate()
      loadContainers()
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteItem(itemId: string) {
    if (!confirm('Rimuovere questo oggetto?')) return

    setLoading(true)
    try {
      await fetch(`/api/player-inventory?id=${itemId}`, {
        method: 'DELETE',
      })
      onUpdate()
      loadContainers()
    } finally {
      setLoading(false)
    }
  }

  async function toggleEquipped(item: InventoryItem) {
    await handleUpdateItem({ ...item, is_equipped: !item.is_equipped })
  }

  async function toggleAttunement(item: InventoryItem) {
    // Check if we can attune (max 3 items)
    if (!item.is_attuned && attunedItems.length >= attunementSlots) {
      alert(`Puoi avere al massimo ${attunementSlots} oggetti sintonizzati.`)
      return
    }

    await handleUpdateItem({ ...item, is_attuned: !item.is_attuned })
  }

  // Get rarity badge
  const getRarityBadge = (rarity: string | null) => {
    if (!rarity) return null
    const color = RARITY_COLORS[rarity as keyof typeof RARITY_COLORS] || RARITY_COLORS.common
    return (
      <span className={`text-xs font-bold ${color} uppercase`}>
        {rarity.replace('_', ' ')}
      </span>
    )
  }

  return (
    <div className="space-y-4">
      {/* Weight Summary */}
      <div className="parchment-card p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-display font-semibold text-[var(--ink)] flex items-center gap-2">
            <GameIcon name="bag" category="ui" size={20} className="text-[var(--teal)]" />
            Inventario
          </h3>
          <span className="text-sm text-[var(--ink-faded)]">
            Peso totale: <span className="font-bold text-[var(--ink)]">{totalWeight.toFixed(1)} lb</span>
          </span>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="w-full px-4 py-2 bg-[var(--teal)] hover:bg-[var(--teal-dark)] text-white rounded flex items-center justify-center gap-2 transition-colors min-h-[44px]"
        >
          <Plus size={18} />
          <span>Aggiungi Oggetto</span>
        </button>
      </div>

      {/* Add Item Form */}
      {isAdding && (
        <form onSubmit={handleAddItem} className="parchment-card p-4 space-y-3">
          <h4 className="font-display font-bold text-[var(--ink)]">Nuovo Oggetto</h4>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[var(--ink-faded)] mb-1 block">Nome</label>
              <input
                type="text"
                placeholder="Nome oggetto"
                value={newItem.item_name}
                onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--paper)] border border-[var(--border-decorative)] rounded text-sm text-[var(--ink)]"
                autoFocus
              />
            </div>

            <div>
              <label className="text-xs text-[var(--ink-faded)] mb-1 block">Contenitore</label>
              <select
                value={selectedContainer}
                onChange={(e) => setSelectedContainer(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--paper)] border border-[var(--border-decorative)] rounded text-sm text-[var(--ink)]"
              >
                {containers.map(c => (
                  <option key={c.container_name} value={c.container_name}>
                    {c.container_name.charAt(0).toUpperCase() + c.container_name.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-[var(--ink-faded)] mb-1 block">Quantità</label>
              <input
                type="number"
                value={newItem.quantity}
                onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 bg-[var(--paper)] border border-[var(--border-decorative)] rounded text-sm text-[var(--ink)]"
                min={1}
              />
            </div>

            <div>
              <label className="text-xs text-[var(--ink-faded)] mb-1 block">Peso (lb)</label>
              <input
                type="number"
                step="0.1"
                value={newItem.weight}
                onChange={(e) => setNewItem({ ...newItem, weight: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-[var(--paper)] border border-[var(--border-decorative)] rounded text-sm text-[var(--ink)]"
                min={0}
              />
            </div>

            <div>
              <label className="text-xs text-[var(--ink-faded)] mb-1 block">Tipo</label>
              <select
                value={newItem.item_type}
                onChange={(e) => setNewItem({ ...newItem, item_type: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--paper)] border border-[var(--border-decorative)] rounded text-sm text-[var(--ink)]"
              >
                <option value="misc">Misc</option>
                <option value="weapon">Weapon</option>
                <option value="armor">Armor</option>
                <option value="consumable">Consumable</option>
                <option value="tool">Tool</option>
                <option value="treasure">Treasure</option>
                <option value="quest">Quest Item</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-[var(--ink-faded)] mb-1 block">Rarità</label>
              <select
                value={newItem.rarity}
                onChange={(e) => setNewItem({ ...newItem, rarity: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--paper)] border border-[var(--border-decorative)] rounded text-sm text-[var(--ink)]"
              >
                <option value="common">Common</option>
                <option value="uncommon">Uncommon</option>
                <option value="rare">Rare</option>
                <option value="very_rare">Very Rare</option>
                <option value="legendary">Legendary</option>
                <option value="artifact">Artifact</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-[var(--ink-faded)] mb-1 block">Note</label>
            <textarea
              placeholder="Note (opzionale)"
              value={newItem.notes}
              onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--paper)] border border-[var(--border-decorative)] rounded text-sm text-[var(--ink)] resize-none"
              rows={2}
            />
          </div>

          <div className="flex gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newItem.is_magical}
                onChange={(e) => setNewItem({ ...newItem, is_magical: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm text-[var(--ink)]">Magico</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newItem.requires_attunement}
                onChange={(e) => setNewItem({ ...newItem, requires_attunement: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm text-[var(--ink)]">Richiede Sintonizzazione</span>
            </label>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading || !newItem.item_name.trim()}
              className="flex-1 px-4 py-2 bg-[var(--teal)] hover:bg-[var(--teal-dark)] disabled:bg-[var(--ink-faded)] text-white rounded transition-colors min-h-[44px]"
            >
              Aggiungi
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="flex-1 px-4 py-2 bg-[var(--cream)] hover:bg-[var(--ink)]/10 text-[var(--ink)] rounded border border-[var(--border-decorative)] transition-colors min-h-[44px]"
            >
              Annulla
            </button>
          </div>
        </form>
      )}

      {/* Attunement Slots */}
      {(itemsRequiringAttunement.length > 0 || attunedItems.length > 0) && (
        <div className="parchment-card p-4">
          <h4 className="font-display font-bold text-[var(--ink)] mb-3 flex items-center gap-2">
            <Star size={18} className="text-yellow-600" />
            Sintonizzazione ({attunedItems.length}/{attunementSlots})
          </h4>

          {/* Attuned Items */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {Array.from({ length: attunementSlots }).map((_, idx) => {
              const attunedItem = attunedItems[idx]
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border-2 ${
                    attunedItem
                      ? 'border-yellow-400 bg-yellow-400/10'
                      : 'border-[var(--border-decorative)] border-dashed bg-[var(--cream-dark)]'
                  }`}
                >
                  {attunedItem ? (
                    <div className="text-xs">
                      <div className="font-bold text-[var(--ink)] truncate">{attunedItem.item_name}</div>
                      <div className="text-[var(--ink-faded)]">
                        {attunedItem.item_type}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-[var(--ink-faded)] text-center">Empty</div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Items Requiring Attunement */}
          {itemsRequiringAttunement.length > 0 && (
            <div>
              <div className="text-xs text-[var(--ink-faded)] mb-2">Richiedono Sintonizzazione:</div>
              <div className="space-y-1">
                {itemsRequiringAttunement.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-[var(--cream-dark)] rounded">
                    <span className="text-sm text-[var(--ink)]">{item.item_name}</span>
                    <button
                      onClick={() => toggleAttunement(item)}
                      className="px-3 py-1 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-700 text-xs rounded transition-colors"
                    >
                      Sintonizza
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Containers */}
      {containers.map((container) => {
        const containerItems = itemsByContainer[container.container_name] || []
        const containerWeight = containerItems.reduce((sum, item) => sum + ((item.weight || 0) * (item.quantity || 1)), 0)
        const isExpanded = expandedContainers.has(container.container_name)
        const weightPercentage = container.capacity_lb
          ? Math.min(100, (containerWeight / container.capacity_lb) * 100)
          : 0

        return (
          <div key={container.id} className="parchment-card">
            {/* Container Header */}
            <button
              onClick={() => toggleContainer(container.container_name)}
              className="w-full p-4 text-left hover:bg-[var(--cream-dark)] transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-display font-bold text-[var(--ink)] flex items-center gap-2">
                  <Package size={18} className="text-[var(--teal)]" />
                  {container.container_name.charAt(0).toUpperCase() + container.container_name.slice(1)}
                  <span className="text-sm font-normal text-[var(--ink-faded)]">
                    ({containerItems.length} items)
                  </span>
                </h4>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-[var(--ink-faded)]">
                    {containerWeight.toFixed(1)} lb
                    {container.capacity_lb && ` / ${container.capacity_lb} lb`}
                  </span>
                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </div>

              {/* Weight Bar */}
              {container.capacity_lb && (
                <div className="h-2 bg-[var(--cream-dark)] rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      weightPercentage > 100
                        ? 'bg-[var(--coral)]'
                        : weightPercentage > 80
                          ? 'bg-yellow-500'
                          : 'bg-[var(--teal)]'
                    }`}
                    style={{ width: `${Math.min(100, weightPercentage)}%` }}
                  />
                </div>
              )}
            </button>

            {/* Container Items */}
            {isExpanded && (
              <div className="px-4 pb-4 space-y-1">
                {containerItems.length === 0 ? (
                  <p className="text-[var(--ink-faded)] text-sm text-center py-4">
                    Contenitore vuoto
                  </p>
                ) : (
                  containerItems.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-2 p-2 rounded transition-colors ${
                        item.is_equipped
                          ? 'bg-[var(--teal)]/10 border border-[var(--teal)]'
                          : 'bg-[var(--cream-dark)]'
                      }`}
                    >
                      <button
                        onClick={() => toggleEquipped(item)}
                        className={`w-5 h-5 rounded border flex items-center justify-center text-xs transition-colors flex-shrink-0 ${
                          item.is_equipped
                            ? 'bg-[var(--teal)] border-[var(--teal)] text-white'
                            : 'bg-[var(--paper)] border-[var(--border-decorative)] text-[var(--ink-light)]'
                        }`}
                        title={item.is_equipped ? 'Equipaggiato' : 'Non equipaggiato'}
                      >
                        {item.is_equipped ? '✓' : ''}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[var(--ink)] text-sm">{item.item_name}</span>
                          {(item.quantity ?? 1) > 1 && (
                            <span className="text-xs text-[var(--ink-faded)]">x{item.quantity}</span>
                          )}
                          {item.is_magical && (
                            <span title="Magico">
                              <Sparkles size={12} className="text-purple-600" />
                            </span>
                          )}
                          {item.is_attuned && (
                            <span title="Sintonizzato">
                              <Star size={12} className="text-yellow-600 fill-yellow-600" />
                            </span>
                          )}
                          {getRarityBadge(item.rarity)}
                        </div>
                        {item.notes && (
                          <p className="text-[var(--ink-faded)] text-xs truncate">{item.notes}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {item.requires_attunement && !item.is_attuned && (
                          <button
                            onClick={() => toggleAttunement(item)}
                            className="p-1 text-yellow-600 hover:bg-yellow-600/10 rounded transition-colors"
                            title="Sintonizza"
                          >
                            <Star size={14} />
                          </button>
                        )}
                        {item.is_attuned && (
                          <button
                            onClick={() => toggleAttunement(item)}
                            className="p-1 text-yellow-600 hover:bg-yellow-600/10 rounded transition-colors"
                            title="Rimuovi sintonizzazione"
                          >
                            <Star size={14} className="fill-yellow-600" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-[var(--ink-faded)] hover:text-[var(--coral)] p-1 transition-colors"
                          title="Rimuovi"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )
      })}

      {items.length === 0 && (
        <div className="parchment-card p-8 text-center">
          <GameIcon name="bag" category="ui" size={48} className="text-[var(--ink-faded)] mx-auto mb-4" />
          <p className="text-[var(--ink-faded)] text-sm">
            Inventario vuoto. Aggiungi il primo oggetto!
          </p>
        </div>
      )}
    </div>
  )
}
