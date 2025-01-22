-- Tickets table schema
-- Core entity for customer support requests
-- Last updated: 2024-01-21

-- Create custom types
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

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = user_id
    AND raw_user_meta_data->>'role' = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is team lead
CREATE OR REPLACE FUNCTION is_team_lead(user_id uuid, team_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = user_id
    AND raw_user_meta_data->>'role' = 'agent'
    AND raw_user_meta_data->>'is_team_lead' = 'true'
    AND raw_user_meta_data->>'team_id' = team_id::text
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create core tables
CREATE TABLE tickets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  status ticket_status NOT NULL DEFAULT 'unassigned',
  assigned_agent_id uuid REFERENCES auth.users(id),
  assigned_team_id uuid NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE ticket_categories (
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE,
  category_id uuid NOT NULL,
  added_at timestamptz NOT NULL DEFAULT now(),
  added_by uuid NOT NULL REFERENCES auth.users(id),
  PRIMARY KEY (ticket_id, category_id)
);

CREATE TABLE ticket_watchers (
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE,
  watcher_id uuid NOT NULL,
  watcher_type watcher_type NOT NULL,
  added_at timestamptz NOT NULL DEFAULT now(),
  added_by uuid NOT NULL REFERENCES auth.users(id),
  notification_preferences jsonb NOT NULL DEFAULT '{"email": true, "in_app": true}'::jsonb,
  PRIMARY KEY (ticket_id, watcher_id, watcher_type)
);

CREATE TABLE ticket_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  change_type change_type NOT NULL,
  old_value jsonb,
  new_value jsonb NOT NULL,
  changed_by uuid NOT NULL REFERENCES auth.users(id),
  changed_at timestamptz NOT NULL DEFAULT now()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Create indexes
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_assigned_agent ON tickets(assigned_agent_id);
CREATE INDEX idx_tickets_assigned_team ON tickets(assigned_team_id);
CREATE INDEX idx_ticket_categories_category ON ticket_categories(category_id);
CREATE INDEX idx_ticket_history_ticket ON ticket_history(ticket_id);
CREATE INDEX idx_ticket_history_changed_at ON ticket_history(changed_at);

-- Add performance-optimized indexes
CREATE INDEX IF NOT EXISTS idx_tickets_created_by ON tickets USING btree (created_by);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_team ON tickets USING btree (assigned_team_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_agent ON tickets USING btree (assigned_agent_id);

-- Enable RLS
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_watchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_history ENABLE ROW LEVEL SECURITY;

-- Ticket RLS Policies
CREATE POLICY "Users can view their own tickets"
ON tickets FOR SELECT
TO authenticated
USING (
  created_by = auth.uid()
  OR assigned_team_id IN (
    SELECT team_id 
    FROM team_members 
    WHERE user_id = auth.uid()
  )
  OR assigned_agent_id = auth.uid()
);

CREATE POLICY "Agents can view team tickets"
ON tickets FOR SELECT
TO authenticated
USING (
  assigned_team_id IN (
    SELECT team_id 
    FROM team_members 
    WHERE user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'agent'
    )
  )
);

CREATE POLICY "Team leads can manage team tickets"
ON tickets FOR ALL
TO authenticated
USING (
  assigned_team_id IN (
    SELECT team_id 
    FROM team_members 
    WHERE user_id = auth.uid()
    AND role = 'lead'
  )
);

CREATE POLICY "Admins have full access"
ON tickets FOR ALL
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Customers can view own tickets"
  ON tickets FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Agents can create tickets"
  ON tickets FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM auth.users
      WHERE raw_user_meta_data->>'role' IN ('agent', 'admin')
    )
  );

CREATE POLICY "Customers can create tickets"
  ON tickets FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Assigned agents can update tickets"
  ON tickets FOR UPDATE
  USING (
    assigned_agent_id = auth.uid()
    OR is_team_lead(auth.uid(), assigned_team_id)
  );

-- Ticket categories policies
CREATE POLICY "View categories follows ticket access"
  ON ticket_categories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_id
      AND (
        tickets.created_by = auth.uid()
        OR tickets.assigned_agent_id = auth.uid()
        OR tickets.assigned_team_id::text = (SELECT raw_user_meta_data->>'team_id' FROM auth.users WHERE id = auth.uid())
        OR is_admin(auth.uid())
      )
    )
  );

CREATE POLICY "Agents and admins can manage categories"
  ON ticket_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' IN ('agent', 'admin')
    )
  );

-- Ticket watchers policies
CREATE POLICY "View watchers follows ticket access"
  ON ticket_watchers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_id
      AND (
        tickets.created_by = auth.uid()
        OR tickets.assigned_agent_id = auth.uid()
        OR tickets.assigned_team_id::text = (SELECT raw_user_meta_data->>'team_id' FROM auth.users WHERE id = auth.uid())
        OR is_admin(auth.uid())
      )
    )
  );

CREATE POLICY "Agents and admins can manage watchers"
  ON ticket_watchers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' IN ('agent', 'admin')
    )
  );

-- Ticket history policies
CREATE POLICY "View history follows ticket access"
  ON ticket_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_id
      AND (
        tickets.created_by = auth.uid()
        OR tickets.assigned_agent_id = auth.uid()
        OR tickets.assigned_team_id::text = (SELECT raw_user_meta_data->>'team_id' FROM auth.users WHERE id = auth.uid())
        OR is_admin(auth.uid())
      )
    )
  );

CREATE POLICY "System can create history entries"
  ON ticket_history FOR INSERT
  WITH CHECK (true);  -- Will be restricted by application logic

-- Comments
COMMENT ON TABLE tickets IS 'Core ticket tracking table for support requests';
COMMENT ON TABLE ticket_categories IS 'Categories assigned to tickets for organization';
COMMENT ON TABLE ticket_watchers IS 'Users and teams watching tickets for updates';
COMMENT ON TABLE ticket_history IS 'Audit trail of all ticket changes'; 