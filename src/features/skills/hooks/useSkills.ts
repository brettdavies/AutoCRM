import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { SkillService } from '../services/SkillService';
import type { EntityType, SkillFilter } from '../types/skill.types';

const skillService = new SkillService();

export function useEntitySkills(entityId: string, entityType: EntityType) {
  const queryClient = useQueryClient();

  const skillsQuery = useQuery({
    queryKey: ['entity-skills', entityType, entityId],
    queryFn: async () => {
      console.log('Fetching skills for:', { entityId, entityType });
      const skills = await skillService.getEntitySkills(entityId, entityType);
      console.log('Fetched skills:', skills);
      return skills;
    },
    enabled: !!entityId,
  });

  const addSkills = useMutation({
    mutationFn: async (skillNames: string[]) => {
      console.log('Adding skills:', { entityId, entityType, skillNames });
      await skillService.addSkillsToEntity(entityId, entityType, skillNames);
      console.log('Skills added successfully');
    },
    onSuccess: () => {
      console.log('Invalidating queries after skill addition');
      queryClient.invalidateQueries({
        queryKey: ['entity-skills', entityType, entityId],
      });
      if (entityType === 'agent') {
        queryClient.invalidateQueries({
          queryKey: ['user-teams', entityId],
        });
      }
    },
    onError: (error) => {
      console.error('Error adding skills:', error);
    }
  });

  const removeSkills = useMutation({
    mutationFn: async (skillNames: string[]) => {
      console.log('Removing skills:', { entityId, entityType, skillNames });
      await skillService.removeSkillsFromEntity(entityId, entityType, skillNames);
      console.log('Skills removed successfully');
    },
    onSuccess: () => {
      console.log('Invalidating queries after skill removal');
      queryClient.invalidateQueries({
        queryKey: ['entity-skills', entityType, entityId],
      });
      if (entityType === 'agent') {
        queryClient.invalidateQueries({
          queryKey: ['user-teams', entityId],
        });
      }
    },
    onError: (error) => {
      console.error('Error removing skills:', error);
    }
  });

  const bulkAssign = useMutation({
    mutationFn: async (operations: Array<{ entityId: string; skillIds: string[] }>) => {
      console.log('Bulk assigning skills:', { entityType, operations });
      await skillService.bulkAssignSkills(entityType, operations);
      console.log('Bulk assignment successful');
    },
    onSuccess: () => {
      console.log('Invalidating queries after bulk assignment');
      queryClient.invalidateQueries({
        queryKey: ['entity-skills', entityType],
      });
    },
    onError: (error) => {
      console.error('Error in bulk assignment:', error);
    }
  });

  return {
    skills: skillsQuery.data ?? [],
    isLoading: skillsQuery.isLoading,
    error: skillsQuery.error,
    addSkills,
    removeSkills,
    bulkAssign,
  };
}

export function useSkillSearch(initialQuery = '') {
  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<SkillFilter[]>([]);

  const searchQuery = useQuery({
    queryKey: ['skill-search', query, filters],
    queryFn: async () => {
      console.log('Searching skills:', { query, filters });
      const results = await skillService.searchSkills(query, filters);
      console.log('Search results:', results);
      return results;
    },
    enabled: query.length >= 2 || filters.length > 0,
  });

  const filteredQuery = useQuery({
    queryKey: ['filtered-skills', filters],
    queryFn: async () => {
      console.log('Filtering skills:', { filters });
      const results = await skillService.getFilteredSkills(filters);
      console.log('Filter results:', results);
      return results;
    },
    enabled: filters.length > 0,
  });

  return {
    results: searchQuery.data ?? [],
    filteredResults: filteredQuery.data ?? [],
    isLoading: searchQuery.isLoading || filteredQuery.isLoading,
    error: searchQuery.error || filteredQuery.error,
    setQuery,
    setFilters,
  };
}

export function useSkillUpdates(entityId: string, entityType: EntityType) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!entityId) return;

    console.log('Setting up skill updates subscription:', { entityId, entityType });
    const unsubscribe = skillService.subscribeToSkillUpdates(
      entityId,
      entityType,
      () => {
        console.log('Received skill update, invalidating queries');
        queryClient.invalidateQueries({
          queryKey: ['entity-skills', entityType, entityId],
        });
      }
    );

    return () => {
      console.log('Cleaning up skill updates subscription');
      unsubscribe();
    };
  }, [entityId, entityType, queryClient]);
} 