-- Knowledge Base table schema
-- Stores help articles and documentation with vector embeddings for AI search
-- Last updated: 2024-01-10

CREATE TABLE knowledge_base (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100),
    tags TEXT[],
    embedding vector(1536),  -- For AI similarity search
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    is_published BOOLEAN DEFAULT false
);

-- Indexes
CREATE INDEX idx_knowledge_base_category ON knowledge_base(category);
CREATE INDEX idx_knowledge_base_tags ON knowledge_base USING gin(tags);
CREATE INDEX idx_knowledge_base_embedding ON knowledge_base USING ivfflat (embedding vector_cosine_ops);

-- Comments
COMMENT ON TABLE knowledge_base IS 'Help articles and documentation with vector embeddings for AI search';
COMMENT ON COLUMN knowledge_base.embedding IS 'Vector representation of content for similarity search';
COMMENT ON COLUMN knowledge_base.category IS 'High-level grouping of articles';
COMMENT ON COLUMN knowledge_base.tags IS 'Array of tags for improved searchability';
COMMENT ON COLUMN knowledge_base.metadata IS 'Additional article properties stored as JSONB'; 