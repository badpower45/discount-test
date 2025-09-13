import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface MerchantData {
  id: string;
  name: string;
  email: string;
  restaurant_id: string;
  restaurant_name?: string;
  role: 'merchant' | 'admin';
}

interface AuthContextType {
  user: User | null;
  merchant: MerchantData | null;
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
        
        // Fetch merchant data in background without blocking UI
        if (session?.user) {
          fetchMerchantData(session.user.id);
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
        // Don't await - let merchant data load in background
        fetchMerchantData(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setMerchant(null);
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

  const signIn = async (email: string, password: string) => {
    const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      return { error, role: undefined };
    }

    if (signInData.user) {
      // Fetch merchant data immediately after successful sign-in
      const merchantData = await fetchMerchantData(signInData.user.id);
      return { error: null, role: merchantData?.role || 'merchant' };
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