import { supabase } from './supabase';

// Database types
export interface Restaurant {
  id: string;
  name: string;
  image_url: string;
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

// Mock data fallback for when database is not available
const mockRestaurants: Restaurant[] = [
  {
    id: '1',
    name: 'Gourmet Bistro',
    image_url: 'https://images.unsplash.com/photo-1667388968964-4aa652df0a9b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZXN0YXVyYW50JTIwZm9vZCUyMGRpbmluZ3xlbnwxfHx8fDE3NTc1ODE5MTN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    discount_percentage: 30,
    description: 'Valid for dine-in or delivery',
    category: 'restaurant',
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Cozy Corner Cafe',
    image_url: 'https://images.unsplash.com/photo-1682979358243-816a75830f77?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYWZlJTIwY29mZmVlJTIwaW50ZXJpb3J8ZW58MXx8fHwxNzU3NTk2ODQ5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    discount_percentage: 25,
    description: 'All beverages and pastries',
    category: 'cafe',
    created_at: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Mario\'s Pizza Palace',
    image_url: 'https://images.unsplash.com/photo-1563245738-9169ff58eccf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaXp6YSUyMHJlc3RhdXJhbnR8ZW58MXx8fHwxNzU3NTI3NTA0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    discount_percentage: 40,
    description: 'Pizza and Italian dishes',
    category: 'restaurant',
    created_at: new Date().toISOString()
  }
];

// Restaurant functions
export const fetchRestaurants = async (): Promise<Restaurant[]> => {
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching restaurants:', error);
      console.warn('🔄 Using mock data fallback');
      return mockRestaurants;
    }
    
    if (!data || data.length === 0) {
      console.warn('📝 No restaurants found in database, using mock data');
      return mockRestaurants;
    }
    
    console.log('✅ Successfully loaded restaurants from database');
    return data;
  } catch (err) {
    console.error('Error in fetchRestaurants:', err);
    console.warn('🔄 Using mock data fallback');
    return mockRestaurants;
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