-- AI Components schema
-- Tables for AI feedback collection and learning data
-- Last updated: 2024-01-10

-- AI Feedback table
CREATE TABLE ai_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id),
    response_quality INTEGER CHECK (response_quality BETWEEN 1 AND 5),
    was_helpful BOOLEAN,
    required_human_intervention BOOLEAN,
    feedback_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Learning Data table
CREATE TABLE ai_learning_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES tickets(id),
    original_query TEXT NOT NULL,
    selected_response TEXT NOT NULL,
    context_used JSONB,
    performance_metrics JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ai_feedback_conversation ON ai_feedback(conversation_id);
CREATE INDEX idx_ai_learning_ticket ON ai_learning_data(ticket_id);

-- Comments
COMMENT ON TABLE ai_feedback IS 'Feedback on AI-generated responses for quality improvement';
COMMENT ON COLUMN ai_feedback.response_quality IS 'Quality rating from 1 (poor) to 5 (excellent)';
COMMENT ON COLUMN ai_feedback.was_helpful IS 'Whether the AI response was helpful to the user';
COMMENT ON COLUMN ai_feedback.required_human_intervention IS 'Whether human agent intervention was needed';

COMMENT ON TABLE ai_learning_data IS 'Training data collected from ticket interactions';
COMMENT ON COLUMN ai_learning_data.original_query IS 'Initial customer query or ticket content';
COMMENT ON COLUMN ai_learning_data.selected_response IS 'Response that was ultimately used';
COMMENT ON COLUMN ai_learning_data.context_used IS 'Knowledge base articles and context used for response';
COMMENT ON COLUMN ai_learning_data.performance_metrics IS 'Response generation and selection metrics'; 