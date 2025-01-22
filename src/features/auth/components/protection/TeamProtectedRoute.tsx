import { Navigate } from 'react-router-dom'
import { RoleProtectedRoute } from './RoleProtectedRoute'
import { useTeamAccess } from '@/features/auth/hooks'
import type { TeamProtectedRouteProps } from '@/features/auth/types/protection.types'

/**
 * @component TeamProtectedRoute
 * @description Extends role protection with team-based access control
 */
export function TeamProtectedRoute({
  children,
  teamId,
  allowedRoles,
  fallbackPath,
  loadingComponent,
  unauthorizedPath,
  teamUnauthorizedPath = '/team-unauthorized',
  errorComponent
}: TeamProtectedRouteProps): JSX.Element {
  const hasTeamAccess = useTeamAccess(teamId)

  return (
    <RoleProtectedRoute
      allowedRoles={allowedRoles}
      fallbackPath={fallbackPath}
      loadingComponent={loadingComponent}
      unauthorizedPath={unauthorizedPath}
      errorComponent={errorComponent}
    >
      {hasTeamAccess ? (
        children
      ) : (
        <Navigate to={teamUnauthorizedPath} replace />
      )}
    </RoleProtectedRoute>
  )
} 