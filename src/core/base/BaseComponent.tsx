import React from 'react'
import { useLogger } from '@/hooks/useLogger'

interface BaseProps {
  className?: string
  testId?: string
}

export abstract class BaseComponent<P extends BaseProps = BaseProps> extends React.Component<P> {
  protected logger = useLogger(this.constructor.name)

  componentDidMount() {
    this.logger.debug('Component mounted')
  }

  componentWillUnmount() {
    this.logger.debug('Component will unmount')
  }

  protected abstract renderContent(): React.ReactNode

  render() {
    return (
      <div 
        className={this.props.className}
        data-testid={this.props.testId}
      >
        {this.renderContent()}
      </div>
    )
  }
} 