import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getDriverByAuthId } from '../lib/database-functions';
import type { User, Session } from '@supabase/supabase-js';

interface MerchantData {
  id: string;
  name: string;
  email: string;
  restaurant_id: string;
  restaurant_name?: string;
  role: 'merchant' | 'admin' | 'dispatcher';
}

interface DriverData {
  id: string;
  full_name: string;
  phone_number: string;
  email: string;
  vehicle_type: 'motorcycle' | 'bicycle' | 'car' | 'scooter';
  status: 'available' | 'busy' | 'offline';
  rating: number;
  total_deliveries: number;
  city: string;
}

interface AuthContextType {
  user: User | null;
  merchant: MerchantData | null;
  driver: DriverData | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any; role?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [merchant, setMerchant] = useState<MerchantData | null>(null);
  const [driver, setDriver] = useState<DriverData | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const getSessionAndMerchant = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        
        // Set loading to false immediately so public pages can render
        setLoading(false);
        
        // Fetch merchant and driver data in background without blocking UI
        if (session?.user) {
          fetchMerchantData(session.user.id);
          fetchDriverData(session.user.id);
        } else {
          console.log('ℹ️ No active session - user can access public pages');
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        setLoading(false);
      }
    };

    getSessionAndMerchant();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (event === 'SIGNED_IN' && session?.user) {
        // Ensure a customer profile exists for Google OAuth sign-ins
        try {
          await supabase.from('customers').upsert(
            {
              id: session.user.id,
              name: (session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Customer'),
              email: session.user.email,
              phone: session.user.user_metadata?.phone || ''
            },
            { onConflict: 'id' } as any
          );
        } catch (e) {
          console.warn('Could not upsert customer profile on sign-in:', e);
        }
        // Don't await - let merchant and driver data load in background
        fetchMerchantData(session.user.id);
        fetchDriverData(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setMerchant(null);
        setDriver(null);
        setIsAdmin(false);
      }
      // No setLoading(false) needed here as it's already false
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchMerchantData = async (userId: string): Promise<MerchantData | null> => {
    if (!userId) {
      console.warn("fetchMerchantData called with no userId");
      return null;
    }
    
    try {
      console.log('🔍 Fetching merchant data using secure RPC function for user ID:', userId);
      
      // Use the new secure RPC function to bypass RLS performance issues
      const { data, error } = await supabase
        .rpc('get_my_merchant_data')
        .single();

      if (error) {
        // PGRST116 means no rows were found, which is not a critical error here.
        if (error.code !== 'PGRST116') {
            console.error('Error fetching merchant data via RPC:', error);
        } else {
            console.log('ℹ️ No merchant record found for this user ID.');
        }
        setMerchant(null);
        setIsAdmin(false);
        return null;
      }

      if (data) {
        console.log('✅ Found merchant data via secure RPC:', data);
        const merchantData: MerchantData = {
          id: data.id,
          name: data.name,
          email: data.email,
          restaurant_id: data.restaurant_id,
          restaurant_name: data.restaurant_name,
          role: data.role || 'merchant'
        };
        setMerchant(merchantData);
        setIsAdmin(merchantData.role === 'admin');
        console.log('🔐 Admin status set to:', merchantData.role === 'admin');
        return merchantData;
      }
      return null;
    } catch (error) {
      console.error('❌ Exception in fetchMerchantData via RPC:', error);
      // Force clear loading state to prevent infinite hang
      setMerchant(null);
      setIsAdmin(false);
      return null;
    }
  };

  const fetchDriverData = async (userId: string): Promise<DriverData | null> => {
    if (!userId) {
      console.warn("fetchDriverData called with no userId");
      return null;
    }
    
    try {
      console.log('🔍 Fetching driver data for user ID:', userId);
      
      const result = await getDriverByAuthId(userId);

      if (result.success && result.driver) {
        console.log('✅ Found driver data:', result.driver);
        const driverData: DriverData = {
          id: result.driver.id,
          full_name: result.driver.full_name,
          phone_number: result.driver.phone_number,
          email: result.driver.email,
          vehicle_type: result.driver.vehicle_type,
          status: result.driver.status,
          rating: result.driver.rating,
          total_deliveries: result.driver.total_deliveries,
          city: result.driver.city,
        };
        setDriver(driverData);
        return driverData;
      } else {
        console.log('ℹ️ No driver record found for this user ID.');
        setDriver(null);
        return null;
      }
    } catch (error) {
      console.error('❌ Exception in fetchDriverData:', error);
      setDriver(null);
      return null;
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      return { error, role: undefined };
    }

    if (signInData.user) {
      // Fetch merchant and driver data immediately after successful sign-in
      const merchantData = await fetchMerchantData(signInData.user.id);
      const driverData = await fetchDriverData(signInData.user.id);
      
      // Return role based on what was found
      if (merchantData) {
        return { error: null, role: merchantData.role };
      } else if (driverData) {
        return { error: null, role: 'driver' };
      }
      
      return { error: null, role: 'customer' };
    }

    return { error: new Error("User not found after sign in"), role: undefined };
  };

  const signOut = async () => {
    try {
      console.log('🚪 Signing out...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
      } else {
        console.log('✅ Successfully signed out');
      }
      
      // Force clear all state
      setUser(null);
      setMerchant(null);
      setDriver(null);
      setSession(null);
      setIsAdmin(false);
      
      // Clear local storage
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
    } catch (error) {
      console.error('❌ Exception during sign out:', error);
    }
  };

  const value = {
    user,
    merchant,
    driver,
    session,
    loading,
    isAdmin,
    signIn,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};