-- Link delivery drivers to Supabase Auth users
-- Run this in Supabase SQL editor once

-- 1) Add auth_user_id to delivery_drivers (if missing)
ALTER TABLE public.delivery_drivers
  ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE;

-- 2) Optional: create a helper view to quickly find driver by auth uid
CREATE OR REPLACE VIEW public.v_drivers_by_auth AS
SELECT d.*
FROM public.delivery_drivers d
WHERE d.auth_user_id IS NOT NULL;

-- 3) Example: link the currently logged-in user to an existing driver row (edit WHERE as needed)
-- UPDATE public.delivery_drivers
--   SET auth_user_id = auth.uid()
--   WHERE email = 'driver@example.com';

-- 4) RLS: allow authenticated users to read drivers (already in secure-supabase-policies.sql)
-- If not applied, you can run this policy as a fallback:
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