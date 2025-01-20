-- Teams table schema
-- Manages support teams and their routing configurations
-- Last updated: 2024-01-10

CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    skills TEXT[],
    routing_rules JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_teams_skills ON teams USING gin(skills);

-- Comments
COMMENT ON TABLE teams IS 'Support teams with their skills and routing configurations';
COMMENT ON COLUMN teams.skills IS 'Array of skills/expertise areas for this team';
COMMENT ON COLUMN teams.routing_rules IS 'JSON configuration for ticket routing logic'; 