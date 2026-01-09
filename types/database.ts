export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      dnd_2024_spells: {
        Row: {
          action_type: string | null
          area_of_effect: string | null
          attack_roll: boolean | null
          cantrip_upgrade: string | null
          classes: string[]
          components: string[] | null
          concentration: boolean | null
          created_at: string | null
          damage: string | null
          description: string | null
          description_it: string | null
          duration: string | null
          higher_level_slot: string | null
          id: string
          level: number
          material: string | null
          name: string
          name_it: string | null
          range: string | null
          ritual: boolean | null
          saving_throw: string | null
          school: string
          slug: string
        }
        Insert: {
          action_type?: string | null
          area_of_effect?: string | null
          attack_roll?: boolean | null
          cantrip_upgrade?: string | null
          classes: string[]
          components?: string[] | null
          concentration?: boolean | null
          created_at?: string | null
          damage?: string | null
          description?: string | null
          description_it?: string | null
          duration?: string | null
          higher_level_slot?: string | null
          id?: string
          level: number
          material?: string | null
          name: string
          name_it?: string | null
          range?: string | null
          ritual?: boolean | null
          saving_throw?: string | null
          school: string
          slug: string
        }
        Update: {
          action_type?: string | null
          area_of_effect?: string | null
          attack_roll?: boolean | null
          cantrip_upgrade?: string | null
          classes?: string[]
          components?: string[] | null
          concentration?: boolean | null
          created_at?: string | null
          damage?: string | null
          description?: string | null
          description_it?: string | null
          duration?: string | null
          higher_level_slot?: string | null
          id?: string
          level?: number
          material?: string | null
          name?: string
          name_it?: string | null
          range?: string | null
          ritual?: boolean | null
          saving_throw?: string | null
          school?: string
          slug?: string
        }
        Relationships: []
      }
      dnd_acts: {
        Row: {
          act_number: number
          campaign_id: string
          created_at: string | null
          description: string | null
          id: string
          is_complete: boolean | null
          objectives: string[] | null
          theme: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          act_number: number
          campaign_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_complete?: boolean | null
          objectives?: string[] | null
          theme?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          act_number?: number
          campaign_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_complete?: boolean | null
          objectives?: string[] | null
          theme?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dnd_acts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "dnd_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      dnd_campaigns: {
        Row: {
          created_at: string | null
          current_act: number | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_act?: number | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_act?: number | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      dnd_character_actions: {
        Row: {
          action_type: string
          attack_type: string | null
          character_id: string
          created_at: string | null
          damage_dice: string | null
          damage_type: string | null
          description: string | null
          hit_bonus: number | null
          id: string
          is_active: boolean | null
          limited_uses: number | null
          name: string
          range_value: string | null
          recharge_on: string | null
          sort_order: number | null
          source: string | null
          updated_at: string | null
          uses_remaining: number | null
        }
        Insert: {
          action_type: string
          attack_type?: string | null
          character_id: string
          created_at?: string | null
          damage_dice?: string | null
          damage_type?: string | null
          description?: string | null
          hit_bonus?: number | null
          id?: string
          is_active?: boolean | null
          limited_uses?: number | null
          name: string
          range_value?: string | null
          recharge_on?: string | null
          sort_order?: number | null
          source?: string | null
          updated_at?: string | null
          uses_remaining?: number | null
        }
        Update: {
          action_type?: string
          attack_type?: string | null
          character_id?: string
          created_at?: string | null
          damage_dice?: string | null
          damage_type?: string | null
          description?: string | null
          hit_bonus?: number | null
          id?: string
          is_active?: boolean | null
          limited_uses?: number | null
          name?: string
          range_value?: string | null
          recharge_on?: string | null
          sort_order?: number | null
          source?: string | null
          updated_at?: string | null
          uses_remaining?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dnd_character_actions_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "dnd_characters"
            referencedColumns: ["id"]
          },
        ]
      }
      dnd_character_spells: {
        Row: {
          canonical_slug: string | null
          character_id: string
          created_at: string | null
          id: string
          is_prepared: boolean | null
          notes: string | null
          sort_order: number | null
          spell_level: number
          spell_name: string
          spell_slug: string
        }
        Insert: {
          canonical_slug?: string | null
          character_id: string
          created_at?: string | null
          id?: string
          is_prepared?: boolean | null
          notes?: string | null
          sort_order?: number | null
          spell_level: number
          spell_name: string
          spell_slug: string
        }
        Update: {
          canonical_slug?: string | null
          character_id?: string
          created_at?: string | null
          id?: string
          is_prepared?: boolean | null
          notes?: string | null
          sort_order?: number | null
          spell_level?: number
          spell_name?: string
          spell_slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "dnd_character_spells_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "dnd_characters"
            referencedColumns: ["id"]
          },
        ]
      }
      dnd_characters: {
        Row: {
          armor_class: number | null
          asi_history: Json | null
          avatar_url: string | null
          base_cha: number | null
          base_con: number | null
          base_dex: number | null
          base_int: number | null
          base_str: number | null
          base_wis: number | null
          campaign_id: string | null
          cha: number | null
          class: string | null
          class_resources: Json | null
          con: number | null
          concentration_spell: string | null
          conditions: string[] | null
          created_at: string | null
          current_hp: number | null
          death_save_failures: number | null
          death_save_successes: number | null
          dex: number | null
          eldritch_invocations: Json | null
          fighting_style: string | null
          id: string
          initiative_bonus: number | null
          inspiration: boolean | null
          int: number | null
          is_concentrating: boolean | null
          level: number | null
          max_hp: number | null
          name: string
          notes: string | null
          passive_perception: number | null
          player_name: string | null
          race: string | null
          racial_asi_choices: Json | null
          skill_proficiencies: Json | null
          speed: number | null
          spell_save_dc: number | null
          str: number | null
          subclass: string | null
          temp_hp: number | null
          updated_at: string | null
          wis: number | null
        }
        Insert: {
          armor_class?: number | null
          asi_history?: Json | null
          avatar_url?: string | null
          base_cha?: number | null
          base_con?: number | null
          base_dex?: number | null
          base_int?: number | null
          base_str?: number | null
          base_wis?: number | null
          campaign_id?: string | null
          cha?: number | null
          class?: string | null
          class_resources?: Json | null
          con?: number | null
          concentration_spell?: string | null
          conditions?: string[] | null
          created_at?: string | null
          current_hp?: number | null
          death_save_failures?: number | null
          death_save_successes?: number | null
          dex?: number | null
          eldritch_invocations?: Json | null
          fighting_style?: string | null
          id?: string
          initiative_bonus?: number | null
          inspiration?: boolean | null
          int?: number | null
          is_concentrating?: boolean | null
          level?: number | null
          max_hp?: number | null
          name: string
          notes?: string | null
          passive_perception?: number | null
          player_name?: string | null
          race?: string | null
          racial_asi_choices?: Json | null
          skill_proficiencies?: Json | null
          speed?: number | null
          spell_save_dc?: number | null
          str?: number | null
          subclass?: string | null
          temp_hp?: number | null
          updated_at?: string | null
          wis?: number | null
        }
        Update: {
          armor_class?: number | null
          asi_history?: Json | null
          avatar_url?: string | null
          base_cha?: number | null
          base_con?: number | null
          base_dex?: number | null
          base_int?: number | null
          base_str?: number | null
          base_wis?: number | null
          campaign_id?: string | null
          cha?: number | null
          class?: string | null
          class_resources?: Json | null
          con?: number | null
          concentration_spell?: string | null
          conditions?: string[] | null
          created_at?: string | null
          current_hp?: number | null
          death_save_failures?: number | null
          death_save_successes?: number | null
          dex?: number | null
          eldritch_invocations?: Json | null
          fighting_style?: string | null
          id?: string
          initiative_bonus?: number | null
          inspiration?: boolean | null
          int?: number | null
          is_concentrating?: boolean | null
          level?: number | null
          max_hp?: number | null
          name?: string
          notes?: string | null
          passive_perception?: number | null
          player_name?: string | null
          race?: string | null
          racial_asi_choices?: Json | null
          skill_proficiencies?: Json | null
          speed?: number | null
          spell_save_dc?: number | null
          str?: number | null
          subclass?: string | null
          temp_hp?: number | null
          updated_at?: string | null
          wis?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dnd_characters_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "dnd_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      dnd_combat_state: {
        Row: {
          current_turn: number | null
          encounter_id: string | null
          ended_at: string | null
          id: string
          initiative_order: Json | null
          is_active: boolean | null
          round_number: number | null
          started_at: string | null
        }
        Insert: {
          current_turn?: number | null
          encounter_id?: string | null
          ended_at?: string | null
          id?: string
          initiative_order?: Json | null
          is_active?: boolean | null
          round_number?: number | null
          started_at?: string | null
        }
        Update: {
          current_turn?: number | null
          encounter_id?: string | null
          ended_at?: string | null
          id?: string
          initiative_order?: Json | null
          is_active?: boolean | null
          round_number?: number | null
          started_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dnd_combat_state_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "dnd_encounters"
            referencedColumns: ["id"]
          },
        ]
      }
      dnd_encounter_monsters: {
        Row: {
          conditions: string[] | null
          current_hp: number | null
          encounter_id: string | null
          id: string
          initiative_roll: number | null
          instance_name: string | null
          is_alive: boolean | null
          monster_id: string | null
          notes: string | null
        }
        Insert: {
          conditions?: string[] | null
          current_hp?: number | null
          encounter_id?: string | null
          id?: string
          initiative_roll?: number | null
          instance_name?: string | null
          is_alive?: boolean | null
          monster_id?: string | null
          notes?: string | null
        }
        Update: {
          conditions?: string[] | null
          current_hp?: number | null
          encounter_id?: string | null
          id?: string
          initiative_roll?: number | null
          instance_name?: string | null
          is_alive?: boolean | null
          monster_id?: string | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dnd_encounter_monsters_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "dnd_encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dnd_encounter_monsters_monster_id_fkey"
            columns: ["monster_id"]
            isOneToOne: false
            referencedRelation: "dnd_monsters"
            referencedColumns: ["id"]
          },
        ]
      }
      dnd_encounters: {
        Row: {
          acts: number[] | null
          campaign_id: string | null
          created_at: string | null
          description: string | null
          difficulty: string | null
          id: string
          location: string | null
          name: string
          notes: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          acts?: number[] | null
          campaign_id?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          id?: string
          location?: string | null
          name: string
          notes?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          acts?: number[] | null
          campaign_id?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          id?: string
          location?: string | null
          name?: string
          notes?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dnd_encounters_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "dnd_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      dnd_inventory: {
        Row: {
          character_id: string
          container: string | null
          created_at: string | null
          id: string
          is_attuned: boolean | null
          is_equipped: boolean | null
          is_magical: boolean | null
          item_name: string
          item_type: string | null
          notes: string | null
          quantity: number | null
          rarity: string | null
          requires_attunement: boolean | null
          sort_order: number | null
          tags: string[] | null
          weight: number | null
        }
        Insert: {
          character_id: string
          container?: string | null
          created_at?: string | null
          id?: string
          is_attuned?: boolean | null
          is_equipped?: boolean | null
          is_magical?: boolean | null
          item_name: string
          item_type?: string | null
          notes?: string | null
          quantity?: number | null
          rarity?: string | null
          requires_attunement?: boolean | null
          sort_order?: number | null
          tags?: string[] | null
          weight?: number | null
        }
        Update: {
          character_id?: string
          container?: string | null
          created_at?: string | null
          id?: string
          is_attuned?: boolean | null
          is_equipped?: boolean | null
          is_magical?: boolean | null
          item_name?: string
          item_type?: string | null
          notes?: string | null
          quantity?: number | null
          rarity?: string | null
          requires_attunement?: boolean | null
          sort_order?: number | null
          tags?: string[] | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dnd_inventory_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "dnd_characters"
            referencedColumns: ["id"]
          },
        ]
      }
      dnd_inventory_containers: {
        Row: {
          capacity_lb: number | null
          character_id: string
          container_name: string
          created_at: string | null
          current_weight_lb: number | null
          id: string
          is_active: boolean | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          capacity_lb?: number | null
          character_id: string
          container_name: string
          created_at?: string | null
          current_weight_lb?: number | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          capacity_lb?: number | null
          character_id?: string
          container_name?: string
          created_at?: string | null
          current_weight_lb?: number | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dnd_inventory_containers_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "dnd_characters"
            referencedColumns: ["id"]
          },
        ]
      }
      dnd_monster_spells: {
        Row: {
          created_at: string | null
          id: string
          monster_id: string
          notes: string | null
          sort_order: number | null
          spell_level: number
          spell_name: string
          spell_slug: string
          uses_per_day: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          monster_id: string
          notes?: string | null
          sort_order?: number | null
          spell_level?: number
          spell_name: string
          spell_slug: string
          uses_per_day?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          monster_id?: string
          notes?: string | null
          sort_order?: number | null
          spell_level?: number
          spell_name?: string
          spell_slug?: string
          uses_per_day?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dnd_monster_spells_monster_id_fkey"
            columns: ["monster_id"]
            isOneToOne: false
            referencedRelation: "dnd_monsters"
            referencedColumns: ["id"]
          },
        ]
      }
      dnd_monsters: {
        Row: {
          abilities: string | null
          armor_class: number | null
          campaign_id: string | null
          cha: number | null
          con: number | null
          cr: string | null
          created_at: string | null
          dex: number | null
          id: string
          image_url: string | null
          int: number | null
          is_template: boolean | null
          legendary_actions: string | null
          max_hp: number | null
          monster_type: string | null
          name: string
          open5e_slug: string | null
          size: string | null
          source: string | null
          speed: string | null
          str: number | null
          wis: number | null
        }
        Insert: {
          abilities?: string | null
          armor_class?: number | null
          campaign_id?: string | null
          cha?: number | null
          con?: number | null
          cr?: string | null
          created_at?: string | null
          dex?: number | null
          id?: string
          image_url?: string | null
          int?: number | null
          is_template?: boolean | null
          legendary_actions?: string | null
          max_hp?: number | null
          monster_type?: string | null
          name: string
          open5e_slug?: string | null
          size?: string | null
          source?: string | null
          speed?: string | null
          str?: number | null
          wis?: number | null
        }
        Update: {
          abilities?: string | null
          armor_class?: number | null
          campaign_id?: string | null
          cha?: number | null
          con?: number | null
          cr?: string | null
          created_at?: string | null
          dex?: number | null
          id?: string
          image_url?: string | null
          int?: number | null
          is_template?: boolean | null
          legendary_actions?: string | null
          max_hp?: number | null
          monster_type?: string | null
          name?: string
          open5e_slug?: string | null
          size?: string | null
          source?: string | null
          speed?: string | null
          str?: number | null
          wis?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dnd_monsters_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "dnd_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      dnd_narrative_checks: {
        Row: {
          ability: string | null
          check_type: string
          condition_text: string | null
          created_at: string | null
          critical_text: string | null
          dc: number | null
          failure_text: string
          id: string
          is_hidden: boolean | null
          node_id: string
          skill: string | null
          sort_order: number | null
          success_text: string
          updated_at: string | null
        }
        Insert: {
          ability?: string | null
          check_type: string
          condition_text?: string | null
          created_at?: string | null
          critical_text?: string | null
          dc?: number | null
          failure_text: string
          id?: string
          is_hidden?: boolean | null
          node_id: string
          skill?: string | null
          sort_order?: number | null
          success_text: string
          updated_at?: string | null
        }
        Update: {
          ability?: string | null
          check_type?: string
          condition_text?: string | null
          created_at?: string | null
          critical_text?: string | null
          dc?: number | null
          failure_text?: string
          id?: string
          is_hidden?: boolean | null
          node_id?: string
          skill?: string | null
          sort_order?: number | null
          success_text?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dnd_narrative_checks_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "dnd_narrative_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      dnd_narrative_edges: {
        Row: {
          created_at: string | null
          from_node_id: string
          id: string
          label: string | null
          taken_at: string | null
          to_node_id: string
          was_taken: boolean | null
        }
        Insert: {
          created_at?: string | null
          from_node_id: string
          id?: string
          label?: string | null
          taken_at?: string | null
          to_node_id: string
          was_taken?: boolean | null
        }
        Update: {
          created_at?: string | null
          from_node_id?: string
          id?: string
          label?: string | null
          taken_at?: string | null
          to_node_id?: string
          was_taken?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "dnd_narrative_edges_from_node_id_fkey"
            columns: ["from_node_id"]
            isOneToOne: false
            referencedRelation: "dnd_narrative_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dnd_narrative_edges_to_node_id_fkey"
            columns: ["to_node_id"]
            isOneToOne: false
            referencedRelation: "dnd_narrative_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      dnd_narrative_node_links: {
        Row: {
          created_at: string | null
          id: string
          link_id: string
          link_type: string
          node_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          link_id: string
          link_type: string
          node_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          link_id?: string
          link_type?: string
          node_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dnd_narrative_node_links_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "dnd_narrative_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      dnd_narrative_nodes: {
        Row: {
          act_id: string
          created_at: string | null
          description: string | null
          id: string
          is_current: boolean | null
          is_root: boolean | null
          position_x: number | null
          position_y: number | null
          session_id: string | null
          title: string
          updated_at: string | null
          visited_at: string | null
          was_visited: boolean | null
        }
        Insert: {
          act_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_current?: boolean | null
          is_root?: boolean | null
          position_x?: number | null
          position_y?: number | null
          session_id?: string | null
          title: string
          updated_at?: string | null
          visited_at?: string | null
          was_visited?: boolean | null
        }
        Update: {
          act_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_current?: boolean | null
          is_root?: boolean | null
          position_x?: number | null
          position_y?: number | null
          session_id?: string | null
          title?: string
          updated_at?: string | null
          visited_at?: string | null
          was_visited?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "dnd_narrative_nodes_act_id_fkey"
            columns: ["act_id"]
            isOneToOne: false
            referencedRelation: "dnd_acts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dnd_narrative_nodes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "dnd_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      dnd_player_notes: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          player_id: string
          sort_order: number | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          player_id: string
          sort_order?: number | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          player_id?: string
          sort_order?: number | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dnd_player_notes_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "dnd_players"
            referencedColumns: ["id"]
          },
        ]
      }
      dnd_players: {
        Row: {
          access_code: string
          background_answers: Json | null
          character_id: string
          character_secret: string | null
          created_at: string | null
          id: string
          last_login: string | null
          player_name: string
        }
        Insert: {
          access_code: string
          background_answers?: Json | null
          character_id: string
          character_secret?: string | null
          created_at?: string | null
          id?: string
          last_login?: string | null
          player_name: string
        }
        Update: {
          access_code?: string
          background_answers?: Json | null
          character_id?: string
          character_secret?: string | null
          created_at?: string | null
          id?: string
          last_login?: string | null
          player_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "dnd_players_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: true
            referencedRelation: "dnd_characters"
            referencedColumns: ["id"]
          },
        ]
      }
      dnd_sessions: {
        Row: {
          act_id: string | null
          campaign_id: string | null
          created_at: string | null
          id: string
          play_date: string | null
          session_number: number | null
          summary: string | null
          xp_awarded: number | null
        }
        Insert: {
          act_id?: string | null
          campaign_id?: string | null
          created_at?: string | null
          id?: string
          play_date?: string | null
          session_number?: number | null
          summary?: string | null
          xp_awarded?: number | null
        }
        Update: {
          act_id?: string | null
          campaign_id?: string | null
          created_at?: string | null
          id?: string
          play_date?: string | null
          session_number?: number | null
          summary?: string | null
          xp_awarded?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dnd_sessions_act_id_fkey"
            columns: ["act_id"]
            isOneToOne: false
            referencedRelation: "dnd_acts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dnd_sessions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "dnd_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      dnd_story_notes: {
        Row: {
          acts: number[] | null
          campaign_id: string | null
          content: string | null
          created_at: string | null
          dm_notes: string | null
          id: string
          image_url: string | null
          is_revealed: boolean | null
          monster_id: string | null
          note_type: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          acts?: number[] | null
          campaign_id?: string | null
          content?: string | null
          created_at?: string | null
          dm_notes?: string | null
          id?: string
          image_url?: string | null
          is_revealed?: boolean | null
          monster_id?: string | null
          note_type?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          acts?: number[] | null
          campaign_id?: string | null
          content?: string | null
          created_at?: string | null
          dm_notes?: string | null
          id?: string
          image_url?: string | null
          is_revealed?: boolean | null
          monster_id?: string | null
          note_type?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dnd_story_notes_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "dnd_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dnd_story_notes_monster_id_fkey"
            columns: ["monster_id"]
            isOneToOne: false
            referencedRelation: "dnd_monsters"
            referencedColumns: ["id"]
          },
        ]
      }
      open5e_classes: {
        Row: {
          archetypes: Json | null
          cached_at: string | null
          document_title: string | null
          hit_dice: string | null
          hp_at_1st_level: string | null
          id: string
          name: string
          prof_armor: string | null
          prof_saving_throws: string | null
          prof_weapons: string | null
          raw_data: Json | null
          slug: string
          spellcasting_ability: string | null
        }
        Insert: {
          archetypes?: Json | null
          cached_at?: string | null
          document_title?: string | null
          hit_dice?: string | null
          hp_at_1st_level?: string | null
          id?: string
          name: string
          prof_armor?: string | null
          prof_saving_throws?: string | null
          prof_weapons?: string | null
          raw_data?: Json | null
          slug: string
          spellcasting_ability?: string | null
        }
        Update: {
          archetypes?: Json | null
          cached_at?: string | null
          document_title?: string | null
          hit_dice?: string | null
          hp_at_1st_level?: string | null
          id?: string
          name?: string
          prof_armor?: string | null
          prof_saving_throws?: string | null
          prof_weapons?: string | null
          raw_data?: Json | null
          slug?: string
          spellcasting_ability?: string | null
        }
        Relationships: []
      }
      open5e_races: {
        Row: {
          asi_desc: string | null
          cached_at: string | null
          document_title: string | null
          id: string
          languages: string | null
          name: string
          raw_data: Json | null
          size_raw: string | null
          slug: string
          speed: Json | null
          traits: string | null
        }
        Insert: {
          asi_desc?: string | null
          cached_at?: string | null
          document_title?: string | null
          id?: string
          languages?: string | null
          name: string
          raw_data?: Json | null
          size_raw?: string | null
          slug: string
          speed?: Json | null
          traits?: string | null
        }
        Update: {
          asi_desc?: string | null
          cached_at?: string | null
          document_title?: string | null
          id?: string
          languages?: string | null
          name?: string
          raw_data?: Json | null
          size_raw?: string | null
          slug?: string
          speed?: Json | null
          traits?: string | null
        }
        Relationships: []
      }
      open5e_spells: {
        Row: {
          area_of_effect: string | null
          attack_roll: boolean | null
          cached_at: string | null
          canonical_slug: string | null
          casting_time: string | null
          components: string | null
          damage: string | null
          description: string | null
          dnd_class: string | null
          document_title: string | null
          duration: string | null
          higher_level: string | null
          id: string
          level_int: number | null
          name: string
          range: string | null
          raw_data: Json | null
          requires_concentration: boolean | null
          saving_throw: string | null
          school: string | null
          slug: string
        }
        Insert: {
          area_of_effect?: string | null
          attack_roll?: boolean | null
          cached_at?: string | null
          canonical_slug?: string | null
          casting_time?: string | null
          components?: string | null
          damage?: string | null
          description?: string | null
          dnd_class?: string | null
          document_title?: string | null
          duration?: string | null
          higher_level?: string | null
          id?: string
          level_int?: number | null
          name: string
          range?: string | null
          raw_data?: Json | null
          requires_concentration?: boolean | null
          saving_throw?: string | null
          school?: string | null
          slug: string
        }
        Update: {
          area_of_effect?: string | null
          attack_roll?: boolean | null
          cached_at?: string | null
          canonical_slug?: string | null
          casting_time?: string | null
          components?: string | null
          damage?: string | null
          description?: string | null
          dnd_class?: string | null
          document_title?: string | null
          duration?: string | null
          higher_level?: string | null
          id?: string
          level_int?: number | null
          name?: string
          range?: string | null
          raw_data?: Json | null
          requires_concentration?: boolean | null
          saving_throw?: string | null
          school?: string | null
          slug?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_container_weight: {
        Args: { p_character_id: string; p_container_name: string }
        Returns: number
      }
    }
    Enums: {
      connection_status: "connected" | "disconnected" | "error"
      marketing_action_type:
        | "email"
        | "post"
        | "ad"
        | "story"
        | "video"
        | "other"
      platform_type: "ga4" | "brevo" | "meta" | "youtube" | "woocommerce"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      connection_status: ["connected", "disconnected", "error"],
      marketing_action_type: ["email", "post", "ad", "story", "video", "other"],
      platform_type: ["ga4", "brevo", "meta", "youtube", "woocommerce"],
    },
  },
} as const

// ============================================================================
// Custom D&D Type Definitions
// ============================================================================
// These custom types are manually maintained and added to the auto-generated
// Supabase types. They support the narrative system and ability checks.

/**
 * D&D 5e Ability Scores
 */
export type DndAbility = 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA'

/**
 * Array of all D&D 5e ability scores
 */
export const DND_ABILITIES: readonly DndAbility[] = [
  'STR',
  'DEX',
  'CON',
  'INT',
  'WIS',
  'CHA',
] as const

/**
 * Italian labels for D&D 5e ability scores
 */
export const DND_ABILITY_LABELS: Record<DndAbility, string> = {
  STR: 'Forza',
  DEX: 'Destrezza',
  CON: 'Costituzione',
  INT: 'Intelligenza',
  WIS: 'Saggezza',
  CHA: 'Carisma',
} as const

/**
 * D&D 5e skill names (Italian)
 * Ordered by ability score for easy grouping in UI
 */
export const DND_SKILLS: readonly string[] = [
  // STR-based skills
  'Atletica',
  // DEX-based skills
  'Acrobazia',
  'Rapidità di Mano',
  'Furtività',
  // INT-based skills
  'Arcano',
  'Storia',
  'Indagare',
  'Natura',
  'Religione',
  // WIS-based skills
  'Addestrare Animali',
  'Intuizione',
  'Medicina',
  'Percezione',
  'Sopravvivenza',
  // CHA-based skills
  'Inganno',
  'Intimidire',
  'Intrattenere',
  'Persuasione',
] as const

/**
 * Character background answers (5 guiding questions)
 * Stored in dnd_players.background_answers as JSON
 */
export interface BackgroundAnswers {
  origins?: string      // Da dove vieni? Qual è la tua famiglia o comunità di origine?
  motivation?: string   // Perché sei diventato un avventuriero? Cosa cerchi?
  fear?: string         // Qual è la tua più grande paura o il tuo difetto principale?
  bonds?: string        // Chi è importante per te? Chi proteggeresti a ogni costo?
  trait?: string        // Come ti comporti in situazioni di stress o pericolo?
}

/**
 * Narrative tree structure
 * Complete representation of a narrative flow with all related data
 */
export interface NarrativeTree {
  nodes: Tables<'dnd_narrative_nodes'>[]
  edges: Tables<'dnd_narrative_edges'>[]
  links: Tables<'dnd_narrative_node_links'>[]
  root_node: Tables<'dnd_narrative_nodes'> | null
  current_node: Tables<'dnd_narrative_nodes'> | null
  visited_path: string[]
}

/**
 * Initiative tracker item (for combat)
 * Represents a combatant (character or monster) in initiative order
 */
export interface InitiativeItem {
  type: 'character' | 'monster'
  id: string
  name: string
  initiative: number
  current_hp?: number
  max_hp?: number
  conditions: string[]
}

/**
 * Class resource (e.g., Rage, Ki Points, Spell Slots)
 * Stored in dnd_characters.class_resources as JSON array
 */
export interface ClassResource {
  id: string
  name: string
  max: number
  current: number
  recharge: 'short' | 'long' | 'passive'
  class: string
  description?: string
}

/**
 * D&D 5e ability score names (lowercase keys used in database)
 */
export type AbilityName = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'

/**
 * Ability scores object
 */
export interface AbilityScores {
  str: number
  dex: number
  con: number
  int: number
  wis: number
  cha: number
}

/**
 * ASI (Ability Score Improvement) choice
 * Used for level-up ASI selections
 */
export interface ASIChoice {
  ability: AbilityName
  bonus: number  // Usually 1 or 2
}

/**
 * Racial ASI choice (same structure as ASIChoice)
 * Used for races with flexible ability score bonuses (e.g., Half-Elf)
 */
export interface RacialASIChoice {
  ability: AbilityName
  bonus: number
}

/**
 * ASI history entry - tracks ASI choices made at each level
 * Stored in dnd_characters.asi_history as JSON array
 */
export interface ASIHistoryEntry {
  level: number
  type: 'asi'
  choices: ASIChoice[]
  timestamp: string
}

/**
 * Level-up data structure
 * Used when leveling up a character
 */
export interface LevelUpData {
  newLevel: number
  hpRoll: number
  conModifier: number
  totalHPGain: number
  hasASI: boolean
  asiChoices?: ASIChoice[]
}

// ============================================================================
// Database Table Type Aliases
// ============================================================================
// Convenient type aliases for database tables

export type Campaign = Tables<'dnd_campaigns'>
export type Character = Tables<'dnd_characters'>
export type Monster = Tables<'dnd_monsters'>
export type MonsterSpell = Tables<'dnd_monster_spells'>
export type Encounter = Tables<'dnd_encounters'>
export type StoryNote = Tables<'dnd_story_notes'>
export type Session = Tables<'dnd_sessions'>
export type Act = Tables<'dnd_acts'>
export type Player = Tables<'dnd_players'>
export type PlayerNote = Tables<'dnd_player_notes'>
export type Inventory = Tables<'dnd_inventory'>
export type InventoryItem = Tables<'dnd_inventory'>  // Alias
export type CharacterSpell = Tables<'dnd_character_spells'>
export type CombatState = Tables<'dnd_combat_state'>
export type NarrativeNode = Tables<'dnd_narrative_nodes'>
export type NarrativeEdge = Tables<'dnd_narrative_edges'>
export type NarrativeNodeLink = Tables<'dnd_narrative_node_links'>
export type NarrativeCheck = Tables<'dnd_narrative_checks'>

// Insert types
export type CharacterInsert = TablesInsert<'dnd_characters'>
export type CharacterSpellInsert = TablesInsert<'dnd_character_spells'>
export type NarrativeCheckInsert = TablesInsert<'dnd_narrative_checks'>
export type NarrativeNodeInsert = TablesInsert<'dnd_narrative_nodes'>
export type NarrativeEdgeInsert = TablesInsert<'dnd_narrative_edges'>
export type NarrativeNodeLinkInsert = TablesInsert<'dnd_narrative_node_links'>

// Update types
export type NarrativeNodeUpdate = TablesUpdate<'dnd_narrative_nodes'>
export type NarrativeCheckUpdate = TablesUpdate<'dnd_narrative_checks'>

// Cached external resources
export type CachedSpell = Tables<'open5e_spells'>
export type CachedRace = Tables<'open5e_races'>
export type CachedClass = Tables<'open5e_classes'>
