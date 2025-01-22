-- Teams table schema
-- Manages support teams and their routing configurations
-- Last updated: 2024-01-21

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Teams table
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    skills TEXT[],
    routing_rules JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team Members table
CREATE TABLE team_members (
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) CHECK (role IN ('member', 'lead')),
    is_primary BOOLEAN DEFAULT false,  -- Indicates user's primary team
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (team_id, user_id)
);

-- Ensure a user only has one primary team
CREATE UNIQUE INDEX idx_team_members_primary ON team_members (user_id) WHERE is_primary = true;

-- Indexes
CREATE INDEX idx_teams_skills ON teams USING gin(skills);
CREATE INDEX idx_team_members_user ON team_members(user_id);

-- Add updated_at trigger
CREATE TRIGGER teams_updated_at
    BEFORE UPDATE ON teams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for teams
CREATE POLICY "Team members can view their teams"
    ON teams FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM team_members
            WHERE team_members.team_id = teams.id
            AND team_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage teams"
    ON teams FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- RLS Policies for team_members
CREATE POLICY "Team leads can manage team members"
    ON team_members FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.team_id = team_members.team_id
            AND tm.user_id = auth.uid()
            AND tm.role = 'lead'
        )
    );

CREATE POLICY "Team members can view team roster"
    ON team_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.team_id = team_members.team_id
            AND tm.user_id = auth.uid()
        )
    );

-- Comments
COMMENT ON TABLE teams IS 'Support teams with their skills and routing configurations';
COMMENT ON TABLE team_members IS 'Team membership and roles';
COMMENT ON COLUMN teams.skills IS 'Array of skills/expertise areas for this team';
COMMENT ON COLUMN teams.routing_rules IS 'JSON configuration for ticket routing logic';
COMMENT ON COLUMN team_members.role IS 'Role within the team: member or lead'; 