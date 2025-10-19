import { supabase } from './supabase';

// Database types
export interface Restaurant {
  id: string;
  name: string;
  restaurant_name?: string;
  offer_name?: string;  
  image_url: string;
  logo_url?: string;
  discount_percentage: number;
  description: string;
  category: 'restaurant' | 'cafe' | 'bakery' | 'clothing' | 'other';
  created_at: string;
  updated_at?: string; // جعل هذا الحقل اختياريًا هنا أيضًا
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

// نوع بيانات السائق - محدث حسب schema قاعدة البيانات
export interface DeliveryDriver {
  id: string;
  full_name: string;
  phone_number: string;
  email: string;
  vehicle_type: 'motorcycle' | 'bicycle' | 'car' | 'scooter';
  status: 'available' | 'busy' | 'offline';
  rating: number;
  total_deliveries: number;
  city: string;
  current_location?: { lat: number; lng: number };
  auth_user_id?: string;
  created_at: string;
  updated_at?: string;
}

// نوع بيانات الطلب - محدث حسب schema قاعدة البيانات
export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  restaurant_id: string;
  delivery_driver_id?: string;
  coupon_id?: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string; // تم إضافة هذا الحقل
  order_items: { name: string; quantity: number; price: number }[]; // تم تصحيح اسم الحقل
  subtotal: number;
  tax_amount: number;
  total_price: number; // تم تصحيح اسم الحقل
  delivery_fee: number; // تم إضافة هذا الحقل
  currency: string;
  delivery_address_snapshot: {
    address: string;
    city: string;
    area: string;
    building_number?: string;
    floor?: string;
    apartment?: string;
    landmark?: string;
  };
  status: 'pending_restaurant_acceptance' | 'confirmed' | 'preparing' | 'ready_for_pickup' | 'en_route_to_restaurant' | 'assigned_to_driver' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
  customer_location?: { lat: number; lng: number };
  special_instructions?: string; // تم تصحيح اسم الحقل
  estimated_delivery_time?: string;
  pickup_time?: string; // تم إضافة هذا الحقل
  delivered_at?: string; // تم تصحيح اسم الحقل
  created_at: string;
  updated_at?: string;
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

// Restaurant management functions
export const addRestaurant = async (restaurantData: Omit<Restaurant, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; data?: Restaurant; error?: any }> => {
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .insert([restaurantData])
      .select()
      .single();

    if (error) {
      console.error('Error adding restaurant:', error);
      return { success: false, error };
    }
    
    console.log('✅ Successfully added restaurant:', data);
    return { success: true, data: data as Restaurant };
  } catch (err) {
    console.error('Error in addRestaurant:', err);
    return { success: false, error: err };
  }
};

// Add this function to delete a restaurant
export const deleteRestaurant = async (restaurantId: string): Promise<{ success: boolean; error?: any }> => {
  try {
    const { error } = await supabase.from('restaurants').delete().eq('id', restaurantId);
    if (error) throw error;
    console.log('✅ Successfully deleted restaurant with ID:', restaurantId);
    return { success: true };
  } catch (err) {
    console.error('Error deleting restaurant:', err);
    return { success: false, error: err };
  }
};

// Add this function to update a restaurant
export const updateRestaurant = async (restaurantId: string, restaurantData: Partial<Omit<Restaurant, 'id' | 'created_at'>>): Promise<{ success: boolean; data?: Restaurant; error?: any }> => {
  try {
    const { data, error } = await supabase.from('restaurants').update(restaurantData).eq('id', restaurantId).select().single();
    if (error) throw error;
    console.log('✅ Successfully updated restaurant:', data);
    return { success: true, data: data as Restaurant };
  } catch (err) {
    console.error('Error updating restaurant:', err);
    return { success: false, error: err };
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
  restaurantId?: string | null
): Promise<{ success: boolean; coupon?: any; error?: string }> => {
  try {
    const { data, error } = await supabase.rpc('validate_coupon', {
      coupon_code: couponCode,
      restaurant_id: restaurantId ?? null
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
    const { data, error } = await supabase.rpc('fetch_restaurant_coupons', {
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
    // Try admin RPC first (will throw if not admin) then fallback to direct select
    const rpcResult = await supabase
      .rpc('fetch_all_customers')
      .order('created_at', { ascending: false } as any);

    if (!rpcResult.error) {
      console.log('✅ Loaded customers via admin RPC');
      return rpcResult.data || [];
    }

    // Fallback to RLS-controlled select
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
    // Try admin RPC first
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('fetch_dashboard_stats')
      .single();

    if (!rpcError && rpcData) {
      return {
        totalRestaurants: Number(rpcData.total_restaurants) || 0,
        totalCustomers: Number(rpcData.total_customers) || 0,
        totalCoupons: Number(rpcData.total_coupons) || 0,
        usedCoupons: Number(rpcData.used_coupons) || 0,
        unusedCoupons: Number(rpcData.unused_coupons) || 0
      };
    }

    // Fallback counts under RLS
    const { count: restaurantCount } = await supabase
      .from('restaurants')
      .select('*', { count: 'exact', head: true });
    const { count: customerCount } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });
    const { count: couponCount } = await supabase
      .from('coupons')
      .select('*', { count: 'exact', head: true });
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
      .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'orders' }, 
          callback)
      .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'delivery_drivers' }, 
          callback)
      .subscribe();

    return subscription;
  } catch (error) {
    console.warn('Failed to subscribe to database changes:', error);
    return { unsubscribe: () => {} };
  }
};

// دالة لجلب جميع الكوبونات (ضرورية للوحة تحكم الأدمن)
export const fetchAllCoupons = async () => {
  try {
    // Try admin RPC first (will throw if not admin) then fallback to direct select
    const rpcResult = await supabase
      .rpc('fetch_all_coupons')
      .order('created_at', { ascending: false } as any);

    if (!rpcResult.error) {
      return rpcResult.data || [];
    }

    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all coupons:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Error in fetchAllCoupons:', err);
    return [];
  }
};

// =============================================================================
// دوال نظام التوصيل - Delivery System Functions
// =============================================================================

// دوال إدارة الطلبات - Order Management Functions

/**
 * إنشاء طلب جديد مع تفاصيل التوصيل
 */
export const createOrder = async (orderData: {
  restaurant_id: string;
  coupon_id?: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  order_items: { name: string; quantity: number; price: number }[];
  subtotal: number;
  tax_amount: number;
  total_price: number;
  delivery_fee: number;
  delivery_address: {
    address: string;
    city: string;
    area: string;
    building_number?: string;
    floor?: string;
    apartment?: string;
    landmark?: string;
  };
  special_instructions?: string;
}): Promise<{ success: boolean; order?: Order; error?: string }> => {
  try {
    let customerId: string;
    
    // Try to get authenticated user
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Authenticated user flow: find or create customer linked to auth
      let { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!customer) {
        const { data: newCustomer, error: newCustomerError } = await supabase
          .from('customers')
          .insert({
            auth_user_id: user.id,
            name: orderData.customer_name,
            email: user.email!,
            phone: orderData.customer_phone
          })
          .select('id')
          .single();

        if (newCustomerError) throw new Error(`Error creating customer profile: ${newCustomerError.message}`);
        customer = newCustomer;
      }
      customerId = customer!.id;
    } else {
      // Anonymous user flow: create guest customer
      const { data: anonCustomer, error: anonError } = await supabase
        .from('customers')
        .insert({
          name: orderData.customer_name,
          email: `guest_${Date.now()}@anonymous.com`,
          phone: orderData.customer_phone
        })
        .select('id')
        .single();

      if (anonError) throw new Error(`Error creating guest customer: ${anonError.message}`);
      customerId = anonCustomer!.id;
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // Prepare order data with proper defaults and explicit mapping
    const finalOrderData = {
      order_number: orderNumber,
      customer_id: customerId,
      restaurant_id: orderData.restaurant_id,
      delivery_driver_id: null,
      customer_name: orderData.customer_name,
      customer_phone: orderData.customer_phone,
      customer_address: orderData.customer_address,
      order_items: orderData.order_items,
      subtotal: orderData.subtotal,
      tax_amount: orderData.tax_amount,
      delivery_fee: orderData.delivery_fee,
      total_price: orderData.total_price,
      delivery_address_snapshot: orderData.delivery_address,
      special_instructions: orderData.special_instructions || null,
      status: 'pending_restaurant_acceptance' as const,
      delivered_at: null
    };

    console.log('🔄 Attempting to insert order:', JSON.stringify(finalOrderData, null, 2));

    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert(finalOrderData)
      .select()
      .single();

    if (orderError) {
      console.error('❌ Database error details:', JSON.stringify(orderError, null, 2));
      throw new Error(`Error inserting order: ${orderError.message || JSON.stringify(orderError)}`);
    }

    return { success: true, order: newOrder };
  } catch (err: any) {
    console.error('❌ Full error details in createOrder:', JSON.stringify(err, null, 2));
    console.error('❌ Error message:', err?.message);
    console.error('❌ Error details:', err?.details);
    const errorMsg = err?.message || err?.error?.message || JSON.stringify(err) || 'Unknown error occurred';
    return { success: false, error: errorMsg };
  }
};

/**
 * تحديث حالة الطلب
 */
export const updateOrderStatus = async (
  orderId: string,
  newStatus: Order['status'],
  driverId?: string,
  estimatedDeliveryTime?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.rpc('update_order_status', {
      order_id: orderId,
      new_status: newStatus,
      driver_id: driverId,
      estimated_time: estimatedDeliveryTime
    });

    if (error) {
      console.error('Error updating order status:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Error in updateOrderStatus:', err);
    return { success: false, error: 'فشل في تحديث حالة الطلب' };
  }
};

/**
 * تعيين سائق للطلب
 */
export const assignDriverToOrder = async (
  orderId: string,
  driverId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.rpc('assign_driver_to_order', {
      order_id: orderId,
      driver_id: driverId
    });

    if (error) {
      console.error('Error assigning driver:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Error in assignDriverToOrder:', err);
    return { success: false, error: 'فشل في تعيين السائق' };
  }
};

// Auto-assign first available driver to an order (merchant/admin)
export const autoAssignDriver = async (
  orderId: string
): Promise<{ success: boolean; driverId?: string; message?: string; error?: string }> => {
  try {
    const { data, error } = await supabase
      .rpc('auto_assign_driver', { p_order_id: orderId })
      .single();

    if (error) {
      console.error('Error auto-assigning driver:', error);
      return { success: false, error: error.message };
    }

    if (data && data.message === 'assigned') {
      return { success: true, driverId: data.driver_id, message: 'assigned' };
    }

    return { success: false, message: data?.message || 'no assignment' };
  } catch (err) {
    console.error('Error in autoAssignDriver:', err);
    return { success: false, error: 'فشل في تعيين السائق تلقائيًا' };
  }
};

/**
 * جلب الطلبات حسب الحالة
 */
export const getOrdersByStatus = async (
  status?: Order['status'],
  restaurantId?: string,
  driverId?: string
): Promise<Order[]> => {
  try {
    // Use left joins (remove !inner) so orders without joined rows still appear
    let query = supabase
      .from('orders')
      .select(`
        *,
        customers(name, phone),
        restaurants(name, restaurant_name, logo_url),
        delivery_drivers(full_name, phone_number, vehicle_type)
      `)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (restaurantId) {
      query = query.eq('restaurant_id', restaurantId);
    }

    if (driverId) {
      query = query.eq('delivery_driver_id', driverId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching orders:', error);
      // Fallback: fetch only from orders table without joins (avoids RLS on related tables)
      try {
        let simple = supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });
        if (status) simple = simple.eq('status', status);
        if (restaurantId) simple = simple.eq('restaurant_id', restaurantId);
        if (driverId) simple = simple.eq('delivery_driver_id', driverId);
        const { data: simpleData, error: simpleError } = await simple;
        if (simpleError) {
          console.error('Fallback orders query also failed:', simpleError);
          return [];
        }
        return simpleData || [];
      } catch (e) {
        console.error('Fallback orders query threw:', e);
        return [];
      }
    }

    return data || [];
  } catch (err) {
    console.error('Error in getOrdersByStatus:', err);
    return [];
  }
};

/**
 * جلب طلبات العميل
 */
export const getCustomerOrders = async (customerEmail: string): Promise<Order[]> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        customers!inner(email,name,phone),
        restaurants!inner(name, logo_url, restaurant_name),
        delivery_drivers(full_name, phone_number, vehicle_type)
      `)
      .eq('customers.email', customerEmail)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching customer orders:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Error in getCustomerOrders:', err);
    return [];
  }
};

/**
 * تتبع حالة الطلب
 */
export const trackOrder = async (orderNumber: string): Promise<{ success: boolean; order?: Order; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        customers!inner(name, phone),
        restaurants!inner(name, logo_url),
        delivery_drivers(full_name, phone_number, vehicle_type, current_location)
      `)
      .eq('order_number', orderNumber)
      .single();

    if (error) {
      console.error('Error tracking order:', error);
      return { success: false, error: error.message };
    }

    if (data) {
      return { success: true, order: data };
    }

    return { success: false, error: 'الطلب غير موجود' };
  } catch (err) {
    console.error('Error in trackOrder:', err);
    return { success: false, error: 'فشل في تتبع الطلب' };
  }
};

// دوال إدارة السائقين - Driver Management Functions

/**
 * تسجيل سائق توصيل جديد
 */
export const registerDeliveryDriver = async (driverData: {
  full_name: string; // تم تصحيح اسم الحقل
  phone_number: string; // تم تصحيح اسم الحقل
  email: string;
  vehicle_type: DeliveryDriver['vehicle_type'];
  city: string;
}): Promise<{ success: boolean; driver?: DeliveryDriver; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('delivery_drivers')
      .insert([{
        ...driverData,
        status: 'offline',
        rating: 5.0,
        total_deliveries: 0
      }])
      .select()
      .single();

    if (error) {
      console.error('Error registering driver:', error);
      return { success: false, error: error.message };
    }

    if (data) {
      return { success: true, driver: data };
    }

    return { success: false, error: 'فشل في تسجيل السائق' };
  } catch (err) {
    console.error('Error in registerDeliveryDriver:', err);
    return { success: false, error: 'خطأ في تسجيل السائق' };
  }
};

/**
 * تحديث موقع السائق
 */
export const updateDriverLocation = async (
  driverId: string,
  location: { lat: number; lng: number }
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('delivery_drivers')
      .update({ 
        current_location: location,
        updated_at: new Date().toISOString()
      })
      .eq('id', driverId);

    if (error) {
      console.error('Error updating driver location:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Error in updateDriverLocation:', err);
    return { success: false, error: 'فشل في تحديث الموقع' };
  }
};

/**
 * تحديث حالة السائق
 */
export const updateDriverStatus = async (
  driverId: string,
  status: DeliveryDriver['status']
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('delivery_drivers')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', driverId);

    if (error) {
      console.error('Error updating driver status:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Error in updateDriverStatus:', err);
    return { success: false, error: 'فشل في تحديث حالة السائق' };
  }
};

/**
 * جلب السائقين المتاحين
 */
export const getAvailableDrivers = async (city?: string): Promise<DeliveryDriver[]> => {
  try {
    let query = supabase
      .from('delivery_drivers')
      .select('*')
      .eq('status', 'available')
      .order('rating', { ascending: false });

    if (city) {
      query = query.eq('city', city);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching available drivers:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Error in getAvailableDrivers:', err);
    return [];
  }
};

/**
 * جلب سائق بالمعرف
 */
export const getDriverById = async (driverId: string): Promise<{ success: boolean; driver?: DeliveryDriver; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('delivery_drivers')
      .select('*')
      .eq('id', driverId)
      .single();

    if (error) {
      console.error('Error fetching driver:', error);
      return { success: false, error: error.message };
    }

    if (data) {
      return { success: true, driver: data };
    }

    return { success: false, error: 'السائق غير موجود' };
  } catch (err) {
    console.error('Error in getDriverById:', err);
    return { success: false, error: 'فشل في جلب بيانات السائق' };
  }
};

/**
 * جلب بيانات السائق بناءً على معرف المستخدم المصادق عليه
 */
export const getDriverByAuthId = async (authUserId: string): Promise<{ success: boolean; driver?: DeliveryDriver; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('delivery_drivers')
      .select('*')
      .eq('auth_user_id', authUserId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found - not an error, just no driver record for this user
        return { success: false, error: 'هذا المستخدم ليس سائق توصيل' };
      }
      console.error('Error fetching driver by auth ID:', error);
      return { success: false, error: error.message };
    }

    if (data) {
      return { success: true, driver: data };
    }

    return { success: false, error: 'السائق غير موجود' };
  } catch (err) {
    console.error('Error in getDriverByAuthId:', err);
    return { success: false, error: 'فشل في جلب بيانات السائق' };
  }
};

// دوال إحصائيات التوصيل - Delivery Statistics Functions

/**
 * جلب إحصائيات التوصيل الشاملة
 */
export const fetchDeliveryStats = async () => {
  try {
    // إجمالي الطلبات
    const { count: totalOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    // الطلبات المكتملة
    const { count: completedOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'delivered');

    // الطلبات النشطة
    const { count: activeOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending_restaurant_acceptance', 'confirmed', 'preparing', 'ready_for_pickup', 'assigned_to_driver', 'picked_up', 'in_transit']);

    // إجمالي السائقين
    const { count: totalDrivers } = await supabase
      .from('delivery_drivers')
      .select('*', { count: 'exact', head: true });

    // السائقين المتاحين
    const { count: availableDrivers } = await supabase
      .from('delivery_drivers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'available');

    return {
      totalOrders: totalOrders || 0,
      completedOrders: completedOrders || 0,
      activeOrders: activeOrders || 0,
      cancelledOrders: (totalOrders || 0) - (completedOrders || 0) - (activeOrders || 0),
      totalDrivers: totalDrivers || 0,
      availableDrivers: availableDrivers || 0,
      busyDrivers: (totalDrivers || 0) - (availableDrivers || 0)
    };
  } catch (err) {
    console.error('Error fetching delivery stats:', err);
    return {
      totalOrders: 0,
      completedOrders: 0,
      activeOrders: 0,
      cancelledOrders: 0,
      totalDrivers: 0,
      availableDrivers: 0,
      busyDrivers: 0
    };
  }
};

// =====================================================================
// Dispatcher System Functions
// =====================================================================

export const fetchReadyOrdersForDispatcher = async () => {
  try {
    const { data, error } = await supabase.rpc('fetch_ready_orders_for_dispatcher');
    
    if (error) {
      console.error('Error fetching ready orders:', error);
      return [];
    }
    
    return data || [];
  } catch (err) {
    console.error('Error in fetchReadyOrdersForDispatcher:', err);
    return [];
  }
};

export const fetchAvailableDrivers = async () => {
  try {
    const { data, error } = await supabase.rpc('fetch_available_drivers');
    
    if (error) {
      console.error('Error fetching available drivers:', error);
      return [];
    }
    
    return data || [];
  } catch (err) {
    console.error('Error in fetchAvailableDrivers:', err);
    return [];
  }
};

export const assignOrderToDriverByDispatcher = async (
  orderId: string,
  driverId: string
): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const { data, error } = await supabase.rpc('assign_order_to_driver_by_dispatcher', {
      p_order_id: orderId,
      p_driver_id: driverId
    });
    
    if (error) {
      console.error('Error assigning driver:', error);
      return { success: false, error: error.message };
    }
    
    if (data && data.length > 0 && data[0].success) {
      return { success: true, message: data[0].message };
    }
    
    return { success: false, error: data?.[0]?.message || 'فشل في تعيين السائق' };
  } catch (err) {
    console.error('Error in assignOrderToDriverByDispatcher:', err);
    return { success: false, error: 'فشل في تعيين السائق' };
  }
};

export const rateDriverByDispatcher = async (
  driverId: string,
  rating: number
): Promise<{ success: boolean; newRating?: number; message?: string; error?: string }> => {
  try {
    const { data, error } = await supabase.rpc('rate_driver_by_dispatcher', {
      p_driver_id: driverId,
      p_rating: rating
    });
    
    if (error) {
      console.error('Error rating driver:', error);
      return { success: false, error: error.message };
    }
    
    if (data && data.length > 0 && data[0].success) {
      return { 
        success: true, 
        newRating: data[0].new_rating,
        message: data[0].message 
      };
    }
    
    return { success: false, error: data?.[0]?.message || 'فشل في تقييم السائق' };
  } catch (err) {
    console.error('Error in rateDriverByDispatcher:', err);
    return { success: false, error: 'فشل في تقييم السائق' };
  }
};

export const fetchMyDriverOrders = async () => {
  try {
    const { data, error } = await supabase.rpc('fetch_my_driver_orders');
    
    if (error) {
      console.error('Error fetching my driver orders:', error);
      return [];
    }
    
    return data || [];
  } catch (err) {
    console.error('Error in fetchMyDriverOrders:', err);
    return [];
  }
};