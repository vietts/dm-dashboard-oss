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
import CharacterBackground from '@/components/player/CharacterBackground'
import ActionsPanel from '@/components/player/ActionsPanel'
import SkillsPanel from '@/components/player/SkillsPanel'
import FeaturesPanel from '@/components/player/FeaturesPanel'
import { GameIcon } from '@/components/icons/GameIcon'
import { ArrowLeft } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { getAbilityColor, getAbilityScoresInOrder, type AbilityScore } from '@/lib/ability-colors'
import { getClassMechanics, getSpellcastingAbility, isSpellcaster } from '@/lib/class-mechanics'
import { SKILLS } from '@/lib/skills'
import { calculateProficiencyBonus } from '@/lib/skills'
import FormulaBreakdown from '@/components/player/educational/FormulaBreakdown'
import ClassInfoTooltip from '@/components/player/educational/ClassInfoTooltip'

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

  // Active tab (used for both mobile and desktop)
  const [activeTab, setActiveTab] = useState<string>('stats')

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

  // Calculate ability modifier
  function getModifier(score: number): string {
    const mod = Math.floor((score - 10) / 2)
    return mod >= 0 ? `+${mod}` : `${mod}`
  }

  function getModifierValue(score: number): number {
    return Math.floor((score - 10) / 2)
  }

  // Get ability score value for character
  function getAbilityScore(ability: AbilityScore): number {
    const abilityMap: Record<AbilityScore, number | null> = {
      STR: character!.str,
      DEX: character!.dex,
      CON: character!.con,
      INT: character!.int,
      WIS: character!.wis,
      CHA: character!.cha,
    }
    return abilityMap[ability] ?? 10 // Default to 10 if null
  }

  const abilities = getAbilityScoresInOrder().map((ability) => {
    const score = getAbilityScore(ability)
    const color = getAbilityColor(ability)
    return { ability, score, color, modifier: getModifierValue(score) }
  })

  // Get skills for each ability
  function getSkillsForAbility(ability: AbilityScore): string[] {
    return SKILLS.filter((skill) => skill.ability === ability).map((skill) => skill.name)
  }

  // Get spell stats for tooltips
  const proficiencyBonus = calculateProficiencyBonus(character.level ?? 1)
  const spellcastingAbility = character.class ? getSpellcastingAbility(character.class) : null
  const spellcastingScore = spellcastingAbility ? getAbilityScore(spellcastingAbility) : 0
  const spellcastingMod = getModifierValue(spellcastingScore)
  const spellAttackBonus = spellcastingMod + proficiencyBonus

  return (
    <div className="min-h-screen bg-[var(--cream)]">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-[var(--paper)] border-b-2 border-[var(--border-decorative)] px-4 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            href={`/campaigns/${campaignId}?tab=party`}
            className="p-2 -ml-2 rounded-lg hover:bg-[var(--cream-dark)] transition-colors"
            title="Torna alla campagna"
          >
            <ArrowLeft size={20} className="text-[var(--ink-light)]" />
          </Link>
          <div className="text-center flex-1">
            <h1 className="text-lg font-display font-bold text-[var(--ink)]">{character.name}</h1>
            <p className="text-xs text-[var(--ink-light)]">
              {campaign?.name || 'Campagna'} • <span className="text-[var(--teal)]">Preview DM</span>
            </p>
          </div>
          <div className="text-xs text-[var(--ink-faded)] bg-[var(--teal)]/10 px-2 py-1 rounded">
            DM View
          </div>
        </div>
      </header>

      {/* Main Content with Tabs */}
      <main className="max-w-7xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Tab Navigation */}
          <div className="sticky top-[72px] z-40 bg-[var(--paper)] border-b border-[var(--border-decorative)] overflow-x-auto scrollbar-hide">
            <TabsList className="inline-flex flex-nowrap justify-start h-auto p-0 bg-transparent rounded-none border-b-0 min-w-full w-auto px-4 gap-1">
              <TabsTrigger
                value="stats"
                className="min-h-[44px] rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--teal)] data-[state=active]:bg-transparent data-[state=active]:text-[var(--teal)] px-3 sm:px-4 text-sm sm:text-base whitespace-nowrap flex-shrink-0"
              >
                Statistiche
              </TabsTrigger>
              <TabsTrigger
                value="actions"
                className="min-h-[44px] rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--teal)] data-[state=active]:bg-transparent data-[state=active]:text-[var(--teal)] px-3 sm:px-4 text-sm sm:text-base whitespace-nowrap flex-shrink-0"
              >
                Azioni
              </TabsTrigger>
              <TabsTrigger
                value="spells"
                className="min-h-[44px] rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--teal)] data-[state=active]:bg-transparent data-[state=active]:text-[var(--teal)] px-3 sm:px-4 text-sm sm:text-base whitespace-nowrap flex-shrink-0"
              >
                Incantesimi
              </TabsTrigger>
              <TabsTrigger
                value="inventory"
                className="min-h-[44px] rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--teal)] data-[state=active]:bg-transparent data-[state=active]:text-[var(--teal)] px-3 sm:px-4 text-sm sm:text-base whitespace-nowrap flex-shrink-0"
              >
                Inventario
              </TabsTrigger>
              <TabsTrigger
                value="features"
                className="min-h-[44px] rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--teal)] data-[state=active]:bg-transparent data-[state=active]:text-[var(--teal)] px-3 sm:px-4 text-sm sm:text-base whitespace-nowrap flex-shrink-0"
              >
                Privilegi
              </TabsTrigger>
              <TabsTrigger
                value="notes"
                className="min-h-[44px] rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--teal)] data-[state=active]:bg-transparent data-[state=active]:text-[var(--teal)] px-3 sm:px-4 text-sm sm:text-base whitespace-nowrap flex-shrink-0"
              >
                Note
              </TabsTrigger>
              <TabsTrigger
                value="campaign"
                className="min-h-[44px] rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--teal)] data-[state=active]:bg-transparent data-[state=active]:text-[var(--teal)] px-3 sm:px-4 text-sm sm:text-base whitespace-nowrap flex-shrink-0"
              >
                Campagna
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Content */}
          <div className="p-4">
            {/* Stats Tab */}
            <TabsContent value="stats" className="space-y-4 mt-0">
              {/* Ability Scores Grid */}
              <div className="parchment-card p-4">
                <h3 className="text-lg font-display font-bold text-[var(--ink)] mb-3">Punteggi di Caratteristica</h3>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {abilities.map((abilityData) => (
                    <TooltipProvider key={abilityData.ability}>
                      <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                          <div
                            className={`${abilityData.color.bg} ${abilityData.color.border} border-2 rounded-lg p-3 text-center cursor-help transition-transform hover:scale-105`}
                          >
                            <div className={`text-xs ${abilityData.color.text} font-bold uppercase tracking-wide mb-1`}>
                              {abilityData.color.name}
                            </div>
                            <div className={`text-2xl font-display font-bold ${abilityData.color.text} leading-tight`}>
                              {getModifier(abilityData.score)}
                            </div>
                            <div className="text-sm text-[var(--ink)] mt-1">({abilityData.score})</div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" align="center">
                          <div className="p-3 min-w-[220px]">
                            <div className="font-semibold text-sm mb-2 text-[var(--cream)]">
                              {abilityData.color.fullName}
                            </div>

                            {/* Formula */}
                            <div className="bg-white/10 p-2 rounded text-xs font-mono mb-3 text-[var(--cream)]">
                              (Punteggio - 10) ÷ 2 = Modificatore
                            </div>

                            {/* Calculation */}
                            <div className="text-xs mb-3 text-[var(--cream)]/80">
                              ({abilityData.score} - 10) ÷ 2 ={' '}
                              <span className="font-bold text-[var(--teal-light)]">
                                {getModifier(abilityData.score)}
                              </span>
                            </div>

                            {/* Related skills */}
                            <div className="pt-3 border-t border-[var(--cream)]/30">
                              <div className="font-semibold text-xs mb-1 text-[var(--cream)]">
                                Abilità {abilityData.color.name}:
                              </div>
                              <div className="space-y-0.5 text-xs text-[var(--cream)]/80">
                                {getSkillsForAbility(abilityData.ability).map((skillName) => (
                                  <div key={skillName}>• {skillName}</div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </div>

              {/* Character Panel (merged identity + resources) */}
              <CharacterPanel character={character} onUpdate={loadData} readOnly />

              {/* Combat Stats */}
              <div className="parchment-card p-4">
                <h3 className="text-lg font-display font-bold text-[var(--ink)] mb-3">Statistiche di Combattimento</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="text-sm">
                    <span className="text-[var(--ink-faded)]">Percezione Passiva</span>
                    <div className="text-xl font-bold text-[var(--ink)]">{character.passive_perception}</div>
                  </div>
                  {character.spell_save_dc && spellcastingAbility && (
                    <TooltipProvider>
                      <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                          <div className="text-sm cursor-help">
                            <span className="text-[var(--ink-faded)]">CD Tiro Salvezza</span>
                            <div className="text-xl font-bold text-[var(--ink)]">{character.spell_save_dc}</div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" align="center">
                          <FormulaBreakdown
                            title="CD Tiro Salvezza Incantesimi"
                            formula="8 + mod. Incantatore + Competenza"
                            breakdown={[
                              { label: 'Base', value: 8 },
                              {
                                label: `Mod. ${getAbilityColor(spellcastingAbility).name}`,
                                value: spellcastingMod,
                                color: getAbilityColor(spellcastingAbility),
                              },
                              { label: 'Competenza', value: proficiencyBonus },
                            ]}
                            total={character.spell_save_dc}
                            characterClass={character.class || ''}
                          />
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  {spellcastingAbility && (
                    <TooltipProvider>
                      <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                          <div className="text-sm cursor-help">
                            <span className="text-[var(--ink-faded)]">Attacco Incantesimi</span>
                            <div className="text-xl font-bold text-[var(--ink)]">
                              {spellAttackBonus >= 0 ? '+' : ''}
                              {spellAttackBonus}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" align="center">
                          <FormulaBreakdown
                            title="Bonus Attacco con Incantesimo"
                            formula="mod. Incantatore + Competenza"
                            breakdown={[
                              {
                                label: `Mod. ${getAbilityColor(spellcastingAbility).name}`,
                                value: spellcastingMod,
                                color: getAbilityColor(spellcastingAbility),
                              },
                              { label: 'Competenza', value: proficiencyBonus },
                            ]}
                            total={spellAttackBonus}
                            characterClass={character.class || ''}
                          />
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>

              {/* Skills */}
              <div className="parchment-card p-4">
                <SkillsPanel character={character} onUpdate={loadData} readOnly />
              </div>

              {/* Quick Guide */}
              <QuickGuide defaultCollapsed characterClass={character?.class ?? undefined} />
            </TabsContent>

            {/* Actions Tab */}
            <TabsContent value="actions" className="space-y-4 mt-0">
              <ActionsPanel character={character} onUpdate={loadData} readOnly />
            </TabsContent>

            {/* Spells Tab */}
            <TabsContent value="spells" className="space-y-4 mt-0">
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
              />
              <SpellSearchWidget defaultCollapsed />
            </TabsContent>

            {/* Inventory Tab */}
            <TabsContent value="inventory" className="space-y-4 mt-0">
              <InventoryManager
                characterId={character.id}
                items={inventory}
                onUpdate={loadData}
              />
            </TabsContent>

            {/* Features Tab */}
            <TabsContent value="features" className="space-y-4 mt-0">
              <FeaturesPanel character={character} readOnly />
              <Glossary />
            </TabsContent>

            {/* Notes Tab */}
            <TabsContent value="notes" className="space-y-4 mt-0">
              {playerId && (
                <CharacterBackground
                  playerId={playerId}
                  initialAnswers={backgroundAnswers}
                  secret={characterSecret}
                  onSecretSave={async () => {}}
                  showSecret={true}
                />
              )}
              <PlayerNotes
                playerId=""
                notes={playerNotes}
                onUpdate={() => {}}
                readOnly
              />
            </TabsContent>

            {/* Campaign Tab */}
            <TabsContent value="campaign" className="space-y-4 mt-0">
              <SessionsList sessions={sessions} />
              <CombatLog encounters={encounters} />
              <RevealedNotes notes={revealedNotes} />
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  )
}
