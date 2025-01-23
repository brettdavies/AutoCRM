export type MessageType = 'customer' | 'agent' | 'ai_response' | 'ai_suggestion' | 'system';

export interface Conversation {
  id: string;
  ticket_id: string;
  sender_id: string;
  message_type: MessageType;
  content: string;
  ai_generated: boolean;
  ai_confidence?: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  is_internal: boolean;
}

export interface ConversationWithSender extends Conversation {
  sender: {
    id: string;
    full_name: string;
    email: string;
  } | null;
}

export interface CreateConversationDTO {
  ticket_id: string;
  content: string;
  message_type: MessageType;
  is_internal?: boolean;
  metadata?: Record<string, any>;
}

export interface UpdateConversationDTO {
  content?: string;
  metadata?: Record<string, any>;
  is_internal?: boolean;
} 