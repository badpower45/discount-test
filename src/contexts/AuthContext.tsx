import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface MerchantData {
  id: string;
  name: string;
  email: string;
  restaurant_id: string;
  restaurant_name?: string;
}

interface AuthContextType {
  user: User | null;
  merchant: MerchantData | null;
  session: Session | null;
  loading: boolean;
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

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchMerchantData(session.user.id);
        }
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (event === 'SIGNED_IN' && session?.user) {
        await fetchMerchantData(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setMerchant(null);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchMerchantData = async (userId: string) => {
    try {
      // For development, we'll use a simple email-based lookup
      // In production, you'd link auth_user_id properly
      const { data, error } = await supabase
        .from('merchants')
        .select(`
          id,
          name,
          email,
          restaurant_id,
          restaurants(restaurant_name)
        `)
        .eq('auth_user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching merchant data:', error);
        return;
      }

      if (data) {
        setMerchant({
          id: data.id,
          name: data.name,
          email: data.email,
          restaurant_id: data.restaurant_id,
          restaurant_name: data.restaurants?.restaurant_name
        });
      }
    } catch (error) {
      console.error('Error in fetchMerchantData:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      return { error };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setMerchant(null);
      setSession(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const value = {
    user,
    merchant,
    session,
    loading,
    signIn,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};