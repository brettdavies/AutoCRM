import { useAuth } from '../components/AuthProvider'

/**
 * @function useTeamAccess
 * @description Hook to check if current user has access to a specific team
 * @param teamId - ID of the team to check access for
 * @returns boolean indicating if user has access to the team
 */
export function useTeamAccess(teamId: string): boolean {
  const { profile, team } = useAuth()

  if (!profile) return false

  // Admin has access to all teams
  if (profile.user_role === 'admin') return true

  // Check if user is part of the team
  if (team?.teamId === teamId) return true

  return false
} 