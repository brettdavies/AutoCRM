import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TicketService } from '@/features/tickets/services/ticket.service';
import type { 
  Ticket, 
  CreateTicketDTO, 
  UpdateTicketDTO,
  TicketWithRelations
} from '@/features/tickets/types/ticket.types';
import { useEffect } from 'react';

export function useTicket(ticketId?: string) {
  const queryClient = useQueryClient();

  // Get ticket query
  const {
    data: ticket,
    isLoading,
    error
  } = useQuery<TicketWithRelations | null>({
    queryKey: ['ticket', ticketId],
    queryFn: async () => {
      console.log('useTicket: Fetching ticket with ID:', ticketId);
      if (!ticketId) return null;
      const result = await TicketService.getTicket(ticketId);
      console.log('useTicket: Received ticket data:', result);
      return result;
    },
    enabled: !!ticketId
  });

  // Create ticket mutation
  const createTicket = useMutation({
    mutationFn: (dto: CreateTicketDTO) => TicketService.createTicket(dto),
    onSuccess: (newTicket) => {
      queryClient.setQueryData(['ticket', newTicket.id], newTicket);
    }
  });

  // Update ticket mutation
  const updateTicket = useMutation({
    mutationFn: (params: { id: string; dto: UpdateTicketDTO }) =>
      TicketService.updateTicket(params.id, params.dto),
    onSuccess: (updatedTicket) => {
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

  // Subscribe to real-time updates
  useEffect(() => {
    if (!ticketId) return;

    console.log('useTicket: Setting up real-time subscription for ticket:', ticketId);
    const subscription = TicketService.subscribeToTicket(ticketId, (updatedTicket) => {
      console.log('useTicket: Received real-time update:', updatedTicket);
      queryClient.setQueryData(['ticket', ticketId], updatedTicket);
    });

    return () => {
      console.log('useTicket: Cleaning up subscription for ticket:', ticketId);
      subscription.unsubscribe();
    };
  }, [ticketId, queryClient]);

  return {
    ticket,
    isLoading,
    error,
    createTicket: createTicket.mutate,
    updateTicket: updateTicket.mutate,
    assignTicket: assignTicket.mutate,
    updateStatus: updateStatus.mutate,
    addWatcher: addWatcher.mutate,
    removeWatcher: removeWatcher.mutate
  };
} 