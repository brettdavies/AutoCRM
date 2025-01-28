import { useQuery } from '@tanstack/react-query';
import type { UseTeamsReturn, HookError } from '../types/hook.types';
import { TeamManagementService } from '@/features/teams/services/TeamManagementService';
import { UIError, ErrorCode } from '@/features/error-handling/types/error.types';
import logger from '@/shared/utils/logger.utils';

/**
 * Hook for fetching teams data
 * @returns {UseTeamsReturn} Object containing teams data and loading state
 * @throws {UIError} When team data fetch fails
 */
export function useTeams(): UseTeamsReturn {
  const COMPONENT = 'useTeams';
  const teamService = new TeamManagementService();

  const { data: teams, isLoading, error } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      logger.debug(`[${COMPONENT}] Fetching teams`);
      try {
        const teams = await teamService.getTeams();
        logger.debug(`[${COMPONENT}] Teams fetched successfully`, { 
          count: teams.length 
        });
        return teams;
      } catch (error) {
        logger.error(`[${COMPONENT}] Failed to fetch teams`, { error });
        throw new UIError(
          ErrorCode.STATE_SYNC_FAILED,
          'Failed to fetch teams',
          COMPONENT,
          error
        );
      }
    },
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    gcTime: 1000 * 60 * 15 // Keep in cache for 15 minutes
  });

  return {
    teams,
    isLoading,
    error: error as HookError | null
  };
} 