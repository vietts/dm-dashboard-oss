'use client'

import { useState } from 'react'
import { GameIcon } from '@/components/icons/GameIcon'
import { InfoTooltip } from '@/components/ui/tooltip'

interface ClassResource {
  id: string
  name: string
  max: number
  current: number
  recharge: 'short' | 'long' | 'passive'
  class: string
  description?: string
}

interface ResourceCardProps {
  resource: ClassResource
  onUpdate: (resourceId: string, operation: 'spend' | 'recover') => Promise<void>
  disabled?: boolean
}

export function ResourceCard({ resource, onUpdate, disabled = false }: ResourceCardProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  const handleUpdate = async (operation: 'spend' | 'recover') => {
    if (isUpdating || disabled) return

    setIsUpdating(true)
    try {
      await onUpdate(resource.id, operation)
    } finally {
      setIsUpdating(false)
    }
  }

  // Determine if we should show dots or numbers
  const showDots = resource.max <= 6

  // Render dots for small pools
  const renderDots = () => {
    const dots = []
    for (let i = 0; i < resource.max; i++) {
      const isFilled = i < resource.current
      dots.push(
        <div
          key={i}
          className={`w-3 h-3 rounded-full border-2 transition-colors ${
            isFilled
              ? 'bg-[var(--health-mid)] border-amber-400'
              : 'bg-[var(--cream)] border-[var(--border-decorative)]'
          }`}
        />
      )
    }
    return dots
  }

  // Get recharge icon and label
  const getRechargeInfo = () => {
    if (resource.recharge === 'short') {
      return {
        icon: <GameIcon name="hourglass" category="ui" size={16} />,
        label: 'breve riposo'
      }
    }
    return {
      icon: <GameIcon name="rest" category="ui" size={16} />,
      label: 'lungo riposo'
    }
  }

  const rechargeInfo = getRechargeInfo()

  // Get unit label (usually HP for most resources)
  const getUnitLabel = () => {
    if (resource.name.toLowerCase().includes('imposizione')) {
      return 'HP'
    }
    return ''
  }

  const unitLabel = getUnitLabel()

  return (
    <div className="parchment-card p-4 space-y-3">
      {/* Header: Name + Tooltip */}
      <div className="flex items-center justify-between">
        <h4 className="font-cinzel text-sm text-[var(--ink)] font-semibold">
          {resource.name}
        </h4>
        {resource.description && (
          <InfoTooltip content={resource.description} />
        )}
      </div>

      {/* Counter Display */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[var(--ink)]/70">
            {resource.current} / {resource.max} {unitLabel}
          </span>
          <div className="flex items-center gap-1 text-[var(--ink)]/60">
            {rechargeInfo.icon}
            <span>{rechargeInfo.label}</span>
          </div>
        </div>

        {/* Dots or Number Display */}
        {showDots && (
          <div className="flex gap-1.5 flex-wrap">
            {renderDots()}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => handleUpdate('spend')}
          disabled={disabled || isUpdating || resource.current === 0}
          className="flex-1 h-10 rounded-md bg-[var(--teal)] text-white font-semibold text-lg
                   hover:bg-[var(--teal-dark)] disabled:opacity-40 disabled:cursor-not-allowed
                   active:scale-95 transition-all focus:outline-none focus:ring-2
                   focus:ring-[var(--teal)] focus:ring-offset-2 touch-manipulation"
          aria-label="Spendi risorsa"
        >
          −
        </button>
        <button
          onClick={() => handleUpdate('recover')}
          disabled={disabled || isUpdating || resource.current === resource.max}
          className="flex-1 h-10 rounded-md bg-[var(--teal)] text-white font-semibold text-lg
                   hover:bg-[var(--teal-dark)] disabled:opacity-40 disabled:cursor-not-allowed
                   active:scale-95 transition-all focus:outline-none focus:ring-2
                   focus:ring-[var(--teal)] focus:ring-offset-2 touch-manipulation"
          aria-label="Recupera risorsa"
        >
          +
        </button>
      </div>

      {/* Loading State Indicator */}
      {isUpdating && (
        <div className="text-center text-xs text-[var(--ink)]/50">
          Aggiornamento...
        </div>
      )}
    </div>
  )
}
