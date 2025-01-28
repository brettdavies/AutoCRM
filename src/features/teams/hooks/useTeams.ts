import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { TeamManagementService } from '../services/TeamManagementService';
import type { Team, TeamCreate, TeamUpdate, TeamListItem } from '../types/team.types';
import logger from '@/shared/utils/logger.utils';

const teamService = new TeamManagementService();

export function useTeamList() {
  return useQuery({
    queryKey: ['team-list'],
    queryFn: async () => {
      logger.debug('[useTeamList] Fetching team list');
      const teams = await teamService.getTeamList();
      logger.debug('[useTeamList] Team list fetched:', teams);
      return teams;
    }
  });
}

export function useTeamMutations() {
  const queryClient = useQueryClient();

  const createTeam = useMutation({
    mutationFn: (team: TeamCreate) => teamService.createTeam(team),
    onSuccess: (newTeam) => {
      queryClient.setQueryData<Team[]>(['teams'], (old = []) => [...old, newTeam]);
      queryClient.setQueryData<TeamListItem[]>(['team-list'], (old = []) => [
        ...old,
        { id: newTeam.id, name: newTeam.name, memberCount: 0 }
      ]);
    },
  });

  const updateTeam = useMutation({
    mutationFn: ({ id, team }: { id: string; team: TeamUpdate }) =>
      teamService.updateTeam(id, team),
    onSuccess: (updatedTeam) => {
      queryClient.setQueryData<Team[]>(['teams'], (old = []) =>
        old?.map((team) => (team.id === updatedTeam.id ? updatedTeam : team)) ?? []
      );
      queryClient.setQueryData<TeamListItem[]>(['team-list'], (old = []) =>
        old.map(team => team.id === updatedTeam.id ? {
          ...team,
          name: updatedTeam.name
        } : team)
      );
    },
  });

  const deleteTeam = useMutation({
    mutationFn: (id: string) => teamService.deleteTeam(id),
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData<Team[]>(['teams'], (old = []) =>
        old?.filter((team) => team.id !== deletedId) ?? []
      );
      queryClient.setQueryData<TeamListItem[]>(['team-list'], (old = []) =>
        old.filter(team => team.id !== deletedId)
      );
    },
  });

  return {
    createTeam,
    updateTeam,
    deleteTeam,
  };
}

export function useTeams(teamId?: string | null) {
  const teamsQuery = useQuery<Team>({
    queryKey: ['teams', teamId],
    queryFn: async () => {
      logger.debug('[useTeams] Fetching team', { teamId });
      const teams = await teamService.getTeams();
      logger.debug('[useTeams] Teams fetched:', teams);
      const team = teams.find(t => t.id === teamId);
      if (!team) throw new Error(`Team not found: ${teamId}`);
      return team;
    },
    enabled: !!teamId,
  });

  return {
    data: teamsQuery.data,
    isLoading: teamsQuery.isLoading,
    error: teamsQuery.error,
  };
}

export function useTeamMembers(teamId: string) {
  const queryClient = useQueryClient();

  const membersQuery = useQuery({
    queryKey: ['team-members', teamId],
    queryFn: () => teamService.getTeamMembers(teamId),
    enabled: !!teamId,
  });

  const assignLead = useMutation({
    mutationFn: async (userId: string) => {
      logger.debug('[useTeamMembers] Starting assignLead mutation', { teamId, userId });
      try {
        await teamService.assignTeamLead(teamId, userId);
        logger.debug('[useTeamMembers] Successfully assigned team lead');
      } catch (error) {
        logger.error('[useTeamMembers] Failed to assign team lead:', error);
        throw error;
      }
    },
    onError: (error) => {
      logger.error('[useTeamMembers] Error in assignLead mutation:', error);
    },
    onSuccess: () => {
      logger.debug('[useTeamMembers] Invalidating queries after successful lead assignment');
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
      queryClient.invalidateQueries({ queryKey: ['team-list'] });
    },
  });

  const addMember = useMutation({
    mutationFn: (userId: string) => teamService.addTeamMember(teamId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
      queryClient.invalidateQueries({ queryKey: ['team-list'] });
    },
  });

  const removeMember = useMutation({
    mutationFn: (userId: string) => teamService.removeTeamMember(teamId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
      queryClient.invalidateQueries({ queryKey: ['team-list'] });
    },
  });

  return {
    members: membersQuery.data ?? [],
    isLoading: membersQuery.isLoading,
    error: membersQuery.error,
    assignLead,
    addMember,
    removeMember,
  };
}

export function useTeamUpdates(teamId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!teamId) return;

    let unsubscribe: (() => void) | undefined;

    teamService.subscribeToTeamUpdates(teamId, () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
      queryClient.invalidateQueries({ queryKey: ['team-list'] });
    }).then(unsub => {
      unsubscribe = unsub;
    });

    return () => {
      unsubscribe?.();
    };
  }, [teamId, queryClient]);
} 