import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks'
import { UIErrorBoundary } from '@/features/error-handling/components/ErrorBoundary'
import type { BaseProtectedRouteProps } from '@/features/auth/types/protection.types'

/**
 * @component BaseProtectedRoute
 * @description Base component for route protection. Handles session validation and loading states.
 */
export function BaseProtectedRoute({
  children,
  fallbackPath = '/login',
  loadingComponent = <div>Loading...</div>,
}: BaseProtectedRouteProps): JSX.Element {
  const location = useLocation()
  const { session, state } = useAuth()

  // Handle loading state
  if (state.isLoading || !state.isInitialized) {
    return <>{loadingComponent}</>
  }

  // Handle unauthenticated state
  if (!session) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />
  }

  // Wrap children in error boundary
  return (
    <UIErrorBoundary boundaryName="protected-route">
      {children}
    </UIErrorBoundary>
  )
} 