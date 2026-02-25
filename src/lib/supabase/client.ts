import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase client environment variables')
}

if (!supabaseServiceUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase service environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// For privileged operations (use in server components/API routes only)
export const supabaseService = createClient(
  supabaseServiceUrl,
  supabaseServiceKey
)