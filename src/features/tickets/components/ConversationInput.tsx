import { useState, useCallback, memo } from 'react';
import type { MessageType } from '../types/conversation.types';
import { Button, Textarea, Label } from '@/shared/components';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface ConversationInputProps {
  ticketId: string;
  onSendMessage: (content: string, isInternal: boolean, messageType: MessageType) => Promise<void>;
  className?: string;
}

export const ConversationInput = memo(function ConversationInput({
  onSendMessage,
  className = ''
}: ConversationInputProps) {
  const { session } = useAuth();
  const [content, setContent] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleSend = useCallback(async () => {
    if (!content.trim() || isSending) return;

    try {
      setIsSending(true);
      // Determine message type based on user role
      const messageType: MessageType = session?.user?.user_metadata?.role === 'agent' 
        ? 'agent' 
        : 'customer';
      
      await onSendMessage(content.trim(), isInternal, messageType);
      setContent('');
    } finally {
      setIsSending(false);
    }
  }, [content, isInternal, isSending, onSendMessage, session?.user?.user_metadata?.role]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  return (
    <div className={`space-y-4 ${className}`}>
      <Textarea
        placeholder="Type your message..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyPress={handleKeyPress}
        className="min-h-[100px]"
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Switch
            id="internal"
            checked={isInternal}
            onCheckedChange={setIsInternal}
          />
          <Label htmlFor="internal">Internal Note</Label>
        </div>
        <Button
          onClick={handleSend}
          disabled={!content.trim() || isSending}
        >
          {isSending ? 'Sending...' : 'Send'}
        </Button>
      </div>
    </div>
  );
}); 