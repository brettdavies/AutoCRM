import { memo } from 'react';
import type { ConversationWithSender } from '../types/conversation.types';
import { Card, Badge } from '@/shared/components';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface ConversationMessageProps {
  conversation: ConversationWithSender;
}

export const ConversationMessage = memo(function ConversationMessage({
  conversation
}: ConversationMessageProps) {
  const { session } = useAuth();
  const isCurrentUser = session?.user?.id === conversation.sender_id;

  const getMessageTypeColor = () => {
    switch (conversation.message_type) {
      case 'customer':
        return 'bg-blue-100 dark:bg-blue-900';
      case 'agent':
        return 'bg-green-100 dark:bg-green-900';
      case 'ai_response':
        return 'bg-purple-100 dark:bg-purple-900';
      case 'ai_suggestion':
        return 'bg-yellow-100 dark:bg-yellow-900';
      case 'system':
        return 'bg-gray-100 dark:bg-gray-900';
      default:
        return 'bg-gray-100 dark:bg-gray-900';
    }
  };

  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      <Card className={`max-w-[80%] ${getMessageTypeColor()}`}>
        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between space-x-2">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                {conversation.sender?.full_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium">
                  {conversation.sender?.full_name || 'Unknown'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(conversation.created_at).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {conversation.is_internal && (
                <Badge variant="secondary">Internal</Badge>
              )}
              {conversation.ai_generated && (
                <Badge variant="secondary">AI Generated</Badge>
              )}
            </div>
          </div>
          <p className="text-sm whitespace-pre-wrap">{conversation.content}</p>
          {conversation.ai_confidence && (
            <p className="text-xs text-muted-foreground">
              AI Confidence: {Math.round(conversation.ai_confidence * 100)}%
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}); 