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
  full_name: string; // تم تصحيح اسم الحقل
  phone_number: string; // تم تصحيح اسم الحقل  
  email: string;
  vehicle_type: 'motorcycle' | 'bicycle' | 'car' | 'scooter';
  status: 'available' | 'busy' | 'offline';
  rating: number;
  total_deliveries: number;
  city: string;
  current_location?: { lat: number; lng: number };
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
  status: 'pending_restaurant_acceptance' | 'confirmed' | 'preparing' | 'ready_for_pickup' | 'assigned_to_driver' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
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
}, customerData?: { name: string; email: string; phone: string; }): Promise<{ success: boolean; order?: Order; error?: string }> => {
  try {
    let customerId: string;
    
    if (customerData) {
      // Try to find existing customer
      let { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('email', customerData.email)
        .single();

      if (!customer) {
        const { data: newCustomer, error: newCustomerError } = await supabase
          .from('customers')
          .insert(customerData)
          .select('id')
          .single();

        if (newCustomerError) throw new Error(`Error creating customer: ${newCustomerError.message}`);
        customer = newCustomer;
      }
      customerId = customer!.id;
    } else {
      // Create anonymous customer record
      const { data: anonCustomer, error: anonError } = await supabase
        .from('customers')
        .insert({
          name: orderData.customer_name,
          email: `${Date.now()}@anonymous.com`,
          phone: orderData.customer_phone
        })
        .select('id')
        .single();

      if (anonError) throw new Error(`Error creating customer: ${anonError.message}`);
      customerId = anonCustomer!.id;
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // Prepare order data with proper mapping
    const finalOrderData = {
      order_number: orderNumber,
      customer_id: customerId,
      restaurant_id: orderData.restaurant_id,
      delivery_driver_id: null,
      coupon_id: orderData.coupon_id || null,
      customer_name: orderData.customer_name,
      customer_phone: orderData.customer_phone,
      customer_address: orderData.customer_address,
      order_items: orderData.order_items,
      subtotal: orderData.subtotal,
      tax_amount: orderData.tax_amount,
      total_price: orderData.total_price,
      delivery_fee: orderData.delivery_fee,
      currency: 'EGP',
      delivery_address_snapshot: orderData.delivery_address,
      status: 'pending_restaurant_acceptance' as const,
      special_instructions: orderData.special_instructions,
      estimated_delivery_time: null,
      pickup_time: null,
      delivered_at: null
    };

    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert(finalOrderData)
      .select()
      .single();

    if (orderError) throw new Error(orderError.message);

    return { success: true, order: newOrder };

  } catch (err: any) {
    console.error('Error in createOrder:', err);
    return { success: false, error: err.message };
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

/**
 * جلب الطلبات حسب الحالة
 */
export const getOrdersByStatus = async (
  status?: Order['status'],
  restaurantId?: string,
  driverId?: string
): Promise<Order[]> => {
  try {
    let query = supabase
      .from('orders')
      .select(`
        *,
        customers!inner(name, phone),
        restaurants!inner(name),
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
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Error in getOrdersByStatus:', err);
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