-- Users table schema
-- Manages all user accounts including customers, agents, and admins
-- Last updated: 2024-01-10

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('customer', 'agent', 'admin')),
    team_id UUID REFERENCES teams(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    preferences JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_team ON users(team_id);

-- Comments
COMMENT ON TABLE users IS 'Stores all user accounts including customers, support agents, and administrators';
COMMENT ON COLUMN users.role IS 'User role: customer (standard user), agent (support staff), admin (system administrator)';
COMMENT ON COLUMN users.preferences IS 'User-specific settings and preferences stored as JSONB'; 