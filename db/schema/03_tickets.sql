-- Tickets table schema
-- Core entity for customer support requests
-- Last updated: 2024-01-10

CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES users(id),
    assigned_to UUID REFERENCES users(id),
    team_id UUID REFERENCES teams(id),
    subject VARCHAR(255) NOT NULL,
    status VARCHAR(50) CHECK (status IN (
        'new', 'assigned', 'in_progress', 'waiting_on_customer',
        'resolved', 'closed', 'reopened'
    )),
    priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    source VARCHAR(50) CHECK (source IN ('web', 'email', 'chat', 'phone', 'api')),
    metadata JSONB DEFAULT '{}'::jsonb,
    ai_analysis JSONB DEFAULT '{}'::jsonb,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    sla_due_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_tickets_customer ON tickets(customer_id);
CREATE INDEX idx_tickets_assigned ON tickets(assigned_to);
CREATE INDEX idx_tickets_team ON tickets(team_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_tags ON tickets USING gin(tags);

-- Comments
COMMENT ON TABLE tickets IS 'Customer support tickets tracking all support requests';
COMMENT ON COLUMN tickets.status IS 'Current state of the ticket in its lifecycle';
COMMENT ON COLUMN tickets.priority IS 'Ticket urgency level affecting SLA and routing';
COMMENT ON COLUMN tickets.source IS 'Channel through which the ticket was created';
COMMENT ON COLUMN tickets.metadata IS 'Additional ticket properties stored as JSONB';
COMMENT ON COLUMN tickets.ai_analysis IS 'AI-generated insights and routing suggestions';
COMMENT ON COLUMN tickets.sla_due_at IS 'Deadline for ticket resolution based on SLA'; 