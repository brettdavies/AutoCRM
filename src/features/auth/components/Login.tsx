import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { OAuthButtons } from './OAuthButtons'
import { AuthLoadingOverlay } from './AuthLoadingOverlay'
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@/shared/components'
import type { OAuthProvider } from '../types/auth.types'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [oauthLoading, setOAuthLoading] = useState<OAuthProvider | null>(null)
  const { signIn, signInWithMagicLink, resetPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      await signIn({ email, password })
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to sign in')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMagicLink = async () => {
    setIsLoading(true)
    setError(null)
    try {
      await signInWithMagicLink(email)
      alert('Check your email for the magic link!')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to send magic link')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordReset = async () => {
    setIsLoading(true)
    setError(null)
    try {
      await resetPassword(email)
      alert('Check your email for password reset instructions!')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to send reset instructions')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <AuthLoadingOverlay 
        provider={oauthLoading ?? 'google'} 
        isVisible={oauthLoading !== null} 
      />
      
      <Card>
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <OAuthButtons />
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                  autoComplete="username"
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div className="text-sm text-red-500">{error}</div>
              )}

              <div className="flex flex-col gap-2">
                <Button
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleMagicLink}
                  disabled={isLoading || !email}
                >
                  Send Magic Link
                </Button>

                <Button
                  type="button"
                  variant="link"
                  onClick={handlePasswordReset}
                  disabled={isLoading || !email}
                >
                  Forgot Password?
                </Button>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
    </>
  )
} 