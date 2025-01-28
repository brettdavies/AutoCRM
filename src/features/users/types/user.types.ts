import type { Database } from '@/core/supabase/types/database.types';

type TeamMemberRole = Database['public']['Enums']['team_member_role'];

export interface User {
  id: string;
  full_name: string;
  email: string;
  user_role: 'admin' | 'agent' | 'customer' | 'team_lead';
  avatar_url: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface UserUpdate {
  id: string;
  full_name?: string;
  email?: string;
  avatar_url?: string;
}

export interface TeamMembership {
  id: string;
  name: string;
  description?: string;
  role: 'lead' | 'member';
  skills: {
    id: string;
    name: string;
  }[];
}

export interface UserTeams {
  teams: TeamMembership[];
  isLoading: boolean;
  error: Error | null;
} 