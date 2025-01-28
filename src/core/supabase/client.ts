import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/core/supabase/types/database.types'

// Debug: Log environment variables (without values)
console.log('Available environment variables:', Object.keys(import.meta.env))

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Debug: Log actual values (length only for security)
console.log('Supabase URL type:', typeof supabaseUrl)
console.log('Supabase URL length:', supabaseUrl?.length || 0)
console.log('Supabase Anon Key type:', typeof supabaseAnonKey)
console.log('Supabase Anon Key length:', supabaseAnonKey?.length || 0)

// Debug: Log if variables are present and truthy
console.log('Supabase URL present:', !!supabaseUrl, 'Value check:', Boolean(supabaseUrl?.trim?.()))
console.log('Supabase Anon Key present:', !!supabaseAnonKey, 'Value check:', Boolean(supabaseAnonKey?.trim?.()))

if (!supabaseUrl?.trim() || !supabaseAnonKey?.trim()) {
  console.error('Environment Debug:', {
    hasUrl: !!supabaseUrl,
    urlEmpty: supabaseUrl === '',
    hasKey: !!supabaseAnonKey,
    keyEmpty: supabaseAnonKey === ''
  })
  throw new Error('Missing Supabase environment variables')
}

let supabaseInstance: ReturnType<typeof createClient<Database>>

export function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(
      supabaseUrl,
      supabaseAnonKey,
      {
        db: {
          schema: 'public'
        },
        auth: {
          persistSession: true,
          detectSessionInUrl: true
        }
      }
    )
  }
  return supabaseInstance
}

export const supabase = getSupabaseClient() 