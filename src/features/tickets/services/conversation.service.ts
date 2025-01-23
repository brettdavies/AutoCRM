import { supabase } from '@/core/supabase/client';
import type {
  Conversation,
  ConversationWithSender,
  CreateConversationDTO,
  UpdateConversationDTO
} from '../types/conversation.types';
import logger from '@/shared/utils/logger.utils';

export class ConversationService {
  private static readonly CONVERSATION_SELECT = `
    *,
    sender:profiles (
      id,
      full_name,
      email
    )
  `;

  static async getConversations(ticketId: string): Promise<ConversationWithSender[]> {
    logger.debug('[ConversationService] Getting conversations for ticket:', { ticketId });

    const { data, error } = await supabase
      .from('conversations')
      .select(this.CONVERSATION_SELECT)
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('[ConversationService] Error fetching conversations:', { error });
      throw error;
    }

    return data;
  }

  static async createConversation(dto: CreateConversationDTO): Promise<ConversationWithSender> {
    logger.debug('[ConversationService] Creating new conversation:', { dto });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        ...dto,
        sender_id: user.id,
        ai_generated: false
      })
      .select(this.CONVERSATION_SELECT)
      .single();

    if (error) {
      logger.error('[ConversationService] Error creating conversation:', { error });
      throw error;
    }

    return data;
  }

  static async updateConversation(
    id: string,
    dto: UpdateConversationDTO
  ): Promise<ConversationWithSender> {
    logger.debug('[ConversationService] Updating conversation:', { id, dto });

    const { data, error } = await supabase
      .from('conversations')
      .update(dto)
      .eq('id', id)
      .select(this.CONVERSATION_SELECT)
      .single();

    if (error) {
      logger.error('[ConversationService] Error updating conversation:', { error });
      throw error;
    }

    return data;
  }

  static async deleteConversation(id: string): Promise<void> {
    logger.debug('[ConversationService] Deleting conversation:', { id });

    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('[ConversationService] Error deleting conversation:', { error });
      throw error;
    }
  }

  static subscribeToConversations(
    ticketId: string,
    callback: (payload: any) => void
  ) {
    return supabase
      .channel(`conversations:${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `ticket_id=eq.${ticketId}`
        },
        callback
      )
      .subscribe();
  }
} 