import { createClient } from '@supabase/supabase-js'

// Get environment variables - the correct way for Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Supabase Configuration:', { 
  hasUrl: !!supabaseUrl, 
  hasKey: !!supabaseKey,
  urlPrefix: supabaseUrl?.substring(0, 30) + '...' 
})

// Create Supabase client safely
export const supabase = (() => {
  try {
    if (supabaseUrl && supabaseKey) {
      return createClient(supabaseUrl, supabaseKey);
    } else {
      console.warn('❌ Missing Supabase credentials - using mock client')
      // Return minimal mock for development
      return {
        from: () => ({ 
          select: () => Promise.resolve({ data: [], error: null }),
          insert: () => Promise.resolve({ data: null, error: null }),
          update: () => Promise.resolve({ data: null, error: null }),
          delete: () => Promise.resolve({ error: null }),
          rpc: () => Promise.resolve({ data: null, error: null })
        }),
        auth: { 
          user: null,
          getUser: () => Promise.resolve({ data: { user: null }, error: null }),
          getSession: () => Promise.resolve({ data: { session: null }, error: null }),
          signInWithPassword: () => Promise.resolve({ data: null, error: null }),
          signOut: () => Promise.resolve({ error: null }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
        },
        channel: () => ({
          on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) })
        })
      } as any
    }
  } catch (error) {
    console.error('❌ Failed to initialize Supabase:', error);
    // Return mock client on error
    return {
      from: () => ({ 
        select: () => Promise.resolve({ data: [], error: { message: 'Supabase init failed' } }),
        insert: () => Promise.resolve({ data: null, error: { message: 'Supabase init failed' } }),
        update: () => Promise.resolve({ data: null, error: { message: 'Supabase init failed' } }),
        delete: () => Promise.resolve({ error: { message: 'Supabase init failed' } }),
        rpc: () => Promise.resolve({ data: null, error: { message: 'Supabase init failed' } })
      }),
      auth: { 
        user: null,
        getUser: () => Promise.resolve({ data: { user: null }, error: { message: 'Supabase init failed' } }),
        getSession: () => Promise.resolve({ data: { session: null }, error: { message: 'Supabase init failed' } }),
        signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Supabase init failed' } }),
        signOut: () => Promise.resolve({ error: { message: 'Supabase init failed' } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
      },
      channel: () => ({
        on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) })
      })
    } as any
  }
})()