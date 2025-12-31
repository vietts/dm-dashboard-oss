'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
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

// Components from Player Dashboard
import CharacterSheet from '@/components/player/CharacterSheet'
import ResourceTracker from '@/components/player/ResourceTracker'
import SessionsList from '@/components/player/SessionsList'
import CombatLog from '@/components/player/CombatLog'
import RevealedNotes from '@/components/player/RevealedNotes'
import InventoryManager from '@/components/player/InventoryManager'
import SpellManager from '@/components/player/SpellManager'
import PlayerNotes from '@/components/player/PlayerNotes'
import QuickGuide from '@/components/player/QuickGuide'
import Glossary from '@/components/player/Glossary'
import CharacterBackground from '@/components/player/CharacterBackground'
import { GameIcon } from '@/components/icons/GameIcon'
import { ArrowLeft } from 'lucide-react'

export default function CharacterPreview() {
  const params = useParams()
  const campaignId = params.id as string
  const characterId = params.characterId as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Data states
  const [character, setCharacter] = useState<Character | null>(null)
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [encounters, setEncounters] = useState<(Encounter & { monsters?: string[] })[]>([])
  const [revealedNotes, setRevealedNotes] = useState<StoryNote[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [spells, setSpells] = useState<CharacterSpell[]>([])
  const [playerNotes, setPlayerNotes] = useState<PlayerNote[]>([])
  const [playerId, setPlayerId] = useState<string>('')
  const [backgroundAnswers, setBackgroundAnswers] = useState<BackgroundAnswers>({})
  const [characterSecret, setCharacterSecret] = useState<string | null>(null)

  // Active section for mobile
  const [activeSection, setActiveSection] = useState<string>('character')

  // Load all data
  const loadData = useCallback(async () => {
    if (!characterId || !campaignId) return

    setLoading(true)
    setError(null)

    try {
      // Load character
      const { data: charData, error: charError } = await supabase
        .from('dnd_characters')
        .select('*')
        .eq('id', characterId)
        .single()

      if (charError) throw new Error('Personaggio non trovato')
      if (!charData) throw new Error('Personaggio non trovato')

      // Verify character belongs to this campaign
      if (charData.campaign_id !== campaignId) {
        throw new Error('Personaggio non appartiene a questa campagna')
      }

      setCharacter(charData)

      // Load campaign
      const { data: campData } = await supabase
        .from('dnd_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single()
      if (campData) setCampaign(campData)

      // Load sessions
      const { data: sessData } = await supabase
        .from('dnd_sessions')
        .select('*')
        .eq('campaign_id', campaignId)
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
        .eq('campaign_id', campaignId)
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
        .eq('campaign_id', campaignId)
        .eq('is_revealed', true)
        .order('note_type')
        .order('updated_at', { ascending: false })
      if (notesData) setRevealedNotes(notesData)

      // Load inventory
      const { data: invData } = await supabase
        .from('dnd_inventory')
        .select('*')
        .eq('character_id', characterId)
        .order('sort_order')
        .order('item_name')
      if (invData) setInventory(invData)

      // Load spells
      const { data: spellData } = await supabase
        .from('dnd_character_spells')
        .select('*')
        .eq('character_id', characterId)
        .order('spell_level')
        .order('spell_name')
      if (spellData) setSpells(spellData)

      // Load player notes, background, and secret (get player_id from character's player record)
      const { data: playerRecord } = await supabase
        .from('dnd_players')
        .select('id, background_answers, character_secret')
        .eq('character_id', characterId)
        .single()

      if (playerRecord) {
        setPlayerId(playerRecord.id)
        if (playerRecord.background_answers) {
          setBackgroundAnswers(playerRecord.background_answers as BackgroundAnswers)
        }
        // DM can see the secret
        setCharacterSecret(playerRecord.character_secret as string | null)

        const { data: pNotesData } = await supabase
          .from('dnd_player_notes')
          .select('*')
          .eq('player_id', playerRecord.id)
          .order('updated_at', { ascending: false })
        if (pNotesData) setPlayerNotes(pNotesData)
      }
    } catch (err) {
      console.error('Error loading data:', err)
      setError(err instanceof Error ? err.message : 'Errore nel caricamento')
    } finally {
      setLoading(false)
    }
  }, [characterId, campaignId])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Setup realtime subscriptions
  useEffect(() => {
    if (!characterId || !campaignId) return

    const channel = supabase
      .channel('dm-character-preview')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dnd_characters',
          filter: `id=eq.${characterId}`,
        },
        () => loadData()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dnd_inventory',
          filter: `character_id=eq.${characterId}`,
        },
        () => loadData()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dnd_character_spells',
          filter: `character_id=eq.${characterId}`,
        },
        () => loadData()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [characterId, campaignId, loadData])

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--cream)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <GameIcon name="d20" category="ui" size={40} className="text-[var(--teal)] animate-pulse" />
          <span className="text-[var(--ink-light)]">Caricamento...</span>
        </div>
      </div>
    )
  }

  if (error || !character) {
    return (
      <div className="min-h-screen bg-[var(--cream)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-[var(--coral)] text-lg">{error || 'Personaggio non trovato'}</div>
          <Link
            href={`/campaigns/${campaignId}?tab=party`}
            className="inline-flex items-center gap-2 text-[var(--teal)] hover:underline"
          >
            <ArrowLeft size={16} />
            Torna alla campagna
          </Link>
        </div>
      </div>
    )
  }

  const sections = [
    { id: 'character', icon: 'masks', title: 'Personaggio' },
    { id: 'backstory', icon: 'book', title: 'Storia' },
    { id: 'inventory', icon: 'skull', title: 'Inventario' },
    { id: 'spells', icon: 'wand', title: 'Incantesimi' },
    { id: 'sessions', icon: 'scroll', title: 'Sessioni' },
    { id: 'notes', icon: 'quill', title: 'Note' },
    { id: 'guide', icon: 'd20', title: 'Guida' },
  ]

  return (
    <div className="min-h-screen bg-[var(--cream)]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[var(--paper)] border-b-2 border-[var(--border-decorative)] px-4 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/campaigns/${campaignId}?tab=party`}
              className="p-2 -ml-2 rounded-lg hover:bg-[var(--cream-dark)] transition-colors"
              title="Torna alla campagna"
            >
              <ArrowLeft size={20} className="text-[var(--ink-light)]" />
            </Link>
            <div className="flex items-center gap-3">
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
              <div>
                <h1 className="text-lg font-display font-bold text-[var(--ink)]">{character.name}</h1>
                <p className="text-xs text-[var(--ink-light)]">
                  {campaign?.name || 'Campagna'} • <span className="text-[var(--teal)]">Preview DM</span>
                </p>
              </div>
            </div>
          </div>
          <div className="text-xs text-[var(--ink-faded)] bg-[var(--teal)]/10 px-2 py-1 rounded">
            Modalità sola lettura
          </div>
        </div>

        {/* Mobile Navigation - Quick Nav */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 md:hidden scrollbar-hide">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm whitespace-nowrap min-h-[44px] transition-all ${
                activeSection === s.id
                  ? 'bg-[var(--teal)] text-white shadow-md'
                  : 'bg-[var(--cream-dark)] text-[var(--ink-light)] hover:bg-[var(--ink)]/10'
              }`}
            >
              <GameIcon name={s.icon} category="ui" size={18} className="flex-shrink-0" />
              <span>{s.title}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4">
        {/* Desktop Grid */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Column 1: Character + Background + Guide */}
          <div className="space-y-4">
            <CharacterSheet character={character} />
            <ResourceTracker character={character} />
            {playerId && (
              <CharacterBackground
                playerId={playerId}
                initialAnswers={backgroundAnswers}
                secret={characterSecret}
                onSecretSave={async () => {}}  // DM can't edit, just view
                showSecret={true}  // DM sees the secret content
              />
            )}
            <QuickGuide defaultCollapsed />
          </div>

          {/* Column 2: Actions + Glossary */}
          <div className="space-y-4">
            <InventoryManager
              characterId={character.id}
              items={inventory}
              onUpdate={loadData}
            />
            <SpellManager
              characterId={character.id}
              spells={spells}
              onUpdate={loadData}
            />
            <PlayerNotes
              playerId=""
              notes={playerNotes}
              onUpdate={() => {}}
              readOnly
            />
            <Glossary defaultCollapsed />
          </div>

          {/* Column 3: Campaign */}
          <div className="space-y-4">
            <SessionsList sessions={sessions} />
            <CombatLog encounters={encounters} />
            <RevealedNotes notes={revealedNotes} />
          </div>
        </div>

        {/* Mobile: Show active section only */}
        <div className="md:hidden space-y-4">
          {activeSection === 'character' && (
            <>
              <CharacterSheet character={character} />
              <ResourceTracker character={character} />
            </>
          )}
          {activeSection === 'backstory' && playerId && (
            <CharacterBackground
              playerId={playerId}
              initialAnswers={backgroundAnswers}
              secret={characterSecret}
              onSecretSave={async () => {}}  // DM can't edit, just view
              showSecret={true}  // DM sees the secret content
            />
          )}
          {activeSection === 'inventory' && (
            <InventoryManager
              characterId={character.id}
              items={inventory}
              onUpdate={loadData}
            />
          )}
          {activeSection === 'spells' && (
            <SpellManager
              characterId={character.id}
              spells={spells}
              onUpdate={loadData}
            />
          )}
          {activeSection === 'sessions' && (
            <>
              <SessionsList sessions={sessions} />
              <CombatLog encounters={encounters} />
            </>
          )}
          {activeSection === 'notes' && (
            <>
              <PlayerNotes
                playerId=""
                notes={playerNotes}
                onUpdate={() => {}}
                readOnly
              />
              <RevealedNotes notes={revealedNotes} />
            </>
          )}
          {activeSection === 'guide' && (
            <>
              <QuickGuide />
              <Glossary />
            </>
          )}
        </div>
      </main>
    </div>
  )
}
