import { useQuery } from '@tanstack/react-query';
import { AgentManagementService } from '../services/AgentManagementService';
import type { Agent } from '../types/agent.types';

const agentService = new AgentManagementService();

export interface AgentFilters {
  teamId?: string;
  skillId?: string;
  role?: string;
  search?: string;
}

export interface UseAgentsOptions {
  filters?: AgentFilters;
  page?: number;
  limit?: number;
}

interface AgentListResponse {
  agents: Agent[];
  total: number;
  hasMore: boolean;
}

export function useAgents(options: UseAgentsOptions = {}) {
  const { filters, page = 1, limit = 10 } = options;
  
  const queryKey = ['agents', { filters, page, limit }];

  const { data, isLoading, error } = useQuery<AgentListResponse>({
    queryKey,
    queryFn: async () => {
      const offset = (page - 1) * limit;
      const { agents, total } = await agentService.listAgents(filters, offset, limit);
      
      return {
        agents,
        total,
        hasMore: total > offset + agents.length
      };
    },
    staleTime: 30000, // 30 seconds
  });

  return {
    agents: data?.agents ?? [],
    total: data?.total ?? 0,
    hasMore: data?.hasMore ?? false,
    isLoading,
    error
  };
} 