import { Team, TeamCreate, TeamUpdate, TeamMember } from '@/features/teams/types/team.types';
import { Skill } from '@/features/skills/types/skill.types';
import { TeamManagementService } from '@/features/teams/services/TeamManagementService';

const teamService = new TeamManagementService();

export const createTeam = async (team: TeamCreate): Promise<Team> => {
  return await teamService.createTeam(team);
};

export const updateTeam = async (id: string, team: TeamUpdate): Promise<Team> => {
  return await teamService.updateTeam(id, team);
};

export const deleteTeam = async (id: string): Promise<void> => {
  await teamService.deleteTeam(id);
};

export const getTeamMembers = async (teamId: string): Promise<TeamMember[]> => {
  return await teamService.getTeamMembers(teamId);
};

export const addTeamMember = async (teamId: string, userId: string): Promise<void> => {
  await teamService.addTeamMember(teamId, userId);
};

export const removeTeamMember = async (teamId: string, userId: string): Promise<void> => {
  await teamService.removeTeamMember(teamId, userId);
};

export const assignTeamLead = async (teamId: string, userId: string): Promise<void> => {
  await teamService.assignTeamLead(teamId, userId);
};

export const getTeamSkills = async (teamId: string): Promise<Skill[]> => {
  return await teamService.getTeamSkills(teamId);
};

export const assignSkillToTeam = async (teamId: string, skillId: string): Promise<void> => {
  await teamService.assignSkillToTeam(teamId, skillId);
};

export const removeSkillFromTeam = async (teamId: string, skillId: string): Promise<void> => {
  await teamService.removeSkillFromTeam(teamId, skillId);
}; 