import { AuthError } from '@supabase/supabase-js'
import { 
  UIError, 
  NavigationError, 
  StateError,
  SupabaseAuthError,
  DatabaseError,
  ErrorCode,
  ValidationError
} from '../types'
import { z } from 'zod'

/**
 * @function handleSupabaseError
 * @description Converts Supabase errors to our error types
 * @param {AuthError} error - Original Supabase error
 * @returns {SupabaseAuthError} Converted error
 */
export function handleSupabaseError(error: AuthError): SupabaseAuthError {
  // Map Supabase error codes to our error codes
  const codeMap: Record<string, ErrorCode> = {
    'auth/invalid-token': ErrorCode.TOKEN_INVALID,
    'auth/session-expired': ErrorCode.SESSION_EXPIRED
  }

  return new SupabaseAuthError(
    codeMap[error.name] || 'AUTH_UNKNOWN',
    error.message,
    error.name,
    error
  )
}

/**
 * @function handleDatabaseError
 * @description Processes database-related errors
 * @param {unknown} error - Original error
 * @param {string} operation - Database operation
 * @param {string} table - Affected table
 * @returns {DatabaseError} Processed error
 */
export function handleDatabaseError(
  error: unknown,
  operation: string,
  table: string
): DatabaseError {
  if (error instanceof AuthError) {
    return new DatabaseError(
      ErrorCode.RLS_VIOLATION,
      'Access denied by security policy',
      error.name,
      operation,
      table,
      error
    )
  }

  return new DatabaseError(
    ErrorCode.QUERY_FAILED,
    'Database operation failed',
    'unknown',
    operation,
    table,
    error
  )
}

/**
 * @function handleUIError
 * @description Processes UI-related errors
 * @param {unknown} error - Original error
 * @param {string} component - Component name
 * @returns {UIError} Processed error
 */
export function handleUIError(error: unknown, component: string): UIError {
  return new UIError(
    ErrorCode.COMPONENT_RENDER_FAILED,
    'Component rendering failed',
    component,
    error
  )
}

/**
 * @function handleNavigationError
 * @description Processes navigation-related errors
 * @param {unknown} error - Original error
 * @param {string} route - Target route
 * @returns {NavigationError} Processed error
 */
export function handleNavigationError(error: unknown, route: string): NavigationError {
  return new NavigationError(
    ErrorCode.ROUTE_ACCESS_DENIED,
    'Navigation failed',
    route,
    error
  )
}

/**
 * @function handleStateError
 * @description Processes state management errors
 * @param {unknown} error - Original error
 * @param {string} state - State description
 * @returns {StateError} Processed error
 */
export function handleStateError(error: unknown, state: string): StateError {
  return new StateError(
    ErrorCode.STATE_CORRUPTION,
    'State management failed',
    state,
    error
  )
}

/**
 * @function handleValidationError
 * @description Processes validation-related errors
 * @param {unknown} error - Original error
 * @param {string} field - Field that failed validation
 * @param {unknown} value - Invalid value
 * @returns {ValidationError} Processed error
 */
export function handleValidationError(
  error: unknown,
  field: string,
  value: unknown
): ValidationError {
  // Handle Zod validation errors
  if (error instanceof z.ZodError) {
    const firstError = error.errors[0];
    if (!firstError) {
      return new ValidationError(
        ErrorCode.INVALID_VALUE,
        'Unknown validation error',
        field,
        value,
        error
      );
    }
    return new ValidationError(
      ErrorCode.INVALID_FORMAT,
      firstError.message,
      field,
      value,
      error
    );
  }

  // Handle business rule violations
  if (error instanceof ValidationError) {
    return error;
  }

  // Handle unknown validation errors
  return new ValidationError(
    ErrorCode.INVALID_VALUE,
    'Validation failed',
    field,
    value,
    error
  );
} 