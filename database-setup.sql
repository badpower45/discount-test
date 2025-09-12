-- Database Schema for Discount Platform
-- Create tables, indexes, RLS policies and RPC functions

-- Create enum for coupon status
CREATE TYPE coupon_status AS ENUM ('unused', 'used');

-- Create enum for restaurant category
CREATE TYPE restaurant_category AS ENUM ('restaurant', 'cafe', 'bakery', 'other');

-- Create restaurants table
CREATE TABLE restaurants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL, -- Generic name field (used for offer name)
    restaurant_name TEXT, -- Specific restaurant name
    offer_name TEXT, -- Specific offer name
    image_url TEXT NOT NULL,
    logo_url TEXT, -- Restaurant logo URL
    discount_percentage INTEGER NOT NULL CHECK (discount_percentage > 0 AND discount_percentage <= 100),
    description TEXT NOT NULL,
    category restaurant_category NOT NULL DEFAULT 'other',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create customers table
CREATE TABLE customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create merchants table for authentication
CREATE TABLE merchants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    restaurant_id UUID REFERENCES restaurants(id),
    role TEXT NOT NULL DEFAULT 'merchant' CHECK (role IN ('merchant', 'admin')),
    auth_user_id UUID UNIQUE, -- Links to Supabase Auth user
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create coupons table
CREATE TABLE coupons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id),
    status coupon_status NOT NULL DEFAULT 'unused',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    used_at TIMESTAMP WITH TIME ZONE NULL
);

-- Create indexes for better performance
CREATE INDEX idx_coupons_restaurant_id ON coupons(restaurant_id);
CREATE INDEX idx_coupons_customer_id ON coupons(customer_id);
CREATE INDEX idx_coupons_status ON coupons(status);
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_merchants_email ON merchants(email);
CREATE INDEX idx_merchants_auth_user_id ON merchants(auth_user_id);
CREATE INDEX idx_merchants_restaurant_id ON merchants(restaurant_id);

-- Function to generate random coupon code
CREATE OR REPLACE FUNCTION generate_coupon_code()
RETURNS TEXT AS $$
DECLARE
    characters TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER := 0;
BEGIN
    FOR i IN 1..8 LOOP
        result := result || substr(characters, floor(random() * length(characters) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to auto-generate coupon code if not provided
CREATE OR REPLACE FUNCTION set_coupon_code()
RETURNS TRIGGER AS $$
BEGIN
    -- If no code provided, generate one
    IF NEW.code IS NULL OR NEW.code = '' THEN
        LOOP
            NEW.code := generate_coupon_code();
            -- Check if this code already exists
            PERFORM 1 FROM coupons WHERE code = NEW.code;
            IF NOT FOUND THEN
                EXIT; -- Exit the loop if code is unique
            END IF;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-generating coupon codes
CREATE TRIGGER trigger_set_coupon_code
    BEFORE INSERT ON coupons
    FOR EACH ROW
    EXECUTE FUNCTION set_coupon_code();

-- Enable Row Level Security (RLS)
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for restaurants table
CREATE POLICY "Public can view restaurants" ON restaurants
    FOR SELECT USING (true);

-- RLS Policies for customers table (only accessible via RPC functions)
CREATE POLICY "No direct access to customers" ON customers
    FOR ALL USING (false);

-- RLS Policies for coupons table (only accessible via RPC functions)
CREATE POLICY "No direct access to coupons" ON coupons
    FOR ALL USING (false);

-- RLS Policies for merchants table
CREATE POLICY "Merchants can view themselves" ON merchants
    FOR SELECT USING (auth_user_id = auth.uid());

CREATE POLICY "Admins can view all merchants" ON merchants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM merchants m 
            WHERE m.auth_user_id = auth.uid() 
            AND m.role = 'admin'
        )
    );

-- RPC Function: Create or get existing customer
CREATE OR REPLACE FUNCTION create_or_get_customer(
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
    customer_id UUID;
BEGIN
    -- Try to find existing customer by email
    SELECT id INTO customer_id
    FROM customers
    WHERE email = customer_email;
    
    -- If customer doesn't exist, create new one
    IF customer_id IS NULL THEN
        INSERT INTO customers (name, email, phone)
        VALUES (customer_name, customer_email, customer_phone)
        RETURNING id INTO customer_id;
    END IF;
    
    RETURN customer_id;
END;
$$;

-- RPC Function: Generate coupon for customer
CREATE OR REPLACE FUNCTION generate_coupon(
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    restaurant_id UUID
)
RETURNS TABLE(
    coupon_id UUID,
    code TEXT,
    created_at TIMESTAMP WITH TIME ZONE
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
    customer_id UUID;
    new_coupon_id UUID;
    coupon_code TEXT;
    coupon_created_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Validate restaurant exists
    PERFORM 1 FROM restaurants WHERE id = restaurant_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Restaurant not found';
    END IF;
    
    -- Create or get customer
    customer_id := create_or_get_customer(customer_name, customer_email, customer_phone);
    
    -- Check if customer already has an unused coupon for this restaurant
    SELECT c.id INTO new_coupon_id
    FROM coupons c
    WHERE c.customer_id = customer_id 
    AND c.restaurant_id = generate_coupon.restaurant_id
    AND c.status = 'unused';
    
    -- If customer already has unused coupon, return it
    IF new_coupon_id IS NOT NULL THEN
        SELECT c.id, c.code, c.created_at
        INTO new_coupon_id, coupon_code, coupon_created_at
        FROM coupons c
        WHERE c.id = new_coupon_id;
        
        RETURN QUERY SELECT new_coupon_id, coupon_code, coupon_created_at;
        RETURN;
    END IF;
    
    -- Create new coupon
    INSERT INTO coupons (customer_id, restaurant_id, status)
    VALUES (customer_id, restaurant_id, 'unused')
    RETURNING id, code, created_at INTO new_coupon_id, coupon_code, coupon_created_at;
    
    RETURN QUERY SELECT new_coupon_id, coupon_code, coupon_created_at;
END;
$$;

-- RPC Function: Validate coupon code
CREATE OR REPLACE FUNCTION validate_coupon(
    coupon_code TEXT,
    restaurant_id UUID
)
RETURNS TABLE(
    is_valid BOOLEAN,
    coupon_id UUID,
    status coupon_status,
    created_at TIMESTAMP WITH TIME ZONE
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
    coupon_record RECORD;
BEGIN
    -- Find coupon
    SELECT c.id, c.status, c.created_at, c.restaurant_id
    INTO coupon_record
    FROM coupons c
    WHERE c.code = coupon_code;
    
    -- Check if coupon exists
    IF coupon_record IS NULL THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::coupon_status, NULL::TIMESTAMP WITH TIME ZONE;
        RETURN;
    END IF;
    
    -- Check if coupon belongs to the restaurant
    IF coupon_record.restaurant_id != restaurant_id THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::coupon_status, NULL::TIMESTAMP WITH TIME ZONE;
        RETURN;
    END IF;
    
    -- Return coupon info
    RETURN QUERY SELECT 
        true, 
        coupon_record.id, 
        coupon_record.status, 
        coupon_record.created_at;
END;
$$;

-- RPC Function: Use coupon (mark as used)
CREATE OR REPLACE FUNCTION use_coupon(
    coupon_code TEXT,
    restaurant_id UUID
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    coupon_id UUID
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
    coupon_record RECORD;
    updated_coupon_id UUID;
BEGIN
    -- Find and validate coupon
    SELECT c.id, c.status, c.restaurant_id
    INTO coupon_record
    FROM coupons c
    WHERE c.code = coupon_code;
    
    -- Check if coupon exists
    IF coupon_record IS NULL THEN
        RETURN QUERY SELECT false, 'Coupon not found', NULL::UUID;
        RETURN;
    END IF;
    
    -- Check if coupon belongs to the restaurant
    IF coupon_record.restaurant_id != restaurant_id THEN
        RETURN QUERY SELECT false, 'Invalid coupon for this restaurant', NULL::UUID;
        RETURN;
    END IF;
    
    -- Check if coupon is already used
    IF coupon_record.status = 'used' THEN
        RETURN QUERY SELECT false, 'Coupon already used', coupon_record.id;
        RETURN;
    END IF;
    
    -- Mark coupon as used
    UPDATE coupons 
    SET status = 'used', used_at = now()
    WHERE id = coupon_record.id
    RETURNING id INTO updated_coupon_id;
    
    RETURN QUERY SELECT true, 'Coupon successfully used', updated_coupon_id;
END;
$$;

-- RPC Function: Fetch restaurant coupons
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
BEGIN
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

-- RPC Function: Fetch dashboard statistics
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
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM restaurants) as total_restaurants,
        (SELECT COUNT(*) FROM customers) as total_customers,
        (SELECT COUNT(*) FROM coupons) as total_coupons,
        (SELECT COUNT(*) FROM coupons WHERE status = 'used') as used_coupons,
        (SELECT COUNT(*) FROM coupons WHERE status = 'unused') as unused_coupons;
END;
$$;

-- Insert initial restaurant data
INSERT INTO restaurants (name, image_url, discount_percentage, description, category) VALUES
('Gourmet Bistro', 'https://images.unsplash.com/photo-1667388968964-4aa652df0a9b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZXN0YXVyYW50JTIwZm9vZCUyMGRpbmluZ3xlbnwxfHx8fDE3NTc1ODE5MTN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', 30, 'Valid for dine-in or delivery', 'restaurant'),
('Cozy Corner Cafe', 'https://images.unsplash.com/photo-1682979358243-816a75830f77?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYWZlJTIwY29mZmVlJTIwaW50ZXJpb3J8ZW58MXx8fHwxNzU3NTk2ODQ5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', 25, 'All beverages and pastries', 'cafe'),
('Mario''s Pizza Palace', 'https://images.unsplash.com/photo-1563245738-9169ff58eccf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaXp6YSUyMHJlc3RhdXJhbnR8ZW58MXx8fHwxNzU3NTI3NTA0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', 40, 'Pizza and Italian dishes', 'restaurant'),
('The Burger Joint', 'https://images.unsplash.com/photo-1644447381290-85358ae625cb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXJnZXIlMjByZXN0YXVyYW50fGVufDF8fHx8MTc1NzU4Mjg0OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', 20, 'Gourmet burgers and fries', 'restaurant'),
('Sweet Dreams Bakery', 'https://images.unsplash.com/photo-1670819916757-e8d5935a6c65?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXNzZXJ0JTIwYmFrZXJ5fGVufDF8fHx8MTc1NzU5Njg1Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', 15, 'Fresh baked goods daily', 'bakery'),
('Sakura Sushi', 'https://images.unsplash.com/photo-1717988732486-285ea23a6f88?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdXNoaSUyMGphcGFuZXNlJTIwcmVzdGF1cmFudHxlbnwxfHx8fDE3NTc1MjY3NTJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', 35, 'Authentic Japanese cuisine', 'restaurant');

-- Insert initial merchant data (sample merchants for testing)
-- Note: auth_user_id will be updated when real users are created in Supabase Auth
INSERT INTO merchants (name, email, restaurant_id, role, auth_user_id) 
SELECT 
    'Admin User',
    'admin@platform.com',
    r.id,
    'admin',
    NULL  -- Will be linked when auth user is created
FROM restaurants r 
WHERE r.name = 'Gourmet Bistro'
LIMIT 1;

INSERT INTO merchants (name, email, restaurant_id, role, auth_user_id)
SELECT 
    'John Smith',
    'merchant@gourmet.com',
    r.id,
    'merchant',
    NULL  -- Will be linked when auth user is created
FROM restaurants r 
WHERE r.name = 'Gourmet Bistro'
LIMIT 1;