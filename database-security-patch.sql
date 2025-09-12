-- CRITICAL SECURITY PATCH FOR DISCOUNT PLATFORM
-- This patch fixes authorization vulnerabilities in RPC functions and adds merchant linking functionality
-- Run this script IMMEDIATELY to secure the application

-- ==============================================================================
-- PART 1: SECURE RPC FUNCTIONS WITH PROPER AUTHORIZATION
-- ==============================================================================

-- Replace fetchRestaurantCoupons with proper authorization
CREATE OR REPLACE FUNCTION fetchRestaurantCoupons(restaurant_id UUID)
RETURNS TABLE(
    coupon_id UUID,
    code TEXT,
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    status coupon_status,
    created_at TIMESTAMP WITH TIME ZONE,
    used_at TIMESTAMP WITH TIME ZONE
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
    caller_role TEXT;
    caller_restaurant_id UUID;
BEGIN
    -- Check if user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;
    
    -- Get caller's role and restaurant_id
    SELECT m.role, m.restaurant_id 
    INTO caller_role, caller_restaurant_id
    FROM merchants m 
    WHERE m.auth_user_id = auth.uid();
    
    -- If no merchant record found, deny access
    IF caller_role IS NULL THEN
        RAISE EXCEPTION 'Access denied: Not a registered merchant';
    END IF;
    
    -- Authorization checks:
    -- 1. Admin can access any restaurant
    -- 2. Merchant can only access their own restaurant
    IF caller_role != 'admin' AND caller_restaurant_id != restaurant_id THEN
        RAISE EXCEPTION 'Access denied: You can only view coupons for your own restaurant';
    END IF;
    
    -- Return authorized data
    RETURN QUERY
    SELECT 
        c.id as coupon_id,
        c.code,
        cust.name as customer_name,
        cust.email as customer_email,
        cust.phone as customer_phone,
        c.status,
        c.created_at,
        c.used_at
    FROM coupons c
    JOIN customers cust ON c.customer_id = cust.id
    WHERE c.restaurant_id = fetchRestaurantCoupons.restaurant_id
    ORDER BY c.created_at DESC;
END;
$$;

-- Replace fetchDashboardStats with admin-only authorization
CREATE OR REPLACE FUNCTION fetchDashboardStats()
RETURNS TABLE(
    total_restaurants BIGINT,
    total_customers BIGINT,
    total_coupons BIGINT,
    used_coupons BIGINT,
    unused_coupons BIGINT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
    caller_role TEXT;
BEGIN
    -- Check if user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;
    
    -- Get caller's role
    SELECT m.role 
    INTO caller_role
    FROM merchants m 
    WHERE m.auth_user_id = auth.uid();
    
    -- Only admins can access dashboard statistics
    IF caller_role != 'admin' THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    
    -- Return dashboard statistics for admins only
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM restaurants) as total_restaurants,
        (SELECT COUNT(*) FROM customers) as total_customers,
        (SELECT COUNT(*) FROM coupons) as total_coupons,
        (SELECT COUNT(*) FROM coupons WHERE status = 'used') as used_coupons,
        (SELECT COUNT(*) FROM coupons WHERE status = 'unused') as unused_coupons;
END;
$$;

-- ==============================================================================
-- PART 2: MERCHANT LINKING FUNCTIONALITY
-- ==============================================================================

-- Create function to link current authenticated user to merchant record
CREATE OR REPLACE FUNCTION link_current_user_to_merchant(merchant_email TEXT)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    merchant_id UUID
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
    current_user_id UUID;
    merchant_record RECORD;
    linked_merchant_id UUID;
BEGIN
    -- Get current authenticated user ID
    current_user_id := auth.uid();
    
    -- Check if user is authenticated
    IF current_user_id IS NULL THEN
        RETURN QUERY SELECT false, 'Authentication required', NULL::UUID;
        RETURN;
    END IF;
    
    -- Find merchant record by email
    SELECT id, email, auth_user_id, name, role
    INTO merchant_record
    FROM merchants 
    WHERE email = merchant_email;
    
    -- Check if merchant exists
    IF merchant_record.id IS NULL THEN
        RETURN QUERY SELECT false, 'Merchant not found with this email', NULL::UUID;
        RETURN;
    END IF;
    
    -- Check if merchant is already linked to another user
    IF merchant_record.auth_user_id IS NOT NULL AND merchant_record.auth_user_id != current_user_id THEN
        RETURN QUERY SELECT false, 'This merchant is already linked to another user', NULL::UUID;
        RETURN;
    END IF;
    
    -- Check if current user is already linked to a different merchant
    PERFORM 1 FROM merchants WHERE auth_user_id = current_user_id AND id != merchant_record.id;
    IF FOUND THEN
        RETURN QUERY SELECT false, 'This user is already linked to another merchant account', NULL::UUID;
        RETURN;
    END IF;
    
    -- Link the user to the merchant
    UPDATE merchants 
    SET auth_user_id = current_user_id, updated_at = now()
    WHERE id = merchant_record.id
    RETURNING id INTO linked_merchant_id;
    
    RETURN QUERY SELECT true, 
        format('Successfully linked user to merchant: %s (%s)', merchant_record.name, merchant_record.role),
        linked_merchant_id;
END;
$$;

-- ==============================================================================
-- PART 3: HELPER FUNCTION FOR EMAIL-BASED MERCHANT LOOKUP
-- ==============================================================================

-- Create function to find merchant by email (for fallback authentication)
CREATE OR REPLACE FUNCTION find_merchant_by_email(user_email TEXT)
RETURNS TABLE(
    merchant_id UUID,
    name TEXT,
    email TEXT,
    restaurant_id UUID,
    restaurant_name TEXT,
    role TEXT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id as merchant_id,
        m.name,
        m.email,
        m.restaurant_id,
        r.restaurant_name,
        m.role
    FROM merchants m
    LEFT JOIN restaurants r ON m.restaurant_id = r.id
    WHERE m.email = user_email;
END;
$$;

-- ==============================================================================
-- PART 4: SECURITY PERMISSIONS
-- ==============================================================================

-- Revoke public access to sensitive functions
REVOKE ALL ON FUNCTION fetchRestaurantCoupons(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION fetchDashboardStats() FROM PUBLIC;
REVOKE ALL ON FUNCTION link_current_user_to_merchant(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION find_merchant_by_email(TEXT) FROM PUBLIC;

-- Grant access only to authenticated users
GRANT EXECUTE ON FUNCTION fetchRestaurantCoupons(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION fetchDashboardStats() TO authenticated;
GRANT EXECUTE ON FUNCTION link_current_user_to_merchant(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION find_merchant_by_email(TEXT) TO authenticated;

-- ==============================================================================
-- PART 5: DATA MIGRATION - BACKFILL EXISTING MERCHANTS
-- ==============================================================================

-- Update existing test merchants with proper auth_user_id links
-- This is a one-time data migration for existing development data

-- Note: In a real environment, you would:
-- 1. Create Supabase Auth users for existing merchants first
-- 2. Then run this migration with actual user IDs
-- 3. For now, we'll prepare the structure but keep auth_user_id NULL until real users are created

UPDATE merchants 
SET updated_at = now()
WHERE auth_user_id IS NULL;

-- ==============================================================================
-- SECURITY PATCH COMPLETE
-- ==============================================================================

-- This patch has:
-- ✓ Added authorization checks to fetchRestaurantCoupons (admin OR own restaurant only)
-- ✓ Added authorization checks to fetchDashboardStats (admin only)
-- ✓ Created link_current_user_to_merchant function for proper user linking
-- ✓ Created find_merchant_by_email function for fallback authentication
-- ✓ Added proper REVOKE/GRANT permissions for security
-- ✓ Prepared data migration structure for existing merchants

-- IMPORTANT: After applying this patch:
-- 1. Update AuthContext.tsx to use the new functions
-- 2. Test authentication flow thoroughly
-- 3. Create actual Supabase Auth users and link them using link_current_user_to_merchant