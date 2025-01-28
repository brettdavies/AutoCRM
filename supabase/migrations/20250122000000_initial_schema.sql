-- Drop Tables
DROP TABLE IF EXISTS profiles cascade;
DROP TABLE IF EXISTS teams cascade;
DROP TABLE IF EXISTS team_members cascade;
DROP TABLE IF EXISTS tickets cascade;
DROP TABLE IF EXISTS ticket_categories cascade;
DROP TABLE IF EXISTS ticket_watchers cascade;
DROP TABLE IF EXISTS ticket_history cascade;
DROP TABLE IF EXISTS conversations cascade;
DROP TABLE IF EXISTS knowledge_base cascade;
DROP TABLE IF EXISTS ai_feedback cascade;
DROP TABLE IF EXISTS ai_learning_data cascade;
DROP TABLE IF EXISTS skills cascade;
DROP TABLE IF EXISTS entity_skills cascade;

-- Drop Types
DROP TYPE IF EXISTS ticket_status cascade;
DROP TYPE IF EXISTS watcher_type cascade;
DROP TYPE IF EXISTS change_type cascade;
DROP TYPE IF EXISTS user_role cascade;
DROP TYPE IF EXISTS team_member_role cascade;

-- PostgreSQL Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS http;

-- Comments
COMMENT ON EXTENSION "uuid-ossp" IS 'UUID generation for primary keys';
COMMENT ON EXTENSION "vector" IS 'Vector operations for AI embeddings and similarity search';
COMMENT ON EXTENSION "pg_trgm" IS 'Trigram matching for improved text search';

-- Create user_role enum type
CREATE TYPE user_role AS ENUM (
  'customer',
  'agent',
  'admin'
);

-- Create team_member_role enum type
CREATE TYPE team_member_role AS ENUM ('member', 'lead');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create profiles table with avatar handling
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT UNIQUE NOT NULL,
    user_role user_role NOT NULL DEFAULT 'customer',
    full_name TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    preferences JSONB DEFAULT '{}'::jsonb,
    oauth_provider text,
    avatar_url text,
    oauth_metadata jsonb DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Add table comment
COMMENT ON TABLE profiles IS 'User profiles with role-based access control';

-- Create teams table
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    routing_rules JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE teams IS 'Team management table with routing rules and descriptions. Skills are now managed through entity_skills table.';

-- Create skills table with constraints
CREATE TABLE skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create entity_skills table with audit columns
CREATE TABLE entity_skills (
    entity_id UUID NOT NULL,
    entity_type VARCHAR(8) CHECK (entity_type IN ('team', 'agent')),
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (entity_id, entity_type, skill_id)
);

-- Create team_members table
CREATE TABLE team_members (
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    team_member_role team_member_role NOT NULL DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    PRIMARY KEY (team_id, user_id),
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Add comments to the foreign key constraints
COMMENT ON CONSTRAINT team_members_team_id_fkey ON team_members IS 'References teams.id';
COMMENT ON CONSTRAINT team_members_user_id_fkey ON team_members IS 'References auth.users.id';
COMMENT ON CONSTRAINT team_members_user_id_fkey1 ON team_members IS 'References profiles.id';

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
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Create ticket_categories table
CREATE TABLE ticket_categories (
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE,
  category_id uuid NOT NULL,
  added_at timestamptz NOT NULL DEFAULT now(),
  added_by uuid NOT NULL REFERENCES auth.users(id),
  PRIMARY KEY (ticket_id, category_id),
  deleted_at TIMESTAMPTZ
);

-- Create ticket_watchers table
CREATE TABLE ticket_watchers (
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE,
  watcher_id uuid NOT NULL,
  watcher_type watcher_type NOT NULL,
  added_at timestamptz NOT NULL DEFAULT now(),
  added_by uuid NOT NULL REFERENCES auth.users(id),
  notification_preferences jsonb NOT NULL DEFAULT '{"email": true, "in_app": true}'::jsonb,
  PRIMARY KEY (ticket_id, watcher_id, watcher_type),
  deleted_at TIMESTAMPTZ
);

-- Create ticket_history table
CREATE TABLE ticket_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE,
  change_type change_type NOT NULL,
  old_value jsonb,
  new_value jsonb NOT NULL,
  changed_by uuid NOT NULL REFERENCES auth.users(id),
  changed_at timestamptz NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Create conversations table
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    message_type VARCHAR(20) CHECK (message_type IN (
        'customer', 'agent', 'ai_response', 'ai_suggestion', 'system'
    )),
    content TEXT NOT NULL,
    ai_generated BOOLEAN DEFAULT false,
    ai_confidence FLOAT,
    is_internal BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
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
    published_at TIMESTAMPTZ,
    is_published BOOLEAN DEFAULT false,
    team_id UUID REFERENCES teams(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
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
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
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
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_user_role ON profiles(user_role);
CREATE INDEX idx_profiles_oauth_provider ON profiles(oauth_provider);
CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE INDEX idx_team_members_role ON team_members(team_member_role);
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
CREATE INDEX idx_entity_skills_entity ON entity_skills(entity_id, entity_type);
CREATE INDEX idx_entity_skills_skill ON entity_skills(skill_id);
CREATE INDEX idx_entity_skills_deleted ON entity_skills(deleted_at);
CREATE INDEX idx_skills_name_lower ON skills (LOWER(name));

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
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_skills ENABLE ROW LEVEL SECURITY;

-- Add REPLICA IDENTITY FULL to ensure proper response headers
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- Create profile trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        email,
        user_role,
        full_name,
        oauth_provider,
        avatar_url,
        oauth_metadata
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'customer'),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
        NEW.raw_user_meta_data->>'provider',
        NEW.raw_user_meta_data->>'avatar_url',
        CASE 
            WHEN NEW.raw_user_meta_data->>'provider' IS NOT NULL 
            THEN jsonb_build_object(
                'provider', NEW.raw_user_meta_data->>'provider',
                'provider_id', NEW.raw_user_meta_data->>'provider_id'
            )
            ELSE '{}'::jsonb
        END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Avatar URL trigger and function
CREATE OR REPLACE FUNCTION public.handle_avatar_url()
RETURNS TRIGGER AS $$
DECLARE
  gravatar_url TEXT;
  response_status INT;
BEGIN
  gravatar_url := 'https://www.gravatar.com/avatar/' || md5(lower(trim(NEW.email))) || '?d=404';
  
  SELECT INTO response_status
    status
  FROM
    http((
      'GET',
      gravatar_url,
      ARRAY[]::http_header[],
      NULL,
      NULL
    )::http_request);

  IF response_status = 200 THEN
    NEW.avatar_url := gravatar_url;
  ELSE
    NEW.avatar_url := 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || NEW.email;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER handle_avatar_url_trigger
  BEFORE INSERT OR UPDATE OF email
  ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_avatar_url();

-- Skill creation trigger
CREATE OR REPLACE FUNCTION set_skill_created_by()
RETURNS TRIGGER AS $$
BEGIN
    NEW.created_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_skill_created_by_trigger
    BEFORE INSERT ON skills
    FOR EACH ROW
    EXECUTE FUNCTION set_skill_created_by();

-- Entity skills audit triggers
CREATE OR REPLACE FUNCTION set_entity_skill_created_by()
RETURNS TRIGGER AS $$
BEGIN
    NEW.created_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_entity_skill_created_by_trigger
    BEFORE INSERT ON entity_skills
    FOR EACH ROW
    EXECUTE FUNCTION set_entity_skill_created_by(); 