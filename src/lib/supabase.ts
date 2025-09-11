import { createClient } from '@supabase/supabase-js'

let supabaseInstance: any = null

export const getSupabaseClient = () => {
  if (!supabaseInstance) {
    const supabaseUrl = (import.meta.env as any).VITE_SUPABASE_URL
    const supabaseAnonKey = (import.meta.env as any).VITE_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
    }

    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
  }
  
  return supabaseInstance
}

// For backwards compatibility
export const supabase = getSupabaseClient()