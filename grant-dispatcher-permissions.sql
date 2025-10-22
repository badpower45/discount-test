-- =====================================================================
-- منح صلاحيات الموزع للمستخدم
-- User UID: 3d58af6a-a488-4cab-bc05-051ccb72e540
-- =====================================================================

-- الخيار 1: إذا كان المستخدم موجود بالفعل في جدول merchants
-- سيتم تحديث دوره إلى dispatcher
UPDATE merchants
SET role = 'dispatcher',
    updated_at = NOW()
WHERE auth_user_id = '3d58af6a-a488-4cab-bc05-051ccb72e540';

-- الخيار 2: إذا لم يكن المستخدم موجود في جدول merchants
-- سيتم إنشاء سجل جديد له بدور dispatcher
-- ملاحظة: قم بتغيير الاسم والبريد الإلكتروني حسب الحاجة
INSERT INTO merchants (name, email, role, auth_user_id, created_at, updated_at)
SELECT 
    'الموزع الرئيسي',  -- قم بتغيير الاسم إذا أردت
    (SELECT email FROM auth.users WHERE id = '3d58af6a-a488-4cab-bc05-051ccb72e540'),
    'dispatcher',
    '3d58af6a-a488-4cab-bc05-051ccb72e540',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM merchants WHERE auth_user_id = '3d58af6a-a488-4cab-bc05-051ccb72e540'
);

-- التحقق من نجاح العملية
SELECT 
    id,
    name,
    email,
    role,
    auth_user_id,
    created_at
FROM merchants
WHERE auth_user_id = '3d58af6a-a488-4cab-bc05-051ccb72e540';

-- =====================================================================
-- ملاحظات مهمة:
-- =====================================================================
-- 1. تأكد من تشغيل ملف dispatcher-system-updates.sql أولاً لتفعيل نظام الموزع
-- 2. بعد تشغيل هذا السكريبت، سيتمكن المستخدم من الوصول إلى لوحة الموزع عبر /dispatcher
-- 3. الموزع سيتمكن من:
--    - رؤية جميع الطلبات الجاهزة للتوصيل (ready_for_pickup)
--    - تعيين الطلبات للسائقين المتاحين
--    - تقييم أداء السائقين
--    - عرض إحصائيات حية عن الطلبات والسائقين
-- =====================================================================
