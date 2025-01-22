import { useEffect, type ReactNode } from 'react'
import { useAuth } from './AuthProvider'
import logger from '@/shared/utils/logger.utils'
import { Auth as SupabaseAuth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '@/core/supabase/client'
import { DemoLogin } from './DemoLogin'

interface AuthProps {
    children?: ReactNode
}

export function Auth({ children }: AuthProps) {
    const { session, state } = useAuth()

    useEffect(() => {
        logger.http('Auth state changed:', { session, state })
    }, [session, state])

    if (state.isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-primary"></div>
            </div>
        )
    }

    if (state.error) {
        return (
            <div className="text-error">
                {state.error.message}
            </div>
        )
    }

    if (!session) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
                <div className="w-full max-w-4xl px-4 flex gap-8 items-start justify-center">
                    {/* Main login form */}
                    <div className="w-[400px]">
                        <div className="w-full p-8 bg-white rounded-lg shadow-md">
                            <h1 className="text-2xl font-bold text-center text-gray-900 mb-8">Welcome to AutoCRM</h1>
                            <SupabaseAuth
                                supabaseClient={supabase}
                                appearance={{ 
                                    theme: ThemeSupa,
                                    variables: {
                                        default: {
                                            colors: {
                                                brand: '#4F46E5',
                                                brandAccent: '#4338CA'
                                            }
                                        }
                                    }
                                }}
                                providers={['github', 'google']}
                                redirectTo={window.location.origin}
                                magicLink={true}
                            />
                        </div>
                    </div>
                    
                    {/* Demo login section */}
                    <div className="w-96">
                        <DemoLogin />
                    </div>
                </div>
            </div>
        )
    }

    return <>{children}</>
} 