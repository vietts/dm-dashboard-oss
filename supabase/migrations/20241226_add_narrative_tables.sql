-- Migration: Add Narrative Branching System
-- Date: 2024-12-26
-- Description: Adds tables for branching narrative tree within acts

-- ============================================
-- TABLE 1: dnd_narrative_nodes
-- Individual story nodes in the narrative tree
-- ============================================
CREATE TABLE dnd_narrative_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  act_id UUID NOT NULL REFERENCES dnd_acts(id) ON DELETE CASCADE,

  -- Node content
  title TEXT NOT NULL,
  description TEXT,

  -- Position in tree (for visualization)
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,

  -- Node metadata
  is_root BOOLEAN DEFAULT FALSE,
  is_current BOOLEAN DEFAULT FALSE,
  was_visited BOOLEAN DEFAULT FALSE,
  visited_at TIMESTAMPTZ,
  session_id UUID REFERENCES dnd_sessions(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_narrative_nodes_act ON dnd_narrative_nodes(act_id);
CREATE INDEX idx_narrative_nodes_current ON dnd_narrative_nodes(act_id, is_current) WHERE is_current = TRUE;

-- ============================================
-- TABLE 2: dnd_narrative_edges
-- Connections between nodes (possible paths)
-- ============================================
CREATE TABLE dnd_narrative_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  from_node_id UUID NOT NULL REFERENCES dnd_narrative_nodes(id) ON DELETE CASCADE,
  to_node_id UUID NOT NULL REFERENCES dnd_narrative_nodes(id) ON DELETE CASCADE,

  -- Edge metadata
  label TEXT,
  was_taken BOOLEAN DEFAULT FALSE,
  taken_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate edges
  UNIQUE(from_node_id, to_node_id)
);

-- Indexes for traversal
CREATE INDEX idx_narrative_edges_from ON dnd_narrative_edges(from_node_id);
CREATE INDEX idx_narrative_edges_to ON dnd_narrative_edges(to_node_id);

-- ============================================
-- TABLE 3: dnd_narrative_node_links
-- Links nodes to existing content (notes, encounters, monsters)
-- ============================================
CREATE TABLE dnd_narrative_node_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID NOT NULL REFERENCES dnd_narrative_nodes(id) ON DELETE CASCADE,

  -- Polymorphic link to content
  link_type TEXT NOT NULL CHECK (link_type IN ('note', 'encounter', 'monster')),
  link_id UUID NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(node_id, link_type, link_id)
);

CREATE INDEX idx_node_links_node ON dnd_narrative_node_links(node_id);

-- ============================================
-- TRIGGER: Auto-update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_narrative_node_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_narrative_nodes_updated_at
  BEFORE UPDATE ON dnd_narrative_nodes
  FOR EACH ROW
  EXECUTE FUNCTION update_narrative_node_updated_at();

-- ============================================
-- RLS Policies (Enable Row Level Security)
-- ============================================
ALTER TABLE dnd_narrative_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dnd_narrative_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE dnd_narrative_node_links ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (same as other tables in this project)
CREATE POLICY "Allow all operations on narrative_nodes" ON dnd_narrative_nodes
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on narrative_edges" ON dnd_narrative_edges
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on narrative_node_links" ON dnd_narrative_node_links
  FOR ALL USING (true) WITH CHECK (true);
