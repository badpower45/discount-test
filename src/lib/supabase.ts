import { createClient } from '@supabase/supabase-js'

let supabaseInstance: any = null

export const getSupabaseClient = () => {
  if (!supabaseInstance) {
    const supabaseUrl = (import.meta.env as any).VITE_SUPABASE_URL
    const supabaseAnonKey = (import.meta.env as any).VITE_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Missing Supabase environment variables. Using mock client.')
      // Return a mock client for development
      return {
        from: () => ({ select: () => ({ data: [], error: null }) }),
        auth: { user: null }
      }
    }

    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
  }
  
  return supabaseInstance
}

// For backwards compatibility - lazy initialization
let _supabase: any = null
export const supabase = new Proxy({}, {
  get(target, prop) {
    if (!_supabase) {
      _supabase = getSupabaseClient()
    }
    return _supabase[prop]
  }
})