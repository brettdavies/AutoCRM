import { useAuth as useAuthProvider } from '../components/AuthProvider'
import type { Profile } from '../types/auth.types'
import { useSessionContext } from '@supabase/auth-helpers-react'

/**
 * @function useProfile
 * @description Hook to access current user profile
 * @param {string} userId - Optional user ID to fetch profile for
 * @returns {Profile | null} Current user profile
 */
export function useProfile(_userId?: string): Profile | null {
  const { profile } = useAuthProvider()
  return profile
}

/**
 * @function useTeam
 * @description Hook to access current team context
 * @returns {Profile[] | null} Current team members
 */
export function useTeam(): Profile[] | null {
  const { team } = useAuthProvider()
  return team?.teamMembers ?? null
}

/**
 * @function useAuthState
 * @description Hook to access auth loading and error states
 * @returns {{ isLoading: boolean, error: Error | null }} Auth state
 */
export function useAuthState() {
  const { state } = useAuthProvider()
  return {
    isLoading: state.isLoading,
    error: state.error
  }
}

/**
 * @function useRequireAuth
 * @description Hook to enforce authentication
 * @throws {Error} If user is not authenticated
 */
export function useRequireAuth() {
  const { session, state } = useAuthProvider()
  
  if (!state.isInitialized) {
    throw new Error('Auth not initialized')
  }
  
  if (!session) {
    throw new Error('Authentication required')
  }
  
  return session
}

/**
 * @function useTeamAccess
 * @description Hook to check team access
 * @param {string} teamId - Team ID to check
 * @returns {boolean} Whether user has access to team
 */
export function useTeamAccess(teamId: string): boolean {
  const { team } = useAuthProvider()
  return team?.teamId === teamId
}

export function useAuth() {
  const { session } = useSessionContext();
  const profile = useProfile(session?.user?.id);

  const isAdmin = session?.user?.user_metadata?.role === 'admin';
  const isAgent = session?.user?.user_metadata?.role === 'agent';
  const isCustomer = session?.user?.user_metadata?.role === 'customer';

  return {
    session,
    profile,
    isAdmin,
    isAgent,
    isCustomer,
    isAuthenticated: !!session?.user
  };
} 