import { createClient } from '@supabase/supabase-js'

// Get environment variables from Replit Secrets via Vite define
const supabaseUrl = (import.meta.env as any)?.VITE_SUPABASE_URL || 
                   (process.env as any)?.SUPABASE_URL
const supabaseAnonKey = (import.meta.env as any)?.VITE_SUPABASE_ANON_KEY || 
                       (process.env as any)?.SUPABASE_ANON_KEY

console.log('🔧 Supabase Configuration:', { 
  hasUrl: !!supabaseUrl, 
  hasKey: !!supabaseAnonKey,
  urlPrefix: supabaseUrl?.substring(0, 30) + '...' 
})

// Create Supabase client
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (() => {
      console.warn('❌ Missing Supabase credentials - some features will not work')
      // Return minimal mock for development
      return {
        from: () => ({ 
          select: () => Promise.resolve({ data: [], error: null }),
          insert: () => Promise.resolve({ data: null, error: null }),
          update: () => Promise.resolve({ data: null, error: null }),
          delete: () => Promise.resolve({ error: null })
        }),
        auth: { user: null }
      } as any
    })()