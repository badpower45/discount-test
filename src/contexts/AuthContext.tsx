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
  signIn: (email: string, password: string) => Promise<{ error: any }>;
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
        
        if (session?.user) {
          await fetchMerchantData(session.user.id);
        } else {
          console.log('ℹ️ No active session - user can access public pages');
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    getSessionAndMerchant();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (event === 'SIGNED_IN' && session?.user) {
        await fetchMerchantData(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setMerchant(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchMerchantData = async (userId: string) => {
    if (!userId) {
      console.warn("fetchMerchantData called with no userId");
      return;
    }
    try {
      console.log('🔍 Fetching merchant data for user ID:', userId);
      const { data, error } = await supabase
        .from('merchants')
        .select(`
          id,
          name,
          email,
          restaurant_id,
          role,
          restaurants(restaurant_name)
        `)
        .eq('auth_user_id', userId)
        .single();

      if (error) {
        // PGRST116 means no rows were found, which is not a critical error here.
        if (error.code !== 'PGRST116') {
            console.error('Error fetching merchant data:', error);
        } else {
            console.log('ℹ️ No merchant record found for this user ID.');
        }
        setMerchant(null);
        setIsAdmin(false);
        return;
      }

      if (data) {
        console.log('✅ Found merchant data:', data);
        const merchantData = {
          id: data.id,
          name: data.name,
          email: data.email,
          restaurant_id: data.restaurant_id,
          restaurant_name: data.restaurants?.restaurant_name,
          role: data.role || 'merchant'
        };
        setMerchant(merchantData);
        setIsAdmin(merchantData.role === 'admin');
      }
    } catch (error) {
      console.error('❌ Exception in fetchMerchantData:', error);
      setMerchant(null);
      setIsAdmin(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
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