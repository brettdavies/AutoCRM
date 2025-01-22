// Export core auth hook
export { useAuth } from '../components/AuthProvider'

// Export individual hooks
export { useProfile, useTeam, useAuthState, useRequireAuth } from './useAuth'
export { useTeamAccess } from './useTeamAccess.js'
export { useSession } from './useSession.js' 