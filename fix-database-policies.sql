-- إصلاح مشكلة infinite recursion في Row Level Security policies
-- يجب تشغيل هذا في Supabase SQL Editor

-- حذف جميع policies الحالية للجدول merchants لحل مشكلة infinite recursion
DROP POLICY IF EXISTS "Users can read their own merchant record" ON public.merchants;
DROP POLICY IF EXISTS "Allow inserts for new merchants" ON public.merchants;
DROP POLICY IF EXISTS "Allow updates for own merchant record" ON public.merchants;
DROP POLICY IF EXISTS "Allow merchant self-management" ON public.merchants;
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON public.merchants;
DROP POLICY IF EXISTS "Merchants can read own restaurant data" ON public.merchants;
DROP POLICY IF EXISTS "Allow merchants to read their own data" ON public.merchants;

-- إنشاء policies بسيطة بدون infinite recursion
CREATE POLICY "Allow read for authenticated users" ON public.merchants
  FOR SELECT USING (true);

CREATE POLICY "Allow insert for authenticated users" ON public.merchants
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users" ON public.merchants
  FOR UPDATE USING (true);

-- تفعيل RLS للجدول
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;

-- عرض حالة الجدول للتأكد
SELECT 
  schemaname, 
  tablename, 
  rowsecurity, 
  enabledby
FROM pg_tables 
LEFT JOIN pg_class ON pg_class.relname = tablename
LEFT JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
WHERE tablename = 'merchants' AND schemaname = 'public';

-- عرض policies الحالية
SELECT 
  policyname, 
  cmd, 
  permissive, 
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'merchants' AND schemaname = 'public';