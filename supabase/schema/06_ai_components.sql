-- AI Components schema
-- Tables for AI feedback collection and learning data
-- Last updated: 2024-01-21

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- AI Feedback table
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

-- AI Learning Data table
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

-- Indexes
CREATE INDEX idx_ai_feedback_conversation ON ai_feedback(conversation_id);
CREATE INDEX idx_ai_feedback_provider ON ai_feedback(provided_by);
CREATE INDEX idx_ai_learning_ticket ON ai_learning_data(ticket_id);
CREATE INDEX idx_ai_learning_collector ON ai_learning_data(collected_by);

-- Add updated_at triggers
CREATE TRIGGER ai_feedback_updated_at
    BEFORE UPDATE ON ai_feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER ai_learning_data_updated_at
    BEFORE UPDATE ON ai_learning_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Enable RLS
ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_learning_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies for AI Feedback
CREATE POLICY "Users can view feedback on their conversations"
    ON ai_feedback FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM conversations c
            JOIN tickets t ON c.ticket_id = t.id
            WHERE c.id = ai_feedback.conversation_id
            AND (
                t.created_by = auth.uid()
                OR t.assigned_agent_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM team_members
                    WHERE team_members.team_id = t.assigned_team_id
                    AND team_members.user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can provide feedback on their conversations"
    ON ai_feedback FOR INSERT
    WITH CHECK (
        provided_by = auth.uid()
        AND EXISTS (
            SELECT 1 FROM conversations c
            JOIN tickets t ON c.ticket_id = t.id
            WHERE c.id = ai_feedback.conversation_id
            AND (
                t.created_by = auth.uid()
                OR t.assigned_agent_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM team_members
                    WHERE team_members.team_id = t.assigned_team_id
                    AND team_members.user_id = auth.uid()
                )
            )
        )
    );

-- RLS Policies for AI Learning Data
CREATE POLICY "Agents can view learning data"
    ON ai_learning_data FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND raw_user_meta_data->>'role' IN ('agent', 'admin')
        )
    );

CREATE POLICY "System can create learning data"
    ON ai_learning_data FOR INSERT
    WITH CHECK (true);  -- Restricted by application logic

-- Comments
COMMENT ON TABLE ai_feedback IS 'Feedback on AI-generated responses for quality improvement';
COMMENT ON TABLE ai_learning_data IS 'Training data collected from ticket interactions';
COMMENT ON COLUMN ai_feedback.response_quality IS 'Quality rating from 1 (poor) to 5 (excellent)';
COMMENT ON COLUMN ai_feedback.was_helpful IS 'Whether the AI response was helpful to the user';
COMMENT ON COLUMN ai_feedback.required_human_intervention IS 'Whether human agent intervention was needed';
COMMENT ON COLUMN ai_feedback.provided_by IS 'User who provided the feedback';
COMMENT ON COLUMN ai_learning_data.original_query IS 'Initial customer query or ticket content';
COMMENT ON COLUMN ai_learning_data.selected_response IS 'Response that was ultimately used';
COMMENT ON COLUMN ai_learning_data.context_used IS 'Knowledge base articles and context used for response';
COMMENT ON COLUMN ai_learning_data.performance_metrics IS 'Response generation and selection metrics';
COMMENT ON COLUMN ai_learning_data.collected_by IS 'User or system that collected this training data'; 