import React, { Component, ErrorInfo, ReactNode } from 'react'

interface UIErrorBoundaryProps {
  children: ReactNode
  boundaryName: string
  fallback?: ReactNode
}

interface UIErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * @class UIErrorBoundary
 * @extends Component
 * @description Error boundary for UI components with fallback rendering
 */
export class UIErrorBoundary extends Component<UIErrorBoundaryProps, UIErrorBoundaryState> {
  constructor(props: UIErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null
    }
  }

  static getDerivedStateFromError(error: Error): UIErrorBoundaryState {
    return {
      hasError: true,
      error
    }
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error(`Error in ${this.props.boundaryName}:`, {
      error,
      errorInfo
    })
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div role="alert" className="error-boundary">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
        </div>
      )
    }

    return this.props.children
  }
} 