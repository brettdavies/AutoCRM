import { useEffect, useState } from 'react'
import type { OAuthProvider } from '../types/auth.types'

interface AuthLoadingOverlayProps {
  provider: OAuthProvider;
  isVisible: boolean;
}

export function AuthLoadingOverlay({ provider, isVisible }: AuthLoadingOverlayProps) {
  const [message, setMessage] = useState(`Connecting to ${provider}...`)
  
  useEffect(() => {
    if (!isVisible) return
    
    const messages = [
      `Connecting to ${provider}...`,
      'Verifying credentials...',
      'Almost there...'
    ]
    
    let currentIndex = 0
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % messages.length
      setMessage(messages[currentIndex])
    }, 2000)
    
    return () => clearInterval(interval)
  }, [provider, isVisible])
  
  if (!isVisible) return null
  
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 p-6 rounded-lg bg-card">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-lg font-medium text-foreground">{message}</p>
      </div>
    </div>
  )
} 