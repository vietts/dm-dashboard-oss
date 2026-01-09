-- ============================================
-- Narrative Checks Table
-- Structured ability checks, saves, and conditions for narrative nodes
-- ============================================

CREATE TABLE dnd_narrative_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID NOT NULL REFERENCES dnd_narrative_nodes(id) ON DELETE CASCADE,

  -- Check type: ability (Perception CD 15), save (TS Con CD 14), condition (Se ha l'anello)
  check_type TEXT NOT NULL CHECK (check_type IN ('ability', 'save', 'condition')),

  -- Per ability checks (skill-based)
  skill TEXT,                    -- Perception, Stealth, Investigation, etc.

  -- Per save checks (ability-based)
  ability TEXT CHECK (ability IN ('str', 'dex', 'con', 'int', 'wis', 'cha')),

  -- Difficulty Class (per ability/save)
  dc INTEGER CHECK (dc IS NULL OR (dc >= 1 AND dc <= 30)),

  -- Per condition checks (narrative conditions)
  condition_text TEXT,           -- "Se hanno l'anello della Faglia"

  -- Outcomes (testo libero)
  success_text TEXT NOT NULL,    -- Cosa succede se passa/vero
  failure_text TEXT NOT NULL,    -- Cosa succede se fallisce/falso
  critical_text TEXT,            -- Opzionale per nat 20

  -- Metadata
  is_hidden BOOLEAN DEFAULT FALSE, -- Visibile solo al DM (non mostrato ai giocatori)
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by node
CREATE INDEX idx_narrative_checks_node ON dnd_narrative_checks(node_id);

-- Trigger for updated_at
CREATE TRIGGER update_narrative_checks_updated_at
  BEFORE UPDATE ON dnd_narrative_checks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE dnd_narrative_checks ENABLE ROW LEVEL SECURITY;

-- Allow all operations (DM only application)
CREATE POLICY "Allow all on narrative_checks" ON dnd_narrative_checks
  FOR ALL USING (true) WITH CHECK (true);

-- Comments for documentation
COMMENT ON TABLE dnd_narrative_checks IS 'Structured ability checks, saves, and narrative conditions attached to story nodes';
COMMENT ON COLUMN dnd_narrative_checks.check_type IS 'Type: ability (skill check), save (saving throw), condition (narrative condition)';
COMMENT ON COLUMN dnd_narrative_checks.skill IS 'D&D 5e skill name for ability checks (e.g., Perception, Stealth)';
COMMENT ON COLUMN dnd_narrative_checks.ability IS 'Ability score for saving throws (str, dex, con, int, wis, cha)';
COMMENT ON COLUMN dnd_narrative_checks.dc IS 'Difficulty Class (1-30) for ability/save checks';
COMMENT ON COLUMN dnd_narrative_checks.condition_text IS 'Text description of narrative condition for condition checks';
COMMENT ON COLUMN dnd_narrative_checks.is_hidden IS 'If true, check is only visible to DM, not players';
