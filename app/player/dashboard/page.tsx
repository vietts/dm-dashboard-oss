'use client'

import { Suspense, useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type {
  Character,
  Campaign,
  Session,
  Encounter,
  StoryNote,
  InventoryItem,
  CharacterSpell,
  PlayerNote,
  BackgroundAnswers,
} from '@/types/database'

// Components
import CharacterPanel from '@/components/player/CharacterPanel'
import SessionsList from '@/components/player/SessionsList'
import CombatLog from '@/components/player/CombatLog'
import RevealedNotes from '@/components/player/RevealedNotes'
import InventoryManager from '@/components/player/InventoryManager'
import SpellManager from '@/components/player/SpellManager'
import PlayerNotes from '@/components/player/PlayerNotes'
import QuickGuide from '@/components/player/QuickGuide'
import Glossary from '@/components/player/Glossary'
import SpellSearchWidget from '@/components/player/SpellSearchWidget'
import AvatarUpload from '@/components/player/AvatarUpload'
import CharacterBackground from '@/components/player/CharacterBackground'
import BottomNavigation, { type NavSection } from '@/components/player/BottomNavigation'
import DMCharacterSelector from '@/components/player/DMCharacterSelector'
import SkillsPanel from '@/components/player/SkillsPanel'
import ActionsPanel from '@/components/player/ActionsPanel'
import { GameIcon } from '@/components/icons/GameIcon'

interface PlayerAuth {
  playerId?: string
  characterId?: string
  campaignId?: string
  playerName: string
  isDM?: boolean
}

function PlayerDashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [playerAuth, setPlayerAuth] = useState<PlayerAuth | null>(null)
  const [isDMPreview, setIsDMPreview] = useState(false)

  // Data states
  const [character, setCharacter] = useState<Character | null>(null)
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [encounters, setEncounters] = useState<(Encounter & { monsters?: string[] })[]>([])
  const [revealedNotes, setRevealedNotes] = useState<StoryNote[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [spells, setSpells] = useState<CharacterSpell[]>([])
  const [playerNotes, setPlayerNotes] = useState<PlayerNote[]>([])
  const [backgroundAnswers, setBackgroundAnswers] = useState<BackgroundAnswers>({})
  const [characterSecret, setCharacterSecret] = useState<string | null>(null)

  // Active section for mobile navigation - Default to 'actions' for quick reference
  const [activeSection, setActiveSection] = useState<NavSection>('actions')

  // Verify auth and load initial data
  useEffect(() => {
    async function init() {
      // Check for DM preview mode via query params
      const previewCharacterId = searchParams.get('preview')
      const previewCampaignId = searchParams.get('campaignId')

      if (previewCharacterId && previewCampaignId) {
        // DM Preview mode - load character data directly
        setIsDMPreview(true)

        // Get player record for this character (if exists)
        const { data: playerRecord } = await supabase
          .from('dnd_players')
          .select('id, player_name')
          .eq('character_id', previewCharacterId)
          .single()

        setPlayerAuth({
          playerId: playerRecord?.id || '',
          characterId: previewCharacterId,
          campaignId: previewCampaignId,
          playerName: playerRecord?.player_name || 'DM Preview',
        })
        return
      }

      // Normal player auth flow
      try {
        const res = await fetch('/api/player-auth')
        if (!res.ok) {
          router.push('/player/login')
          return
        }
        const auth = await res.json()
        setPlayerAuth(auth)
      } catch {
        router.push('/player/login')
      }
    }
    init()
  }, [router, searchParams])

  // Load all data when auth is ready
  const loadData = useCallback(async () => {
    if (!playerAuth) return

    setLoading(true)
    try {
      // Load character
      const { data: charData } = await supabase
        .from('dnd_characters')
        .select('*')
        .eq('id', playerAuth.characterId)
        .single()
      if (charData) setCharacter(charData)

      // Load campaign
      if (playerAuth.campaignId) {
        const { data: campData } = await supabase
          .from('dnd_campaigns')
          .select('*')
          .eq('id', playerAuth.campaignId)
          .single()
        if (campData) setCampaign(campData)

        // Load sessions
        const { data: sessData } = await supabase
          .from('dnd_sessions')
          .select('*')
          .eq('campaign_id', playerAuth.campaignId)
          .order('play_date', { ascending: false })
        if (sessData) setSessions(sessData)

        // Load completed encounters with monsters
        const { data: encData } = await supabase
          .from('dnd_encounters')
          .select(`
            *,
            dnd_encounter_monsters (
              dnd_monsters ( name )
            )
          `)
          .eq('campaign_id', playerAuth.campaignId)
          .eq('status', 'completed')
          .order('updated_at', { ascending: false })

        if (encData) {
          const encountersWithMonsters = encData.map((enc) => ({
            ...enc,
            monsters: enc.dnd_encounter_monsters
              ?.map((em: { dnd_monsters: { name: string } | null }) => em.dnd_monsters?.name)
              .filter(Boolean) || [],
          }))
          setEncounters(encountersWithMonsters)
        }

        // Load revealed notes
        const { data: notesData } = await supabase
          .from('dnd_story_notes')
          .select('*')
          .eq('campaign_id', playerAuth.campaignId)
          .eq('is_revealed', true)
          .order('note_type')
          .order('updated_at', { ascending: false })
        if (notesData) setRevealedNotes(notesData)
      }

      // Load inventory
      const { data: invData } = await supabase
        .from('dnd_inventory')
        .select('*')
        .eq('character_id', playerAuth.characterId)
        .order('sort_order')
        .order('item_name')
      if (invData) setInventory(invData)

      // Load spells
      const { data: spellData } = await supabase
        .from('dnd_character_spells')
        .select('*')
        .eq('character_id', playerAuth.characterId)
        .order('spell_level')
        .order('spell_name')
      if (spellData) setSpells(spellData)

      // Load player notes
      const { data: pNotesData } = await supabase
        .from('dnd_player_notes')
        .select('*')
        .eq('player_id', playerAuth.playerId!)
        .order('updated_at', { ascending: false })
      if (pNotesData) setPlayerNotes(pNotesData)

      // Load background answers and secret
      const { data: playerData } = await supabase
        .from('dnd_players')
        .select('background_answers, character_secret')
        .eq('id', playerAuth.playerId!)
        .single()
      if (playerData) {
        if (playerData.background_answers) {
          setBackgroundAnswers(playerData.background_answers as BackgroundAnswers)
        }
        // Note: We set the secret but player won't see its content (only sealed status)
        setCharacterSecret(playerData.character_secret as string | null)
      }
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }, [playerAuth])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Setup realtime subscriptions
  useEffect(() => {
    if (!playerAuth) return

    const channel = supabase
      .channel('player-dashboard')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dnd_characters',
          filter: `id=eq.${playerAuth.characterId}`,
        },
        () => loadData()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dnd_sessions',
          filter: `campaign_id=eq.${playerAuth.campaignId}`,
        },
        () => loadData()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dnd_story_notes',
          filter: `campaign_id=eq.${playerAuth.campaignId}`,
        },
        () => loadData()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [playerAuth, loadData])

  // Logout handler
  async function handleLogout() {
    await fetch('/api/player-auth', { method: 'DELETE' })
    router.push('/player/login')
  }

  // Secret save handler (sealed - one time only)
  async function handleSecretSave(secret: string) {
    const res = await fetch('/api/player-secret', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId: playerAuth?.playerId,
        secret
      })
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Failed to save secret')
    }

    // Update local state to show sealed status
    setCharacterSecret(secret)
  }

  // Show DM character selector if user is DM (not in preview mode)
  if (playerAuth?.isDM && !isDMPreview) {
    return <DMCharacterSelector />
  }

  if (!playerAuth || loading) {
    return (
      <div className="min-h-screen bg-[var(--cream)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <GameIcon name="d20" category="ui" size={40} className="text-[var(--teal)] animate-pulse" />
          <span className="text-[var(--ink-light)]">Caricamento...</span>
        </div>
      </div>
    )
  }

  if (!character) {
    return (
      <div className="min-h-screen bg-[var(--cream)] flex items-center justify-center">
        <div className="text-[var(--coral)]">Errore: personaggio non trovato</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--cream)]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[var(--paper)] border-b-2 border-[var(--border-decorative)] px-4 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Back button for DM preview */}
            {isDMPreview && (
              <Link
                href={`/campaigns/${playerAuth.campaignId}?tab=party`}
                className="p-2 -ml-2 rounded-lg hover:bg-[var(--cream-dark)] transition-colors"
                title="Torna alla campagna"
              >
                <ArrowLeft size={20} className="text-[var(--ink-light)]" />
              </Link>
            )}
            {/* Avatar in header for mobile */}
            <div className="md:hidden">
              {character.avatar_url ? (
                <img
                  src={character.avatar_url}
                  alt={character.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-[var(--teal)]"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[var(--teal)]/20 flex items-center justify-center">
                  <GameIcon name="masks" category="ui" size={20} className="text-[var(--teal)]" />
                </div>
              )}
            </div>
            {!isDMPreview && (
              <div className="hidden md:block">
                <GameIcon name="masks" category="ui" size={28} className="text-[var(--teal)]" />
              </div>
            )}
            <div>
              <h1 className="text-lg font-display font-bold text-[var(--ink)]">{character.name}</h1>
              <p className="text-xs text-[var(--ink-light)]">
                {campaign?.name || 'Campagna'}
                {isDMPreview && <span className="text-[var(--teal)]"> • Preview DM</span>}
              </p>
            </div>
          </div>
          {isDMPreview ? (
            <div className="text-xs text-[var(--ink-faded)] bg-[var(--teal)]/10 px-2 py-1 rounded">
              Sola lettura
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="text-[var(--ink-light)] hover:text-[var(--coral)] text-sm transition-colors min-h-[44px] px-3"
            >
              Esci
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4">
        {/* Desktop: Fluid modular layout */}
        <div className="hidden md:block space-y-4">
          {/* Row 1: Character Panel (merged identity + resources) */}
          <CharacterPanel character={character} onUpdate={loadData} readOnly={isDMPreview} />

          {/* Row 2: Skills */}
          <SkillsPanel
            character={character}
            onUpdate={loadData}
            readOnly={isDMPreview}
          />

          {/* Row 3: Spells (full width) */}
          <SpellManager
            characterId={character.id}
            characterClass={character.class || ''}
            characterLevel={character.level || 1}
            stats={{
              int: character.int || 10,
              wis: character.wis || 10,
              cha: character.cha || 10
            }}
            spells={spells}
            onUpdate={loadData}
            readOnly={isDMPreview}
          />

          {/* Row 4: Actions Panel (full width) */}
          <ActionsPanel
            character={character}
            onUpdate={loadData}
            readOnly={isDMPreview}
          />

          {/* Row 5: Inventory + Player Notes (side by side) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <InventoryManager
              characterId={character.id}
              items={inventory}
              onUpdate={loadData}
            />
            <PlayerNotes
              playerId={playerAuth.playerId!}
              notes={playerNotes}
              onUpdate={loadData}
            />
          </div>

          {/* Row 6: Sessions | Combat + Revealed Notes (side by side) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SessionsList sessions={sessions} />
            <div className="space-y-4">
              <CombatLog encounters={encounters} />
              <RevealedNotes notes={revealedNotes} />
            </div>
          </div>

          {/* Row 7: Character Background (collapsible) */}
          <CharacterBackground
            playerId={playerAuth.playerId!}
            initialAnswers={backgroundAnswers}
            secret={characterSecret}
            onSecretSave={handleSecretSave}
            showSecret={isDMPreview}
            defaultCollapsed
          />

          {/* Row 8: Avatar + Guide + Glossary (collapsible) */}
          <div
            className={`grid grid-cols-1 gap-4 ${
              isDMPreview ? 'lg:grid-cols-2' : 'lg:grid-cols-3'
            }`}
          >
            {/* Avatar Upload - only if not DM preview */}
            {!isDMPreview && (
              <div>
                <AvatarUpload
                  characterId={character.id}
                  currentUrl={character.avatar_url}
                  characterName={character.name}
                  onUpdate={loadData}
                />
              </div>
            )}

            <QuickGuide defaultCollapsed characterClass={character?.class ?? undefined} />
            <Glossary defaultCollapsed />
          </div>

          {/* Row 9: Spell Search (full width) */}
          <SpellSearchWidget defaultCollapsed />
        </div>

        {/* Mobile: Section-based view with Bottom Navigation */}
        <div className="md:hidden space-y-4">
          {/* Section: Personaggio (character panel + skills + background) */}
          {activeSection === 'character' && (
            <>
              {/* Avatar upload on mobile - hidden in DM preview */}
              {!isDMPreview && (
                <div className="parchment-card p-4 mb-4">
                  <AvatarUpload
                    characterId={character.id}
                    currentUrl={character.avatar_url}
                    characterName={character.name}
                    onUpdate={loadData}
                  />
                </div>
              )}
              <CharacterPanel character={character} onUpdate={loadData} readOnly={isDMPreview} />

              {/* Skills Panel */}
              <SkillsPanel
                character={character}
                onUpdate={loadData}
                readOnly={isDMPreview}
              />

              <CharacterBackground
                playerId={playerAuth.playerId!}
                initialAnswers={backgroundAnswers}
                secret={characterSecret}
                onSecretSave={handleSecretSave}
                showSecret={isDMPreview}
                defaultCollapsed
              />
            </>
          )}

          {/* Section: Azioni (spells + actions + inventory + notes) */}
          {activeSection === 'actions' && (
            <>
              {/* Spells first for casters */}
              <SpellManager
                characterId={character.id}
                characterClass={character.class || ''}
                characterLevel={character.level || 1}
                stats={{
                  int: character.int || 10,
                  wis: character.wis || 10,
                  cha: character.cha || 10
                }}
                spells={spells}
                onUpdate={loadData}
                readOnly={isDMPreview}
              />

              {/* Class Actions */}
              <ActionsPanel
                character={character}
                onUpdate={loadData}
                readOnly={isDMPreview}
              />

              <InventoryManager
                characterId={character.id}
                items={inventory}
                onUpdate={loadData}
              />

              <PlayerNotes
                playerId={playerAuth.playerId!}
                notes={playerNotes}
                onUpdate={loadData}
              />
            </>
          )}

          {/* Section: Campagna (sessions + combat + revealed notes) */}
          {activeSection === 'campaign' && (
            <>
              <SessionsList sessions={sessions} />
              <CombatLog encounters={encounters} />
              <RevealedNotes notes={revealedNotes} />
            </>
          )}

          {/* Section: Info (guide + glossary + spell search) */}
          {activeSection === 'info' && (
            <>
              <QuickGuide characterClass={character?.class ?? undefined} />
              <Glossary />
              <SpellSearchWidget />
            </>
          )}
        </div>
      </main>

      {/* Bottom Navigation for Mobile */}
      <BottomNavigation
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
    </div>
  )
}

// Wrapper with Suspense for useSearchParams (required by Next.js 13+)
export default function PlayerDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--cream)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <GameIcon name="d20" category="ui" size={40} className="text-[var(--teal)] animate-pulse" />
          <span className="text-[var(--ink-light)]">Caricamento...</span>
        </div>
      </div>
    }>
      <PlayerDashboardContent />
    </Suspense>
  )
}
