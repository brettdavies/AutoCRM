import { useQuery } from '@tanstack/react-query';
import type { UseTicketsOptions } from '@/features/tickets/types/ticket.types';
import { useEffect } from 'react';
import { useAuth } from '@/features/auth';
import { TicketService } from '@/features/tickets/services/ticket.service';

export function useTickets(options: UseTicketsOptions = {}) {
  const { teamId, agentId, status } = options;
  const { session, profile } = useAuth();

  const {
    data: tickets,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['tickets', teamId, agentId, status, session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) throw new Error('Not authenticated');

      return TicketService.getTickets({
        teamId: teamId || undefined,
        agentId: agentId || undefined,
        status: status || undefined,
        userId: session.user.id,
        userTeamId: profile?.team_id || undefined
      });
    },
    enabled: !!session?.user?.id
  });

  // Subscribe to ticket changes
  useEffect(() => {
    if (!session?.user?.id) return;

    const subscription = TicketService.subscribeToTicket(undefined, () => {
      refetch();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [teamId, refetch, session?.user?.id]);

  return {
    tickets,
    isLoading,
    error
  };
} 