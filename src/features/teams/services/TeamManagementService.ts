import { supabase } from '@/core/supabase/client';
import { retry } from '@/lib/retry';
import type { Team, TeamCreate, TeamMemberRole, TeamUpdate, TeamListItem } from '../types/team.types';
import type { Skill } from '@/features/skills/types/skill.types';
import logger from '@/shared/utils/logger.utils';

const MAX_RETRIES = 3;
const BACKOFF_MS = 300;

export class TeamManagementService {
  private async checkRole(requiredRole: 'team_manager' | 'admin'): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Authentication required');

    // Check for admin first
    const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin');
    if (adminError) {
      logger.error('[TeamManagementService] Error checking admin role:', adminError);
      throw new Error('Failed to verify permissions');
    }
    
    if (isAdmin) return; // Admin can do everything

    // If team_manager role is required, check if user is team lead
    if (requiredRole === 'team_manager') {
      const { data: isTeamLead, error: teamLeadError } = await supabase.rpc('is_team_lead');
      if (teamLeadError) {
        logger.error('[TeamManagementService] Error checking team lead role:', teamLeadError);
        throw new Error('Failed to verify permissions');
      }
      
      if (!isTeamLead) {
        throw new Error('Insufficient permissions: Must be a team lead or admin');
      }
    }
  }
  
  private handleError(error: { message: string; code?: string } | null, operation: string): never {
    if (!error) throw new Error(`Failed to ${operation}: Unknown error`);
    
    // Map database errors to user-friendly messages
    if (error.code === '23505') {
      throw new Error('A team with this name already exists');
    }
    throw new Error(`Failed to ${operation}: ${error.message}`);
  }

  async getTeamList(): Promise<TeamListItem[]> {
    return retry(async () => {
      logger.debug('[TeamManagementService] Fetching team list');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('user_role')
        .eq('id', user.id)
        .single();

      // Base query to get teams with member count
      let query = supabase
        .from('teams')
        .select(`
          id,
          name,
          team_members!inner (
            user_id
          ),
          member_count:team_members(count)
        `)
        .is('deleted_at', null);

      // If not admin, only show teams the user is a member of
      if (userProfile?.user_role !== 'admin') {
        query = query.eq('team_members.user_id', user.id);
      }

      const { data, error } = await query.order('name', { ascending: true });

      if (error) {
        logger.error('[TeamManagementService] Error fetching team list:', error);
        this.handleError(error, 'fetch team list');
      }

      if (!data) {
        logger.warn('[TeamManagementService] No teams data returned');
        return [];
      }

      return data.map(team => ({
        id: team.id,
        name: team.name,
        memberCount: team.member_count[0]?.count ?? 0
      }));
    }, MAX_RETRIES, BACKOFF_MS);
  }

  async getTeams(): Promise<Team[]> {
    return retry(async () => {
      console.log('Fetching teams...');
      const { data, error } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          description,
          created_at,
          updated_at
        `)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching teams:', error);
        this.handleError(error, 'fetch teams');
      }

      console.log('Teams data:', data);

      if (!data) {
        console.warn('No teams data returned');
        return [];
      }

      return data.map(team => ({
        id: team.id,
        name: team.name,
        description: team.description || '',
        created_at: team.created_at,
        updated_at: team.updated_at,
        members: [],
        skills: []
      }));
    }, MAX_RETRIES, BACKOFF_MS);
  }

  async createTeam(team: TeamCreate): Promise<Team> {
    await this.checkRole('team_manager');

    return retry(async () => {
      const { data, error } = await supabase
        .from('teams')
        .insert(team)
        .select('*')
        .single();

      if (error) this.handleError(error, 'create team');
      return { ...data, members: [], skills: [] };
    }, MAX_RETRIES, BACKOFF_MS);
  }

  async updateTeam(id: string, team: TeamUpdate): Promise<Team> {
    await this.checkRole('team_manager');

    return retry(async () => {
      const { data, error } = await supabase
        .from('teams')
        .update(team)
        .eq('id', id)
        .select('*')
        .single();

      if (error) this.handleError(error, 'update team');
      return { ...data, members: [], skills: [] };
    }, MAX_RETRIES, BACKOFF_MS);
  }

  async deleteTeam(id: string): Promise<void> {
    await this.checkRole('admin');

    return retry(async () => {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', id);

      if (error) this.handleError(error, 'delete team');
    }, MAX_RETRIES, BACKOFF_MS);
  }

  async assignTeamLead(teamId: string, userId: string): Promise<void> {
    logger.debug('[TeamManagementService] Starting assignTeamLead', { teamId, userId });
    
    try {
      await this.checkRole('team_manager');
      logger.debug('[TeamManagementService] Role check passed');
    } catch (error) {
      logger.error('[TeamManagementService] Role check failed:', error);
      throw error;
    }

    return retry(async () => {
      logger.debug('[TeamManagementService] Assigning team lead', { teamId, userId });
      
      // First, demote the current lead to member
      const { data: currentLead, error: leadQueryError } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('team_id', teamId)
        .eq('team_member_role', 'lead')
        .single();

      if (leadQueryError) {
        logger.error('[TeamManagementService] Error finding current lead:', leadQueryError);
        this.handleError(leadQueryError, 'find current lead');
      }

      logger.debug('[TeamManagementService] Current lead found:', currentLead);

      if (currentLead) {
        const { error: demoteError } = await supabase
          .from('team_members')
          .update({ team_member_role: 'member' })
          .eq('team_id', teamId)
          .eq('user_id', currentLead.user_id);

        if (demoteError) {
          logger.error('[TeamManagementService] Error demoting current lead:', demoteError);
          this.handleError(demoteError, 'demote current lead');
        }
        logger.debug('[TeamManagementService] Successfully demoted current lead');
      }

      // Then, promote the new lead
      const { error: promoteError } = await supabase
        .from('team_members')
        .upsert({
          team_id: teamId,
          user_id: userId,
          team_member_role: 'lead'
        });

      if (promoteError) {
        logger.error('[TeamManagementService] Error promoting new lead:', promoteError);
        this.handleError(promoteError, 'assign team lead');
      }

      logger.debug('[TeamManagementService] Successfully assigned new team lead');
    }, MAX_RETRIES, BACKOFF_MS);
  }

  async addTeamMember(teamId: string, userId: string): Promise<void> {
    await this.checkRole('team_manager');
    

    return retry(async () => {
      const { error } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: userId,
          team_member_role: 'member'
        });

      if (error) this.handleError(error, 'add team member');
    }, MAX_RETRIES, BACKOFF_MS);
  }

  async removeTeamMember(teamId: string, userId: string): Promise<void> {
    await this.checkRole('team_manager');

    return retry(async () => {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .match({ team_id: teamId, user_id: userId });

      if (error) this.handleError(error, 'remove team member');
    }, MAX_RETRIES, BACKOFF_MS);
  }

  async getTeamMembers(teamId: string): Promise<Team['members']> {
    return retry(async () => {
      logger.debug('[TeamManagementService] Fetching team members', { teamId });
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          user_id,
          team_member_role,
          joined_at,
          profiles!team_members_user_id_fkey1(
            full_name,
            email,
            user_role,
            avatar_url,
            created_at,
            updated_at
          )
        `)
        .eq('team_id', teamId) as unknown as {
          data: Array<{
            user_id: string;
            team_member_role: TeamMemberRole;
            joined_at: string | null;
            profiles: {
              full_name: string;
              email: string;
              user_role: string;
              avatar_url: string;
              created_at: string | null;
              updated_at: string | null;
            };
          }>;
          error: any;
        };

      if (error) {
        logger.error('[TeamManagementService] Error fetching team members:', error);
        this.handleError(error, 'get team members');
      }

      logger.debug('[TeamManagementService] Team members fetched:', data);

      const members = data.map(member => ({
        id: member.user_id,
        full_name: member.profiles.full_name || 'Unknown User',
        email: member.profiles.email,
        user_role: (member.profiles.user_role as 'admin' | 'agent' | 'customer') || 'agent',
        avatar_url: member.profiles.avatar_url || '',
        created_at: member.profiles.created_at || member.joined_at || new Date().toISOString(),
        updated_at: member.profiles.updated_at || member.joined_at || new Date().toISOString(),
        role: member.team_member_role,
        joined_at: member.joined_at
      }));

      // Sort members: team lead first, then others alphabetically
      return members.sort((a, b) => {
        if (a.role === 'lead') return -1;
        if (b.role === 'lead') return 1;
        return a.full_name.localeCompare(b.full_name);
      });
    }, MAX_RETRIES, BACKOFF_MS);
  }

  async getTeamSkills(teamId: string): Promise<Skill[]> {
    const { data, error } = await supabase
      .from('entity_skills')
      .select(`
        skill_id,
        skills (
          id,
          name,
          category,
          created_at,
          updated_at,
          created_by
        )
      `)
      .match({
        entity_id: teamId,
        entity_type: 'team',
        deleted_at: null
      });

    if (error) throw new Error(`Failed to fetch team skills: ${error.message}`);
    return data.map(item => item.skills);
  }

  async assignSkillToTeam(teamId: string, skillId: string): Promise<void> {
    const { error } = await supabase
      .from('entity_skills')
      .insert({
        entity_id: teamId,
        entity_type: 'team',
        skill_id: skillId
      });

    if (error) throw new Error(`Failed to assign skill to team: ${error.message}`);
  }

  async removeSkillFromTeam(teamId: string, skillId: string): Promise<void> {
    const { error } = await supabase
      .from('entity_skills')
      .delete()
      .match({
        entity_id: teamId,
        entity_type: 'team',
        skill_id: skillId
      });

    if (error) throw new Error(`Failed to remove skill from team: ${error.message}`);
  }

  async subscribeToTeamUpdates(
    teamId: string,
    callback: (payload: any) => void
  ): Promise<() => void> {
    const channel = supabase
      .channel(`team:${teamId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'teams',
          filter: `id=eq.${teamId}`
        },
        callback
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }
}