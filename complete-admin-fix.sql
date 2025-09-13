-- إصلاح شامل لمشكلة الأدمن والـ Database Policies
-- يجب تشغيل هذا كاملاً في Supabase SQL Editor

-- الخطوة 1: حذف جميع policies المعطلة من جدول merchants
DROP POLICY IF EXISTS "Users can read their own merchant record" ON public.merchants;
DROP POLICY IF EXISTS "Allow inserts for new merchants" ON public.merchants;
DROP POLICY IF EXISTS "Allow updates for own merchant record" ON public.merchants;
DROP POLICY IF EXISTS "Allow merchant self-management" ON public.merchants;
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON public.merchants;
DROP POLICY IF EXISTS "Merchants can read own restaurant data" ON public.merchants;
DROP POLICY IF EXISTS "Allow merchants to read their own data" ON public.merchants;

-- الخطوة 2: إنشاء policies بسيطة بدون infinite recursion
CREATE POLICY "merchants_select_policy" ON public.merchants
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "merchants_insert_policy" ON public.merchants
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "merchants_update_policy" ON public.merchants
  FOR UPDATE USING (auth.role() = 'authenticated');

-- الخطوة 3: تفعيل RLS للجدول
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;

-- الخطوة 4: إضافة/تحديث admin@platform.com كأدمن
-- أولاً نحصل على أول restaurant_id متاح
DO $$
DECLARE
  first_restaurant_id uuid;
BEGIN
  -- الحصول على أول مطعم متاح
  SELECT id INTO first_restaurant_id FROM public.restaurants LIMIT 1;
  
  -- إدراج أو تحديث الأدمن
  INSERT INTO public.merchants (
    auth_user_id, 
    name, 
    email, 
    role,
    restaurant_id
  ) VALUES (
    '005d2ef2-61db-48eb-abf1-1c0fa5cf2e68',
    'مدير المنصة',
    'admin@platform.com',
    'admin',
    first_restaurant_id
  ) ON CONFLICT (auth_user_id) 
  DO UPDATE SET 
    role = 'admin',
    name = 'مدير المنصة',
    email = 'admin@platform.com',
    restaurant_id = first_restaurant_id;
END $$;

-- الخطوة 5: التحقق من النتائج
SELECT 
  'تم إنشاء/تحديث الأدمن بنجاح' as status,
  m.name,
  m.email,
  m.role,
  r.restaurant_name
FROM merchants m
LEFT JOIN restaurants r ON m.restaurant_id = r.id
WHERE m.email = 'admin@platform.com';

-- الخطوة 6: عرض جميع policies الجديدة للتأكد
SELECT 
  'Policies Created Successfully' as status,
  policyname, 
  cmd as command_type
FROM pg_policies 
WHERE tablename = 'merchants' AND schemaname = 'public';

-- إنتهى الإصلاح