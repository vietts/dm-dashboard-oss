-- Character Actions System Migration
-- This adds support for tracking character actions (attacks, special abilities, limited use resources)

CREATE TABLE dnd_character_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES dnd_characters(id) ON DELETE CASCADE,

  -- Basic Info
  name TEXT NOT NULL,
  description TEXT,

  -- Action Economy
  action_type TEXT NOT NULL CHECK (action_type IN ('action', 'bonus_action', 'reaction', 'other')),

  -- Attack Info (optional)
  attack_type TEXT CHECK (attack_type IN ('melee', 'ranged', 'spell')),
  range_value TEXT, -- '5 ft', '90 ft', 'Self', 'Touch', '30 ft cone', etc.
  hit_bonus INTEGER, -- +4, -1, etc.
  damage_dice TEXT, -- '1d6', '2d8+3', '1d10+DEX', etc.
  damage_type TEXT, -- 'slashing', 'fire', 'piercing', etc.

  -- Limited Use Resources
  limited_uses INTEGER, -- null if unlimited
  uses_remaining INTEGER, -- current uses left
  recharge_on TEXT CHECK (recharge_on IN ('short_rest', 'long_rest', 'dawn', 'turn', null)), -- when uses recharge

  -- Metadata
  source TEXT, -- 'class', 'race', 'feat', 'item', 'spell', 'custom'
  is_active BOOLEAN DEFAULT TRUE, -- can be deactivated without deleting
  sort_order INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_character_actions_character ON dnd_character_actions(character_id);
CREATE INDEX idx_character_actions_type ON dnd_character_actions(action_type);
CREATE INDEX idx_character_actions_active ON dnd_character_actions(is_active);
CREATE INDEX idx_character_actions_source ON dnd_character_actions(source);

-- RLS Policies
ALTER TABLE dnd_character_actions ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (DM and players can manage actions)
CREATE POLICY "Anyone can view character actions"
  ON dnd_character_actions FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert character actions"
  ON dnd_character_actions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update character actions"
  ON dnd_character_actions FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete character actions"
  ON dnd_character_actions FOR DELETE
  USING (true);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_character_actions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER character_actions_updated_at
  BEFORE UPDATE ON dnd_character_actions
  FOR EACH ROW
  EXECUTE FUNCTION update_character_actions_updated_at();

-- Add some common default actions for testing (Unarmed Strike, Dash, Disengage, Dodge, Help, Hide)
-- These will be inserted via the populate_default_actions.py script instead

COMMENT ON TABLE dnd_character_actions IS 'Stores character actions including attacks, special abilities, and limited use resources';
COMMENT ON COLUMN dnd_character_actions.action_type IS 'Type of action economy: action, bonus_action, reaction, or other';
COMMENT ON COLUMN dnd_character_actions.recharge_on IS 'When limited uses recharge: short_rest, long_rest, dawn, turn, or null for unlimited';
COMMENT ON COLUMN dnd_character_actions.source IS 'Where the action comes from: class, race, feat, item, spell, or custom';
