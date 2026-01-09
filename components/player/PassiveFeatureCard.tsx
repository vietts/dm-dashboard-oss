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

interface PassiveFeatureCardProps {
  feature: ClassResource
}

export function PassiveFeatureCard({ feature }: PassiveFeatureCardProps) {
  return (
    <div className="parchment-card p-4 bg-[var(--ink)]/5 border border-[var(--ink)]/10">
      {/* Header: Name + Tooltip */}
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-cinzel text-sm text-[var(--ink)] font-semibold">
          {feature.name}
        </h4>
        {feature.description && (
          <InfoTooltip content={feature.description} />
        )}
      </div>

      {/* Passive Badge */}
      <div className="flex items-center gap-2 text-xs text-[var(--ink)]/60">
        <span className="text-base">∞</span>
        <span>sempre</span>
      </div>
    </div>
  )
}
