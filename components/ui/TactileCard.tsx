'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type TactileCardVariant = 'default' | 'elevated' | 'info' | 'warning'

interface TactileCardProps {
  children: ReactNode
  variant?: TactileCardVariant
  className?: string
  interactive?: boolean
  onClick?: () => void
}

const variantStyles: Record<TactileCardVariant, string> = {
  default: 'bg-[var(--cream)] border-[var(--border-decorative)] shadow-md',
  elevated: 'bg-[var(--cream)] border-[var(--border-decorative)] shadow-xl',
  info: 'bg-[var(--cream)] border-[var(--teal)] shadow-lg ring-1 ring-[var(--teal)]/20',
  warning: 'bg-[var(--cream)] border-amber-500 shadow-lg ring-1 ring-amber-500/20',
}

/**
 * TactileCard - Base card component with parchment theme and tactile effects
 *
 * Provides consistent card styling across the app with:
 * - Deep layered shadows for depth
 * - Parchment border effects
 * - Touch feedback (press down animation)
 * - Variant system for different states
 *
 * @param variant - Visual style: default | elevated | info | warning
 * @param interactive - Enable press-down animation on tap (default: true if onClick provided)
 * @param className - Additional Tailwind classes
 * @param onClick - Optional click handler
 */
export default function TactileCard({
  children,
  variant = 'default',
  className,
  interactive,
  onClick,
}: TactileCardProps) {
  const isInteractive = interactive ?? !!onClick

  return (
    <div
      onClick={onClick}
      className={cn(
        // Base parchment card styles
        'rounded-lg border-2',
        'backdrop-blur-sm',

        // Variant-specific styles
        variantStyles[variant],

        // Interactive states
        isInteractive && [
          'cursor-pointer',
          'transition-all duration-200',
          'active:scale-[0.98]',
          'hover:shadow-2xl',
        ],

        // Custom classes
        className
      )}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  )
}
