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
        setIsAdmin(false);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchMerchantData = async (userId: string) => {
    try {
      // First, try to find merchant by auth_user_id (primary method)
      const { data: authLinkedData, error: authError } = await supabase
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

      // If found by auth_user_id, use that data
      if (authLinkedData && !authError) {
        const merchantData = {
          id: authLinkedData.id,
          name: authLinkedData.name,
          email: authLinkedData.email,
          restaurant_id: authLinkedData.restaurant_id,
          restaurant_name: authLinkedData.restaurants?.restaurant_name,
          role: authLinkedData.role || 'merchant'
        };
        setMerchant(merchantData);
        setIsAdmin(merchantData.role === 'admin');
        return;
      }

      // If not found by auth_user_id, try email fallback (for unlinked accounts)
      if (user?.email) {
        console.log('Auth user not linked to merchant, attempting email fallback...');
        
        const { data: emailData, error: emailError } = await supabase
          .rpc('find_merchant_by_email', { user_email: user.email });

        if (emailData && emailData.length > 0 && !emailError) {
          const foundMerchant = emailData[0];
          
          // Attempt to link the current user to this merchant
          const { data: linkResult, error: linkError } = await supabase
            .rpc('link_current_user_to_merchant', { merchant_email: user.email });

          if (linkResult && linkResult.length > 0 && linkResult[0].success) {
            console.log('Successfully linked user to merchant:', linkResult[0].message);
            
            // Set merchant data after successful linking
            const merchantData = {
              id: foundMerchant.merchant_id,
              name: foundMerchant.name,
              email: foundMerchant.email,
              restaurant_id: foundMerchant.restaurant_id,
              restaurant_name: foundMerchant.restaurant_name,
              role: foundMerchant.role || 'merchant'
            };
            setMerchant(merchantData);
            setIsAdmin(merchantData.role === 'admin');
          } else {
            console.error('Failed to link user to merchant:', linkError || linkResult?.[0]?.message);
          }
        } else {
          console.log('No merchant found with email:', user.email);
        }
      }
    } catch (error) {
      console.error('Error in fetchMerchantData:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // استخدام دالة تسجيل الدخول الحقيقية من Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        // إذا كان هناك خطأ، قم بإرجاعه لعرضه للمستخدم
        return { error };
      }
      
      // إذا نجح تسجيل الدخول، ستقوم دالة onAuthStateChange تلقائيًا بتحديث بيانات المستخدم
      // لا داعي لإجراء أي شيء إضافي هنا
      return { error: null };

    } catch (error) {
      console.error('Sign in error:', error);
      return { error: { message: 'حدث خطأ غير متوقع أثناء تسجيل الدخول' } };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setMerchant(null);
      setSession(null);
      setIsAdmin(false);
    } catch (error) {
      console.error('Sign out error:', error);
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
      {children}
    </AuthContext.Provider>
  );
};