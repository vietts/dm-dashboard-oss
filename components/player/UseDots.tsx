import { cn } from '@/lib/utils'

interface UseDotsProps {
  current: number
  max: number
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

/**
 * UseDots - Visual progress indicator using filled/empty circles
 * Pattern based on D&D Beyond spell slots and limited use displays
 *
 * @example
 * <UseDots current={3} max={5} /> // Shows ●●●○○
 * <UseDots current={2} max={3} size="lg" className="text-teal-600" />
 */
export function UseDots({ current, max, className, size = 'md' }: UseDotsProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  }

  const dotSize = sizeClasses[size]

  return (
    <div className={cn('flex gap-1', className)}>
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'rounded-full transition-all',
            dotSize,
            i < current
              ? 'bg-current shadow-sm' // Filled dot (available)
              : 'border-2 border-current bg-transparent' // Empty dot (used)
          )}
          aria-label={i < current ? 'Uso disponibile' : 'Uso consumato'}
        />
      ))}
    </div>
  )
}
