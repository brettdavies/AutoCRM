import { supabase } from '@/core/supabase/client';
import { getAvatarUrl } from './AvatarService';
import type { User, UserUpdate } from '../types/user.types';
import type { Skill } from '@/features/skills/types/skill.types';
import { logger } from '@/lib/logger';

export class UserService {
  async getUser(userId: string): Promise<User> {
    logger.debug('Fetching user details', { userId });
    
    const { data, error } = await supabase
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
      .eq('id', userId)
      .single();

    if (error) {
      logger.error('Failed to fetch user', { error });
      throw new Error(`Failed to fetch user: ${error.message}`);
    }

    if (!data) {
      logger.error('No user found', { userId });
      throw new Error('User not found');
    }

    if (!data.email) {
      logger.error('User has no email', { userId });
      throw new Error('User has no email');
    }

    // Get avatar URL with fallbacks
    let avatarUrl = data.avatar_url;
    if (!avatarUrl && data.email) {
      try {
        avatarUrl = await getAvatarUrl(data.email || '');
      } catch (error) {
        logger.warn('Failed to get avatar URL', { error });
        avatarUrl = ''; // Will use Dicebear as final fallback in the UI
      }
    }

    // Extract username from email and use it as fallback for name
    const username = data.email.split('@')[0];

    return {
      id: data.id,
      full_name: data.full_name || username || '',
      email: data.email,
      user_role: data.user_role,
      avatar_url: avatarUrl || '',
      created_at: data.created_at || new Date().toISOString(),
      updated_at: data.updated_at || new Date().toISOString()
    };
  }

  async updateUser({ id, ...updates }: UserUpdate): Promise<User> {
    logger.debug('[UserService] Updating user', { id, updates });

    // If clearing avatar_url, ensure it's properly set to null
    const sanitizedUpdates = {
      ...updates,
      avatar_url: updates.avatar_url === undefined ? null : updates.avatar_url === '' ? null : updates.avatar_url
    };

    const { data, error } = await supabase
      .from('profiles')
      .update(sanitizedUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('[UserService] Error updating user:', error);
      throw error;
    }

    // If no avatar_url, try Gravatar then Dicebear
    let avatarUrl = data.avatar_url;
    if (!avatarUrl && data.email) {
      try {
        avatarUrl = await getAvatarUrl(data.email || '');
      } catch (error) {
        logger.warn('Failed to get avatar URL', { error });
        avatarUrl = ''; // Will use Dicebear as final fallback in the UI
      }
    }

    return {
      id: data.id,
      full_name: data.full_name || '',
      email: data.email,
      user_role: data.user_role,
      avatar_url: avatarUrl || '',
      created_at: data.created_at || '',
      updated_at: data.updated_at || ''
    };
  }

  async getUserTeams(userId: string): Promise<string[]> {
    logger.debug('Fetching user teams', { userId });
    
    const { data, error } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', userId)
      .is('deleted_at', null);

    if (error) {
      logger.error('Failed to fetch user teams', { error });
      throw new Error(`Failed to fetch user teams: ${error.message}`);
    }

    return data.map(team => team.team_id);
  }

  async getUserSkills(userId: string): Promise<Skill[]> {
    logger.debug('Fetching user skills', { userId });
    
    // Get all teams the user is a member of
    const { data: teamResults, error: teamError } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', userId)
      .is('deleted_at', null);

    if (teamError) {
      logger.error('Failed to fetch user team ID', { error: teamError });
      throw new Error(`Failed to fetch user team ID: ${teamError.message}`);
    }

    if (!teamResults?.length) {
      logger.debug('User has no teams', { userId });
      return [];
    }

    // Get team IDs
    const teamIds = teamResults.map(team => team.team_id);

    // Then fetch all teams' skills
    const { data: skills, error: skillsError } = await supabase
      .from('entity_skills')
      .select(`
        skills (
          id,
          name,
          category,
          created_at,
          updated_at,
          created_by
        )
      `)
      .in('entity_id', teamIds)
      .eq('entity_type', 'team')
      .is('deleted_at', null);

    if (skillsError) {
      logger.error('Failed to fetch team skills', { error: skillsError });
      throw new Error(`Failed to fetch team skills: ${skillsError.message}`);
    }

    // Deduplicate skills since a user could have the same skill from multiple teams
    const uniqueSkills = Array.from(new Set((skills || []).map(item => item.skills)));
    return uniqueSkills;
  }
} 