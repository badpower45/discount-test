-- Secure RLS policies for Discount Platform
-- Paste this into Supabase SQL Editor and run once

-- 1) Ensure RLS is enabled (safe if already enabled)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

-- 2) Drop permissive public-read policies if present (to tighten access)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='orders' AND policyname='Public can view orders'
  ) THEN
    DROP POLICY "Public can view orders" ON public.orders;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='delivery_drivers' AND policyname='Public can view delivery drivers'
  ) THEN
    DROP POLICY "Public can view delivery drivers" ON public.delivery_drivers;
  END IF;
END $$;

-- 3) Merchants policies
-- Allow an authenticated user to read their own merchant row
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='merchants' AND policyname='Me: read my merchant row'
  ) THEN
    CREATE POLICY "Me: read my merchant row" ON public.merchants
      FOR SELECT USING (auth.uid() = auth_user_id);
  END IF;
END $$;

-- Optional: allow merchants to insert/update their own row (keep commented if not needed)
-- DO $$
-- BEGIN
--   IF NOT EXISTS (
--     SELECT 1 FROM pg_policies 
--     WHERE schemaname='public' AND tablename='merchants' AND policyname='Me: upsert my merchant row'
--   ) THEN
--     CREATE POLICY "Me: upsert my merchant row" ON public.merchants
--       FOR INSERT WITH CHECK (auth.uid() = auth_user_id);
--     CREATE POLICY "Me: update my merchant row" ON public.merchants
--       FOR UPDATE USING (auth.uid() = auth_user_id);
--   END IF;
-- END $$;

-- 4) Orders policies
-- a) Allow merchants to read orders for their restaurant
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='orders' AND policyname='Merchants read own restaurant orders'
  ) THEN
    CREATE POLICY "Merchants read own restaurant orders" ON public.orders
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.merchants m
          WHERE m.auth_user_id = auth.uid()
            AND m.restaurant_id = orders.restaurant_id
        )
      );
  END IF;
END $$;

-- b) Deny direct writes to orders; use RPCs with SECURITY DEFINER
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='orders' AND policyname='No direct write to orders'
  ) THEN
    CREATE POLICY "No direct write to orders" ON public.orders
      FOR INSERT WITH CHECK (false);
    CREATE POLICY "No direct update to orders" ON public.orders
      FOR UPDATE USING (false) WITH CHECK (false);
    CREATE POLICY "No direct delete of orders" ON public.orders
      FOR DELETE USING (false);
  END IF;
END $$;

-- Optional: allow customers to read their own orders
-- Requires customers.auth_user_id to be set for logged-in customers
-- DO $$
-- BEGIN
--   IF NOT EXISTS (
--     SELECT 1 FROM pg_policies 
--     WHERE schemaname='public' AND tablename='orders' AND policyname='Customers read own orders'
--   ) THEN
--     CREATE POLICY "Customers read own orders" ON public.orders
--       FOR SELECT USING (
--         EXISTS (
--           SELECT 1 FROM public.customers c
--           WHERE c.auth_user_id = auth.uid()
--             AND c.id = orders.customer_id
--         )
--       );
--   END IF;
-- END $$;

-- Optional: public order tracking by order_number only (commented for security)
-- CREATE POLICY "Public can track order by number" ON public.orders
--   FOR SELECT USING (
--     current_setting('request.jwt.claims', true) IS NOT NULL
--     AND (coalesce((select (auth.jwt() ->> 'role')), '') IN ('anon','authenticated'))
--     AND (orders.order_number IS NOT NULL)
--   );
-- NOTE: You should constrain this more tightly if enabling.

-- 5) Delivery drivers read-only for authenticated users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='delivery_drivers' AND policyname='Authenticated can view drivers'
  ) THEN
    CREATE POLICY "Authenticated can view drivers" ON public.delivery_drivers
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- 6) Function grants (RPCs run as SECURITY DEFINER and perform auth checks inside)
DO $$
BEGIN
  -- update_order_status(order_id, new_status, driver_id, estimated_time)
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname='public' AND p.proname='update_order_status'
  ) THEN
    RAISE NOTICE 'Function update_order_status not found (will skip grant)';
  ELSE
    GRANT EXECUTE ON FUNCTION public.update_order_status(UUID, TEXT, UUID, TEXT) TO authenticated;
  END IF;

  -- assign_driver_to_order(order_id, driver_id)
  IF EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname='public' AND p.proname='assign_driver_to_order'
  ) THEN
    GRANT EXECUTE ON FUNCTION public.assign_driver_to_order(UUID, UUID) TO authenticated;
  END IF;

  -- auto_assign_driver(p_order_id)
  IF EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname='public' AND p.proname='auto_assign_driver'
  ) THEN
    GRANT EXECUTE ON FUNCTION public.auto_assign_driver(UUID) TO authenticated;
  END IF;

  -- admin/reporting functions can also be granted to authenticated (they enforce admin check inside)
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname='public' AND p.proname='fetch_all_orders') THEN
    GRANT EXECUTE ON FUNCTION public.fetch_all_orders() TO authenticated;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname='public' AND p.proname='fetch_all_customers') THEN
    GRANT EXECUTE ON FUNCTION public.fetch_all_customers() TO authenticated;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname='public' AND p.proname='fetch_all_coupons') THEN
    GRANT EXECUTE ON FUNCTION public.fetch_all_coupons() TO authenticated;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname='public' AND p.proname='fetch_dashboard_stats') THEN
    GRANT EXECUTE ON FUNCTION public.fetch_dashboard_stats() TO authenticated;
  END IF;
END $$;
