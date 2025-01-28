-- Seed data for AutoCRM
-- Reset sequences and clean existing data
TRUNCATE auth.users CASCADE;
TRUNCATE public.profiles CASCADE;
TRUNCATE public.teams CASCADE;
TRUNCATE public.tickets CASCADE;
TRUNCATE public.conversations CASCADE;

-- Temporarily disable the trigger
ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;

-- Create admin users
INSERT INTO auth.users
  (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'd7bed83c-44e2-4275-8251-6c775773c89b', 'authenticated', 'authenticated', 'admin@example.com', crypt('admin123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"admin"}'::jsonb, now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'd8b6d83c-44e2-4275-8251-6c775773c89c', 'authenticated', 'authenticated', 'manager@example.com', crypt('manager123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"admin"}'::jsonb, now(), now(), '', '', '', '');

-- Create agent users
INSERT INTO auth.users
  (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'e1234567-e89b-12d3-a456-426614174000', 'authenticated', 'authenticated', 'tech_lead@example.com', crypt('agent123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"agent"}'::jsonb, now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'e2345678-e89b-12d3-a456-426614174001', 'authenticated', 'authenticated', 'success_lead@example.com', crypt('agent123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"agent"}'::jsonb, now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'e3456789-e89b-12d3-a456-426614174002', 'authenticated', 'authenticated', 'billing_lead@example.com', crypt('agent123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"agent"}'::jsonb, now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'e4567890-e89b-12d3-a456-426614174003', 'authenticated', 'authenticated', 'tech_agent1@example.com', crypt('agent123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"agent"}'::jsonb, now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'e5678901-e89b-12d3-a456-426614174004', 'authenticated', 'authenticated', 'tech_agent2@example.com', crypt('agent123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"agent"}'::jsonb, now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'e6789012-e89b-12d3-a456-426614174005', 'authenticated', 'authenticated', 'tech_agent3@example.com', crypt('agent123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"agent"}'::jsonb, now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'e7890123-e89b-12d3-a456-426614174006', 'authenticated', 'authenticated', 'success_agent1@example.com', crypt('agent123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"agent"}'::jsonb, now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'e8901234-e89b-12d3-a456-426614174007', 'authenticated', 'authenticated', 'success_agent2@example.com', crypt('agent123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"agent"}'::jsonb, now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'e9012345-e89b-12d3-a456-426614174008', 'authenticated', 'authenticated', 'success_agent3@example.com', crypt('agent123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"agent"}'::jsonb, now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'ea123456-e89b-12d3-a456-426614174009', 'authenticated', 'authenticated', 'billing_agent1@example.com', crypt('agent123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"agent"}'::jsonb, now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'eb234567-e89b-12d3-a456-426614174010', 'authenticated', 'authenticated', 'billing_agent2@example.com', crypt('agent123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"agent"}'::jsonb, now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'ec345678-e89b-12d3-a456-426614174011', 'authenticated', 'authenticated', 'billing_agent3@example.com', crypt('agent123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"agent"}'::jsonb, now(), now(), '', '', '', '');

-- Create customer users
INSERT INTO auth.users
  (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'f1234567-e89b-12d3-a456-426614174000', 'authenticated', 'authenticated', 'customer1@example.com', crypt('customer123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"customer"}'::jsonb, now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'f2345678-e89b-12d3-a456-426614174001', 'authenticated', 'authenticated', 'customer2@example.com', crypt('customer123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"customer"}'::jsonb, now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'f3456789-e89b-12d3-a456-426614174002', 'authenticated', 'authenticated', 'customer3@example.com', crypt('customer123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"customer"}'::jsonb, now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'f4567890-e89b-12d3-a456-426614174003', 'authenticated', 'authenticated', 'customer4@example.com', crypt('customer123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"customer"}'::jsonb, now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'f5678901-e89b-12d3-a456-426614174004', 'authenticated', 'authenticated', 'customer5@example.com', crypt('customer123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"customer"}'::jsonb, now(), now(), '', '', '', '');

-- Create identities for all users
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  id,
  format('{"sub":"%s","email":"%s"}', id::text, email)::jsonb,
  'email',
  email,
  now(),
  now(),
  now()
FROM auth.users;

-- Create user profiles
INSERT INTO public.profiles (id, email, full_name, user_role, avatar_url)
SELECT 
  u.id,
  u.email,
  CASE 
    WHEN position('@' in u.email) > 1 THEN 
      replace(substring(u.email from 1 for position('@' in u.email) - 1), '_', ' ')
    ELSE u.email
  END,
  CASE
    WHEN u.raw_user_meta_data->>'role' = 'admin' THEN 'admin'::user_role
    WHEN u.raw_user_meta_data->>'role' = 'agent' THEN 'agent'::user_role 
    WHEN u.raw_user_meta_data->>'role' = 'customer' THEN 'customer'::user_role
  END,
  'https://www.gravatar.com/avatar/' || md5(lower(trim(u.email))) || '?d=mp'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
);

-- Re-enable the trigger
ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;

-- Create teams
INSERT INTO public.teams (id, name, description)
VALUES
  ('11234567-e89b-12d3-a456-426614174000', 'Technical Support', 'Handle technical issues and bugs'),
  ('12345678-e89b-12d3-a456-426614174001', 'Customer Success', 'Handle general inquiries and account issues'),
  ('13456789-e89b-12d3-a456-426614174002', 'Billing Support', 'Handle billing and subscription issues');

-- Assign agents to teams with proper roles
INSERT INTO public.team_members (team_id, user_id, team_member_role)
SELECT 
  teams.id,
  users.id,
  CASE 
    WHEN users.email LIKE '%lead@example.com' THEN 'lead'::team_member_role 
    ELSE 'member'::team_member_role
  END
FROM 
  (SELECT id, name FROM public.teams) teams
CROSS JOIN LATERAL (
  SELECT u.id, u.email
  FROM auth.users u
  WHERE u.email LIKE CASE 
    WHEN teams.name = 'Technical Support' THEN 'tech_%'
    WHEN teams.name = 'Customer Success' THEN 'success_%' 
    ELSE 'billing_%'
  END
  LIMIT 4
) users;

-- Update user metadata with team_id and lead status
DO $$
BEGIN
  -- Update all agents with their team_id
  UPDATE auth.users u
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
      jsonb_build_object(
        'team_id', tm.team_id::text,
        'is_team_lead', (tm.team_member_role = 'lead')::text
      )
  FROM team_members tm
  WHERE u.id = tm.user_id
  AND u.email LIKE '%@example.com'
  AND u.raw_user_meta_data->>'role' = 'agent';
END $$;

-- Begin transaction for ticket creation and wrap all ticket-related operations
DO $outer$
DECLARE
  agent_func text := $func$
    CREATE OR REPLACE FUNCTION assign_random_agent()
    RETURNS TRIGGER AS $body$
    DECLARE
      valid_agent_id uuid;
      agent_email text;
    BEGIN
      -- Only assign for non-unassigned tickets
      IF NEW.status != 'unassigned' THEN
        -- Get a random agent from the assigned team
        SELECT tm.user_id, u.email INTO valid_agent_id, agent_email
        FROM public.team_members tm
        JOIN auth.users u ON u.id = tm.user_id
        WHERE tm.team_id = NEW.assigned_team_id
        AND tm.team_member_role = 'member'
        ORDER BY random()
        LIMIT 1;
        
        NEW.assigned_agent_id := valid_agent_id;
        
        -- Log the assignment
        RAISE NOTICE 'Ticket % assigned to agent %', NEW.title, agent_email;
      END IF;
      RETURN NEW;
    END;
    $body$ LANGUAGE plpgsql;
  $func$;

  customer_func text := $func$
    CREATE OR REPLACE FUNCTION assign_random_customer()
    RETURNS TRIGGER AS $body$
    BEGIN
      NEW.created_by := (
        SELECT id
        FROM auth.users
        WHERE email LIKE 'customer%'
        OFFSET floor(random() * (SELECT COUNT(*) FROM auth.users WHERE email LIKE 'customer%'))
        LIMIT 1
      );
      RETURN NEW;
    END;
    $body$ LANGUAGE plpgsql;
  $func$;
BEGIN
  -- Create temporary staging table
  CREATE TEMP TABLE ticket_staging (
    id uuid PRIMARY KEY,
    title text,
    description text,
    status ticket_status,
    created_by uuid,
    assigned_agent_id uuid,
    assigned_team_id uuid,
    created_at timestamptz,
    updated_at timestamptz
  ) ON COMMIT DROP;

  -- Stage 1: Create base tickets
  INSERT INTO ticket_staging (
    id,
    title,
    description,
    status,
    assigned_team_id,
    created_at,
    updated_at
  )
  SELECT
    gen_random_uuid(),
    'Issue ' || i || ': ' || 
    CASE (i % 3) 
      WHEN 0 THEN 'Technical Problem'
      WHEN 1 THEN 'Account Question'
      ELSE 'Billing Inquiry'
    END,
    CASE (i % 3)
      WHEN 0 THEN 'Having trouble with the application. Need technical assistance.'
      WHEN 1 THEN 'Need help with my account settings and preferences.'
      ELSE 'Questions about my recent billing statement.'
    END,
    (CASE (i % 4)
      WHEN 0 THEN 'unassigned'
      WHEN 1 THEN 'in_progress'
      WHEN 2 THEN 'under_review'
      ELSE 'resolved'
    END)::ticket_status,
    -- Assign team based on ticket type, using the exact IDs from the teams table insert
    CASE (i % 3)
      WHEN 0 THEN '11234567-e89b-12d3-a456-426614174000'::uuid -- Technical Support
      WHEN 1 THEN '12345678-e89b-12d3-a456-426614174001'::uuid -- Customer Success
      ELSE '13456789-e89b-12d3-a456-426614174002'::uuid -- Billing Support
    END,
    now() - interval '1 day',
    now() - interval '1 day'
  FROM generate_series(1, 100) i;

  -- Create functions and triggers in a single EXECUTE
  EXECUTE agent_func;
  EXECUTE 'CREATE TRIGGER assign_agent_trigger BEFORE UPDATE ON ticket_staging FOR EACH ROW EXECUTE FUNCTION assign_random_agent()';
  
  -- Stage 2: Assign agents (modify the update to trigger for non-unassigned tickets)
  UPDATE ticket_staging 
  SET assigned_agent_id = NULL 
  WHERE status != 'unassigned';
  
  -- Drop agent trigger and function
  DROP TRIGGER IF EXISTS assign_agent_trigger ON ticket_staging;
  DROP FUNCTION IF EXISTS assign_random_agent();

  -- Create customer function and trigger
  EXECUTE customer_func;
  EXECUTE 'CREATE TRIGGER assign_customer_trigger BEFORE UPDATE ON ticket_staging FOR EACH ROW EXECUTE FUNCTION assign_random_customer()';
  
  -- Stage 3: Assign customers
  UPDATE ticket_staging SET created_by = NULL;
  
  -- Drop customer trigger and function
  DROP TRIGGER IF EXISTS assign_customer_trigger ON ticket_staging;
  DROP FUNCTION IF EXISTS assign_random_customer();

  -- Final stage: Copy to actual tickets table
  INSERT INTO public.tickets (
    id, title, description, status, created_by,
    assigned_agent_id, assigned_team_id, created_at, updated_at
  )
  SELECT 
    id, title, description, status, created_by,
    assigned_agent_id, assigned_team_id, created_at, updated_at
  FROM ticket_staging;
END;
$outer$;

-- Create sample conversations for tickets
INSERT INTO public.conversations (
  id,
  ticket_id,
  sender_id,
  content,
  message_type
)
SELECT
  gen_random_uuid(),
  t.id,
  CASE 
    WHEN t.status = 'unassigned'::ticket_status THEN t.created_by
    ELSE COALESCE(t.assigned_agent_id, 
      (SELECT id FROM auth.users WHERE email LIKE 'agent%' ORDER BY random() LIMIT 1))
  END,
  CASE 
    WHEN t.status = 'unassigned'::ticket_status THEN 'Initial ticket description: ' || t.description
    WHEN t.status = 'in_progress'::ticket_status THEN 'We are working on your issue. Will update soon.'
    WHEN t.status = 'under_review'::ticket_status THEN 'Waiting for your response.'
    ELSE 'Issue has been resolved. Please let us know if you need anything else.'
  END,
  CASE 
    WHEN t.status = 'unassigned'::ticket_status THEN 'customer'
    ELSE 'agent'
  END
FROM public.tickets t;

-- Add AI-suggested responses for some tickets
INSERT INTO public.conversations (
  id,
  ticket_id,
  sender_id,
  content,
  message_type,
  ai_generated,
  ai_confidence
)
SELECT
  gen_random_uuid(),
  id,
  (SELECT id FROM auth.users WHERE email = 'admin@example.com' LIMIT 1),
  'Based on your description, here is a suggested solution...',
  'ai_suggestion',
  true,
  0.85
FROM public.tickets
WHERE random() < 0.3; -- Add AI responses to 30% of tickets 