import { useQuery } from '@tanstack/react-query';
import type { UseTicketsOptions } from '@/features/tickets/types/ticket.types';
import { useEffect } from 'react';
import { useAuth } from '@/features/auth';
import { TicketService } from '@/features/tickets/services/ticket.service';
import logger from '@/shared/utils/logger.utils';

export function useTickets(options: UseTicketsOptions = {}) {
  const { teamId, agentId, status } = options;
  const { session, profile } = useAuth();

  logger.debug('[useTickets] Hook called with options:', {
    teamId,
    agentId,
    status,
    userId: session?.user?.id,
    userTeamId: profile?.team_id
  });

  const {
    data: tickets,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['tickets', teamId, agentId, status, session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) throw new Error('Not authenticated');

      logger.debug('[useTickets] Fetching tickets with params:', {
        teamId: teamId || undefined,
        agentId: agentId || undefined,
        status: status || undefined,
        userId: session.user.id,
        userTeamId: profile?.team_id || undefined
      });

      const result = await TicketService.getTickets({
        teamId: teamId || undefined,
        agentId: agentId || undefined,
        status: status || undefined,
        userId: session.user.id,
        userTeamId: profile?.team_id || undefined
      });

      logger.debug('[useTickets] Received tickets:', {
        count: result.length,
        tickets: result.map(t => ({
          id: t.id,
          title: t.title,
          status: t.status,
          assigned_agent: t.assigned_agent?.id
        }))
      });

      return result;
    },
    enabled: !!session?.user?.id
  });

  // Subscribe to ticket changes
  useEffect(() => {
    if (!session?.user?.id) return;

    logger.debug('[useTickets] Setting up ticket subscription');
    const subscription = TicketService.subscribeToTicket(undefined, () => {
      logger.debug('[useTickets] Ticket update received, refetching...');
      refetch();
    });

    return () => {
      logger.debug('[useTickets] Cleaning up ticket subscription');
      subscription.unsubscribe();
    };
  }, [teamId, refetch, session?.user?.id]);

  return {
    tickets,
    isLoading,
    error
  };
} 