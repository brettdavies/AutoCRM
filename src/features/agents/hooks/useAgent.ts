import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AgentManagementService } from '../services/AgentManagementService';
import type { Agent, AgentCreate, AgentUpdate, AgentTeamMembership } from '../types/agent.types';
import { useEffect } from 'react';

const agentService = new AgentManagementService();

export function useAgent(id: string) {
  const queryClient = useQueryClient();
  const queryKey = ['agent', id];

  // Fetch agent data
  const { data: agent, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => agentService.getAgent(id),
    staleTime: 60000, // 1 minute
  });

  // Create agent mutation
  const createAgent = useMutation({
    mutationFn: (newAgent: AgentCreate) => agentService.createAgent(newAgent),
    onSuccess: (data) => {
      queryClient.setQueryData(['agent', data.id], data);
    },
  });

  // Update agent mutation
  const updateAgent = useMutation({
    mutationFn: (update: AgentUpdate) => agentService.updateAgent(id, update),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data);
    },
  });

  // Update team memberships mutation
  const updateTeamMemberships = useMutation({
    mutationFn: (memberships: AgentTeamMembership[]) => 
      agentService.updateTeamMemberships(id, memberships),
    onSuccess: () => {
      queryClient.invalidateQueries(queryKey);
    },
  });

  // Subscribe to real-time updates
  useEffect(() => {
    if (!id) return;

    const unsubscribe = agentService.subscribeToAgentUpdates(id, (updatedAgent) => {
      queryClient.setQueryData(queryKey, updatedAgent);
    });

    return () => {
      unsubscribe();
    };
  }, [id, queryClient]);

  return {
    agent,
    isLoading,
    error,
    createAgent: createAgent.mutate,
    updateAgent: updateAgent.mutate,
    updateTeamMemberships: updateTeamMemberships.mutate,
    isUpdating: updateAgent.isPending || updateTeamMemberships.isPending,
  };
} 