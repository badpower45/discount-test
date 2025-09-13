-- إصلاح آمن ومحدث لمشكلة الأدمن والـ Database Policies
-- يجب تشغيل هذا كاملاً في Supabase SQL Editor

-- الخطوة 1: حذف جميع policies المعطلة من جدول merchants
DROP POLICY IF EXISTS "Users can read their own merchant record" ON public.merchants;
DROP POLICY IF EXISTS "Allow inserts for new merchants" ON public.merchants;
DROP POLICY IF EXISTS "Allow updates for own merchant record" ON public.merchants;
DROP POLICY IF EXISTS "Allow merchant self-management" ON public.merchants;
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON public.merchants;
DROP POLICY IF EXISTS "Merchants can read own restaurant data" ON public.merchants;
DROP POLICY IF EXISTS "Allow merchants to read their own data" ON public.merchants;
DROP POLICY IF EXISTS "merchants_select_policy" ON public.merchants;
DROP POLICY IF EXISTS "merchants_insert_policy" ON public.merchants;
DROP POLICY IF EXISTS "merchants_update_policy" ON public.merchants;

-- الخطوة 2: إنشاء policies آمنة مع تحكم صحيح بالأذونات
CREATE POLICY "merchants_own_data_select" ON public.merchants
  FOR SELECT USING (
    auth.uid() = auth_user_id OR 
    EXISTS (
      SELECT 1 FROM public.merchants admin_check 
      WHERE admin_check.auth_user_id = auth.uid() 
      AND admin_check.role = 'admin'
    )
  );

CREATE POLICY "merchants_own_data_insert" ON public.merchants
  FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "merchants_own_data_update" ON public.merchants
  FOR UPDATE USING (
    auth.uid() = auth_user_id OR 
    EXISTS (
      SELECT 1 FROM public.merchants admin_check 
      WHERE admin_check.auth_user_id = auth.uid() 
      AND admin_check.role = 'admin'
    )
  );

-- الخطوة 3: تفعيل RLS للجدول
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;

-- الخطوة 4: إنشاء مطعم افتراضي إذا لم يكن موجود
INSERT INTO public.restaurants (
  id,
  offer_name,
  restaurant_name,
  image_url,
  logo_url,
  discount_percentage,
  description,
  category
) SELECT 
  gen_random_uuid(),
  'عرض المنصة',
  'منصة الخصومات',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0',
  0,
  'مطعم افتراضي للإدارة',
  'restaurant'::restaurant_category
WHERE NOT EXISTS (SELECT 1 FROM public.restaurants LIMIT 1);

-- الخطوة 5: إضافة/تحديث admin@platform.com كأدمن
DO $$
DECLARE
  first_restaurant_id uuid;
BEGIN
  -- الحصول على أول مطعم متاح (مضمون الوجود بعد INSERT أعلاه)
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

-- الخطوة 6: التحقق من النتائج
SELECT 
  'تم إنشاء/تحديث الأدمن بنجاح' as status,
  m.name,
  m.email,
  m.role,
  r.restaurant_name
FROM merchants m
LEFT JOIN restaurants r ON m.restaurant_id = r.id
WHERE m.email = 'admin@platform.com';

-- الخطوة 7: عرض policies الآمنة الجديدة للتأكد
SELECT 
  'Secure Policies Created Successfully' as status,
  policyname, 
  cmd as command_type,
  LEFT(qual, 50) as using_clause
FROM pg_policies 
WHERE tablename = 'merchants' AND schemaname = 'public';

-- إنتهى الإصلاح الآمن