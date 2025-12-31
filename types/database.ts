export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// D&D 5e Conditions
export const DND_CONDITIONS = [
  'blinded',
  'charmed',
  'deafened',
  'frightened',
  'grappled',
  'incapacitated',
  'invisible',
  'paralyzed',
  'petrified',
  'poisoned',
  'prone',
  'restrained',
  'stunned',
  'unconscious',
] as const

export type DndCondition = typeof DND_CONDITIONS[number]

// Exhaustion levels (1-6)
export type ExhaustionLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6

export interface Database {
  public: {
    Tables: {
      dnd_campaigns: {
        Row: {
          id: string
          name: string
          description: string | null
          current_act: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          current_act?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          current_act?: number
          created_at?: string
          updated_at?: string
        }
      }
      dnd_characters: {
        Row: {
          id: string
          campaign_id: string | null
          name: string
          player_name: string | null
          class: string | null
          level: number
          race: string | null
          max_hp: number
          current_hp: number
          temp_hp: number
          armor_class: number
          initiative_bonus: number
          speed: number
          passive_perception: number
          spell_save_dc: number | null
          conditions: string[]
          death_save_successes: number
          death_save_failures: number
          is_concentrating: boolean
          concentration_spell: string | null
          notes: string | null
          avatar_url: string | null
          str: number
          dex: number
          con: number
          int: number
          wis: number
          cha: number
          class_resources: Json | null
          // Level-up system fields
          base_str: number
          base_dex: number
          base_con: number
          base_int: number
          base_wis: number
          base_cha: number
          asi_history: Json
          racial_asi_choices: Json | null
          subclass: string | null
          fighting_style: string | null
          eldritch_invocations: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          campaign_id?: string | null
          name: string
          player_name?: string | null
          class?: string | null
          level?: number
          race?: string | null
          max_hp?: number
          current_hp?: number
          temp_hp?: number
          armor_class?: number
          initiative_bonus?: number
          speed?: number
          passive_perception?: number
          spell_save_dc?: number | null
          conditions?: string[]
          death_save_successes?: number
          death_save_failures?: number
          is_concentrating?: boolean
          concentration_spell?: string | null
          notes?: string | null
          avatar_url?: string | null
          str?: number
          dex?: number
          con?: number
          int?: number
          wis?: number
          cha?: number
          class_resources?: Json | null
          // Level-up system fields
          base_str?: number
          base_dex?: number
          base_con?: number
          base_int?: number
          base_wis?: number
          base_cha?: number
          asi_history?: Json
          racial_asi_choices?: Json | null
          subclass?: string | null
          fighting_style?: string | null
          eldritch_invocations?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string | null
          name?: string
          player_name?: string | null
          class?: string | null
          level?: number
          race?: string | null
          max_hp?: number
          current_hp?: number
          temp_hp?: number
          armor_class?: number
          initiative_bonus?: number
          speed?: number
          passive_perception?: number
          spell_save_dc?: number | null
          conditions?: string[]
          death_save_successes?: number
          death_save_failures?: number
          is_concentrating?: boolean
          concentration_spell?: string | null
          notes?: string | null
          avatar_url?: string | null
          str?: number
          dex?: number
          con?: number
          int?: number
          wis?: number
          cha?: number
          class_resources?: Json | null
          // Level-up system fields
          base_str?: number
          base_dex?: number
          base_con?: number
          base_int?: number
          base_wis?: number
          base_cha?: number
          asi_history?: Json
          racial_asi_choices?: Json | null
          subclass?: string | null
          fighting_style?: string | null
          eldritch_invocations?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      dnd_monsters: {
        Row: {
          id: string
          campaign_id: string | null
          name: string
          cr: string | null
          monster_type: string | null
          size: string | null
          max_hp: number | null
          armor_class: number | null
          speed: string | null
          str: number
          dex: number
          con: number
          int: number
          wis: number
          cha: number
          abilities: string | null
          legendary_actions: string | null
          source: string | null
          is_template: boolean
          open5e_slug: string | null
          created_at: string
        }
        Insert: {
          id?: string
          campaign_id?: string | null
          name: string
          cr?: string | null
          monster_type?: string | null
          size?: string | null
          max_hp?: number | null
          armor_class?: number | null
          speed?: string | null
          str?: number
          dex?: number
          con?: number
          int?: number
          wis?: number
          cha?: number
          abilities?: string | null
          legendary_actions?: string | null
          source?: string | null
          is_template?: boolean
          open5e_slug?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string | null
          name?: string
          cr?: string | null
          monster_type?: string | null
          size?: string | null
          max_hp?: number | null
          armor_class?: number | null
          speed?: string | null
          str?: number
          dex?: number
          con?: number
          int?: number
          wis?: number
          cha?: number
          abilities?: string | null
          legendary_actions?: string | null
          source?: string | null
          is_template?: boolean
          open5e_slug?: string | null
          created_at?: string
        }
      }
      dnd_encounters: {
        Row: {
          id: string
          campaign_id: string | null
          act: number
          name: string
          description: string | null
          location: string | null
          difficulty: string | null
          status: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          campaign_id?: string | null
          act?: number
          name: string
          description?: string | null
          location?: string | null
          difficulty?: string | null
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string | null
          act?: number
          name?: string
          description?: string | null
          location?: string | null
          difficulty?: string | null
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      dnd_encounter_monsters: {
        Row: {
          id: string
          encounter_id: string | null
          monster_id: string | null
          instance_name: string | null
          current_hp: number | null
          conditions: string[]
          initiative_roll: number | null
          is_alive: boolean
          notes: string | null
        }
        Insert: {
          id?: string
          encounter_id?: string | null
          monster_id?: string | null
          instance_name?: string | null
          current_hp?: number | null
          conditions?: string[]
          initiative_roll?: number | null
          is_alive?: boolean
          notes?: string | null
        }
        Update: {
          id?: string
          encounter_id?: string | null
          monster_id?: string | null
          instance_name?: string | null
          current_hp?: number | null
          conditions?: string[]
          initiative_roll?: number | null
          is_alive?: boolean
          notes?: string | null
        }
      }
      dnd_story_notes: {
        Row: {
          id: string
          campaign_id: string | null
          act: number | null
          title: string
          content: string | null
          dm_notes: string | null
          note_type: string
          tags: string[]
          is_revealed: boolean
          monster_id: string | null
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          campaign_id?: string | null
          act?: number | null
          title: string
          content?: string | null
          dm_notes?: string | null
          note_type?: string
          tags?: string[]
          is_revealed?: boolean
          monster_id?: string | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string | null
          act?: number | null
          title?: string
          content?: string | null
          dm_notes?: string | null
          note_type?: string
          tags?: string[]
          is_revealed?: boolean
          monster_id?: string | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      dnd_sessions: {
        Row: {
          id: string
          campaign_id: string | null
          act_id: string | null
          session_number: number | null
          play_date: string | null
          summary: string | null
          xp_awarded: number
          created_at: string
        }
        Insert: {
          id?: string
          campaign_id?: string | null
          act_id?: string | null
          session_number?: number | null
          play_date?: string | null
          summary?: string | null
          xp_awarded?: number
          created_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string | null
          act_id?: string | null
          session_number?: number | null
          play_date?: string | null
          summary?: string | null
          xp_awarded?: number
          created_at?: string
        }
      }
      dnd_combat_state: {
        Row: {
          id: string
          encounter_id: string | null
          current_turn: number
          round_number: number
          initiative_order: Json
          is_active: boolean
          started_at: string
          ended_at: string | null
        }
        Insert: {
          id?: string
          encounter_id?: string | null
          current_turn?: number
          round_number?: number
          initiative_order?: Json
          is_active?: boolean
          started_at?: string
          ended_at?: string | null
        }
        Update: {
          id?: string
          encounter_id?: string | null
          current_turn?: number
          round_number?: number
          initiative_order?: Json
          is_active?: boolean
          started_at?: string
          ended_at?: string | null
        }
      }
      // Open5e Cache Tables
      open5e_spells: {
        Row: {
          id: string
          slug: string
          name: string
          level_int: number | null
          school: string | null
          casting_time: string | null
          range: string | null
          duration: string | null
          components: string | null
          requires_concentration: boolean
          description: string | null
          higher_level: string | null
          dnd_class: string | null
          document_title: string | null
          raw_data: Json | null
          cached_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          level_int?: number | null
          school?: string | null
          casting_time?: string | null
          range?: string | null
          duration?: string | null
          components?: string | null
          requires_concentration?: boolean
          description?: string | null
          higher_level?: string | null
          dnd_class?: string | null
          document_title?: string | null
          raw_data?: Json | null
          cached_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          level_int?: number | null
          school?: string | null
          casting_time?: string | null
          range?: string | null
          duration?: string | null
          components?: string | null
          requires_concentration?: boolean
          description?: string | null
          higher_level?: string | null
          dnd_class?: string | null
          document_title?: string | null
          raw_data?: Json | null
          cached_at?: string
        }
      }
      open5e_races: {
        Row: {
          id: string
          slug: string
          name: string
          size_raw: string | null
          speed: Json | null
          asi_desc: string | null
          traits: string | null
          languages: string | null
          document_title: string | null
          raw_data: Json | null
          cached_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          size_raw?: string | null
          speed?: Json | null
          asi_desc?: string | null
          traits?: string | null
          languages?: string | null
          document_title?: string | null
          raw_data?: Json | null
          cached_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          size_raw?: string | null
          speed?: Json | null
          asi_desc?: string | null
          traits?: string | null
          languages?: string | null
          document_title?: string | null
          raw_data?: Json | null
          cached_at?: string
        }
      }
      open5e_classes: {
        Row: {
          id: string
          slug: string
          name: string
          hit_dice: string | null
          hp_at_1st_level: string | null
          prof_armor: string | null
          prof_weapons: string | null
          prof_saving_throws: string | null
          spellcasting_ability: string | null
          archetypes: Json | null
          document_title: string | null
          raw_data: Json | null
          cached_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          hit_dice?: string | null
          hp_at_1st_level?: string | null
          prof_armor?: string | null
          prof_weapons?: string | null
          prof_saving_throws?: string | null
          spellcasting_ability?: string | null
          archetypes?: Json | null
          document_title?: string | null
          raw_data?: Json | null
          cached_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          hit_dice?: string | null
          hp_at_1st_level?: string | null
          prof_armor?: string | null
          prof_weapons?: string | null
          prof_saving_throws?: string | null
          spellcasting_ability?: string | null
          archetypes?: Json | null
          document_title?: string | null
          raw_data?: Json | null
          cached_at?: string
        }
      }
      dnd_acts: {
        Row: {
          id: string
          campaign_id: string
          act_number: number
          title: string
          description: string | null
          theme: string | null
          objectives: string[]
          is_complete: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          act_number: number
          title: string
          description?: string | null
          theme?: string | null
          objectives?: string[]
          is_complete?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          act_number?: number
          title?: string
          description?: string | null
          theme?: string | null
          objectives?: string[]
          is_complete?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      dnd_character_spells: {
        Row: {
          id: string
          character_id: string
          spell_slug: string
          spell_name: string
          spell_level: number
          notes: string | null
          is_prepared: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          character_id: string
          spell_slug: string
          spell_name: string
          spell_level: number
          notes?: string | null
          is_prepared?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          character_id?: string
          spell_slug?: string
          spell_name?: string
          spell_level?: number
          notes?: string | null
          is_prepared?: boolean
          sort_order?: number
          created_at?: string
        }
      }
      // ============================================
      // Player Dashboard Tables
      // ============================================
      dnd_players: {
        Row: {
          id: string
          character_id: string
          access_code: string
          player_name: string
          last_login: string | null
          background_answers: BackgroundAnswers
          character_secret: string | null  // Sealed secret visible only to DM
          created_at: string
        }
        Insert: {
          id?: string
          character_id: string
          access_code: string
          player_name: string
          last_login?: string | null
          background_answers?: BackgroundAnswers
          character_secret?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          character_id?: string
          access_code?: string
          player_name?: string
          last_login?: string | null
          background_answers?: BackgroundAnswers
          character_secret?: string | null
          created_at?: string
        }
      }
      dnd_player_notes: {
        Row: {
          id: string
          player_id: string
          title: string | null
          content: string | null
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          player_id: string
          title?: string | null
          content?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          player_id?: string
          title?: string | null
          content?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      dnd_inventory: {
        Row: {
          id: string
          character_id: string
          item_name: string
          quantity: number
          weight: number | null
          notes: string | null
          is_equipped: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          character_id: string
          item_name: string
          quantity?: number
          weight?: number | null
          notes?: string | null
          is_equipped?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          character_id?: string
          item_name?: string
          quantity?: number
          weight?: number | null
          notes?: string | null
          is_equipped?: boolean
          sort_order?: number
          created_at?: string
        }
      }
      // ============================================
      // Narrative Branching System Tables
      // ============================================
      dnd_narrative_nodes: {
        Row: {
          id: string
          act_id: string
          title: string
          description: string | null
          position_x: number
          position_y: number
          is_root: boolean
          is_current: boolean
          was_visited: boolean
          visited_at: string | null
          session_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          act_id: string
          title: string
          description?: string | null
          position_x?: number
          position_y?: number
          is_root?: boolean
          is_current?: boolean
          was_visited?: boolean
          visited_at?: string | null
          session_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          act_id?: string
          title?: string
          description?: string | null
          position_x?: number
          position_y?: number
          is_root?: boolean
          is_current?: boolean
          was_visited?: boolean
          visited_at?: string | null
          session_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      dnd_narrative_edges: {
        Row: {
          id: string
          from_node_id: string
          to_node_id: string
          label: string | null
          was_taken: boolean
          taken_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          from_node_id: string
          to_node_id: string
          label?: string | null
          was_taken?: boolean
          taken_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          from_node_id?: string
          to_node_id?: string
          label?: string | null
          was_taken?: boolean
          taken_at?: string | null
          created_at?: string
        }
      }
      dnd_narrative_node_links: {
        Row: {
          id: string
          node_id: string
          link_type: 'note' | 'encounter' | 'monster'
          link_id: string
          created_at: string
        }
        Insert: {
          id?: string
          node_id: string
          link_type: 'note' | 'encounter' | 'monster'
          link_id: string
          created_at?: string
        }
        Update: {
          id?: string
          node_id?: string
          link_type?: 'note' | 'encounter' | 'monster'
          link_id?: string
          created_at?: string
        }
      }
    }
  }
}

// Helper types
export type Campaign = Database['public']['Tables']['dnd_campaigns']['Row']
export type Character = Database['public']['Tables']['dnd_characters']['Row']
export type Monster = Database['public']['Tables']['dnd_monsters']['Row']
export type Encounter = Database['public']['Tables']['dnd_encounters']['Row']
export type EncounterMonster = Database['public']['Tables']['dnd_encounter_monsters']['Row']
export type StoryNote = Database['public']['Tables']['dnd_story_notes']['Row']
export type Session = Database['public']['Tables']['dnd_sessions']['Row']
export type CombatState = Database['public']['Tables']['dnd_combat_state']['Row']
export type Act = Database['public']['Tables']['dnd_acts']['Row']

// Insert types
export type CampaignInsert = Database['public']['Tables']['dnd_campaigns']['Insert']
export type CharacterInsert = Database['public']['Tables']['dnd_characters']['Insert']
export type MonsterInsert = Database['public']['Tables']['dnd_monsters']['Insert']

// Initiative order item
export interface InitiativeItem {
  type: 'character' | 'monster'
  id: string
  name: string
  initiative: number
  current_hp?: number
  max_hp?: number
  conditions?: string[]
}

// Open5e Cache helper types
export type CachedSpell = Database['public']['Tables']['open5e_spells']['Row']
export type CachedRace = Database['public']['Tables']['open5e_races']['Row']
export type CachedClass = Database['public']['Tables']['open5e_classes']['Row']

// Character Spells helper type
export type CharacterSpell = Database['public']['Tables']['dnd_character_spells']['Row']
export type CharacterSpellInsert = Database['public']['Tables']['dnd_character_spells']['Insert']

// StoryNote with monster info (for NPC with combat stats)
export interface StoryNoteWithMonster extends StoryNote {
  monster?: Monster | null
}

// Class Resource for tracking Rage, Ki, Channel Divinity, etc.
export interface ClassResource {
  id: string           // 'rage', 'ki', 'channel_divinity', 'wild_shape', etc.
  name: string         // Display name: 'Rage', 'Ki Points', etc.
  max: number          // Maximum uses (0 for passive abilities)
  current: number      // Current uses remaining (0 for passive abilities)
  recharge: 'short' | 'long' | 'passive'  // When it recharges ('passive' = always available)
  class: string        // Originating class
  description?: string // Optional description (e.g., "HP pool" for Lay on Hands)
}

// ============================================
// Level-Up System Types
// ============================================

// Ability score names
export type AbilityName = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'

// Base ability scores object
export interface AbilityScores {
  str: number
  dex: number
  con: number
  int: number
  wis: number
  cha: number
}

// ASI (Ability Score Improvement) choice
export interface ASIChoice {
  ability: AbilityName
  bonus: number  // +1 or +2
}

// Entry in ASI history (tracked for each level-up with ASI)
export interface ASIHistoryEntry {
  level: number
  type: 'asi' | 'feat'
  choices: ASIChoice[]
  timestamp: string  // ISO date string
}

// Racial ASI choice (for races like Half-Elf)
export interface RacialASIChoice {
  ability: AbilityName
  bonus: number
}

// Data passed to level-up function
export interface LevelUpData {
  newLevel: number
  hpRoll: number        // DM enters hit die roll result
  conModifier: number   // Auto-calculated CON modifier
  totalHPGain: number   // hpRoll + conModifier (minimum 1)
  hasASI: boolean
  asiChoices?: ASIChoice[]
}

// ============================================
// Narrative Branching System Types
// ============================================
export type NarrativeNode = Database['public']['Tables']['dnd_narrative_nodes']['Row']
export type NarrativeNodeInsert = Database['public']['Tables']['dnd_narrative_nodes']['Insert']
export type NarrativeNodeUpdate = Database['public']['Tables']['dnd_narrative_nodes']['Update']

export type NarrativeEdge = Database['public']['Tables']['dnd_narrative_edges']['Row']
export type NarrativeEdgeInsert = Database['public']['Tables']['dnd_narrative_edges']['Insert']
export type NarrativeEdgeUpdate = Database['public']['Tables']['dnd_narrative_edges']['Update']

export type NarrativeNodeLink = Database['public']['Tables']['dnd_narrative_node_links']['Row']
export type NarrativeNodeLinkInsert = Database['public']['Tables']['dnd_narrative_node_links']['Insert']

// Extended node with resolved relationships (for UI)
export interface NarrativeNodeWithRelations extends NarrativeNode {
  outgoing_edges: NarrativeEdge[]
  incoming_edges: NarrativeEdge[]
  linked_notes: StoryNote[]
  linked_encounters: Encounter[]
  linked_monsters: Monster[]
  children: NarrativeNodeWithRelations[]
}

// Full tree structure for visualization
export interface NarrativeTree {
  nodes: NarrativeNode[]
  edges: NarrativeEdge[]
  links: NarrativeNodeLink[]
  root_node: NarrativeNode | null
  current_node: NarrativeNode | null
  visited_path: string[] // Ordered list of visited node IDs
}

// ============================================
// Player Dashboard Types
// ============================================

// Background answers for character backstory
export interface BackgroundAnswers {
  origins?: string      // Da dove vieni? Qual è la tua famiglia/comunità?
  motivation?: string   // Perché sei diventato un avventuriero? Cosa cerchi?
  fear?: string         // Qual è la tua più grande paura o difetto?
  bonds?: string        // Chi è importante per te? Chi proteggeresti a ogni costo?
  trait?: string        // Come ti comporti in situazioni di stress/pericolo?
}

export type Player = Database['public']['Tables']['dnd_players']['Row']
export type PlayerInsert = Database['public']['Tables']['dnd_players']['Insert']
export type PlayerUpdate = Database['public']['Tables']['dnd_players']['Update']

export type PlayerNote = Database['public']['Tables']['dnd_player_notes']['Row']
export type PlayerNoteInsert = Database['public']['Tables']['dnd_player_notes']['Insert']
export type PlayerNoteUpdate = Database['public']['Tables']['dnd_player_notes']['Update']

export type InventoryItem = Database['public']['Tables']['dnd_inventory']['Row']
export type InventoryItemInsert = Database['public']['Tables']['dnd_inventory']['Insert']
export type InventoryItemUpdate = Database['public']['Tables']['dnd_inventory']['Update']

// Player dashboard aggregated data
export interface PlayerDashboardData {
  player: Player
  character: Character
  campaign: Campaign
  sessions: Session[]
  encounters: Encounter[]
  revealedNotes: StoryNote[]
  inventory: InventoryItem[]
  spells: CharacterSpell[]
  playerNotes: PlayerNote[]
}
