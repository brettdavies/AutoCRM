import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/core/supabase/client';
import logger from '@/shared/utils/logger.utils';

interface Team {
  id: string;
  name: string;
}

export function useTeams() {
  return useQuery<Team[]>({
    queryKey: ['teams'],
    queryFn: async () => {
      logger.debug('[useTeams] Fetching teams');
      
      const { data, error } = await supabase
        .from('teams')
        .select('id, name')
        .order('name');
      
      if (error) {
        logger.error('[useTeams] Error fetching teams:', error);
        throw error;
      }

      logger.debug('[useTeams] Teams fetched successfully:', {
        count: data?.length,
        teams: data?.map(t => ({ id: t.id, name: t.name }))
      });

      return data;
    }
  });
} 