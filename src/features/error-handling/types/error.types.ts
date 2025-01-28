/**
 * @class BaseAuthError
 * @extends Error
 * @description Base error class for authentication system
 * @property {string} code - Unique error identifier
 * @property {string} message - Human-readable error message
 * @property {unknown} [cause] - Original error that caused this error
 */
export class BaseAuthError extends Error {
  readonly code: string;
  readonly cause?: unknown;

  constructor(code: string, message: string, cause?: unknown) {
    super(message);
    this.name = 'BaseAuthError';
    this.code = code;
    this.cause = cause;
  }
}

/**
 * @class UIError
 * @extends BaseAuthError
 * @description Errors related to UI rendering and state management
 * @property {string} component - Name of component where error occurred
 */
export class UIError extends BaseAuthError {
  readonly component: string;

  constructor(code: string, message: string, component: string, cause?: unknown) {
    super(code, message, cause);
    this.name = 'UIError';
    this.component = component;
  }
}

/**
 * @class NavigationError
 * @extends BaseAuthError
 * @description Errors related to route navigation and deep linking
 * @property {string} route - Target route where error occurred
 */
export class NavigationError extends BaseAuthError {
  readonly route: string;

  constructor(code: string, message: string, route: string, cause?: unknown) {
    super(code, message, cause);
    this.name = 'NavigationError';
    this.route = route;
  }
}

/**
 * @class StateError
 * @extends BaseAuthError
 * @description Errors related to application state management
 * @property {string} state - Description of state when error occurred
 */
export class StateError extends BaseAuthError {
  readonly state: string;

  constructor(code: string, message: string, state: string, cause?: unknown) {
    super(code, message, cause);
    this.name = 'StateError';
    this.state = state;
  }
}

/**
 * @class SupabaseAuthError
 * @extends BaseAuthError
 * @description Wrapper for Supabase authentication errors
 * @property {string} supabaseCode - Original Supabase error code
 */
export class SupabaseAuthError extends BaseAuthError {
  readonly supabaseCode: string;

  constructor(code: string, message: string, supabaseCode: string, cause?: unknown) {
    super(code, message, cause);
    this.name = 'SupabaseAuthError';
    this.supabaseCode = supabaseCode;
  }
}

/**
 * @class DatabaseError
 * @extends SupabaseAuthError
 * @description Database-related errors including RLS violations
 * @property {string} operation - Database operation that caused error
 * @property {string} table - Affected database table
 */
export class DatabaseError extends SupabaseAuthError {
  readonly operation: string;
  readonly table: string;

  constructor(
    code: string,
    message: string,
    supabaseCode: string,
    operation: string,
    table: string,
    cause?: unknown
  ) {
    super(code, message, supabaseCode, cause);
    this.name = 'DatabaseError';
    this.operation = operation;
    this.table = table;
  }
}

/**
 * @class ValidationError
 * @extends BaseAuthError
 * @description Validation-related errors including format and business rule violations
 * @property {string} field - Field that failed validation
 * @property {unknown} value - Invalid value
 */
export class ValidationError extends BaseAuthError {
  readonly field: string;
  readonly value: unknown;

  constructor(
    code: string,
    message: string,
    field: string,
    value: unknown,
    cause?: unknown
  ) {
    super(code, message, cause);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
  }
}

/**
 * @enum ErrorCode
 * @description Enumeration of all possible error codes
 * @readonly
 */
export enum ErrorCode {
  // UI Errors
  COMPONENT_RENDER_FAILED = 'UI_001',
  STATE_SYNC_FAILED = 'UI_002',
  
  // Navigation Errors
  ROUTE_ACCESS_DENIED = 'NAV_001',
  DEEP_LINK_FAILED = 'NAV_002',
  
  // State Errors
  INVALID_STATE_TRANSITION = 'STATE_001',
  STATE_CORRUPTION = 'STATE_002',
  
  // Supabase Auth Errors
  SESSION_EXPIRED = 'AUTH_001',
  TOKEN_INVALID = 'AUTH_002',
  
  // Database Errors
  RLS_VIOLATION = 'DB_001',
  QUERY_FAILED = 'DB_002',

  // Validation Errors
  INVALID_FORMAT = 'VAL_001',
  INVALID_VALUE = 'VAL_002',
  DUPLICATE_VALUE = 'VAL_003',
  BUSINESS_RULE_VIOLATION = 'VAL_004'
} 