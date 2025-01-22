import type { Session, User } from '@supabase/supabase-js'
import type { ProfileRow } from '@/core/supabase/types/database.types'

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
}

/**
 * @interface Profile
 * @description Domain model for user profile, extending database profile with metadata
 */
export interface Profile extends ProfileRow {
  // Additional fields from metadata
  team_id: string | null
}

// Role type definition
export type UserRole = 'customer' | 'agent' | 'admin';

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