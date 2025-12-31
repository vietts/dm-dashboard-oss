-- ============================================
-- Player Dashboard Migration
-- ============================================
-- Adds tables for player login, inventory, and personal notes

-- ============================================
-- 1. dnd_players - Player access codes
-- ============================================
CREATE TABLE dnd_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID UNIQUE NOT NULL REFERENCES dnd_characters(id) ON DELETE CASCADE,
  access_code VARCHAR(8) UNIQUE NOT NULL,
  player_name VARCHAR(100) NOT NULL,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast login lookup
CREATE INDEX idx_players_access_code ON dnd_players(access_code);

-- RLS: No policies = access only via service_role (API routes)
ALTER TABLE dnd_players ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. dnd_player_notes - Personal player notes
-- ============================================
CREATE TABLE dnd_player_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES dnd_players(id) ON DELETE CASCADE,
  title VARCHAR(200),
  content TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_player_notes_player ON dnd_player_notes(player_id);

ALTER TABLE dnd_player_notes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. dnd_inventory - Character inventory
-- ============================================
CREATE TABLE dnd_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES dnd_characters(id) ON DELETE CASCADE,
  item_name VARCHAR(200) NOT NULL,
  quantity INT DEFAULT 1,
  weight DECIMAL(10,2),
  notes TEXT,
  is_equipped BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inventory_character ON dnd_inventory(character_id);

ALTER TABLE dnd_inventory ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. Add is_prepared to dnd_character_spells
-- ============================================
ALTER TABLE dnd_character_spells
ADD COLUMN IF NOT EXISTS is_prepared BOOLEAN DEFAULT false;

-- Index for prepared spells query
CREATE INDEX IF NOT EXISTS idx_character_spells_prepared
ON dnd_character_spells(character_id, is_prepared)
WHERE is_prepared = true;

-- ============================================
-- 5. Add sort_order to dnd_character_spells
-- ============================================
ALTER TABLE dnd_character_spells
ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;

-- ============================================
-- 6. Auto-update updated_at trigger for player_notes
-- ============================================
CREATE OR REPLACE FUNCTION update_player_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_player_notes_updated_at
  BEFORE UPDATE ON dnd_player_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_player_notes_updated_at();

-- ============================================
-- 7. Storage bucket for character avatars
-- ============================================
-- Note: Run this in Supabase Dashboard > Storage if not using CLI
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('character-avatars', 'character-avatars', true);
