import { memo } from 'react';
import type { ConversationWithSender } from '../types/conversation.types';
import { ScrollArea } from '@/shared/components';
import { ConversationMessage } from './ConversationMessage';

interface ConversationListProps {
  conversations: ConversationWithSender[];
  className?: string;
}

export const ConversationList = memo(function ConversationList({
  conversations,
  className = ''
}: ConversationListProps) {
  return (
    <ScrollArea className={`h-full ${className}`}>
      <div className="space-y-4 p-4">
        {conversations.map((conversation) => (
          <ConversationMessage
            key={conversation.id}
            conversation={conversation}
          />
        ))}
      </div>
    </ScrollArea>
  );
}); 