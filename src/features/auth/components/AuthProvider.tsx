import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { AuthContextValue, AuthState, TeamContext, Profile, OAuthProvider, OAuthError, TeamRole, ProfileRow } from '../types/auth.types'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/core/supabase/client'

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
        .select()
        .eq('id', session.user.id)
        .single()

      if (error) throw error

      // Convert database profile to domain profile
      const dbProfile = data as ProfileRow

      // Map profile fields
      const profile: Profile = {
        id: dbProfile.id,
        email: dbProfile.email,
        full_name: dbProfile.full_name || '',
        user_role: dbProfile.user_role,
        created_at: dbProfile.created_at,
        updated_at: dbProfile.updated_at,
        last_login_at: dbProfile.last_login_at,
        is_active: dbProfile.is_active,
        preferences: dbProfile.preferences,
        avatar_url: dbProfile.avatar_url || '',
        oauth_metadata: {
          provider: 'google',
          provider_id: session.user.id
        },
        deleted_at: dbProfile.deleted_at || null
      }

      // Optional fields from user metadata
      if (session.user.user_metadata?.oauth_provider) {
        profile.oauth_provider = session.user.user_metadata.oauth_provider as OAuthProvider
      }
      if (session.user.user_metadata?.team_role) {
        profile.team_role = session.user.user_metadata.team_role as TeamRole
      }
      if (session.user.user_metadata?.team_id) {
        profile.team_id = session.user.user_metadata.team_id
      }
      return profile
    },
    enabled: !!session?.user?.id
  })

  // Fetch team data when profile is available
  const { data: team } = useQuery({
    queryKey: ['team', profile?.team_id],
    queryFn: async () => {
      if (!profile?.team_id) return null;
      
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('id', profile.team_id)
        .single();

      if (teamError) {
        console.error('Failed to fetch team:', teamError);
        return null;
      }

      if (!teamData) return null;

      console.log('Team Data:', teamData);

      // First get team members
      const { data: teamMembers, error: membersError } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', profile.team_id);

      console.log('Raw Team Members Response:', teamMembers);

      if (membersError) {
        console.error('Failed to fetch team members:', membersError);
        console.error('User role:', session?.user?.user_metadata?.role);
        console.error('Team ID:', profile.team_id);
        return null;
      }

      // Then fetch profiles for all team members
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', teamMembers.map(member => member.user_id));

      console.log('Raw Profiles Data:', profilesData);

      if (profilesError) {
        console.error('Failed to fetch member profiles:', profilesError);
        return null;
      }

      // Create a map of profiles for easy lookup
      const profileMap = new Map(profilesData?.map(profile => [profile.id, profile]));
      console.log('Profile Map:', Object.fromEntries(profileMap));

      // Convert database profiles to domain profiles
      const members = teamMembers
        .map(member => {
          const profile = profileMap.get(member.user_id);
          if (!profile) return null;

          return {
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name,
            user_role: session?.user?.user_metadata?.role || 'customer',
            created_at: profile.created_at,
            updated_at: profile.updated_at,
            last_login_at: profile.last_login_at,
            is_active: profile.is_active,
            preferences: profile.preferences,
            oauth_metadata: {
              provider: profile.oauth_provider as OAuthProvider || 'google',
              provider_id: profile.id
            },
            ...(teamData.id ? { team_id: teamData.id } : {})
          } satisfies Profile;
        })
        .filter((member): member is Profile => member !== null);

      console.log('Final members array:', members);

      const result = {
        teamId: teamData.id,
        teamMembers: members
      } satisfies TeamContext;
      console.log('Final team context:', result);
      return result;
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

  const signInWithOAuth = useCallback(async (provider: OAuthProvider) => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      })
      
      if (error) throw error
      if (!data.url) throw new Error('No OAuth URL returned')
      
      // Redirect to provider
      window.location.href = data.url
    } catch (error) {
      console.error('OAuth error:', error)
      const oauthError: OAuthError = {
        type: 'oauth_error',
        code: 'provider_error',
        message: error instanceof Error ? error.message : 'Failed to initialize OAuth flow',
        provider,
        originalError: error,
        name: 'OAuthError'
      }
      setState(prev => ({ ...prev, error: oauthError }))
    }
  }, [])

  const unlinkOAuthProvider = useCallback(async (provider: OAuthProvider) => {
    if (!session?.user?.id) throw new Error('No authenticated user')
    
    try {
      const { error } = await supabase.rpc('unlink_oauth_account', {
        user_id: session.user.id,
        provider
      })
      
      if (error) throw error
      
      // Refresh profile data
      await queryClient.invalidateQueries({ queryKey: ['profile', session.user.id] })
    } catch (error) {
      console.error('Failed to unlink provider:', error)
      setState(prev => ({ 
        ...prev, 
        error: new Error('Failed to unlink provider') 
      }))
    }
  }, [session?.user?.id, queryClient])

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    profile: profile ?? null,
    team: team ?? null,
    state,
    signOut,
    refreshSession,
    signInWithOAuth,
    unlinkOAuthProvider
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