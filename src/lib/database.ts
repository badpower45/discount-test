// Database setup and operations for Discount Platform
import { supabase } from './supabase';

// Check if tables exist by trying to read from them
export async function checkTables() {
  try {
    console.log('🔍 Checking database tables...');
    
    // Test restaurants table
    const { data: _restaurants, error: restaurantError } = await supabase
      .from('restaurants')
      .select('*', { count: 'exact', head: true });

    // Test users table  
    const { data: _users, error: userError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Test coupons table
    const { data: _coupons, error: couponError } = await supabase
      .from('coupons')
      .select('*', { count: 'exact', head: true });

    const tablesExist = {
      restaurants: !restaurantError,
      users: !userError,
      coupons: !couponError
    };

    console.log('📊 Table status:', tablesExist);
    
    if (!tablesExist.restaurants || !tablesExist.users || !tablesExist.coupons) {
      console.warn('⚠️  Some tables are missing. Please create them in Supabase dashboard:');
      console.log(`
CREATE TABLE IF NOT EXISTS restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  discount_percentage INTEGER DEFAULT 20,
  description TEXT,
  image_url TEXT,
  category TEXT DEFAULT 'restaurant',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'unused' CHECK (status IN ('unused', 'used')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  used_at TIMESTAMPTZ
);`);
    }

    return tablesExist;
  } catch (error) {
    console.error('❌ Database check error:', error);
    return { restaurants: false, users: false, coupons: false };
  }
}

// Insert initial restaurant data
export async function seedRestaurants() {
  try {
    const { data: existing, error: checkError } = await supabase
      .from('restaurants')
      .select('*', { count: 'exact', head: true });
    
    if (checkError) {
      console.error('Error checking restaurants:', checkError);
      return;
    }

    if (!checkError && existing && existing.length > 0) {
      console.log('📊 Restaurants already exist, skipping seed');
      return;
    }

    const restaurants = [
      {
        name: 'Gourmet Bistro',
        address: '123 Food Street, Cairo',
        phone: '+20-123-456-789',
        discount_percentage: 30,
        description: 'Fine dining experience with Mediterranean cuisine',
        image_url: 'https://images.unsplash.com/photo-1667388968964-4aa652df0a9b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZXN0YXVyYW50JTIwZm9vZCUyMGRpbmluZ3xlbnwxfHx8fDE3NTc1ODE5MTN8MA&ixlib=rb-4.1.0&q=80&w=1080',
        category: 'restaurant'
      },
      {
        name: 'Cozy Corner Cafe',
        address: '456 Coffee Ave, Cairo',
        phone: '+20-987-654-321',
        discount_percentage: 25,
        description: 'Perfect spot for coffee lovers and pastry enthusiasts',
        image_url: 'https://images.unsplash.com/photo-1682979358243-816a75830f77?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYWZlJTIwY29mZmVlJTIwaW50ZXJpb3J8ZW58MXx8fHwxNzU3NTk2ODQ5fDA&ixlib=rb-4.1.0&q=80&w=1080',
        category: 'cafe'
      },
      {
        name: 'Fresh Bakery',
        address: '789 Baker St, Cairo',
        phone: '+20-555-123-456',
        discount_percentage: 20,
        description: 'Freshly baked goods and artisan breads daily',
        image_url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYWtlcnklMjBwYXN0cnklMjBicmVhZHxlbnwxfHx8fDE3NTc1OTY4NDl8MA&ixlib=rb-4.1.0&q=80&w=1080',
        category: 'bakery'
      }
    ];

    const { error: seedError } = await supabase
      .from('restaurants')
      .insert(restaurants);

    if (seedError) {
      console.error('❌ Error seeding restaurants:', seedError);
    } else {
      console.log('✅ Restaurants seeded successfully');
    }
  } catch (error) {
    console.error('❌ Seed error:', error);
  }
}

// Database functions
export const db = {
  // Get all restaurants
  async getRestaurants() {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching restaurants:', error);
      return [];
    }
    return data || [];
  },

  // Create or get user
  async createUser(userData: { name: string; email: string; phone: string }) {
    // First try to find existing user
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', userData.email)
      .single();

    if (existingUser) {
      return existingUser;
    }

    // Create new user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      throw error;
    }

    return newUser;
  },

  // Generate unique coupon code
  generateCouponCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  // Create coupon
  async createCoupon(userId: string, restaurantId: string) {
    const code = this.generateCouponCode();
    
    const { data, error } = await supabase
      .from('coupons')
      .insert({
        code,
        user_id: userId,
        restaurant_id: restaurantId,
        status: 'unused'
      })
      .select(`
        *,
        users:user_id(*),
        restaurants:restaurant_id(*)
      `)
      .single();

    if (error) {
      console.error('Error creating coupon:', error);
      throw error;
    }

    return data;
  },

  // Validate and use coupon
  async useCoupon(code: string, restaurantId?: string) {
    // First find the coupon
    const { data: coupon, error: findError } = await supabase
      .from('coupons')
      .select(`
        *,
        users:user_id(*),
        restaurants:restaurant_id(*)
      `)
      .eq('code', code.trim().toUpperCase())
      .single();

    if (findError || !coupon) {
      return { success: false, message: 'Invalid coupon code' };
    }

    if (coupon.status === 'used') {
      return { success: false, message: 'Coupon already used', coupon };
    }

    // If restaurant ID provided, check if coupon belongs to this restaurant
    if (restaurantId && coupon.restaurant_id !== restaurantId) {
      return { success: false, message: 'Coupon not valid for this restaurant' };
    }

    // Mark coupon as used
    const { data: updatedCoupon, error: updateError } = await supabase
      .from('coupons')
      .update({ 
        status: 'used',
        used_at: new Date().toISOString()
      })
      .eq('id', coupon.id)
      .select(`
        *,
        users:user_id(*),
        restaurants:restaurant_id(*)
      `)
      .single();

    if (updateError) {
      console.error('Error updating coupon:', updateError);
      return { success: false, message: 'Error processing coupon' };
    }

    return { success: true, message: 'Coupon used successfully', coupon: updatedCoupon };
  },

  // Get coupons with filters
  async getCoupons(filters: { 
    restaurantId?: string; 
    status?: 'used' | 'unused'; 
    userId?: string 
  } = {}) {
    let query = supabase
      .from('coupons')
      .select(`
        *,
        users:user_id(*),
        restaurants:restaurant_id(*)
      `)
      .order('created_at', { ascending: false });

    if (filters.restaurantId) {
      query = query.eq('restaurant_id', filters.restaurantId);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching coupons:', error);
      return [];
    }

    return data || [];
  },

  // Get all users
  async getUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }

    return data || [];
  },

  // Get statistics
  async getStats() {
    const [restaurants, users, coupons] = await Promise.all([
      this.getRestaurants(),
      this.getUsers(),
      this.getCoupons()
    ]);

    const usedCoupons = coupons.filter((c: any) => c.status === 'used');
    const unusedCoupons = coupons.filter((c: any) => c.status === 'unused');

    return {
      totalRestaurants: restaurants.length,
      totalUsers: users.length,
      totalCoupons: coupons.length,
      usedCoupons: usedCoupons.length,
      unusedCoupons: unusedCoupons.length,
      restaurants,
      users,
      coupons
    };
  }
};

// Initialize database
export async function initializeDatabase() {
  console.log('🚀 Initializing database...');
  
  // Check if tables exist first
  const tablesExist = await checkTables();
  
  if (tablesExist.restaurants && tablesExist.users && tablesExist.coupons) {
    await seedRestaurants();
    console.log('✅ Database initialized successfully');
    return { success: true, message: 'Database ready' };
  } else {
    console.error('❌ Database tables missing. Please create them in Supabase dashboard.');
    return { success: false, message: 'Tables missing' };
  }
}