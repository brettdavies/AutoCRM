import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/core/supabase/client';
import logger from '@/shared/utils/logger.utils';
import type { InheritedSkillInfo } from '@/features/skills/components/SkillMatrix';

export function useUserTeams(userId: string) {
  return useQuery({
    queryKey: ['user-teams', userId],
    queryFn: async () => {
      logger.debug('[useUserTeams] Fetching teams for user', { userId });
      
      // First get the teams
      const { data: teamMembers, error: teamError } = await supabase
        .from('team_members')
        .select(`
          team_member_role,
          teams!inner (
            id,
            name,
            description
          )
        `)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .is('teams.deleted_at', null);

      if (teamError) {
        logger.error('[useUserTeams] Error fetching teams:', teamError);
        throw teamError;
      }

      // Then get skills for each team
      const teams = await Promise.all(
        teamMembers.map(async (member) => {
          const { data: skills, error: skillsError } = await supabase
            .from('entity_skills')
            .select(`
              skills (
                id,
                name
              )
            `)
            .eq('entity_id', member.teams.id)
            .eq('entity_type', 'team')
            .is('deleted_at', null);

          if (skillsError) {
            logger.error('[useUserTeams] Error fetching team skills:', skillsError);
            return {
              id: member.teams.id,
              name: member.teams.name,
              description: member.teams.description || '',
              role: member.team_member_role,
              skills: []
            };
          }

          return {
            id: member.teams.id,
            name: member.teams.name,
            description: member.teams.description || '',
            role: member.team_member_role,
            skills: skills?.map(s => ({
              id: s.skills.id,
              name: s.skills.name,
              teams: [{
                id: member.teams.id,
                name: member.teams.name
              }]
            })) || []
          };
        })
      );

      // Combine skills from all teams, merging team info for duplicate skills
      const skillMap = new Map<string, InheritedSkillInfo>();
      teams.forEach(team => {
        team.skills.forEach(skill => {
          const existingSkill = skillMap.get(skill.name);
          if (existingSkill) {
            existingSkill.teams.push({
              id: team.id,
              name: team.name
            });
          } else {
            skillMap.set(skill.name, {
              name: skill.name,
              teams: [{
                id: team.id,
                name: team.name
              }]
            });
          }
        });
      });

      // Convert teams to TeamMembership format
      return teams.map(team => ({
        ...team,
        skills: team.skills.map(s => ({
          id: s.id,
          name: s.name
        }))
      }));
    },
    enabled: !!userId
  });
} 