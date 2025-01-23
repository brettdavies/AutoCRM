import { useAuth as useAuthProvider } from '../components/AuthProvider'
import type { Profile } from '../types/auth.types'
import { supabase } from '@/core/supabase'
import type { UserRole } from '@/core/supabase/types/database.types'

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
  const { session, profile, signInWithOAuth } = useAuthProvider()

  const signInWithDemo = async (role: UserRole) => {
    const demoCredentials = {
      admin: {
        email: 'admin@example.com',
        password: 'admin123'
      },
      agent: {
        email: 'tech_agent1@example.com',
        password: 'agent123'
      },
      customer: {
        email: 'customer1@example.com',
        password: 'customer123'
      }
    }

    const { error } = await supabase.auth.signInWithPassword(demoCredentials[role])
    if (error) throw error
  }

  const signIn = async ({ email, password }: { email: string; password: string }) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
  }

  const signInWithMagicLink = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) throw error
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })
    if (error) throw error
  }

  const signUp = async ({ email, password, full_name }: { email: string; password: string; full_name: string }) => {
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          role: 'customer' // Default role for new signups
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (signUpError) throw signUpError
  }

  return {
    session,
    profile,
    signOut: () => supabase.auth.signOut(),
    signInWithDemo,
    signIn,
    signInWithMagicLink,
    resetPassword,
    signUp,
    signInWithOAuth,
    isAdmin: profile?.role === 'admin',
    isAgent: profile?.role === 'agent',
    isCustomer: profile?.role === 'customer',
    isAuthenticated: !!session
  }
} 