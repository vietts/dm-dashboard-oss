-- Inventory Enhancements Migration
-- Adds container system, item types, rarity, and attunement support

-- Add new columns to dnd_inventory
ALTER TABLE dnd_inventory
ADD COLUMN IF NOT EXISTS container TEXT DEFAULT 'equipment',
ADD COLUMN IF NOT EXISTS item_type TEXT DEFAULT 'misc',
ADD COLUMN IF NOT EXISTS rarity TEXT DEFAULT 'common',
ADD COLUMN IF NOT EXISTS requires_attunement BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_attuned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_magical BOOLEAN DEFAULT FALSE;

-- Add constraints for item_type
ALTER TABLE dnd_inventory
DROP CONSTRAINT IF EXISTS dnd_inventory_item_type_check;

ALTER TABLE dnd_inventory
ADD CONSTRAINT dnd_inventory_item_type_check
CHECK (item_type IN ('weapon', 'armor', 'consumable', 'tool', 'treasure', 'quest', 'misc'));

-- Add constraints for rarity
ALTER TABLE dnd_inventory
DROP CONSTRAINT IF EXISTS dnd_inventory_rarity_check;

ALTER TABLE dnd_inventory
ADD CONSTRAINT dnd_inventory_rarity_check
CHECK (rarity IN ('common', 'uncommon', 'rare', 'very_rare', 'legendary', 'artifact'));

-- Create inventory containers table
CREATE TABLE IF NOT EXISTS dnd_inventory_containers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES dnd_characters(id) ON DELETE CASCADE,
  container_name TEXT NOT NULL,
  capacity_lb NUMERIC,
  current_weight_lb NUMERIC DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Ensure unique container names per character
  UNIQUE(character_id, container_name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_inventory_containers_character ON dnd_inventory_containers(character_id);
CREATE INDEX IF NOT EXISTS idx_inventory_item_type ON dnd_inventory(item_type);
CREATE INDEX IF NOT EXISTS idx_inventory_rarity ON dnd_inventory(rarity);
CREATE INDEX IF NOT EXISTS idx_inventory_attunement ON dnd_inventory(requires_attunement);
CREATE INDEX IF NOT EXISTS idx_inventory_container ON dnd_inventory(container);

-- RLS Policies for containers
ALTER TABLE dnd_inventory_containers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view inventory containers"
  ON dnd_inventory_containers FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert inventory containers"
  ON dnd_inventory_containers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update inventory containers"
  ON dnd_inventory_containers FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete inventory containers"
  ON dnd_inventory_containers FOR DELETE
  USING (true);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_inventory_containers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER inventory_containers_updated_at
  BEFORE UPDATE ON dnd_inventory_containers
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_containers_updated_at();

-- Function to calculate total weight in a container
CREATE OR REPLACE FUNCTION calculate_container_weight(p_character_id UUID, p_container_name TEXT)
RETURNS NUMERIC AS $$
DECLARE
  total_weight NUMERIC;
BEGIN
  SELECT COALESCE(SUM(weight * quantity), 0)
  INTO total_weight
  FROM dnd_inventory
  WHERE character_id = p_character_id
    AND container = p_container_name;

  RETURN total_weight;
END;
$$ LANGUAGE plpgsql;

-- Function to update container current_weight when inventory changes
CREATE OR REPLACE FUNCTION update_container_weight()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the container's current_weight
  UPDATE dnd_inventory_containers
  SET current_weight_lb = calculate_container_weight(
    COALESCE(NEW.character_id, OLD.character_id),
    COALESCE(NEW.container, OLD.container)
  )
  WHERE character_id = COALESCE(NEW.character_id, OLD.character_id)
    AND container_name = COALESCE(NEW.container, OLD.container);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update container weight
CREATE TRIGGER inventory_update_container_weight
  AFTER INSERT OR UPDATE OR DELETE ON dnd_inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_container_weight();

-- Insert default containers for existing characters
INSERT INTO dnd_inventory_containers (character_id, container_name, capacity_lb, sort_order)
SELECT
  id,
  'equipment',
  NULL, -- No capacity limit for worn equipment
  0
FROM dnd_characters
ON CONFLICT (character_id, container_name) DO NOTHING;

INSERT INTO dnd_inventory_containers (character_id, container_name, capacity_lb, sort_order)
SELECT
  id,
  'backpack',
  50, -- Standard backpack capacity
  1
FROM dnd_characters
ON CONFLICT (character_id, container_name) DO NOTHING;

-- Update existing inventory items to be in 'equipment' container by default
UPDATE dnd_inventory
SET container = 'equipment'
WHERE container IS NULL;

COMMENT ON TABLE dnd_inventory_containers IS 'Defines inventory containers (backpack, pouch, etc.) with weight tracking';
COMMENT ON COLUMN dnd_inventory.container IS 'Which container holds this item (equipment, backpack, pouch, etc.)';
COMMENT ON COLUMN dnd_inventory.item_type IS 'Type of item: weapon, armor, consumable, tool, treasure, quest, misc';
COMMENT ON COLUMN dnd_inventory.rarity IS 'Item rarity: common, uncommon, rare, very_rare, legendary, artifact';
COMMENT ON COLUMN dnd_inventory.requires_attunement IS 'Whether this item requires attunement to use';
COMMENT ON COLUMN dnd_inventory.is_attuned IS 'Whether this item is currently attuned';
COMMENT ON COLUMN dnd_inventory.tags IS 'Custom tags for categorization (damage, combat, utility, exploration, etc.)';
