import { ReactNode } from 'react';
import { Panel } from './Panel';
import { ScrollableContainer } from './ScrollableContainer';

interface ResponsivePanelProps {
  children: ReactNode;
  mobileHeight?: string;
  desktopHeight?: string;
  minHeight?: string;
  className?: string;
}

export function ResponsivePanel({ 
  children, 
  mobileHeight = "h-[400px]",
  desktopHeight = "lg:h-[calc(50%-1rem)]",
  minHeight = "min-h-[220px]",
  className = ""
}: ResponsivePanelProps) {
  return (
    <Panel className={`${mobileHeight} ${desktopHeight} ${minHeight} ${className}`}>
      <ScrollableContainer>
        {children}
      </ScrollableContainer>
    </Panel>
  );
} 