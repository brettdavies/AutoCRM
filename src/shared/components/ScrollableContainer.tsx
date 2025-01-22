import { ReactNode } from 'react';

interface ScrollableContainerProps {
  children: ReactNode;
  className?: string;
}

export function ScrollableContainer({ children, className = "" }: ScrollableContainerProps) {
  return (
    <div className={`h-full overflow-auto ${className}`}>
      {children}
    </div>
  );
} 