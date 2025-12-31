-- Add character_secret field to dnd_players
-- This is a "sealed" secret that players write once and only the DM can see

ALTER TABLE dnd_players
ADD COLUMN IF NOT EXISTS character_secret TEXT DEFAULT '';

COMMENT ON COLUMN dnd_players.character_secret IS 'Secret note from player, visible only to DM. Once written, cannot be modified by player.';
