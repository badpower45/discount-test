-- Coupon security hardening: rate limits, uniqueness, and admin RPCs
-- Run in Supabase SQL editor

-- 1) Ensure there is at most one UNUSED coupon per (customer, restaurant)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' AND indexname = 'uniq_unused_coupon_per_customer_restaurant'
  ) THEN
    CREATE UNIQUE INDEX uniq_unused_coupon_per_customer_restaurant
      ON public.coupons(restaurant_id, customer_id)
      WHERE status = 'unused';
  END IF;
END $$;

-- 2) Create helper function to check admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.merchants m
    WHERE m.auth_user_id = auth.uid() AND m.role = 'admin'
  );
$$;

-- 3) Harden generate_coupon RPC with 24h rate limit per (customer, restaurant)
-- Expected params: customer_name TEXT, customer_email TEXT, customer_phone TEXT, restaurant_id UUID
-- Returns TABLE(coupon_id UUID, code TEXT, created_at TIMESTAMPTZ)
CREATE OR REPLACE FUNCTION public.generate_coupon(
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  restaurant_id UUID
)
RETURNS TABLE(coupon_id UUID, code TEXT, created_at TIMESTAMPTZ)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_customer_id UUID;
  v_code TEXT;
  v_existing RECORD;
BEGIN
  -- 3.a) Upsert customer by email (single identity point), update phone/name if changed
  INSERT INTO public.customers(name, email, phone)
  VALUES (customer_name, customer_email, customer_phone)
  ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = EXCLUDED.phone
  RETURNING id INTO v_customer_id;

  -- 3.b) Block duplicates within last 24 hours (issued or used)
  SELECT c.* INTO v_existing
  FROM public.coupons c
  WHERE c.customer_id = v_customer_id
    AND c.restaurant_id = restaurant_id
    AND (
      (c.status = 'unused') OR
      (c.created_at >= now() - interval '24 hours')
    )
  ORDER BY c.created_at DESC
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    -- Return the latest coupon (don’t create new ones to avoid spam)
    coupon_id := v_existing.id;
    code := v_existing.code;
    created_at := v_existing.created_at;
    RETURN NEXT;
    RETURN;
  END IF;

  -- 3.c) Generate a new unique code
  v_code := upper(encode(gen_random_bytes(4), 'hex'));

  INSERT INTO public.coupons (code, customer_id, restaurant_id, status)
  VALUES (v_code, v_customer_id, restaurant_id, 'unused')
  RETURNING id, code, created_at INTO coupon_id, code, created_at;

  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_coupon(TEXT, TEXT, TEXT, UUID) TO authenticated;

-- 4) Admin read RPCs (optional; enforce admin check inside)
CREATE OR REPLACE FUNCTION public.fetch_all_orders()
RETURNS SETOF public.orders
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  RETURN QUERY SELECT * FROM public.orders ORDER BY created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.fetch_all_drivers()
RETURNS SETOF public.delivery_drivers
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  RETURN QUERY SELECT * FROM public.delivery_drivers ORDER BY created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fetch_all_orders() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fetch_all_drivers() TO authenticated;
