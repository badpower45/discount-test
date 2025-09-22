-- Safe patch: add missing time-related columns to orders if needed
-- Run this in Supabase SQL editor

DO $$
BEGIN
  -- estimated_delivery_time
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'estimated_delivery_time'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN estimated_delivery_time TEXT;
  END IF;

  -- pickup_time
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'pickup_time'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN pickup_time TEXT;
  END IF;

  -- delivered_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'delivered_at'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN delivered_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Resolve overload ambiguity: drop timestamp-based overloads of update_order_status if they exist
DO $$
BEGIN
  -- Drop variant with timestamp without time zone
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'update_order_status'
      AND pg_get_function_arguments(p.oid) LIKE '%estimated_time timestamp without time zone%'
  ) THEN
    DROP FUNCTION public.update_order_status(UUID, TEXT, UUID, TIMESTAMP WITHOUT TIME ZONE);
  END IF;

  -- Drop variant with timestamp with time zone (just in case)
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'update_order_status'
      AND pg_get_function_arguments(p.oid) LIKE '%estimated_time timestamp with time zone%'
  ) THEN
    DROP FUNCTION public.update_order_status(UUID, TEXT, UUID, TIMESTAMP WITH TIME ZONE);
  END IF;
END $$;

-- Ensure RPC update_order_status exists and targets the correct column
CREATE OR REPLACE FUNCTION public.update_order_status(
  order_id UUID,
  new_status TEXT,
  driver_id UUID DEFAULT NULL,
  estimated_time TEXT DEFAULT NULL
)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.orders
  SET status = new_status,
      delivery_driver_id = COALESCE(driver_id, delivery_driver_id),
      estimated_delivery_time = estimated_time,
      updated_at = now()
  WHERE id = order_id;
END;
$$;

-- Optional: grant execute to authenticated role (Supabase default usually allows this for RPCs)
GRANT EXECUTE ON FUNCTION public.update_order_status(UUID, TEXT, UUID, TEXT) TO authenticated;