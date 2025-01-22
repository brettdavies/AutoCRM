import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { AuthContextValue, AuthState, TeamContext, Profile } from '../types/auth.types'
import type { ProfileRow } from '@/core/supabase/types/database.types'
import type { Session } from '@supabase/supabase-js'

const supabase = createBrowserClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

/**
 * @constant AuthContext
 * @description React context for auth state
 */
export const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * @interface AuthProviderProps
 * @description Props for AuthProvider component
 */
interface AuthProviderProps {
  children: ReactNode
}

/**
 * @function AuthProvider
 * @description Provider component for auth state
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isInitialized: false,
    error: null
  })
  
  const [session, setSession] = useState<Session | null>(null)
  const queryClient = useQueryClient()

  const isSessionValid = useCallback((session: Session | null) => {
    if (!session) return false
    const expiresAt = session.expires_at ? new Date(session.expires_at * 1000) : null
    return expiresAt ? expiresAt > new Date() : false
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && !isSessionValid(session)) {
        // Session exists but is invalid, attempt refresh
        supabase.auth.refreshSession().then(({ data: { session: newSession } }) => {
          setSession(newSession)
        }).catch((error) => {
          console.error('Session refresh failed:', error)
          setSession(null)
        })
      } else {
        setSession(session)
      }
      setState((prev: AuthState) => ({ ...prev, isInitialized: true, isLoading: false }))
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'TOKEN_REFRESHED') {
        // Invalidate queries that depend on auth
        await queryClient.invalidateQueries({ queryKey: ['profile'] })
        await queryClient.invalidateQueries({ queryKey: ['team'] })
      }
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [queryClient, isSessionValid])

  // Fetch profile data when user is available
  const { data: profile } = useQuery({
    queryKey: ['profile', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) throw new Error('No user ID')
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error) throw error

      // Convert database profile to domain profile
      const dbProfile = data as ProfileRow
      return {
        ...dbProfile,
        team_id: session.user.user_metadata?.team_id || null
      } satisfies Profile
    },
    enabled: !!session?.user?.id
  })

  // Fetch team data when profile is available
  const { data: team } = useQuery({
    queryKey: ['team', profile?.team_id],
    queryFn: async () => {
      if (!profile?.team_id) throw new Error('No team ID')
      
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('id', profile.team_id)
        .single()

      if (teamError) throw teamError

      const { data: members, error: membersError } = await supabase
        .from('profiles')
        .select('*')
        .eq('team_id', profile.team_id)

      if (membersError) throw membersError

      // Convert database profiles to domain profiles
      const teamMembers = members.map(member => ({
        ...(member as ProfileRow),
        team_id: member.team_id || null
      })) satisfies Profile[]

      return {
        teamId: teamData.id,
        teamMembers
      } satisfies TeamContext
    },
    enabled: !!profile?.team_id
  })

  // Initialize real-time subscriptions
  useEffect(() => {
    if (!profile?.id) return

    const channel = supabase
      .channel('profile-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${profile.id}` },
        (payload) => {
          queryClient.setQueryData(['profile', profile.id], payload.new)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile?.id, queryClient, supabase])

  // Actions
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      queryClient.clear()
    } catch (error) {
      setState((prev: AuthState) => ({ ...prev, error: new Error('Failed to sign out') }))
    }
  }

  const refreshSession = async () => {
    try {
      const { error } = await supabase.auth.refreshSession()
      if (error) throw error
    } catch (error) {
      setState((prev: AuthState) => ({ ...prev, error: new Error('Failed to refresh session') }))
    }
  }

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    profile: profile ?? null,
    team: team ?? null,
    state,
    signOut,
    refreshSession
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * @function useAuth
 * @description Hook to access auth context
 * @throws {Error} If used outside AuthProvider
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
} 