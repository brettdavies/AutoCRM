import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/core/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { User } from '../types/user.types';
import { logger } from '@/lib/logger';

export function useUsers() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      logger.debug('[useUsers] Fetching users');

      if (!profile) {
        throw new Error('Not authenticated');
      }

      // Base query to get users
      const query = supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          user_role,
          avatar_url,
          created_at,
          updated_at
        `)
        .is('deleted_at', null);

      // Apply role-based filters
      if (profile.user_role !== 'admin') {
        if (profile.user_role === 'agent') {
          // Get all tickets assigned to this agent
          const { data: agentTickets, error: ticketError } = await supabase
            .from('tickets')
            .select('created_by')
            .eq('assigned_agent_id', profile.id)
            .is('deleted_at', null);

          if (ticketError) {
            logger.error('[useUsers] Error fetching agent tickets:', ticketError);
            throw ticketError;
          }

          // Get unique customer IDs from tickets
          const customerIds = [...new Set([
            profile.id, // Include the agent themselves
            ...(agentTickets?.map(ticket => ticket.created_by) || [])
          ])];

          // Filter users to show agent and their customers
          query.in('id', customerIds);
        } else {
          // Regular users can only see themselves
          query.eq('id', profile.id);
        }
      }

      const { data, error } = await query;

      if (error) {
        logger.error('[useUsers] Error fetching users:', error);
        throw error;
      }

      return data.map(user => ({
        id: user.id,
        full_name: user.full_name || '',
        email: user.email,
        user_role: user.user_role,
        avatar_url: user.avatar_url || '',
        created_at: user.created_at,
        updated_at: user.updated_at
      }));
    },
    enabled: !!profile
  });
} 