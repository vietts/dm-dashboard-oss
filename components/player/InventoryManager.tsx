'use client'

import { useState } from 'react'
import { InventoryItem } from '@/types/database'
import { GameIcon } from '@/components/icons/GameIcon'

interface InventoryManagerProps {
  characterId: string
  items: InventoryItem[]
  onUpdate: () => void
}

const ITEMS_COLLAPSED_LIMIT = 10

export default function InventoryManager({ characterId, items, onUpdate }: InventoryManagerProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newItem, setNewItem] = useState({ item_name: '', quantity: 1, notes: '' })
  const [loading, setLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  // Calculate total weight
  const totalWeight = items.reduce((sum, item) => sum + ((item.weight || 0) * item.quantity), 0)

  // Collapsible logic: show first 10 items unless expanded
  const hasMoreItems = items.length > ITEMS_COLLAPSED_LIMIT
  const visibleItems = isExpanded ? items : items.slice(0, ITEMS_COLLAPSED_LIMIT)
  const hiddenCount = items.length - ITEMS_COLLAPSED_LIMIT

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
        }),
      })

      if (res.ok) {
        setNewItem({ item_name: '', quantity: 1, notes: '' })
        setIsAdding(false)
        onUpdate()
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
    } finally {
      setLoading(false)
    }
  }

  async function toggleEquipped(item: InventoryItem) {
    await handleUpdateItem({ ...item, is_equipped: !item.is_equipped })
  }

  return (
    <div className="parchment-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-display font-semibold text-[var(--ink)] flex items-center gap-2">
          <GameIcon name="scroll" category="ui" size={20} className="text-[var(--teal)]" />
          Inventario
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--ink-faded)]">
            Peso: {totalWeight.toFixed(1)} lb
          </span>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="px-2 py-1 text-xs bg-[var(--teal)] hover:bg-[var(--teal-dark)] text-white rounded transition-colors"
          >
            + Aggiungi
          </button>
        </div>
      </div>

      {/* Add Item Form */}
      {isAdding && (
        <form onSubmit={handleAddItem} className="mb-4 p-3 bg-[var(--cream-dark)] rounded-lg">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input
              type="text"
              placeholder="Nome oggetto"
              value={newItem.item_name}
              onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })}
              className="px-2 py-1 bg-[var(--paper)] border border-[var(--border-decorative)] rounded text-sm text-[var(--ink)] placeholder:text-[var(--ink-faded)]"
              autoFocus
            />
            <input
              type="number"
              placeholder="Qtà"
              value={newItem.quantity}
              onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
              className="px-2 py-1 bg-[var(--paper)] border border-[var(--border-decorative)] rounded text-sm text-[var(--ink)]"
              min={1}
            />
          </div>
          <input
            type="text"
            placeholder="Note (opzionale)"
            value={newItem.notes}
            onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
            className="w-full px-2 py-1 bg-[var(--paper)] border border-[var(--border-decorative)] rounded text-sm text-[var(--ink)] placeholder:text-[var(--ink-faded)] mb-2"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading || !newItem.item_name.trim()}
              className="px-3 py-1 bg-[var(--teal)] hover:bg-[var(--teal-dark)] disabled:bg-[var(--ink-faded)] text-white text-sm rounded transition-colors"
            >
              Aggiungi
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1 bg-[var(--cream)] hover:bg-[var(--ink)]/10 text-[var(--ink)] text-sm rounded border border-[var(--border-decorative)] transition-colors"
            >
              Annulla
            </button>
          </div>
        </form>
      )}

      {/* Items List - NO scroll, collapsible after 10 items */}
      {items.length === 0 ? (
        <p className="text-[var(--ink-faded)] text-sm text-center py-4">
          Inventario vuoto
        </p>
      ) : (
        <div className="space-y-1">
          {visibleItems.map((item) => (
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
                className={`w-5 h-5 rounded border flex items-center justify-center text-xs transition-colors ${
                  item.is_equipped
                    ? 'bg-[var(--teal)] border-[var(--teal)] text-white'
                    : 'bg-[var(--paper)] border-[var(--border-decorative)] text-[var(--ink-light)]'
                }`}
                title={item.is_equipped ? 'Equipaggiato' : 'Non equipaggiato'}
              >
                {item.is_equipped ? '✓' : ''}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[var(--ink)] text-sm truncate">{item.item_name}</span>
                  {item.quantity > 1 && (
                    <span className="text-xs text-[var(--ink-faded)]">x{item.quantity}</span>
                  )}
                </div>
                {item.notes && (
                  <p className="text-[var(--ink-faded)] text-xs truncate">{item.notes}</p>
                )}
              </div>

              <button
                onClick={() => handleDeleteItem(item.id)}
                className="text-[var(--ink-faded)] hover:text-[var(--coral)] p-1 transition-colors"
                title="Rimuovi"
              >
                ×
              </button>
            </div>
          ))}

          {/* Expand/Collapse button for items > 10 */}
          {hasMoreItems && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full py-2 text-sm text-[var(--teal)] hover:text-[var(--teal-dark)] hover:bg-[var(--cream-dark)] rounded transition-colors flex items-center justify-center gap-1"
            >
              {isExpanded ? (
                <>
                  <span>Mostra meno</span>
                  <span className="text-xs">▲</span>
                </>
              ) : (
                <>
                  <span>Mostra altri {hiddenCount}</span>
                  <span className="text-xs">▼</span>
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
