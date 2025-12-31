-- ===========================================
-- DM Dashboard - Database Schema
-- ===========================================
-- Run this SQL in your Supabase SQL Editor to set up the database
-- https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- ============================================
-- TABLES
-- ============================================

-- Campaigns
CREATE TABLE dnd_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  current_act INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Acts (story chapters)
CREATE TABLE dnd_acts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES dnd_campaigns(id) ON DELETE CASCADE,
  act_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  theme TEXT,
  objectives TEXT[] DEFAULT '{}',
  is_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Characters
CREATE TABLE dnd_characters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES dnd_campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  player_name TEXT,
  class TEXT,
  subclass TEXT,
  level INTEGER DEFAULT 1,
  race TEXT,
  max_hp INTEGER DEFAULT 10,
  current_hp INTEGER DEFAULT 10,
  temp_hp INTEGER DEFAULT 0,
  armor_class INTEGER DEFAULT 10,
  initiative_bonus INTEGER DEFAULT 0,
  speed INTEGER DEFAULT 30,
  passive_perception INTEGER DEFAULT 10,
  spell_save_dc INTEGER,
  conditions TEXT[] DEFAULT '{}',
  death_save_successes INTEGER DEFAULT 0,
  death_save_failures INTEGER DEFAULT 0,
  is_concentrating BOOLEAN DEFAULT false,
  concentration_spell TEXT,
  notes TEXT,
  avatar_url TEXT,
  -- Ability scores
  str INTEGER DEFAULT 10,
  dex INTEGER DEFAULT 10,
  con INTEGER DEFAULT 10,
  int INTEGER DEFAULT 10,
  wis INTEGER DEFAULT 10,
  cha INTEGER DEFAULT 10,
  base_str INTEGER DEFAULT 10,
  base_dex INTEGER DEFAULT 10,
  base_con INTEGER DEFAULT 10,
  base_int INTEGER DEFAULT 10,
  base_wis INTEGER DEFAULT 10,
  base_cha INTEGER DEFAULT 10,
  -- Class features
  class_resources JSONB DEFAULT '[]',
  asi_history JSONB DEFAULT '[]',
  racial_asi_choices JSONB,
  fighting_style TEXT,
  eldritch_invocations JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Character Spells
CREATE TABLE dnd_character_spells (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  character_id UUID NOT NULL REFERENCES dnd_characters(id) ON DELETE CASCADE,
  spell_slug TEXT NOT NULL,
  spell_name TEXT NOT NULL,
  spell_level INTEGER NOT NULL,
  notes TEXT,
  is_prepared BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Inventory
CREATE TABLE dnd_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  character_id UUID NOT NULL REFERENCES dnd_characters(id) ON DELETE CASCADE,
  item_name VARCHAR(200) NOT NULL,
  quantity INTEGER DEFAULT 1,
  weight NUMERIC,
  notes TEXT,
  is_equipped BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Players (for player portal access)
CREATE TABLE dnd_players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  character_id UUID NOT NULL REFERENCES dnd_characters(id) ON DELETE CASCADE,
  access_code VARCHAR(8) NOT NULL UNIQUE,
  player_name VARCHAR(100) NOT NULL,
  last_login TIMESTAMP WITH TIME ZONE,
  background_answers JSONB DEFAULT '{}',
  character_secret TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Player Notes
CREATE TABLE dnd_player_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES dnd_players(id) ON DELETE CASCADE,
  title VARCHAR(200),
  content TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Monsters
CREATE TABLE dnd_monsters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES dnd_campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cr TEXT,
  monster_type TEXT,
  size TEXT,
  max_hp INTEGER,
  armor_class INTEGER,
  speed TEXT,
  str INTEGER DEFAULT 10,
  dex INTEGER DEFAULT 10,
  con INTEGER DEFAULT 10,
  int INTEGER DEFAULT 10,
  wis INTEGER DEFAULT 10,
  cha INTEGER DEFAULT 10,
  abilities TEXT,
  legendary_actions TEXT,
  source TEXT,
  is_template BOOLEAN DEFAULT true,
  open5e_slug TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Encounters
CREATE TABLE dnd_encounters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES dnd_campaigns(id) ON DELETE CASCADE,
  act INTEGER DEFAULT 1,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  difficulty TEXT,
  status TEXT DEFAULT 'planned',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Encounter Monsters (instances)
CREATE TABLE dnd_encounter_monsters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  encounter_id UUID REFERENCES dnd_encounters(id) ON DELETE CASCADE,
  monster_id UUID REFERENCES dnd_monsters(id) ON DELETE CASCADE,
  instance_name TEXT,
  current_hp INTEGER,
  conditions TEXT[] DEFAULT '{}',
  initiative_roll INTEGER,
  is_alive BOOLEAN DEFAULT true,
  notes TEXT
);

-- Combat State
CREATE TABLE dnd_combat_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  encounter_id UUID REFERENCES dnd_encounters(id) ON DELETE CASCADE,
  current_turn INTEGER DEFAULT 0,
  round_number INTEGER DEFAULT 1,
  initiative_order JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Sessions
CREATE TABLE dnd_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES dnd_campaigns(id) ON DELETE CASCADE,
  act_id UUID REFERENCES dnd_acts(id) ON DELETE SET NULL,
  session_number INTEGER,
  play_date DATE,
  summary TEXT,
  xp_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Story Notes
CREATE TABLE dnd_story_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES dnd_campaigns(id) ON DELETE CASCADE,
  monster_id UUID REFERENCES dnd_monsters(id) ON DELETE SET NULL,
  act INTEGER,
  title TEXT NOT NULL,
  content TEXT,
  dm_notes TEXT,
  note_type TEXT DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  is_revealed BOOLEAN DEFAULT false,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Narrative Nodes (branching story)
CREATE TABLE dnd_narrative_nodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  act_id UUID NOT NULL REFERENCES dnd_acts(id) ON DELETE CASCADE,
  session_id UUID REFERENCES dnd_sessions(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  is_root BOOLEAN DEFAULT false,
  is_current BOOLEAN DEFAULT false,
  was_visited BOOLEAN DEFAULT false,
  visited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Narrative Edges (connections between nodes)
CREATE TABLE dnd_narrative_edges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_node_id UUID NOT NULL REFERENCES dnd_narrative_nodes(id) ON DELETE CASCADE,
  to_node_id UUID NOT NULL REFERENCES dnd_narrative_nodes(id) ON DELETE CASCADE,
  label TEXT,
  was_taken BOOLEAN DEFAULT false,
  taken_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Narrative Node Links (link nodes to NPCs, locations, etc.)
CREATE TABLE dnd_narrative_node_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  node_id UUID NOT NULL REFERENCES dnd_narrative_nodes(id) ON DELETE CASCADE,
  link_type TEXT NOT NULL,
  link_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
-- Enable RLS on all tables and allow full access
-- Customize these policies based on your auth needs

ALTER TABLE dnd_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE dnd_acts ENABLE ROW LEVEL SECURITY;
ALTER TABLE dnd_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE dnd_character_spells ENABLE ROW LEVEL SECURITY;
ALTER TABLE dnd_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE dnd_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE dnd_player_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dnd_monsters ENABLE ROW LEVEL SECURITY;
ALTER TABLE dnd_encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE dnd_encounter_monsters ENABLE ROW LEVEL SECURITY;
ALTER TABLE dnd_combat_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE dnd_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dnd_story_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dnd_narrative_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dnd_narrative_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE dnd_narrative_node_links ENABLE ROW LEVEL SECURITY;

-- Create policies for each table (allowing all operations for anon and authenticated)
-- You may want to customize these for production

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'dnd_campaigns', 'dnd_acts', 'dnd_characters', 'dnd_character_spells',
    'dnd_inventory', 'dnd_players', 'dnd_player_notes', 'dnd_monsters',
    'dnd_encounters', 'dnd_encounter_monsters', 'dnd_combat_state',
    'dnd_sessions', 'dnd_story_notes', 'dnd_narrative_nodes',
    'dnd_narrative_edges', 'dnd_narrative_node_links'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    -- Anon policies
    EXECUTE format('CREATE POLICY %I_anon_select ON %I FOR SELECT TO anon USING (true)', tbl, tbl);
    EXECUTE format('CREATE POLICY %I_anon_insert ON %I FOR INSERT TO anon WITH CHECK (true)', tbl, tbl);
    EXECUTE format('CREATE POLICY %I_anon_update ON %I FOR UPDATE TO anon USING (true) WITH CHECK (true)', tbl, tbl);
    EXECUTE format('CREATE POLICY %I_anon_delete ON %I FOR DELETE TO anon USING (true)', tbl, tbl);
    -- Authenticated policies
    EXECUTE format('CREATE POLICY %I_select_authenticated ON %I FOR SELECT TO authenticated USING (true)', tbl, tbl);
    EXECUTE format('CREATE POLICY %I_insert_authenticated ON %I FOR INSERT TO authenticated WITH CHECK (true)', tbl, tbl);
    EXECUTE format('CREATE POLICY %I_update_authenticated ON %I FOR UPDATE TO authenticated USING (true) WITH CHECK (true)', tbl, tbl);
    EXECUTE format('CREATE POLICY %I_delete_authenticated ON %I FOR DELETE TO authenticated USING (true)', tbl, tbl);
  END LOOP;
END $$;

-- ============================================
-- STORAGE BUCKETS
-- ============================================
-- Run these in SQL Editor to create storage buckets

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('character-avatars', 'character-avatars', true, 4194304, ARRAY['image/*']),
  ('note-images', 'note-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies (public read, authenticated write)
CREATE POLICY "Public read character-avatars" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'character-avatars');

CREATE POLICY "Authenticated upload character-avatars" ON storage.objects
  FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'character-avatars');

CREATE POLICY "Authenticated update character-avatars" ON storage.objects
  FOR UPDATE TO anon, authenticated USING (bucket_id = 'character-avatars');

CREATE POLICY "Authenticated delete character-avatars" ON storage.objects
  FOR DELETE TO anon, authenticated USING (bucket_id = 'character-avatars');

CREATE POLICY "Public read note-images" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'note-images');

CREATE POLICY "Authenticated upload note-images" ON storage.objects
  FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'note-images');

CREATE POLICY "Authenticated update note-images" ON storage.objects
  FOR UPDATE TO anon, authenticated USING (bucket_id = 'note-images');

CREATE POLICY "Authenticated delete note-images" ON storage.objects
  FOR DELETE TO anon, authenticated USING (bucket_id = 'note-images');
