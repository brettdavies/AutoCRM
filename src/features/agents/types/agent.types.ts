import { z } from 'zod';
import type { Skill } from '@/features/skills/types/skill.types';
import type { Database } from '@/core/supabase/types/database.types';

type TeamMemberRole = Database['public']['Enums']['team_member_role'];

export interface AgentTeamMembership {
  teamId: string;
  role: TeamMemberRole;
  joinedAt: string;
  teamName?: string;
  teamDescription?: string;
  teamMembers?: Array<{
    id: string;
    name: string;
    role: string;
  }>;
  teamSkills?: Array<{
    id: string;
    name: string;
    category: string;
  }>;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  role: TeamMemberRole;
  teams: AgentTeamMembership[];
  directSkills: Skill[];
  inheritedSkills: Skill[];
  created_at: string;
  updated_at: string;
}

export interface AgentCreate {
  name: string;
  email: string;
  teamId: string;  // Initial team assignment is required
}

export interface AgentUpdate {
  name?: string;
  email?: string;
  role?: TeamMemberRole;
  skillIds?: string[];
}

// Zod schemas for validation
export const agentCreateSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  teamId: z.string().uuid()
});

export const agentUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  role: z.enum(['member', 'lead']).optional()
});

export const agentTeamMembershipSchema = z.object({
  teamId: z.string().uuid(),
  role: z.enum(['member', 'lead']),
  isPrimary: z.boolean(),
  joinedAt: z.string().nullable()
}); 