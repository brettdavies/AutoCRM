-- Drop ALL policies that might use is_admin()
DROP POLICY IF EXISTS "Users can view and manage tickets" ON tickets;
DROP POLICY IF EXISTS "Knowledge base access" ON knowledge_base;
DROP POLICY IF EXISTS "Team leads can manage team members" ON team_members;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Team members can view team roster" ON team_members;
DROP POLICY IF EXISTS "Access ticket categories" ON ticket_categories;
DROP POLICY IF EXISTS "Access ticket watchers" ON ticket_watchers;
DROP POLICY IF EXISTS "Access ticket history" ON ticket_history;
DROP POLICY IF EXISTS "Conversation access" ON conversations;
DROP POLICY IF EXISTS "AI feedback access" ON ai_feedback;
DROP POLICY IF EXISTS "AI learning data access" ON ai_learning_data;
DROP POLICY IF EXISTS "Customers can view teams assigned to their tickets" ON teams;
DROP POLICY IF EXISTS "Customers can view profiles of agents on their tickets" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins have full access to teams" ON teams;
DROP POLICY IF EXISTS "Agents can view teams" ON teams;
DROP POLICY IF EXISTS "Team members can view their teams" ON teams;

-- Drop existing functions
DROP FUNCTION IF EXISTS is_admin();
DROP FUNCTION IF EXISTS sync_profile_role();
DROP FUNCTION IF EXISTS is_agent();
DROP FUNCTION IF EXISTS is_team_lead();
DROP TRIGGER IF EXISTS on_profile_role_change ON profiles;

-- Create role check functions using auth.users metadata
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT raw_user_meta_data->>'role' = 'admin'
    FROM auth.users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_agent()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT raw_user_meta_data->>'role' = 'agent'
    FROM auth.users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_team_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT team_id
    FROM team_members
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_team_lead()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM team_members
    WHERE user_id = auth.uid()
    AND team_member_role = 'lead'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profile Policies
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Agents can view all profiles"
    ON profiles FOR SELECT
    TO authenticated
    USING (is_agent() OR is_admin());

CREATE POLICY "Customers can view profiles of agents on their tickets"
    ON profiles FOR SELECT
    TO authenticated
    USING (
        auth.uid() = id  -- Can view own profile
        OR EXISTS (      -- Can view profiles of agents assigned to their tickets
            SELECT 1 FROM tickets
            WHERE (
                tickets.assigned_agent_id = profiles.id
                OR tickets.created_by = profiles.id
            )
            AND tickets.created_by = auth.uid()
        )
    );

-- Team Policies
CREATE POLICY "Admins have full access to teams"
    ON teams FOR ALL
    TO authenticated
    USING (is_admin());

CREATE POLICY "Agents can view teams"
    ON teams FOR SELECT
    TO authenticated
    USING (
        is_agent() OR
        get_user_team_id() = id
    );

CREATE POLICY "Team members can view their teams"
    ON teams FOR SELECT
    TO authenticated
    USING (
        get_user_team_id() = id
    );

CREATE POLICY "Customers can view teams assigned to their tickets"
    ON teams FOR SELECT
    TO authenticated
    USING (
        id IN (  -- Direct reference to team IDs from customer's tickets
            SELECT assigned_team_id 
            FROM tickets 
            WHERE created_by = auth.uid()
            AND assigned_team_id IS NOT NULL
        )
    );

-- Team Member Policies
CREATE POLICY "Team leads can manage team members"
    ON team_members FOR ALL
    TO authenticated
    USING (
        is_admin() OR
        (
            is_team_lead() AND team_id = get_user_team_id()
        )
    );

CREATE POLICY "Team members can view team roster"
    ON team_members FOR SELECT
    TO authenticated
    USING (
        is_admin() OR
        team_id = get_user_team_id()
    );

-- Ticket Policies
CREATE POLICY "Admins have full access to tickets"
    ON tickets FOR ALL
    TO authenticated
    USING (is_admin());

CREATE POLICY "Users can access their tickets"
    ON tickets FOR ALL
    TO authenticated
    USING (
        is_admin()
        OR (is_agent() AND (
            assigned_agent_id = auth.uid()
            OR assigned_team_id = get_user_team_id()
        ))
        OR created_by = auth.uid()
    );

-- Ticket Categories Policies
CREATE POLICY "Access ticket categories"
    ON ticket_categories FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM tickets t
            WHERE t.id = ticket_id
            AND (
                is_admin() OR
                auth.uid() = t.created_by OR
                auth.uid() = t.assigned_agent_id OR
                t.assigned_team_id = get_user_team_id()
            )
        )
    );

-- Ticket Watchers Policies
CREATE POLICY "Access ticket watchers"
    ON ticket_watchers FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM tickets t
            WHERE t.id = ticket_id
            AND (
                is_admin() OR
                auth.uid() = t.created_by OR
                auth.uid() = t.assigned_agent_id OR
                t.assigned_team_id = get_user_team_id()
            )
        )
    );

-- Ticket History Policies
CREATE POLICY "Access ticket history"
    ON ticket_history FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM tickets t
            WHERE t.id = ticket_id
            AND (
                is_admin() OR
                auth.uid() = t.created_by OR
                auth.uid() = t.assigned_agent_id OR
                t.assigned_team_id = get_user_team_id()
            )
        )
    );

-- Knowledge Base Policies
CREATE POLICY "Knowledge base access"
    ON knowledge_base FOR ALL
    TO authenticated
    USING (
        is_admin() OR
        auth.uid() = created_by OR
        (team_id IS NOT NULL AND team_id = get_user_team_id()) OR
        is_published = true
    );

-- Conversation Policies
CREATE POLICY "Conversation access"
    ON conversations FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM tickets t
            WHERE t.id = ticket_id
            AND (
                is_admin() OR
                auth.uid() = t.created_by OR
                auth.uid() = t.assigned_agent_id OR
                t.assigned_team_id = get_user_team_id()
            )
        )
    );

-- AI Feedback Policies
CREATE POLICY "AI feedback access"
    ON ai_feedback FOR ALL
    TO authenticated
    USING (
        is_admin() OR
        auth.uid() = provided_by OR
        conversation_id IN (
            SELECT c.id
            FROM conversations c, tickets t
            WHERE c.ticket_id = t.id
            AND (
                auth.uid() = t.created_by OR
                auth.uid() = t.assigned_agent_id OR
                t.assigned_team_id = get_user_team_id()
            )
        )
    );

-- AI Learning Data Policies
CREATE POLICY "AI learning data access"
    ON ai_learning_data FOR ALL
    TO authenticated
    USING (
        is_admin() OR
        auth.uid() = collected_by OR
        EXISTS (
            SELECT 1 FROM tickets t
            WHERE t.id = ticket_id
            AND (
                auth.uid() = t.created_by OR
                auth.uid() = t.assigned_agent_id OR
                t.assigned_team_id = get_user_team_id()
            )
        )
    );

-- Add skill-related policies
CREATE POLICY "Admins can manage all skills"
ON skills FOR ALL
TO authenticated
USING (is_admin());

CREATE POLICY "Users can view skills"
ON skills FOR SELECT
TO authenticated
USING (
    is_admin() OR
    EXISTS (
        SELECT 1 
        FROM entity_skills es
        WHERE es.skill_id = id
        AND (
            (es.entity_type = 'agent' AND es.entity_id::uuid = auth.uid()) OR
            (es.entity_type = 'team' AND es.entity_id IN (
                SELECT team_id 
                FROM team_members 
                WHERE user_id = auth.uid()
            ))
        )
    )
);

CREATE POLICY "Admins can manage entity skills"
ON entity_skills FOR ALL
TO authenticated
USING (is_admin());

CREATE POLICY "Team leads can manage team entity skills"
ON entity_skills FOR INSERT
TO authenticated
WITH CHECK (
    is_team_lead() AND
    entity_type = 'team' AND
    entity_id IN (
        SELECT team_id
        FROM team_members
        WHERE user_id = auth.uid()
        AND team_member_role = 'lead'
    )
);

-- Add OAuth unlink function
CREATE OR REPLACE FUNCTION public.unlink_oauth_account(user_id uuid, provider text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF auth.uid() <> user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE auth.users
  SET raw_app_meta_data = raw_app_meta_data - concat('oauth_', provider)
  WHERE id = user_id;
END;
$$;

-- Add team membership management function
CREATE OR REPLACE FUNCTION update_agent_teams(
  p_user_id uuid,
  p_team_memberships jsonb[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM check_admin();
  
  DELETE FROM team_members WHERE user_id = p_user_id;
  
  INSERT INTO team_members (user_id, team_id, team_member_role)
  SELECT 
    p_user_id,
    (value->>'teamId')::uuid,
    (value->>'role')::team_member_role
  FROM jsonb_array_elements(p_team_memberships);
END;
$$;

-- Add role resolution function
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    CASE
      WHEN is_admin() THEN 'admin'
      WHEN is_team_lead() THEN 'lead'
      ELSE 'member'
    END;
$$;