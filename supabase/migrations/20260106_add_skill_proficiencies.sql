-- Skills System Migration
-- Adds skill_proficiencies JSONB column to track proficiency/expertise for 18 D&D 5e skills

-- Add skill_proficiencies column
ALTER TABLE dnd_characters
ADD COLUMN IF NOT EXISTS skill_proficiencies JSONB DEFAULT '{
  "athletics": "none",
  "acrobatics": "none",
  "sleight_of_hand": "none",
  "stealth": "none",
  "arcana": "none",
  "history": "none",
  "investigation": "none",
  "nature": "none",
  "religion": "none",
  "animal_handling": "none",
  "insight": "none",
  "medicine": "none",
  "perception": "none",
  "survival": "none",
  "deception": "none",
  "intimidation": "none",
  "performance": "none",
  "persuasion": "none"
}'::jsonb;

-- Add GIN index for efficient JSONB querying
CREATE INDEX IF NOT EXISTS idx_characters_skill_proficiencies
  ON dnd_characters USING GIN (skill_proficiencies);

-- Note: Validation of skill proficiency values ('none', 'proficient', 'expertise')
-- is handled at the application level in the SkillsPanel component

-- Add comments for documentation
COMMENT ON COLUMN dnd_characters.skill_proficiencies IS
  'Skill proficiency levels for 18 D&D 5e skills. Values: none (no proficiency), proficient (+proficiency bonus), expertise (double proficiency bonus). Skills: athletics (STR), acrobatics/sleight_of_hand/stealth (DEX), arcana/history/investigation/nature/religion (INT), animal_handling/insight/medicine/perception/survival (WIS), deception/intimidation/performance/persuasion (CHA).';

-- Update existing characters with default skill proficiencies
UPDATE dnd_characters
SET skill_proficiencies = '{
  "athletics": "none",
  "acrobatics": "none",
  "sleight_of_hand": "none",
  "stealth": "none",
  "arcana": "none",
  "history": "none",
  "investigation": "none",
  "nature": "none",
  "religion": "none",
  "animal_handling": "none",
  "insight": "none",
  "medicine": "none",
  "perception": "none",
  "survival": "none",
  "deception": "none",
  "intimidation": "none",
  "performance": "none",
  "persuasion": "none"
}'::jsonb
WHERE skill_proficiencies IS NULL;
