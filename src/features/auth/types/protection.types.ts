import type { ReactNode } from 'react'
import type { UserRole } from './auth.types'

/**
 * @interface BaseProtectedRouteProps
 * @description Base props for all protected route components
 */
export interface BaseProtectedRouteProps {
  children: ReactNode
  fallbackPath: string
  loadingComponent: ReactNode
  errorComponent?: ReactNode
}

/**
 * @interface RoleProtectedRouteProps
 * @description Props for role-based protection, extending base props
 */
export interface RoleProtectedRouteProps extends Omit<BaseProtectedRouteProps, 'children'> {
  children: ReactNode
  allowedRoles: readonly UserRole[]
  unauthorizedPath: string
}

/**
 * @interface TeamProtectedRouteProps
 * @description Props for team-based protection, extending role props
 */
export interface TeamProtectedRouteProps extends Omit<RoleProtectedRouteProps, 'children'> {
  children: ReactNode
  teamId: string
  teamUnauthorizedPath: string
}

/**
 * @type ProtectionLevel
 * @description Available protection levels for routes
 */
export type ProtectionLevel = 'base' | 'role' | 'team'

/**
 * @interface ProtectionConfig
 * @description Configuration for protected routes
 */
export interface ProtectionConfig {
  level: ProtectionLevel
  roles?: readonly UserRole[]
  teamId?: string
  paths: {
    fallback: string
    unauthorized?: string
    teamUnauthorized?: string
  }
} 