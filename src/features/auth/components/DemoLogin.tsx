import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
} from '@/shared/components'
import type { UserRole } from '@/core/supabase/types/database.types'

export function DemoLogin() {
  const [isLoading, setIsLoading] = useState(false)
  const { signInWithDemo } = useAuth()

  const handleDemoLogin = async (role: UserRole) => {
    try {
      setIsLoading(true)
      await signInWithDemo(role)
    } catch (error) {
      console.error('Demo login failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Demo Mode</CardTitle>
        <CardDescription>
          Try out AutoCRM with a demo account. No sign up required.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">
          Get instant access to all features with our pre-configured demo environment.
          Perfect for exploring the platform before creating an account.
        </p>
        <div className="flex flex-col gap-2">
          <Button
            className="w-full"
            onClick={() => handleDemoLogin('admin')}
            disabled={isLoading}
            variant="default"
          >
            {isLoading ? 'Loading...' : 'Try as Admin'}
          </Button>
          <Button
            className="w-full"
            onClick={() => handleDemoLogin('agent')}
            disabled={isLoading}
            variant="secondary"
          >
            {isLoading ? 'Loading...' : 'Try as Agent'}
          </Button>
          <Button
            className="w-full"
            onClick={() => handleDemoLogin('customer')}
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? 'Loading...' : 'Try as Customer'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 
