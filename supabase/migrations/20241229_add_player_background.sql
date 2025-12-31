-- Add background_answers field to dnd_players for character backstory
-- This stores responses to 5 guiding questions to help players develop their character

ALTER TABLE dnd_players
ADD COLUMN IF NOT EXISTS background_answers JSONB DEFAULT '{}'::jsonb;

-- Add a comment explaining the structure
COMMENT ON COLUMN dnd_players.background_answers IS
'JSON object with 5 background questions:
{
  "origins": "Where do you come from?",
  "motivation": "Why did you become an adventurer?",
  "fear": "What is your greatest fear or flaw?",
  "bonds": "Who is important to you?",
  "trait": "How do you behave under stress?"
}';
