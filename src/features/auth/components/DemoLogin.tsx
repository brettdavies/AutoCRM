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
import { cn } from '@/lib/utils'

type UserRole = 'admin' | 'agent' | 'lead' | 'customer';

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
            onClick={() => handleDemoLogin('admin')}
            disabled={isLoading}
            variant="default"
          >
            {isLoading ? 'Loading...' : 'Try as Admin'}
          </Button>
          <Button
            onClick={() => handleDemoLogin('lead')}
            disabled={isLoading}
            variant="default"
            className="w-full bg-slate-600 hover:bg-slate-600"
          >
            {isLoading ? 'Loading...' : 'Try as Team Lead'}
          </Button>
          <Button
            onClick={() => handleDemoLogin('agent')}
            disabled={isLoading}
            variant="secondary"
          >
            {isLoading ? 'Loading...' : 'Try as Agent'}
          </Button>
          <Button
            onClick={() => handleDemoLogin('customer')}
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            {isLoading ? 'Loading...' : 'Try as Customer'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 
