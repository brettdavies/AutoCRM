-- Knowledge Base table schema
-- Stores help articles and documentation with vector embeddings for AI search
-- Last updated: 2024-01-21

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE knowledge_base (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100),
    tags TEXT[],
    embedding vector(1536),  -- For AI similarity search
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    last_updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    is_published BOOLEAN DEFAULT false,
    team_id UUID REFERENCES teams(id)  -- Team that owns this article
);

-- Indexes
CREATE INDEX idx_knowledge_base_category ON knowledge_base(category);
CREATE INDEX idx_knowledge_base_tags ON knowledge_base USING gin(tags);
CREATE INDEX idx_knowledge_base_embedding ON knowledge_base USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_knowledge_base_team ON knowledge_base(team_id);
CREATE INDEX idx_knowledge_base_created_by ON knowledge_base(created_by);

-- Add updated_at trigger
CREATE TRIGGER knowledge_base_updated_at
    BEFORE UPDATE ON knowledge_base
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Enable RLS
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Published articles are visible to all authenticated users"
    ON knowledge_base FOR SELECT
    USING (
        is_published = true
        AND auth.uid() IS NOT NULL
    );

CREATE POLICY "Team members can view their team's unpublished articles"
    ON knowledge_base FOR SELECT
    USING (
        NOT is_published
        AND EXISTS (
            SELECT 1 FROM team_members
            WHERE team_members.team_id = knowledge_base.team_id
            AND team_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Team members can create articles"
    ON knowledge_base FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM team_members
            WHERE team_members.team_id = knowledge_base.team_id
            AND team_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Team leads and article authors can update articles"
    ON knowledge_base FOR UPDATE
    USING (
        created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM team_members
            WHERE team_members.team_id = knowledge_base.team_id
            AND team_members.user_id = auth.uid()
            AND team_members.role = 'lead'
        )
    );

CREATE POLICY "Only admins can delete articles"
    ON knowledge_base FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Comments
COMMENT ON TABLE knowledge_base IS 'Help articles and documentation with vector embeddings for AI search';
COMMENT ON COLUMN knowledge_base.embedding IS 'Vector representation of content for similarity search';
COMMENT ON COLUMN knowledge_base.category IS 'High-level grouping of articles';
COMMENT ON COLUMN knowledge_base.tags IS 'Array of tags for improved searchability';
COMMENT ON COLUMN knowledge_base.metadata IS 'Additional article properties stored as JSONB';
COMMENT ON COLUMN knowledge_base.team_id IS 'Team that owns and maintains this article';
COMMENT ON COLUMN knowledge_base.created_by IS 'User who created the article';
COMMENT ON COLUMN knowledge_base.last_updated_by IS 'User who last modified the article'; 