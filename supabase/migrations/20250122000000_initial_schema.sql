-- PostgreSQL Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Comments
COMMENT ON EXTENSION "uuid-ossp" IS 'UUID generation for primary keys';
COMMENT ON EXTENSION "vector" IS 'Vector operations for AI embeddings and similarity search';
COMMENT ON EXTENSION "pg_trgm" IS 'Trigram matching for improved text search';

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create user role function
CREATE OR REPLACE FUNCTION set_user_role(user_id UUID, new_role text)
RETURNS void AS $$
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', new_role)
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create user team function
CREATE OR REPLACE FUNCTION set_user_team(user_id UUID, team_id UUID, is_team_lead boolean DEFAULT false)
RETURNS void AS $$
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
      jsonb_build_object(
        'team_id', team_id::text,
        'is_team_lead', is_team_lead::text
      )
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    preferences JSONB DEFAULT '{}'::jsonb
);

-- Add table comment
COMMENT ON TABLE profiles IS 'User profiles with role-based access control';

-- Create teams table
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    skills TEXT[],
    routing_rules JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create team_members table
CREATE TABLE team_members (
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    team_member_role VARCHAR(20) CHECK (team_member_role IN ('member', 'lead')),
    is_primary BOOLEAN DEFAULT false,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (team_id, user_id)
);

-- Ensure a user only has one primary team
CREATE UNIQUE INDEX idx_team_members_primary ON team_members (user_id) WHERE is_primary = true;

-- Create ticket types
CREATE TYPE ticket_status AS ENUM (
  'unassigned',
  'in_progress',
  'under_review',
  'escalated',
  'resolved',
  'closed'
);

CREATE TYPE watcher_type AS ENUM (
  'team',
  'agent'
);

CREATE TYPE change_type AS ENUM (
  'status',
  'assignment',
  'category',
  'watcher',
  'comment'
);

-- Create tickets table
CREATE TABLE tickets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  status ticket_status NOT NULL DEFAULT 'unassigned',
  assigned_agent_id uuid REFERENCES auth.users(id),
  assigned_team_id uuid REFERENCES teams(id),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create ticket_categories table
CREATE TABLE ticket_categories (
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE,
  category_id uuid NOT NULL,
  added_at timestamptz NOT NULL DEFAULT now(),
  added_by uuid NOT NULL REFERENCES auth.users(id),
  PRIMARY KEY (ticket_id, category_id)
);

-- Create ticket_watchers table
CREATE TABLE ticket_watchers (
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE,
  watcher_id uuid NOT NULL,
  watcher_type watcher_type NOT NULL,
  added_at timestamptz NOT NULL DEFAULT now(),
  added_by uuid NOT NULL REFERENCES auth.users(id),
  notification_preferences jsonb NOT NULL DEFAULT '{"email": true, "in_app": true}'::jsonb,
  PRIMARY KEY (ticket_id, watcher_id, watcher_type)
);

-- Create ticket_history table
CREATE TABLE ticket_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE,
  change_type change_type NOT NULL,
  old_value jsonb,
  new_value jsonb NOT NULL,
  changed_by uuid NOT NULL REFERENCES auth.users(id),
  changed_at timestamptz NOT NULL DEFAULT now()
);

-- Create conversations table
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id),
    message_type VARCHAR(20) CHECK (message_type IN (
        'customer', 'agent', 'ai_response', 'ai_suggestion', 'system'
    )),
    content TEXT NOT NULL,
    ai_generated BOOLEAN DEFAULT false,
    ai_confidence FLOAT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_internal BOOLEAN DEFAULT false
);

-- Create knowledge_base table
CREATE TABLE knowledge_base (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100),
    tags TEXT[],
    embedding vector(1536),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    last_updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    is_published BOOLEAN DEFAULT false,
    team_id UUID REFERENCES teams(id)
);

-- Create AI feedback tables
CREATE TABLE ai_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    provided_by UUID NOT NULL REFERENCES auth.users(id),
    response_quality INTEGER CHECK (response_quality BETWEEN 1 AND 5),
    was_helpful BOOLEAN,
    required_human_intervention BOOLEAN,
    feedback_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ai_learning_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    collected_by UUID NOT NULL REFERENCES auth.users(id),
    original_query TEXT NOT NULL,
    selected_response TEXT NOT NULL,
    context_used JSONB,
    performance_metrics JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_teams_skills ON teams USING gin(skills);
CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE INDEX idx_tickets_created_by ON tickets(created_by);
CREATE INDEX idx_tickets_assigned_team ON tickets(assigned_team_id);
CREATE INDEX idx_tickets_assigned_agent ON tickets(assigned_agent_id);
CREATE INDEX idx_conversations_ticket ON conversations(ticket_id);
CREATE INDEX idx_conversations_sender ON conversations(sender_id);
CREATE INDEX idx_conversations_type ON conversations(message_type);
CREATE INDEX idx_conversations_created ON conversations(created_at);
CREATE INDEX idx_knowledge_base_category ON knowledge_base(category);
CREATE INDEX idx_knowledge_base_tags ON knowledge_base USING gin(tags);
CREATE INDEX idx_knowledge_base_embedding ON knowledge_base USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_knowledge_base_team ON knowledge_base(team_id);
CREATE INDEX idx_knowledge_base_created_by ON knowledge_base(created_by);
CREATE INDEX idx_ai_feedback_conversation ON ai_feedback(conversation_id);
CREATE INDEX idx_ai_feedback_provider ON ai_feedback(provided_by);
CREATE INDEX idx_ai_learning_ticket ON ai_learning_data(ticket_id);
CREATE INDEX idx_ai_learning_collector ON ai_learning_data(collected_by);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_watchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_learning_data ENABLE ROW LEVEL SECURITY;

-- Add REPLICA IDENTITY FULL to ensure proper response headers
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- Create profile trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create profile
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
        
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 