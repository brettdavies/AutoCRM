import { useState, useCallback } from 'react'
import { supabase } from '@/core/supabase/client'
import { useAuth } from '../components/AuthProvider'

export interface SessionRecoveryState {
  isRecovering: boolean
  error: Error | null
}

export function useSessionRecovery() {
  const [state, setState] = useState<SessionRecoveryState>({
    isRecovering: false,
    error: null
  })
  const { session } = useAuth()

  const isValid = useCallback(() => {
    if (!session) return false
    const expiresAt = session.expires_at ? new Date(session.expires_at * 1000) : null
    return expiresAt ? expiresAt > new Date() : false
  }, [session])

  const recoverSession = useCallback(async () => {
    if (!isValid()) {
      setState({ isRecovering: true, error: null })
      try {
        const { data: { session }, error } = await supabase.auth.refreshSession()
        if (error) throw error
        if (!session) throw new Error('No session returned after refresh')
        
        // Session recovered successfully
        setState({ isRecovering: false, error: null })
        return true
      } catch (error) {
        setState({ 
          isRecovering: false, 
          error: error instanceof Error ? error : new Error('Unknown error during session recovery')
        })
        return false
      }
    }
    return true
  }, [isValid])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  return {
    ...state,
    recoverSession,
    clearError
  }
} 