import { useState } from 'react'
import { supabase } from '@/core/supabase/client'
import type { UserRole } from '../types/auth.types'
import logger from '@/shared/utils/logger.utils'

interface DemoUser {
  email: string
  role: UserRole
  label: string
  password: string
}

// Demo users with credentials
const DEMO_USERS: DemoUser[] = [
  {
    email: 'admin@example.com',
    role: 'admin',
    label: 'Admin',
    password: 'admin123'
  },
  {
    email: 'tech_agent1@example.com',
    role: 'agent',
    label: 'Agent',
    password: 'agent123'
  },
  {
    email: 'customer1@example.com',
    role: 'customer',
    label: 'Customer',
    password: 'customer123'
  }
]

export function DemoLogin() {
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleDemoLogin = async (user: DemoUser) => {
    try {
      setIsLoading(user.role)
      setError(null)

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: user.password
      })

      if (signInError) throw signInError

      logger.info(`Demo login successful: ${user.role}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to login'
      setError(message)
      logger.error('Demo login failed:', err)
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Want to try it out?
      </h2>
      <p className="text-gray-600 mb-6">
        Experience AutoCRM with a demo account - no signup required!
      </p>
      <div className="space-y-3">
        {DEMO_USERS.map((user) => (
          <button
            key={user.role}
            onClick={() => handleDemoLogin(user)}
            disabled={isLoading !== null}
            className={`
              w-full px-4 py-2 rounded-md font-medium transition-colors
              ${isLoading === user.role ? 'animate-pulse' : ''}
              ${
                user.role === 'admin'
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  : user.role === 'agent'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {isLoading === user.role ? (
              <span>Logging in...</span>
            ) : (
              <span>Login as {user.label}</span>
            )}
          </button>
        ))}
        {error && (
          <div className="mt-4 text-sm text-red-600">
            {error}
          </div>
        )}
      </div>
    </div>
  )
} 