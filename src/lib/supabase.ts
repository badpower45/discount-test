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
      return createClient(supabaseUrl, supabaseKey, {
        auth: {
          flowType: 'pkce',
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      } as any);
    } else {
      console.warn('❌ Missing Supabase credentials - using mock client')
      // Return comprehensive mock for development
      const createPostgrestBuilder = (mockData: any[] = [], mockError: any = null) => ({
        select: (_columns?: string, _options?: any) => createPostgrestBuilder(mockData, mockError),
        insert: (_values?: any, _options?: any) => createPostgrestBuilder(mockData, mockError),
        update: (_values?: any, _options?: any) => createPostgrestBuilder(mockData, mockError),
        delete: (_options?: any) => createPostgrestBuilder(mockData, mockError),
        eq: (_column: string, _value: any) => createPostgrestBuilder(mockData, mockError),
        neq: (_column: string, _value: any) => createPostgrestBuilder(mockData, mockError),
        gt: (_column: string, _value: any) => createPostgrestBuilder(mockData, mockError),
        gte: (_column: string, _value: any) => createPostgrestBuilder(mockData, mockError),
        lt: (_column: string, _value: any) => createPostgrestBuilder(mockData, mockError),
        lte: (_column: string, _value: any) => createPostgrestBuilder(mockData, mockError),
        like: (_column: string, _pattern: string) => createPostgrestBuilder(mockData, mockError),
        ilike: (_column: string, _pattern: string) => createPostgrestBuilder(mockData, mockError),
        in: (_column: string, _values: any[]) => createPostgrestBuilder(mockData, mockError),
        order: (_column: string, _options?: any) => createPostgrestBuilder(mockData, mockError),
        limit: (_count: number, _options?: any) => createPostgrestBuilder(mockData, mockError),
        range: (_from: number, _to: number, _options?: any) => createPostgrestBuilder(mockData, mockError),
        single: () => createPostgrestBuilder(mockData?.[0] || null, mockError),
        maybeSingle: () => createPostgrestBuilder(mockData?.[0] || null, mockError),
        throwOnError: () => createPostgrestBuilder(mockData, mockError),
        then: (onResolve: any, onReject?: any) => Promise.resolve({ data: mockData, error: mockError }).then(onResolve, onReject),
        catch: (onReject: any) => Promise.resolve({ data: mockData, error: mockError }).catch(onReject)
      });

      return {
        from: (table: string) => {
          // Return appropriate mock data based on table
          let mockData: any[] = [];
          if (table === 'restaurants') {
            mockData = [
              {
                id: '1',
                name: 'Pizza Palace',
                restaurant_name: 'Pizza Palace',
                offer_name: '25% Off All Pizzas',
                image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop',
                logo_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=100&h=100&fit=crop',
                discount_percentage: 25,
                description: 'Delicious wood-fired pizzas with fresh ingredients',
                category: 'restaurant',
                created_at: '2024-01-01T00:00:00.000Z'
              },
              {
                id: '2',
                name: 'Coffee Central',
                restaurant_name: 'Coffee Central',
                offer_name: '20% Off All Beverages',
                image_url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=300&fit=crop',
                logo_url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=100&h=100&fit=crop',
                discount_percentage: 20,
                description: 'Artisanal coffee and fresh pastries',
                category: 'cafe',
                created_at: '2024-01-02T00:00:00.000Z'
              },
              {
                id: '3',
                name: 'Burger House',
                restaurant_name: 'Burger House',
                offer_name: '15% Off Burgers & Fries',
                image_url: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop',
                logo_url: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=100&h=100&fit=crop',
                discount_percentage: 15,
                description: 'Gourmet burgers made with locally sourced beef',
                category: 'restaurant',
                created_at: '2024-01-03T00:00:00.000Z'
              }
            ];
          }
          return createPostgrestBuilder(mockData);
        },
        rpc: (fnName: string, params?: any) => {
          console.log(`🔧 Mock RPC call: ${fnName}`, params);
          // Return appropriate mock data based on function name
          if (fnName === 'generate_coupon') {
            return Promise.resolve({ 
              data: [{ code: 'MOCK-' + Math.random().toString(36).substr(2, 8).toUpperCase(), success: true }], 
              error: null 
            });
          }
          if (fnName === 'validate_coupon') {
            return Promise.resolve({ 
              data: [{ is_valid: true, discount_percentage: 20 }], 
              error: null 
            });
          }
          if (fnName === 'use_coupon') {
            return Promise.resolve({ 
              data: [{ success: true, message: 'Coupon used successfully' }], 
              error: null 
            });
          }
          if (fnName === 'get_restaurant_coupons') {
            return Promise.resolve({ data: [], error: null });
          }
          if (fnName === 'get_my_merchant_data') {
            return Promise.resolve({ data: null, error: { code: 'PGRST116', message: 'No merchant data found' } });
          }
          return Promise.resolve({ data: null, error: null });
        },
        auth: { 
          user: null,
          getUser: () => Promise.resolve({ data: { user: null }, error: null }),
          getSession: () => Promise.resolve({ data: { session: null }, error: null }),
          signInWithPassword: (_credentials: any) => Promise.resolve({ 
            data: { user: null, session: null }, 
            error: { message: 'Mock auth: credentials not configured' }
          }),
          signOut: () => Promise.resolve({ error: null }),
          onAuthStateChange: (callback: any) => {
            // Call callback immediately with signed out state
            setTimeout(() => callback('SIGNED_OUT', null), 0);
            return { 
              data: { 
                subscription: { 
                  unsubscribe: () => console.log('🔧 Mock auth subscription unsubscribed')
                } 
              } 
            };
          }
        },
        channel: (name: string) => {
          console.log(`🔧 Mock channel created: ${name}`);
          return {
            on: (event: string, _config: any, _callback?: any) => {
              console.log(`🔧 Mock channel event listener: ${event}`);
              return {
                subscribe: (_callback?: any) => {
                  console.log('🔧 Mock channel subscribed');
                  return { 
                    unsubscribe: () => console.log('🔧 Mock channel unsubscribed')
                  };
                }
              };
            }
          };
        }
      } as any
    }
  } catch (error) {
    console.error('❌ Failed to initialize Supabase:', error);
    // Return comprehensive mock client on error
    const createErrorPostgrestBuilder = (errorMsg: string = 'Supabase init failed') => ({
      select: (_columns?: string, _options?: any) => createErrorPostgrestBuilder(errorMsg),
      insert: (_values?: any, _options?: any) => createErrorPostgrestBuilder(errorMsg),
      update: (_values?: any, _options?: any) => createErrorPostgrestBuilder(errorMsg),
      delete: (_options?: any) => createErrorPostgrestBuilder(errorMsg),
      eq: (_column: string, _value: any) => createErrorPostgrestBuilder(errorMsg),
      neq: (_column: string, _value: any) => createErrorPostgrestBuilder(errorMsg),
      gt: (_column: string, _value: any) => createErrorPostgrestBuilder(errorMsg),
      gte: (_column: string, _value: any) => createErrorPostgrestBuilder(errorMsg),
      lt: (_column: string, _value: any) => createErrorPostgrestBuilder(errorMsg),
      lte: (_column: string, _value: any) => createErrorPostgrestBuilder(errorMsg),
      like: (_column: string, _pattern: string) => createErrorPostgrestBuilder(errorMsg),
      ilike: (_column: string, _pattern: string) => createErrorPostgrestBuilder(errorMsg),
      in: (_column: string, _values: any[]) => createErrorPostgrestBuilder(errorMsg),
      order: (_column: string, _options?: any) => createErrorPostgrestBuilder(errorMsg),
      limit: (_count: number, _options?: any) => createErrorPostgrestBuilder(errorMsg),
      range: (_from: number, _to: number, _options?: any) => createErrorPostgrestBuilder(errorMsg),
      single: () => createErrorPostgrestBuilder(errorMsg),
      maybeSingle: () => createErrorPostgrestBuilder(errorMsg),
      throwOnError: () => createErrorPostgrestBuilder(errorMsg),
      then: (onResolve: any, onReject?: any) => Promise.resolve({ data: null, error: { message: errorMsg } }).then(onResolve, onReject),
      catch: (onReject: any) => Promise.resolve({ data: null, error: { message: errorMsg } }).catch(onReject)
    });

    return {
      from: (_table: string) => createErrorPostgrestBuilder(),
      rpc: (_fnName: string, _params?: any) => Promise.resolve({ data: null, error: { message: 'Supabase init failed' } }),
      auth: { 
        user: null,
        getUser: () => Promise.resolve({ data: { user: null }, error: { message: 'Supabase init failed' } }),
        getSession: () => Promise.resolve({ data: { session: null }, error: { message: 'Supabase init failed' } }),
        signInWithPassword: (_credentials: any) => Promise.resolve({ 
          data: { user: null, session: null }, 
          error: { message: 'Supabase init failed' }
        }),
        signOut: () => Promise.resolve({ error: { message: 'Supabase init failed' } }),
        onAuthStateChange: (callback: any) => {
          setTimeout(() => callback('SIGNED_OUT', null), 0);
          return { 
            data: { 
              subscription: { 
                unsubscribe: () => console.log('🔧 Error mock auth subscription unsubscribed')
              } 
            } 
          };
        }
      },
      channel: (name: string) => {
        console.log(`🔧 Error mock channel created: ${name}`);
        return {
          on: (event: string, _config: any, _callback?: any) => {
            console.log(`🔧 Error mock channel event listener: ${event}`);
            return {
              subscribe: (_callback?: any) => {
                console.log('🔧 Error mock channel subscribed');
                return { 
                  unsubscribe: () => console.log('🔧 Error mock channel unsubscribed')
                };
              }
            };
          }
        };
      }
    } as any
  }
})()