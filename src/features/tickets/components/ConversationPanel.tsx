import { memo, useCallback } from 'react';
import type { MessageType } from '../types/conversation.types';
import { useConversations } from '../hooks/useConversations';
import { ConversationList } from './ConversationList';
import { ConversationInput } from './ConversationInput';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components';
import logger from '@/shared/utils/logger.utils';

interface ConversationPanelProps {
  ticketId: string;
  className?: string;
}

export const ConversationPanel = memo(function ConversationPanel({
  ticketId,
  className = ''
}: ConversationPanelProps) {
  const {
    conversations,
    isLoading,
    error,
    createConversation
  } = useConversations(ticketId);

  const handleSendMessage = useCallback(async (
    content: string,
    isInternal: boolean,
    messageType: MessageType
  ) => {
    try {
      await createConversation({
        ticket_id: ticketId,
        content,
        message_type: messageType,
        is_internal: isInternal
      });
    } catch (error) {
      logger.error('[ConversationPanel] Failed to send message:', { error });
      throw error;
    }
  }, [ticketId, createConversation]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          Loading conversations...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-4 text-red-500">
          Error loading conversations: {error.message}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Conversation</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[calc(100vh-24rem)] flex flex-col">
          <div className="flex-1">
            <ConversationList
              conversations={conversations || []}
            />
          </div>
          <div className="p-4 border-t border-border">
            <ConversationInput
              ticketId={ticketId}
              onSendMessage={handleSendMessage}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}); 