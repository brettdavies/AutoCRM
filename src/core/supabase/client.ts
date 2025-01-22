import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types/database.types'

let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    supabaseClient = createBrowserClient<Database>(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    )
  }
  return supabaseClient
}

export const supabase = getSupabaseClient() 