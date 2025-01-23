import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/core/supabase/client'
import { AuthLoadingOverlay } from './AuthLoadingOverlay'
import logger from '@/shared/utils/logger.utils'

export function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get session from URL
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          logger.error('Auth callback error:', error)
          throw error
        }
        
        if (!session) {
          logger.error('No session established')
          throw new Error('No session established')
        }
        
        // Get the redirect_to parameter or default to '/'
        const redirectTo = searchParams.get('redirect_to') || '/'
        
        logger.debug('Auth callback successful, redirecting to:', redirectTo)
        navigate(redirectTo, { replace: true })
      } catch (error) {
        logger.error('Auth callback error:', error)
        // Redirect to login with error
        navigate('/auth/login', {
          replace: true,
          state: { 
            error: 'Authentication failed. Please try again.' 
          }
        })
      }
    }

    handleCallback()
  }, [navigate, searchParams])

  return (
    <AuthLoadingOverlay 
      provider={searchParams.get('provider') as 'google' | 'github' || 'google'}
      isVisible={true}
    />
  )
} 