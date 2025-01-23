import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { 
  CreateConversationDTO, 
  UpdateConversationDTO 
} from '../types/conversation.types';
import { ConversationService } from '../services/conversation.service';
import logger from '@/shared/utils/logger.utils';

export function useConversations(ticketId: string) {
  const queryClient = useQueryClient();

  // Set up real-time subscription
  useEffect(() => {
    if (!ticketId) return;

    logger.debug('[useConversations] Setting up subscription for ticket:', { ticketId });
    
    const subscription = ConversationService.subscribeToConversations(
      ticketId,
      () => {
        // Invalidate and refetch on any changes
        queryClient.invalidateQueries({ queryKey: ['conversations', ticketId] });
      }
    );

    return () => {
      logger.debug('[useConversations] Cleaning up subscription for ticket:', { ticketId });
      subscription.unsubscribe();
    };
  }, [ticketId, queryClient]);

  // Fetch conversations
  const { data: conversations, isLoading, error } = useQuery({
    queryKey: ['conversations', ticketId],
    queryFn: () => ConversationService.getConversations(ticketId),
    enabled: !!ticketId,
    staleTime: 1000 * 60, // Consider data fresh for 1 minute
    cacheTime: 1000 * 60 * 5 // Keep in cache for 5 minutes
  });

  // Create conversation mutation
  const createConversation = useMutation({
    mutationFn: async (dto: CreateConversationDTO) => {
      logger.debug('[useConversations] Creating conversation:', { dto });
      return ConversationService.createConversation(dto);
    },
    onSuccess: (newConversation) => {
      logger.debug('[useConversations] Conversation created:', { 
        conversationId: newConversation.id 
      });
      queryClient.invalidateQueries({ queryKey: ['conversations', ticketId] });
    }
  });

  // Update conversation mutation
  const updateConversation = useMutation({
    mutationFn: async (params: { id: string; dto: UpdateConversationDTO }) => {
      logger.debug('[useConversations] Updating conversation:', { 
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
      logger.debug('[useConversations] Deleting conversation:', { id });
      return ConversationService.deleteConversation(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', ticketId] });
    }
  });

  return {
    conversations,
    isLoading,
    error,
    createConversation: createConversation.mutateAsync,
    updateConversation: updateConversation.mutateAsync,
    deleteConversation: deleteConversation.mutateAsync
  };
} 