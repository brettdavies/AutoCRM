import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateConversationDTO, UpdateConversationDTO } from '../types/conversation.types';
import type { UseConversationsReturn, HookError } from '../types/hook.types';
import { ConversationService } from '../services/conversation.service';
import { UIError, ErrorCode } from '@/features/error-handling/types/error.types';
import logger from '@/shared/utils/logger.utils';

/**
 * Hook for managing ticket conversations with real-time updates
 * @param ticketId - The ID of the ticket to fetch conversations for
 * @returns {UseConversationsReturn} Object containing conversations data and mutation functions
 * @throws {UIError} When subscription setup fails
 */
export function useConversations(ticketId: string): UseConversationsReturn {
  const queryClient = useQueryClient();
  const COMPONENT = 'useConversations';

  // Set up real-time subscription
  useEffect(() => {
    if (!ticketId) return;

    logger.debug(`[${COMPONENT}] Setting up subscription for ticket:`, { ticketId });
    
    let subscription;
    try {
      subscription = ConversationService.subscribeToConversations(
        ticketId,
        () => {
          queryClient.invalidateQueries({ queryKey: ['conversations', ticketId] });
        }
      );
    } catch (error) {
      logger.error(`[${COMPONENT}] Subscription setup failed:`, error);
      throw new UIError(
        ErrorCode.STATE_SYNC_FAILED,
        'Failed to set up real-time updates for conversations',
        COMPONENT,
        error
      );
    }

    return () => {
      logger.debug(`[${COMPONENT}] Cleaning up subscription for ticket:`, { ticketId });
      subscription?.unsubscribe();
    };
  }, [ticketId, queryClient]);

  // Fetch conversations
  const { data: conversations, isLoading, error } = useQuery({
    queryKey: ['conversations', ticketId],
    queryFn: () => ConversationService.getConversations(ticketId),
    enabled: !!ticketId,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5
  });

  // Create conversation mutation
  const createConversation = useMutation({
    mutationFn: async (dto: CreateConversationDTO) => {
      logger.debug(`[${COMPONENT}] Creating conversation:`, { dto });
      return ConversationService.createConversation(dto);
    },
    onSuccess: (newConversation) => {
      logger.debug(`[${COMPONENT}] Conversation created:`, { 
        conversationId: newConversation.id 
      });
      queryClient.invalidateQueries({ queryKey: ['conversations', ticketId] });
    }
  });

  // Update conversation mutation
  const updateConversation = useMutation({
    mutationFn: async (params: { id: string; dto: UpdateConversationDTO }) => {
      logger.debug(`[${COMPONENT}] Updating conversation:`, { 
        id: params.id,
        dto: params.dto
      });
      return ConversationService.updateConversation(params.id, params.dto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', ticketId] });
    }
  });

  // Delete conversation mutation
  const deleteConversation = useMutation({
    mutationFn: async (id: string) => {
      logger.debug(`[${COMPONENT}] Deleting conversation:`, { id });
      return ConversationService.deleteConversation(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', ticketId] });
    }
  });

  return {
    conversations,
    isLoading,
    error: error as HookError | null,
    createConversation: {
      mutateAsync: createConversation.mutateAsync,
      isLoading: createConversation.isPending,
      error: createConversation.error as HookError | null
    },
    updateConversation: {
      mutateAsync: updateConversation.mutateAsync,
      isLoading: updateConversation.isPending,
      error: updateConversation.error as HookError | null
    },
    deleteConversation: {
      mutateAsync: deleteConversation.mutateAsync,
      isLoading: deleteConversation.isPending,
      error: deleteConversation.error as HookError | null
    }
  };
} 