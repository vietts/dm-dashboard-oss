'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { GameIcon, CLASS_ICONS } from '@/components/icons/GameIcon'
import { Heart, Shield } from 'lucide-react'
import type { Character, Campaign } from '@/types/database'

interface CharacterWithCampaign extends Character {
  campaign?: Campaign | null
}

export default function DMCharacterSelector() {
  const router = useRouter()
  const [characters, setCharacters] = useState<CharacterWithCampaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadCharacters() {
      const { data } = await supabase
        .from('dnd_characters')
        .select(`
          *,
          campaign:dnd_campaigns(*)
        `)
        .order('name')

      if (data) {
        setCharacters(data as CharacterWithCampaign[])
      }
      setLoading(false)
    }
    loadCharacters()
  }, [])

  async function handleLogout() {
    await fetch('/api/player-auth', { method: 'DELETE' })
    router.push('/player/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--cream)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <GameIcon name="d20" category="ui" size={40} className="text-[var(--teal)] animate-pulse" />
          <span className="text-[var(--ink-light)]">Caricamento personaggi...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--cream)]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[var(--paper)] border-b-2 border-[var(--border-decorative)] px-4 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GameIcon name="crown" category="ui" size={32} className="text-[var(--teal)]" />
            <div>
              <h1 className="text-2xl font-display font-bold text-[var(--ink)]">DM Dashboard</h1>
              <p className="text-sm text-[var(--ink-light)]">Seleziona un personaggio da visualizzare</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-[var(--ink-light)] hover:text-[var(--coral)] text-sm transition-colors min-h-[44px] px-3"
          >
            Esci
          </button>
        </div>
      </header>

      {/* Character Grid */}
      <main className="max-w-7xl mx-auto p-4">
        {characters.length === 0 ? (
          <div className="text-center py-12">
            <GameIcon name="masks" category="ui" size={48} className="text-[var(--ink-faded)] mx-auto mb-3" />
            <p className="text-[var(--ink-light)]">Nessun personaggio trovato</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {characters.map((character) => {
              const classIconName = CLASS_ICONS[character.class?.toLowerCase() || ''] || 'masks'
              const hpPercentage = (character.current_hp ?? 10) / (character.max_hp ?? 10)
              const hpColor = hpPercentage <= 0.25
                ? 'text-[var(--coral)]'
                : hpPercentage <= 0.5
                  ? 'text-[var(--health-mid)]'
                  : 'text-[var(--teal)]'

              return (
                <Link
                  key={character.id}
                  href={`/player/dashboard?preview=${character.id}&campaignId=${character.campaign_id || ''}`}
                  className="parchment-card p-4 hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {/* Avatar & Name */}
                  <div className="flex items-center gap-3 mb-3">
                    {character.avatar_url ? (
                      <img
                        src={character.avatar_url}
                        alt={character.name}
                        className="w-14 h-14 rounded-full object-cover border-2 border-[var(--teal)] flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-[var(--cream-dark)] flex items-center justify-center border-2 border-[var(--border-decorative)] flex-shrink-0">
                        <GameIcon name={classIconName} category="classes" size={28} className="text-[var(--teal)]" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-bold text-[var(--ink)] truncate">{character.name}</h3>
                      <p className="text-xs text-[var(--ink-light)] flex items-center gap-1">
                        <GameIcon name={classIconName} category="classes" size={10} className="text-[var(--teal)]" />
                        {character.race} {character.class}
                      </p>
                    </div>
                  </div>

                  {/* Campaign Badge */}
                  {character.campaign && (
                    <div className="mb-3 text-xs text-[var(--ink-faded)] bg-[var(--cream-dark)] px-2 py-1 rounded">
                      📜 {character.campaign.name}
                    </div>
                  )}

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {/* HP */}
                    <div className="bg-[var(--cream-dark)] rounded p-2">
                      <Heart size={14} className={`${hpColor} mx-auto mb-1`} />
                      <div className="text-xs text-[var(--ink-faded)]">HP</div>
                      <div className={`text-sm font-bold ${hpColor}`}>
                        {character.current_hp}/{character.max_hp}
                      </div>
                    </div>

                    {/* Level */}
                    <div className="bg-[var(--cream-dark)] rounded p-2">
                      <GameIcon name="d20" category="ui" size={14} className="text-[var(--teal)] mx-auto mb-1" />
                      <div className="text-xs text-[var(--ink-faded)]">Lv</div>
                      <div className="text-sm font-bold text-[var(--ink)]">{character.level}</div>
                    </div>

                    {/* AC */}
                    <div className="bg-[var(--cream-dark)] rounded p-2">
                      <Shield size={14} className="text-[var(--teal)] mx-auto mb-1" />
                      <div className="text-xs text-[var(--ink-faded)]">AC</div>
                      <div className="text-sm font-bold text-[var(--ink)]">{character.armor_class}</div>
                    </div>
                  </div>

                  {/* Conditions */}
                  {character.conditions && character.conditions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {character.conditions.slice(0, 3).map((condition) => (
                        <span
                          key={condition}
                          className="px-2 py-0.5 bg-[var(--coral)]/10 text-[var(--coral)] rounded text-xs"
                        >
                          {condition}
                        </span>
                      ))}
                      {character.conditions.length > 3 && (
                        <span className="px-2 py-0.5 bg-[var(--ink-faded)]/10 text-[var(--ink-faded)] rounded text-xs">
                          +{character.conditions.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
