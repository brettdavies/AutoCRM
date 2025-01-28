import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseTicketReturn, HookError } from '../types/hook.types';
import type { CreateTicketDTO, UpdateTicketDTO, TicketStatus } from '../types/ticket.types';
import { TicketService } from '../services/ticket.service';
import { UIError, ErrorCode } from '@/features/error-handling/types/error.types';
import { supabase } from '@/core/supabase/client';
import logger from '@/shared/utils/logger.utils';

/**
 * Hook for managing a single ticket with real-time updates
 * @param ticketId - The ID of the ticket to manage
 * @returns {UseTicketReturn} Object containing ticket data and mutation functions
 * @throws {UIError} When subscription setup fails
 */
export function useTicket(ticketId: string): UseTicketReturn {
  const queryClient = useQueryClient();
  const COMPONENT = 'useTicket';

  // Set up real-time subscription
  useEffect(() => {
    if (!ticketId) return;

    logger.debug(`[${COMPONENT}] Setting up subscription for ticket:`, { ticketId });
    
    let subscription;
    try {
      subscription = supabase
        .channel(`ticket:${ticketId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tickets',
            filter: `id=eq.${ticketId}`
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
          }
        )
        .subscribe();
    } catch (error) {
      logger.error(`[${COMPONENT}] Subscription setup failed:`, error);
      throw new UIError(
        ErrorCode.STATE_SYNC_FAILED,
        'Failed to set up real-time updates for ticket',
        COMPONENT,
        error
      );
    }

    return () => {
      logger.debug(`[${COMPONENT}] Cleaning up subscription for ticket:`, { ticketId });
      subscription?.unsubscribe();
    };
  }, [ticketId, queryClient]);

  // Fetch ticket data
  const { data: ticket, isLoading, error } = useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: () => TicketService.getTicket(ticketId),
    enabled: !!ticketId,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5
  });

  // Create ticket mutation
  const createTicket = useMutation({
    mutationFn: async (dto: CreateTicketDTO) => {
      logger.info(`[${COMPONENT}] Creating new ticket`, { 
        title: dto.title,
        teamId: dto.team_id,
        categoryCount: dto.category_ids.length,
        hasAttachments: dto.attachments?.length ?? 0
      });

      try {
        const newTicket = await TicketService.createTicket(dto);
        logger.info(`[${COMPONENT}] Ticket created successfully`, {
          ticketId: newTicket.id,
          status: newTicket.status,
          teamId: newTicket.team?.id
        });
        return newTicket;
      } catch (error) {
        logger.error(`[${COMPONENT}] Failed to create ticket`, { 
          title: dto.title,
          error 
        });
        throw new UIError(
          ErrorCode.STATE_SYNC_FAILED,
          'Failed to create ticket',
          COMPONENT,
          error
        );
      }
    },
    onSuccess: (newTicket) => {
      logger.debug(`[${COMPONENT}] Updating cache with new ticket`, { 
        ticketId: newTicket.id 
      });
      queryClient.setQueryData(['ticket', newTicket.id], newTicket);
    }
  });

  // Update ticket mutation
  const updateTicket = useMutation({
    mutationFn: async (params: { id: string; dto: UpdateTicketDTO }) => {
      logger.info(`[${COMPONENT}] Updating ticket`, { 
        ticketId: params.id,
        updates: params.dto
      });

      try {
        const updatedTicket = await TicketService.updateTicket(params.id, params.dto);
        logger.info(`[${COMPONENT}] Ticket updated successfully`, {
          ticketId: updatedTicket.id,
          status: updatedTicket.status
        });
        return updatedTicket;
      } catch (error) {
        logger.error(`[${COMPONENT}] Failed to update ticket`, { 
          ticketId: params.id,
          error 
        });
        throw new UIError(
          ErrorCode.STATE_SYNC_FAILED,
          'Failed to update ticket',
          COMPONENT,
          error
        );
      }
    },
    onSuccess: (updatedTicket) => {
      logger.debug(`[${COMPONENT}] Updating cache with updated ticket`, { 
        ticketId: updatedTicket.id 
      });
      queryClient.setQueryData(['ticket', updatedTicket.id], updatedTicket);
    }
  });

  // Assign ticket mutation
  const assignTicket = useMutation({
    mutationFn: async (params: { ticketId: string; agentId: string; teamId: string }) => {
      logger.info(`[${COMPONENT}] Assigning ticket`, params);
      try {
        return await TicketService.assignTicket(params.ticketId, params.agentId, params.teamId);
      } catch (error) {
        logger.error(`[${COMPONENT}] Failed to assign ticket`, { ...params, error });
        throw new UIError(
          ErrorCode.STATE_SYNC_FAILED,
          'Failed to assign ticket',
          COMPONENT,
          error
        );
      }
    },
    onSuccess: (updatedTicket) => {
      queryClient.setQueryData(['ticket', updatedTicket.id], updatedTicket);
    }
  });

  // Update status mutation
  const updateStatus = useMutation({
    mutationFn: async (params: { ticketId: string; status: TicketStatus }) => {
      logger.info(`[${COMPONENT}] Updating ticket status`, params);
      try {
        return await TicketService.updateStatus(params.ticketId, params.status);
      } catch (error) {
        logger.error(`[${COMPONENT}] Failed to update ticket status`, { ...params, error });
        throw new UIError(
          ErrorCode.STATE_SYNC_FAILED,
          'Failed to update ticket status',
          COMPONENT,
          error
        );
      }
    },
    onSuccess: (updatedTicket) => {
      queryClient.setQueryData(['ticket', updatedTicket.id], updatedTicket);
    }
  });

  return {
    ticket,
    isLoading,
    error: error as HookError | null,
    createTicket: {
      mutateAsync: createTicket.mutateAsync,
      isLoading: createTicket.isPending,
      error: createTicket.error as HookError | null
    },
    updateTicket: {
      mutateAsync: updateTicket.mutateAsync,
      isLoading: updateTicket.isPending,
      error: updateTicket.error as HookError | null
    },
    assignTicket: {
      mutateAsync: assignTicket.mutateAsync,
      isLoading: assignTicket.isPending,
      error: assignTicket.error as HookError | null
    },
    updateStatus: {
      mutateAsync: updateStatus.mutateAsync,
      isLoading: updateStatus.isPending,
      error: updateStatus.error as HookError | null
    }
  };
} 