'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Campaign, Act } from '@/types/database'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CampaignLayoutProps {
  children: React.ReactNode
}

export default function CampaignLayout({ children }: CampaignLayoutProps) {
  const params = useParams()
  const pathname = usePathname()
  const campaignId = params.id as string

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [acts, setActs] = useState<Act[]>([])
  const [loading, setLoading] = useState(true)

  // Check if we're on an act detail page
  const isActPage = pathname?.includes('/acts/')
  const currentActId = pathname?.match(/\/acts\/([^/]+)/)?.[1]

  useEffect(() => {
    if (campaignId) {
      fetchLayoutData()
    }
  }, [campaignId])

  async function fetchLayoutData() {
    setLoading(true)

    const [campaignResult, actsResult] = await Promise.all([
      supabase
        .from('dnd_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single(),
      supabase
        .from('dnd_acts')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('act_number', { ascending: true })
    ])

    if (campaignResult.data) {
      setCampaign(campaignResult.data)
    }
    if (actsResult.data) {
      setActs(actsResult.data)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="animate-spin text-[var(--coral)]">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      </div>
    )
  }

  // If not on act page, render children directly without extra header
  if (!isActPage) {
    return <>{children}</>
  }

  // On act detail page, show campaign navigation header
  return (
    <div className="min-h-screen">
      {/* Campaign Navigation Header - only on act pages */}
      <div className="bg-[var(--parchment)] border-b border-[var(--ink-faded)]/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Back to Campaign */}
            <Link href={`/campaigns/${campaignId}`}>
              <Button variant="ghost" size="sm" className="text-[var(--ink-light)] hover:text-[var(--ink)]">
                <span className="mr-1">←</span>
                {campaign?.name || 'Campagna'}
              </Button>
            </Link>

            {/* Act Navigation Tabs */}
            {acts.length > 0 && (
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                {acts.map((act) => {
                  const isActive = act.id === currentActId
                  const isCurrent = act.act_number === campaign?.current_act

                  return (
                    <Link
                      key={act.id}
                      href={`/campaigns/${campaignId}/acts/${act.id}`}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          'whitespace-nowrap transition-all',
                          isActive
                            ? 'bg-[var(--coral)] text-white hover:bg-[var(--coral)]/90'
                            : 'text-[var(--ink-light)] hover:text-[var(--ink)] hover:bg-[var(--ink)]/5',
                          isCurrent && !isActive && 'ring-1 ring-[var(--coral)]/50'
                        )}
                      >
                        Atto {act.act_number}
                        {isCurrent && !isActive && (
                          <span className="ml-1 text-[var(--coral)]">•</span>
                        )}
                      </Button>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Page Content */}
      <main>
        {children}
      </main>
    </div>
  )
}
