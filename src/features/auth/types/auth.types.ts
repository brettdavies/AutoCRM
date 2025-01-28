import type { Session, User } from '@supabase/supabase-js'
import type { Database } from '@/core/supabase/types/database.types'

export type ProfileRow = Database['public']['Tables']['profiles']['Row']

/**
 * @interface AuthState
 * @description Core authentication state managed by the provider
 * @property {boolean} isLoading - Loading state for auth operations
 * @property {boolean} isInitialized - Whether auth system is initialized
 * @property {Error | null} error - Current auth error if any
 */
export interface AuthState {
  isLoading: boolean
  isInitialized: boolean
  error: Error | null
}

/**
 * @interface TeamContext
 * @description Team-related data and operations
 * @property {string} teamId - Current team ID
 * @property {Profile[]} teamMembers - List of team members
 */
export interface TeamContext {
  teamId: string
  teamMembers: Profile[]
}

/**
 * @interface AuthContextValue
 * @description Complete auth context including Supabase and custom state
 * @property {Session | null} session - Supabase session
 * @property {User | null} user - Supabase user
 * @property {Profile | null} profile - User profile from database
 * @property {TeamContext | null} team - Team context if applicable
 * @property {AuthState} state - Auth system state
 */
export interface AuthContextValue {
  // Supabase provided
  session: Session | null
  user: User | null
  
  // Our extensions
  profile: Profile | null
  team: TeamContext | null
  state: AuthState
  
  // Actions
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
  signInWithOAuth: (provider: OAuthProvider) => Promise<void>
  unlinkOAuthProvider: (provider: OAuthProvider) => Promise<void>
}

/**
 * @interface Profile
 * @extends {Omit<ProfileRow, 'oauth_metadata' | 'oauth_provider' | 'avatar_url' | 'deleted_at'>}
 * @description User profile with typed OAuth metadata
 */
export interface Profile extends Omit<ProfileRow, 'oauth_metadata' | 'oauth_provider' | 'avatar_url' | 'deleted_at'> {
  oauth_provider?: OAuthProvider
  oauth_metadata: OAuthMetadata
  user_role: UserRole
  team_role?: TeamRole
  team_id?: string
  avatar_url?: string
  deleted_at?: string | null
}

// Role type definition
export type UserRole = Database['public']['Enums']['user_role'];

// Team role type definition
export type TeamRole = Database['public']['Enums']['team_member_role'];

// Permissions interface matching our RLS policies
export interface RolePermissions {
  // Profile permissions
  canUpdateProfile: boolean
  canViewTeamProfiles: boolean
  canManageAllProfiles: boolean

  // Team permissions
  canViewTeam: boolean
  canManageTeams: boolean

  // Ticket permissions
  canViewTickets: boolean
  canCreateTickets: boolean
  canUpdateTickets: boolean
  canManageAllTickets: boolean

  // Conversation permissions
  canViewConversations: boolean
  canViewInternalNotes: boolean

  // Knowledge base permissions
  canManageKnowledgeBase: boolean
}

// Default permissions for each role
export const DEFAULT_PERMISSIONS: Record<UserRole, RolePermissions> = {
  customer: {
    canUpdateProfile: true,
    canViewTeamProfiles: false,
    canManageAllProfiles: false,
    canViewTeam: false,
    canManageTeams: false,
    canViewTickets: true,
    canCreateTickets: true,
    canUpdateTickets: false,
    canManageAllTickets: false,
    canViewConversations: true,
    canViewInternalNotes: false,
    canManageKnowledgeBase: false
  },
  agent: {
    canUpdateProfile: true,
    canViewTeamProfiles: true,
    canManageAllProfiles: false,
    canViewTeam: true,
    canManageTeams: false,
    canViewTickets: true,
    canCreateTickets: false,
    canUpdateTickets: true,
    canManageAllTickets: false,
    canViewConversations: true,
    canViewInternalNotes: true,
    canManageKnowledgeBase: true
  },
  admin: {
    canUpdateProfile: true,
    canViewTeamProfiles: true,
    canManageAllProfiles: true,
    canViewTeam: true,
    canManageTeams: true,
    canViewTickets: true,
    canCreateTickets: true,
    canUpdateTickets: true,
    canManageAllTickets: true,
    canViewConversations: true,
    canViewInternalNotes: true,
    canManageKnowledgeBase: true
  }
}

export type OAuthProvider = 'google' | 'github';

export interface OAuthMetadata {
  provider: OAuthProvider;
  provider_id: string;
  linked_providers?: {
    [key in OAuthProvider]?: {
      provider_id: string;
      email: string;
      linked_at: number;
    }
  }
}

/**
 * @interface OAuthError
 * @description OAuth specific error types
 */
export interface OAuthError extends Error {
  type: 'oauth_error';
  code: 'user_cancelled' | 'provider_error' | 'network_error';
  provider: OAuthProvider;
  originalError?: unknown;
} 