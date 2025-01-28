import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/core/supabase/client';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_role', 'agent');
      
      if (error) throw error;
      return data;
    }
  });
} 