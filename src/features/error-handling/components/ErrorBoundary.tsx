import { Component, ErrorInfo, ReactNode } from 'react'
import { 
  handleUIError,
  handleNavigationError,
  handleStateError
} from '../utils/handlers'
import { BaseAuthError } from '../types/error.types'

/**
 * @interface ErrorBoundaryProps
 * @description Props for error boundary components
 * @property {ReactNode} children - Child components to render
 * @property {string} boundaryName - Identifier for the boundary
 * @property {Function} [onError] - Optional error callback
 */
interface ErrorBoundaryProps {
  children: ReactNode
  boundaryName: string
  onError?: (error: BaseAuthError) => void
}

/**
 * @interface ErrorBoundaryState
 * @description State for error boundary components
 * @property {BaseAuthError | null} error - Caught error
 */
interface ErrorBoundaryState {
  error: BaseAuthError | null
}

/**
 * @class UIErrorBoundary
 * @extends Component
 * @description Catches and processes UI rendering errors
 */
export class UIErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      error: handleUIError(error, 'unknown')
    }
  }

  override componentDidCatch(error: Error, _errorInfo: ErrorInfo): void {
    const uiError = handleUIError(error, this.props.boundaryName)
    this.props.onError?.(uiError)
  }

  override render(): ReactNode {
    if (this.state.error) {
      return (
        <div role="alert" className="error-boundary">
          <h2>Component Error</h2>
          <p>{this.state.error.message}</p>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * @class NavigationErrorBoundary
 * @extends Component
 * @description Catches and processes navigation errors
 */
export class NavigationErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      error: handleNavigationError(error, 'unknown')
    }
  }

  override componentDidCatch(error: Error, _errorInfo: ErrorInfo): void {
    const navError = handleNavigationError(error, this.props.boundaryName)
    this.props.onError?.(navError)
  }

  override render(): ReactNode {
    if (this.state.error) {
      return (
        <div role="alert" className="error-boundary">
          <h2>Navigation Error</h2>
          <p>{this.state.error.message}</p>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * @class StateErrorBoundary
 * @extends Component
 * @description Catches and processes state management errors
 */
export class StateErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      error: handleStateError(error, 'unknown')
    }
  }

  override componentDidCatch(error: Error, _errorInfo: ErrorInfo): void {
    const stateError = handleStateError(error, this.props.boundaryName)
    this.props.onError?.(stateError)
  }

  override render(): ReactNode {
    if (this.state.error) {
      return (
        <div role="alert" className="error-boundary">
          <h2>State Error</h2>
          <p>{this.state.error.message}</p>
        </div>
      )
    }

    return this.props.children
  }
} 