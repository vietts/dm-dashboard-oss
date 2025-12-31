'use client'

import Link from 'next/link'
import { Act } from '@/types/database'
import { Button } from '@/components/ui/button'

interface ActNavigationProps {
  campaignId: string
  currentAct: Act
  allActs: Act[]
}

export function ActNavigation({ campaignId, currentAct, allActs }: ActNavigationProps) {
  // Find previous and next acts
  const sortedActs = [...allActs].sort((a, b) => a.act_number - b.act_number)
  const currentIndex = sortedActs.findIndex(a => a.id === currentAct.id)

  const prevAct = currentIndex > 0 ? sortedActs[currentIndex - 1] : null
  const nextAct = currentIndex < sortedActs.length - 1 ? sortedActs[currentIndex + 1] : null

  return (
    <div className="flex items-center justify-between py-6 border-t border-[var(--ink-faded)]/20">
      {/* Previous Act */}
      {prevAct ? (
        <Link href={`/campaigns/${campaignId}/acts/${prevAct.id}`}>
          <Button variant="outline" className="flex items-center gap-2">
            <span>←</span>
            <div className="text-left">
              <div className="text-xs text-[var(--ink-light)]">Atto {prevAct.act_number}</div>
              <div className="text-sm truncate max-w-[150px]">{prevAct.title}</div>
            </div>
          </Button>
        </Link>
      ) : (
        <div />
      )}

      {/* Back to Campaign */}
      <Link href={`/campaigns/${campaignId}`}>
        <Button variant="ghost" className="text-[var(--ink-light)]">
          Torna alla Campagna
        </Button>
      </Link>

      {/* Next Act */}
      {nextAct ? (
        <Link href={`/campaigns/${campaignId}/acts/${nextAct.id}`}>
          <Button variant="outline" className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-xs text-[var(--ink-light)]">Atto {nextAct.act_number}</div>
              <div className="text-sm truncate max-w-[150px]">{nextAct.title}</div>
            </div>
            <span>→</span>
          </Button>
        </Link>
      ) : (
        <div />
      )}
    </div>
  )
}
