import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

interface Profile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
}

const getGravatarUrl = (email: string): string => {
  const encoder = new TextEncoder();
  const data = encoder.encode(email.toLowerCase().trim());
  const hash = Array.from(
    new Uint8Array(crypto.subtle.digestSync("MD5", data))
  ).map(b => b.toString(16).padStart(2, '0')).join('');
  return `https://www.gravatar.com/avatar/${hash}?d=404`
}

const getDicebearUrl = (name: string): string => {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`
}

const checkImageExists = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    return response.status === 200
  } catch {
    return false
  }
}

serve(async (req) => {
  const { email, full_name } = await req.json() as Profile
  
  if (!email) {
    return new Response(
      JSON.stringify({ error: 'Email is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Try Gravatar first
  const gravatarUrl = getGravatarUrl(email)
  const hasGravatar = await checkImageExists(gravatarUrl)
  
  if (hasGravatar) {
    return new Response(
      JSON.stringify({ avatar_url: gravatarUrl }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Fallback to Dicebear
  const displayName = full_name || email.split('@')[0]
  const dicebearUrl = getDicebearUrl(displayName)

  return new Response(
    JSON.stringify({ avatar_url: dicebearUrl }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}) 