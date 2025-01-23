import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TicketService } from '@/features/tickets/services/ticket.service';
import type { 
  Ticket, 
  CreateTicketDTO, 
  UpdateTicketDTO,
  TicketWithRelations
} from '@/features/tickets/types/ticket.types';
import { useEffect } from 'react';
import logger from '@/shared/utils/logger.utils';
import { supabase } from '@/core/supabase/client';

export function useTicket(ticketId: string) {
  const queryClient = useQueryClient();

  // Set up real-time subscription
  useEffect(() => {
    if (!ticketId) return;

    logger.debug('useTicket: Setting up real-time subscription for ticket:', { ticketId });
    
    const subscription = supabase
      .channel(`ticket:${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
          filter: `id=eq.${ticketId}`
        },
        (payload) => {
          // Invalidate and refetch
          queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
        }
      )
      .subscribe();

    return () => {
      logger.debug('useTicket: Cleaning up subscription for ticket:', { ticketId });
      subscription.unsubscribe();
    };
  }, [ticketId]); // Only re-run if ticketId changes

  // Fetch ticket data
  const { data: ticket, isLoading, error } = useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: () => TicketService.getTicket(ticketId),
    enabled: !!ticketId,
    staleTime: 1000 * 60, // Consider data fresh for 1 minute
    cacheTime: 1000 * 60 * 5 // Keep in cache for 5 minutes
  });

  // Create ticket mutation
  const createTicket = useMutation({
    mutationFn: async (dto: CreateTicketDTO) => {
      logger.info('[useTicket] Creating new ticket', { 
        title: dto.title,
        teamId: dto.team_id,
        categoryCount: dto.category_ids.length,
        hasAttachments: dto.attachments?.length > 0
      });

      try {
        const newTicket = await TicketService.createTicket(dto);
        logger.info('[useTicket] Ticket created successfully', {
          ticketId: newTicket.id,
          status: newTicket.status,
          teamId: newTicket.team?.id
        });
        return newTicket;
      } catch (error) {
        logger.error('[useTicket] Failed to create ticket', { 
          title: dto.title,
          error 
        });
        throw error;
      }
    },
    onSuccess: (newTicket) => {
      logger.debug('[useTicket] Updating cache with new ticket', { 
        ticketId: newTicket.id 
      });
      queryClient.setQueryData(['ticket', newTicket.id], newTicket);
    }
  });

  // Update ticket mutation
  const updateTicket = useMutation({
    mutationFn: async (params: { id: string; dto: UpdateTicketDTO }) => {
      logger.info('[useTicket] Updating ticket', { 
        ticketId: params.id,
        updates: params.dto
      });

      try {
        const updatedTicket = await TicketService.updateTicket(params.id, params.dto);
        logger.info('[useTicket] Ticket updated successfully', {
          ticketId: updatedTicket.id,
          status: updatedTicket.status
        });
        return updatedTicket;
      } catch (error) {
        logger.error('[useTicket] Failed to update ticket', { 
          ticketId: params.id,
          error 
        });
        throw error;
      }
    },
    onSuccess: (updatedTicket) => {
      logger.debug('[useTicket] Updating cache with updated ticket', { 
        ticketId: updatedTicket.id 
      });
      queryClient.setQueryData(['ticket', updatedTicket.id], updatedTicket);
    }
  });

  // Assign ticket mutation
  const assignTicket = useMutation({
    mutationFn: (params: { ticketId: string; agentId: string; teamId: string }) =>
      TicketService.assignTicket(params.ticketId, params.agentId, params.teamId),
    onSuccess: (updatedTicket) => {
      queryClient.setQueryData(['ticket', updatedTicket.id], updatedTicket);
    }
  });

  // Update status mutation
  const updateStatus = useMutation({
    mutationFn: (params: { ticketId: string; status: Ticket['status'] }) =>
      TicketService.updateStatus(params.ticketId, params.status),
    onSuccess: (updatedTicket) => {
      queryClient.setQueryData(['ticket', updatedTicket.id], updatedTicket);
    }
  });

  // Add watcher mutation
  const addWatcher = useMutation({
    mutationFn: (params: { 
      ticketId: string; 
      watcherId: string; 
      watcherType: 'team' | 'agent' 
    }) =>
      TicketService.addWatcher(
        params.ticketId, 
        params.watcherId, 
        params.watcherType
      ),
    onSuccess: (updatedTicket) => {
      queryClient.setQueryData(['ticket', updatedTicket.id], updatedTicket);
    }
  });

  // Remove watcher mutation
  const removeWatcher = useMutation({
    mutationFn: (params: { ticketId: string; watcherId: string }) =>
      TicketService.removeWatcher(params.ticketId, params.watcherId),
    onSuccess: (updatedTicket) => {
      queryClient.setQueryData(['ticket', updatedTicket.id], updatedTicket);
    }
  });

  return {
    ticket,
    isLoading,
    error,
    createTicket: createTicket.mutateAsync,
    updateTicket: updateTicket.mutate,
    assignTicket: assignTicket.mutate,
    updateStatus: updateStatus.mutate,
    addWatcher: addWatcher.mutate,
    removeWatcher: removeWatcher.mutate
  };
} 