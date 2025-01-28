import { supabase } from '@/core/supabase/client';
import { retry } from '@/lib/retry';
import type { Agent, AgentCreate, AgentUpdate, AgentTeamMembership } from '../types/agent.types';
import { logger } from '@/lib/logger';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Database } from '@/core/supabase/types/database.types';
import type { Skill } from '@/features/skills/types/skill.types';

const MAX_RETRIES = 3;
const BACKOFF_MS = 300;

// Use database types
type TeamMemberRow = Database['public']['Tables']['team_members']['Row'];
type TeamRow = Database['public']['Tables']['teams']['Row'];
type EntitySkillRow = Database['public']['Tables']['entity_skills']['Row'] & {
  skills: Skill;
};

// Combined type for team member with its team data
type TeamMemberWithTeam = TeamMemberRow & {
  teams: TeamRow;
};

export class AgentManagementService {
  // Create a new agent
  async createAgent(agent: AgentCreate): Promise<Agent> {
    return retry(async () => {
      // Create profile first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: agent.email,
          full_name: agent.name,
          user_role: 'agent'
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // Add team membership - everyone starts as a member
      const { error: teamError } = await supabase
        .from('team_members')
        .insert({
          user_id: profile.id,
          team_id: agent.teamId,
          team_member_role: 'member'  // Everyone starts as a member
        });

      if (teamError) {
        // Rollback profile creation
        await supabase.from('profiles').delete().match({ id: profile.id });
        throw teamError;
      }

      return this.getAgent(profile.id);
    }, MAX_RETRIES, BACKOFF_MS);
  }

  // Get agent by ID
  async getAgent(id: string): Promise<Agent> {
    return retry(async () => {
      // Get profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (profileError) throw profileError;

      // Get team memberships
      const { data: teams, error: teamsError } = await supabase
        .from('team_members')
        .select('*, teams(*)')
        .eq('user_id', id);

      if (teamsError) throw teamsError;

      // Get direct skills
      const { data: directSkills, error: skillsError } = await supabase
        .from('entity_skills')
        .select('*, skills(*)')
        .eq('entity_id', id)
        .eq('entity_type', 'agent')
        .is('deleted_at', null);

      if (skillsError) throw skillsError;

      // Get inherited skills from teams
      const teamIds = teams.map((t: TeamMemberWithTeam) => t.team_id);
      const { data: inheritedSkills, error: inheritedError } = await supabase
        .from('entity_skills')
        .select('*, skills(*)')
        .in('entity_id', teamIds)
        .eq('entity_type', 'team')
        .is('deleted_at', null);

      if (inheritedError) throw inheritedError;

      return {
        id: profile.id,
        name: profile.full_name ?? '',
        email: profile.email,
        role: teams.find((t: TeamMemberWithTeam) => t.team_member_role === 'lead') ? 'lead' : 'member',
        teams: teams.map((t: TeamMemberWithTeam) => ({
          teamId: t.team_id,
          role: t.team_member_role,
          joinedAt: t.joined_at ?? new Date().toISOString(),
          teamName: t.teams.name,
          ...(t.teams.description && { teamDescription: t.teams.description })
        })),
        directSkills: directSkills.map((s: EntitySkillRow) => s.skills),
        inheritedSkills: inheritedSkills.map((s: EntitySkillRow) => s.skills),
        created_at: profile.created_at ?? new Date().toISOString(),
        updated_at: profile.updated_at ?? new Date().toISOString()
      };
    }, MAX_RETRIES, BACKOFF_MS);
  }

  // Update agent
  async updateAgent(id: string, update: AgentUpdate): Promise<Agent> {
    return retry(async () => {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          ...(update.name && { full_name: update.name }),
          ...(update.email && { email: update.email })
        })
        .eq('id', id);

      if (updateError) throw updateError;

      if (update.role) {
        const { error: roleError } = await supabase
          .from('team_members')
          .update({ team_member_role: update.role })
          .eq('user_id', id)
        if (roleError) throw roleError;
      }

      return this.getAgent(id);
    }, MAX_RETRIES, BACKOFF_MS);
  }

  // Update team memberships
  async updateTeamMemberships(id: string, memberships: AgentTeamMembership[]): Promise<void> {
    return retry(async () => {
      // Start a transaction
      const { error } = await supabase.rpc('update_agent_teams' as any, {
        p_user_id: id,
        p_team_memberships: memberships
      });

      if (error) throw error;
    }, MAX_RETRIES, BACKOFF_MS);
  }

  // Subscribe to agent updates
  subscribeToAgentUpdates(id: string, callback: (agent: Agent) => void): () => void {
    const subscription = supabase
      .channel(`agent:${id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${id}`
      }, async (_payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => {
        try {
          const agent = await this.getAgent(id);
          callback(agent);
        } catch (error) {
          logger.error('Error processing agent update', { error });
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }
} 