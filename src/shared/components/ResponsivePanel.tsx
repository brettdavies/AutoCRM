import { ReactNode } from 'react'
import { Card } from '@/shared/components'
import { cn } from '@/lib/utils'

interface ResponsivePanelProps {
  children: ReactNode
  className?: string
  mobileHeight?: string
  desktopHeight?: string
  minHeight?: string
}

export function ResponsivePanel({
  children,
  className,
  mobileHeight = 'h-[calc(40vh-6rem)]',
  desktopHeight = 'lg:h-[calc(40vh-6rem)]',
  minHeight = 'min-h-[200px]'
}: ResponsivePanelProps) {
  return (
    <Card className={cn(mobileHeight, desktopHeight, minHeight, className)}>
      {children}
    </Card>
  )
} 