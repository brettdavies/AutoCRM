import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseTicketsReturn, HookError } from '../types/hook.types';
import type { TicketStatus } from '../types/ticket.types';
import { TicketService } from '../services/ticket.service';
import { UIError, ErrorCode } from '@/features/error-handling/types/error.types';
import { supabase } from '@/core/supabase/client';
import { useAuth } from '@/features/auth';
import logger from '@/shared/utils/logger.utils';

/**
 * Hook for fetching and managing tickets with real-time updates
 * @param filters - Optional filters to apply to the ticket query
 * @returns {UseTicketsReturn} Object containing tickets data and loading state
 * @throws {UIError} When subscription setup fails or ticket fetch fails
 */
export function useTickets(filters?: {
  status?: TicketStatus;
  teamId?: string;
  agentId?: string;
}): UseTicketsReturn {
  const queryClient = useQueryClient();
  const COMPONENT = 'useTickets';
  const { session, profile } = useAuth();

  // Set up real-time subscription
  useEffect(() => {
    if (!session?.user?.id) return;

    logger.debug(`[${COMPONENT}] Setting up subscription for tickets`, { filters });
    
    let subscription;
    try {
      subscription = supabase
        .channel('tickets_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tickets'
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ['tickets', filters] });
          }
        )
        .subscribe();
    } catch (error) {
      logger.error(`[${COMPONENT}] Subscription setup failed:`, error);
      throw new UIError(
        ErrorCode.STATE_SYNC_FAILED,
        'Failed to set up real-time updates for tickets',
        COMPONENT,
        error
      );
    }

    return () => {
      logger.debug(`[${COMPONENT}] Cleaning up subscription for tickets`);
      subscription?.unsubscribe();
    };
  }, [queryClient, filters, session?.user?.id]);

  // Fetch tickets
  const { data: tickets, isLoading, error } = useQuery({
    queryKey: ['tickets', filters],
    queryFn: async () => {
      if (!session?.user?.id) {
        throw new UIError(
          ErrorCode.STATE_SYNC_FAILED,
          'User must be authenticated to fetch tickets',
          COMPONENT
        );
      }

      logger.debug(`[${COMPONENT}] Fetching tickets`, { filters });
      try {
        const tickets = await TicketService.getTickets({
          teamId: filters?.teamId,
          agentId: filters?.agentId,
          status: filters?.status,
          userId: session.user.id,
          userRole: profile?.user_role,
          userTeamId: profile?.team_id
        });
        logger.debug(`[${COMPONENT}] Tickets fetched successfully`, { 
          count: tickets.length 
        });
        return tickets;
      } catch (error) {
        logger.error(`[${COMPONENT}] Failed to fetch tickets`, { error });
        throw new UIError(
          ErrorCode.STATE_SYNC_FAILED,
          'Failed to fetch tickets',
          COMPONENT,
          error
        );
      }
    },
    enabled: !!session?.user?.id,
    staleTime: 1000 * 60, // Consider data fresh for 1 minute
    gcTime: 1000 * 60 * 5 // Keep in cache for 5 minutes
  });

  return {
    tickets,
    isLoading,
    error: error as HookError | null
  };
} 