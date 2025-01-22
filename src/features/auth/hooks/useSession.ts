import { useCallback, useContext } from 'react'
import { AuthContext } from '../components/AuthProvider'

export function useSession() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useSession must be used within AuthProvider')

  const isValid = useCallback(() => {
    if (!context.session) return false
    const expiresAt = context.session.expires_at ? new Date(context.session.expires_at * 1000) : null
    return expiresAt ? expiresAt > new Date() : false
  }, [context.session])

  return { isValid }
} 