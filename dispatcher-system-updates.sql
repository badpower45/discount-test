-- =====================================================================
-- Dispatcher System Database Updates
-- This file adds dispatcher role, new RPC functions, and order status updates
-- =====================================================================

-- Step 1: Update merchants table to support 'dispatcher' role
ALTER TABLE merchants DROP CONSTRAINT IF EXISTS merchants_role_check;
ALTER TABLE merchants ADD CONSTRAINT merchants_role_check 
    CHECK (role IN ('merchant', 'admin', 'dispatcher'));

-- Step 2: Add customer_location field to orders table (if not exists)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_location JSONB;

-- Step 3: Update order status enum to include 'en_route_to_restaurant'
-- Note: In PostgreSQL, we need to add the new value to existing orders
-- The status field is TEXT with CHECK constraint, so we need to drop and recreate
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
    CHECK (status IN (
        'pending_restaurant_acceptance',
        'confirmed',
        'preparing',
        'ready_for_pickup',
        'en_route_to_restaurant',
        'assigned_to_driver',
        'picked_up',
        'in_transit',
        'delivered',
        'cancelled'
    ));

-- Step 4: Create helper function to check if user is dispatcher
CREATE OR REPLACE FUNCTION is_current_user_dispatcher()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM merchants m
        WHERE m.auth_user_id = auth.uid() AND m.role = 'dispatcher'
    );
$$;

-- Step 5: Create RPC function for dispatcher to assign order to driver
CREATE OR REPLACE FUNCTION assign_order_to_driver_by_dispatcher(
    p_order_id UUID,
    p_driver_id UUID
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
    v_is_dispatcher BOOLEAN;
    v_is_admin BOOLEAN;
    v_driver_status TEXT;
BEGIN
    -- Check if current user is dispatcher or admin
    SELECT is_current_user_dispatcher() INTO v_is_dispatcher;
    SELECT is_current_user_admin() INTO v_is_admin;
    
    IF NOT (v_is_dispatcher OR v_is_admin) THEN
        RETURN QUERY SELECT false, 'غير مصرح: يجب أن تكون موزعاً أو مديراً';
        RETURN;
    END IF;
    
    -- Check if driver exists and get status
    SELECT status INTO v_driver_status
    FROM delivery_drivers
    WHERE id = p_driver_id;
    
    IF v_driver_status IS NULL THEN
        RETURN QUERY SELECT false, 'السائق غير موجود';
        RETURN;
    END IF;
    
    IF v_driver_status != 'available' THEN
        RETURN QUERY SELECT false, 'السائق غير متاح حالياً';
        RETURN;
    END IF;
    
    -- Assign driver to order and update statuses
    UPDATE orders
    SET delivery_driver_id = p_driver_id,
        status = 'en_route_to_restaurant',
        updated_at = NOW()
    WHERE id = p_order_id;
    
    -- Update driver status to busy
    UPDATE delivery_drivers
    SET status = 'busy',
        updated_at = NOW()
    WHERE id = p_driver_id;
    
    RETURN QUERY SELECT true, 'تم تعيين السائق بنجاح';
END;
$$;

GRANT EXECUTE ON FUNCTION assign_order_to_driver_by_dispatcher(UUID, UUID) TO authenticated;

-- Step 6: Create RPC function for dispatcher to rate driver
CREATE OR REPLACE FUNCTION rate_driver_by_dispatcher(
    p_driver_id UUID,
    p_rating NUMERIC
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    new_rating NUMERIC
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
    v_is_dispatcher BOOLEAN;
    v_is_admin BOOLEAN;
    v_current_rating NUMERIC;
    v_total_deliveries INTEGER;
    v_new_rating NUMERIC;
BEGIN
    -- Check if current user is dispatcher or admin
    SELECT is_current_user_dispatcher() INTO v_is_dispatcher;
    SELECT is_current_user_admin() INTO v_is_admin;
    
    IF NOT (v_is_dispatcher OR v_is_admin) THEN
        RETURN QUERY SELECT false, 'غير مصرح: يجب أن تكون موزعاً أو مديراً', NULL::NUMERIC;
        RETURN;
    END IF;
    
    -- Validate rating range
    IF p_rating < 1 OR p_rating > 5 THEN
        RETURN QUERY SELECT false, 'التقييم يجب أن يكون بين 1 و 5', NULL::NUMERIC;
        RETURN;
    END IF;
    
    -- Get current driver data
    SELECT rating, total_deliveries 
    INTO v_current_rating, v_total_deliveries
    FROM delivery_drivers
    WHERE id = p_driver_id;
    
    IF v_current_rating IS NULL THEN
        RETURN QUERY SELECT false, 'السائق غير موجود', NULL::NUMERIC;
        RETURN;
    END IF;
    
    -- Calculate new average rating
    -- Formula: ((current_rating * total_deliveries) + new_rating) / (total_deliveries + 1)
    v_new_rating := ((v_current_rating * v_total_deliveries) + p_rating) / (v_total_deliveries + 1);
    
    -- Update driver rating and increment deliveries
    UPDATE delivery_drivers
    SET rating = v_new_rating,
        total_deliveries = total_deliveries + 1,
        updated_at = NOW()
    WHERE id = p_driver_id;
    
    RETURN QUERY SELECT true, 'تم تحديث تقييم السائق بنجاح', v_new_rating;
END;
$$;

GRANT EXECUTE ON FUNCTION rate_driver_by_dispatcher(UUID, NUMERIC) TO authenticated;

-- Step 7: Create function to fetch ready_for_pickup orders (for dispatcher dashboard)
CREATE OR REPLACE FUNCTION fetch_ready_orders_for_dispatcher()
RETURNS TABLE (
    order_id UUID,
    order_number TEXT,
    restaurant_id UUID,
    restaurant_name TEXT,
    customer_name TEXT,
    customer_phone TEXT,
    customer_address TEXT,
    total_price NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
    v_is_dispatcher BOOLEAN;
    v_is_admin BOOLEAN;
BEGIN
    -- Check if current user is dispatcher or admin
    SELECT is_current_user_dispatcher() INTO v_is_dispatcher;
    SELECT is_current_user_admin() INTO v_is_admin;
    
    IF NOT (v_is_dispatcher OR v_is_admin) THEN
        RAISE EXCEPTION 'غير مصرح: يجب أن تكون موزعاً أو مديراً';
    END IF;
    
    RETURN QUERY
    SELECT 
        o.id as order_id,
        o.order_number,
        o.restaurant_id,
        r.restaurant_name,
        o.customer_name,
        o.customer_phone,
        o.customer_address,
        o.total_price,
        o.created_at
    FROM orders o
    JOIN restaurants r ON o.restaurant_id = r.id
    WHERE o.status = 'ready_for_pickup'
    ORDER BY o.created_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION fetch_ready_orders_for_dispatcher() TO authenticated;

-- Step 8: Create function to fetch available drivers (for dispatcher dashboard)
CREATE OR REPLACE FUNCTION fetch_available_drivers()
RETURNS TABLE (
    driver_id UUID,
    full_name TEXT,
    phone_number TEXT,
    vehicle_type TEXT,
    rating NUMERIC,
    total_deliveries INTEGER,
    city TEXT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
    v_is_dispatcher BOOLEAN;
    v_is_admin BOOLEAN;
BEGIN
    -- Check if current user is dispatcher or admin
    SELECT is_current_user_dispatcher() INTO v_is_dispatcher;
    SELECT is_current_user_admin() INTO v_is_admin;
    
    IF NOT (v_is_dispatcher OR v_is_admin) THEN
        RAISE EXCEPTION 'غير مصرح: يجب أن تكون موزعاً أو مديراً';
    END IF;
    
    RETURN QUERY
    SELECT 
        dd.id as driver_id,
        dd.full_name,
        dd.phone_number,
        dd.vehicle_type,
        dd.rating,
        dd.total_deliveries,
        dd.city
    FROM delivery_drivers dd
    WHERE dd.status = 'available'
    ORDER BY dd.rating DESC, dd.total_deliveries ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION fetch_available_drivers() TO authenticated;

-- Step 9: Update existing update_order_status function to handle new statuses
CREATE OR REPLACE FUNCTION update_order_status(
    order_id UUID,
    new_status TEXT,
    driver_id UUID DEFAULT NULL,
    estimated_time TEXT DEFAULT NULL
)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
    v_old_status TEXT;
    v_driver_id UUID;
BEGIN
    -- Get current order status and driver
    SELECT status, delivery_driver_id INTO v_old_status, v_driver_id
    FROM orders
    WHERE id = order_id;
    
    -- Update order
    UPDATE orders
    SET status = new_status,
        delivery_driver_id = COALESCE(driver_id, delivery_driver_id),
        estimated_delivery_time = estimated_time,
        delivered_at = CASE WHEN new_status = 'delivered' THEN NOW() ELSE delivered_at END,
        updated_at = NOW()
    WHERE id = order_id;
    
    -- If order is delivered, set driver back to available
    IF new_status = 'delivered' AND v_driver_id IS NOT NULL THEN
        UPDATE delivery_drivers
        SET status = 'available',
            updated_at = NOW()
        WHERE id = v_driver_id;
    END IF;
END;
$$;

-- Step 10: Add index for faster queries on ready_for_pickup status
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Step 11: Create function for drivers to fetch their assigned orders only
CREATE OR REPLACE FUNCTION fetch_my_driver_orders()
RETURNS SETOF orders
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
    v_driver_id UUID;
BEGIN
    -- Get driver_id from auth_user_id
    -- Assuming delivery_drivers table has auth_user_id column (we'll need to add this)
    SELECT id INTO v_driver_id
    FROM delivery_drivers
    WHERE auth_user_id = auth.uid();
    
    IF v_driver_id IS NULL THEN
        RAISE EXCEPTION 'السائق غير موجود';
    END IF;
    
    RETURN QUERY
    SELECT * FROM orders
    WHERE delivery_driver_id = v_driver_id
    AND status NOT IN ('delivered', 'cancelled')
    ORDER BY created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION fetch_my_driver_orders() TO authenticated;

-- Step 12: Add auth_user_id to delivery_drivers if it doesn't exist
ALTER TABLE delivery_drivers ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE;

-- Add index for auth_user_id
CREATE INDEX IF NOT EXISTS idx_delivery_drivers_auth_user_id ON delivery_drivers(auth_user_id);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ تم تحديث قاعدة البيانات بنجاح لدعم نظام الموزع';
END $$;
