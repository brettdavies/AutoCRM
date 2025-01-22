import { Navigate } from 'react-router-dom'
import { BaseProtectedRoute } from './BaseProtectedRoute'
import { useAuth } from '@/features/auth/hooks'
import type { RoleProtectedRouteProps } from '@/features/auth/types/protection.types'

/**
 * @component RoleProtectedRoute
 * @description Extends base protection with role-based access control
 */
export function RoleProtectedRoute({
  children,
  allowedRoles,
  fallbackPath,
  loadingComponent,
  unauthorizedPath = '/unauthorized',
  errorComponent
}: RoleProtectedRouteProps): JSX.Element {
  const { profile } = useAuth()

  return (
    <BaseProtectedRoute
      fallbackPath={fallbackPath}
      loadingComponent={loadingComponent}
      errorComponent={errorComponent}
    >
      {profile && allowedRoles.includes(profile.user_role) ? (
        children
      ) : (
        <Navigate to={unauthorizedPath} replace />
      )}
    </BaseProtectedRoute>
  )
} 