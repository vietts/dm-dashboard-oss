-- Add Level-Up System columns to dnd_characters
-- This migration adds base stats tracking, ASI history, and racial ASI choices

-- Base stats (before racial bonuses are applied)
-- These store the "raw" stats entered by the DM
ALTER TABLE dnd_characters ADD COLUMN IF NOT EXISTS base_str integer DEFAULT 10;
ALTER TABLE dnd_characters ADD COLUMN IF NOT EXISTS base_dex integer DEFAULT 10;
ALTER TABLE dnd_characters ADD COLUMN IF NOT EXISTS base_con integer DEFAULT 10;
ALTER TABLE dnd_characters ADD COLUMN IF NOT EXISTS base_int integer DEFAULT 10;
ALTER TABLE dnd_characters ADD COLUMN IF NOT EXISTS base_wis integer DEFAULT 10;
ALTER TABLE dnd_characters ADD COLUMN IF NOT EXISTS base_cha integer DEFAULT 10;

-- ASI (Ability Score Improvement) history
-- Stores array of: { level: number, type: 'asi'|'feat', choices: [{ability, bonus}], timestamp: string }
ALTER TABLE dnd_characters ADD COLUMN IF NOT EXISTS asi_history jsonb DEFAULT '[]'::jsonb;

-- Racial ASI choices (for races like Half-Elf that let you choose bonuses)
-- Stores array of: { ability: string, bonus: number }
ALTER TABLE dnd_characters ADD COLUMN IF NOT EXISTS racial_asi_choices jsonb DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN dnd_characters.base_str IS 'Base STR before racial/ASI bonuses';
COMMENT ON COLUMN dnd_characters.base_dex IS 'Base DEX before racial/ASI bonuses';
COMMENT ON COLUMN dnd_characters.base_con IS 'Base CON before racial/ASI bonuses';
COMMENT ON COLUMN dnd_characters.base_int IS 'Base INT before racial/ASI bonuses';
COMMENT ON COLUMN dnd_characters.base_wis IS 'Base WIS before racial/ASI bonuses';
COMMENT ON COLUMN dnd_characters.base_cha IS 'Base CHA before racial/ASI bonuses';
COMMENT ON COLUMN dnd_characters.asi_history IS 'History of ASI choices at each level-up';
COMMENT ON COLUMN dnd_characters.racial_asi_choices IS 'Chosen racial ASI bonuses (e.g., Half-Elf +1 to two abilities)';
