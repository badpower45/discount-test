import { createClient } from '@supabase/supabase-js'

// Get environment variables from Replit Secrets via Vite define
declare const VITE_SUPABASE_URL: string;
declare const VITE_SUPABASE_ANON_KEY: string;

const supabaseUrl = (typeof VITE_SUPABASE_URL !== 'undefined') ? VITE_SUPABASE_URL : 
                   ((import.meta as any)?.env?.VITE_SUPABASE_URL || 
                   (process.env as any)?.VITE_SUPABASE_URL);

const supabaseAnonKey = (typeof VITE_SUPABASE_ANON_KEY !== 'undefined') ? VITE_SUPABASE_ANON_KEY :
                       ((import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY || 
                       (process.env as any)?.VITE_SUPABASE_ANON_KEY);

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