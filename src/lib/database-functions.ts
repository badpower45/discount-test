import { supabase } from './supabase';

// Database types
export interface Restaurant {
  id: string;
  name: string; // Generic name (used for offer name for backward compatibility)
  restaurant_name?: string; // Specific restaurant name
  offer_name?: string; // Specific offer name  
  image_url: string;
  logo_url?: string; // Restaurant logo URL
  discount_percentage: number;
  description: string;
  category: 'restaurant' | 'cafe' | 'bakery' | 'other';
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  customer_id: string;
  restaurant_id: string;
  status: 'unused' | 'used';
  created_at: string;
  used_at?: string;
}

// Production ready - database only

// Restaurant functions
export const fetchRestaurants = async (): Promise<Restaurant[]> => {
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching restaurants:', error);
      return [];
    }
    
    if (!data || data.length === 0) {
      console.warn('📝 No restaurants found in database');
      return [];
    }
    
    console.log('✅ Successfully loaded restaurants from database');
    return data;
  } catch (err) {
    console.error('Error in fetchRestaurants:', err);
    return [];
  }
};

export const fetchRestaurantById = async (id: string): Promise<Restaurant | null> => {
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching restaurant:', error);
      return null;
    }
    
    return data;
  } catch (err) {
    console.error('Error in fetchRestaurantById:', err);
    return null;
  }
};

// Coupon generation function
export const generateCoupon = async (
  customerName: string,
  customerEmail: string,
  customerPhone: string,
  restaurantId: string
): Promise<{ success: boolean; coupon?: any; error?: string }> => {
  try {
    const { data, error } = await supabase.rpc('generate_coupon', {
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      restaurant_id: restaurantId
    });
    
    if (error) {
      console.error('Error generating coupon:', error);
      return { success: false, error: error.message };
    }
    
    if (data && data.length > 0) {
      return { success: true, coupon: data[0] };
    }
    
    return { success: false, error: 'No coupon generated' };
  } catch (err) {
    console.error('Error in generateCoupon:', err);
    return { success: false, error: 'Failed to generate coupon' };
  }
};

// Coupon validation functions
export const validateCoupon = async (
  couponCode: string,
  restaurantId: string
): Promise<{ success: boolean; coupon?: any; error?: string }> => {
  try {
    const { data, error } = await supabase.rpc('validate_coupon', {
      coupon_code: couponCode,
      restaurant_id: restaurantId
    });
    
    if (error) {
      console.error('Error validating coupon:', error);
      return { success: false, error: error.message };
    }
    
    if (data && data.length > 0 && data[0].is_valid) {
      return { success: true, coupon: data[0] };
    }
    
    return { success: false, error: 'Invalid coupon' };
  } catch (err) {
    console.error('Error in validateCoupon:', err);
    return { success: false, error: 'Failed to validate coupon' };
  }
};

export const useCoupon = async (
  couponCode: string,
  restaurantId: string
): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const { data, error } = await supabase.rpc('use_coupon', {
      coupon_code: couponCode,
      restaurant_id: restaurantId
    });
    
    if (error) {
      console.error('Error using coupon:', error);
      return { success: false, error: error.message };
    }
    
    if (data && data.length > 0) {
      const result = data[0];
      if (result.success) {
        return { success: true, message: result.message };
      } else {
        return { success: false, error: result.message };
      }
    }
    
    return { success: false, error: 'Failed to use coupon' };
  } catch (err) {
    console.error('Error in useCoupon:', err);
    return { success: false, error: 'Failed to use coupon' };
  }
};

// Function to fetch restaurant coupons
export const fetchRestaurantCoupons = async (restaurantId: string) => {
  try {
    const { data, error } = await supabase.rpc('get_restaurant_coupons', {
      restaurant_id: restaurantId
    });
    
    if (error) {
      console.error('Error fetching restaurant coupons:', error);
      return [];
    }
    
    return data || [];
  } catch (err) {
    console.error('Error in fetchRestaurantCoupons:', err);
    return [];
  }
};

// Customer functions
export const fetchCustomers = async (): Promise<Customer[]> => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching customers:', error);
      return [];
    }
    
    console.log('✅ Successfully loaded customers from database');
    return data || [];
  } catch (err) {
    console.error('Error in fetchCustomers:', err);
    return [];
  }
};

// Statistics functions for admin dashboard
export const fetchDashboardStats = async () => {
  try {
    // Fetch total restaurants
    const { count: restaurantCount } = await supabase
      .from('restaurants')
      .select('*', { count: 'exact', head: true });
    
    // Fetch total customers
    const { count: customerCount } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });
    
    // Fetch total coupons
    const { count: couponCount } = await supabase
      .from('coupons')
      .select('*', { count: 'exact', head: true });
    
    // Fetch used coupons
    const { count: usedCouponCount } = await supabase
      .from('coupons')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'used');
    
    return {
      totalRestaurants: restaurantCount || 0,
      totalCustomers: customerCount || 0,
      totalCoupons: couponCount || 0,
      usedCoupons: usedCouponCount || 0,
      unusedCoupons: (couponCount || 0) - (usedCouponCount || 0)
    };
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    return {
      totalRestaurants: 0,
      totalCustomers: 0,
      totalCoupons: 0,
      usedCoupons: 0,
      unusedCoupons: 0
    };
  }
};

// Real-time subscription helpers
export const subscribeToTables = (callback: () => void) => {
  try {
    // Check if supabase is properly initialized
    if (!supabase || typeof supabase.channel !== 'function') {
      console.warn('Supabase not properly initialized, skipping real-time subscriptions');
      return { unsubscribe: () => {} };
    }
    
    const subscription = supabase
      .channel('db-changes')
      .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'coupons' }, 
          callback)
      .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'customers' }, 
          callback)
      .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'restaurants' }, 
          callback)
      .subscribe();
    
    return subscription;
  } catch (error) {
    console.warn('Failed to subscribe to database changes:', error);
    return { unsubscribe: () => {} };
  }
};