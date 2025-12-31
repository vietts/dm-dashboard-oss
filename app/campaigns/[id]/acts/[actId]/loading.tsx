import { GameIcon } from '@/components/icons/GameIcon'

export default function ActLoading() {
  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header skeleton */}
        <div className="bg-[var(--parchment)] rounded-lg border border-[var(--ink-faded)]/20 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-16 bg-[var(--ink-faded)]/20 rounded animate-pulse" />
            <div className="h-6 w-20 bg-[var(--ink-faded)]/20 rounded animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-8 w-64 bg-[var(--ink-faded)]/20 rounded animate-pulse" />
            <div className="h-5 w-48 bg-[var(--ink-faded)]/20 rounded animate-pulse" />
          </div>
        </div>

        {/* Description skeleton */}
        <div className="bg-[var(--parchment)] rounded-lg border border-[var(--ink-faded)]/20 p-6">
          <div className="h-5 w-32 bg-[var(--ink-faded)]/20 rounded animate-pulse mb-4" />
          <div className="space-y-2">
            <div className="h-4 w-full bg-[var(--ink-faded)]/20 rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-[var(--ink-faded)]/20 rounded animate-pulse" />
            <div className="h-4 w-5/6 bg-[var(--ink-faded)]/20 rounded animate-pulse" />
          </div>
        </div>

        {/* Objectives skeleton */}
        <div className="bg-[var(--parchment)] rounded-lg border border-[var(--ink-faded)]/20 p-6">
          <div className="h-5 w-28 bg-[var(--ink-faded)]/20 rounded animate-pulse mb-4" />
          <div className="space-y-2">
            <div className="h-4 w-48 bg-[var(--ink-faded)]/20 rounded animate-pulse" />
            <div className="h-4 w-56 bg-[var(--ink-faded)]/20 rounded animate-pulse" />
            <div className="h-4 w-40 bg-[var(--ink-faded)]/20 rounded animate-pulse" />
          </div>
        </div>

        {/* Notes skeleton */}
        <div className="bg-[var(--parchment)] rounded-lg border border-[var(--ink-faded)]/20 p-6">
          <div className="h-5 w-20 bg-[var(--ink-faded)]/20 rounded animate-pulse mb-4" />
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 w-full bg-[var(--ink-faded)]/10 rounded animate-pulse" />
            ))}
          </div>
        </div>

        {/* Loading indicator */}
        <div className="flex justify-center py-4">
          <GameIcon name="d20" category="ui" size={32} className="text-[var(--coral)] animate-spin" />
        </div>
      </div>
    </div>
  )
}
