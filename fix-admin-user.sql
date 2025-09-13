-- إصلاح مشكلة مستخدم الإدمن
-- يجب تشغيل هذا الملف بعد إنشاء المستخدم في Supabase Auth

-- دالة لربط المستخدم الحالي بحساب الإدمن
CREATE OR REPLACE FUNCTION setup_admin_user(admin_email TEXT)
RETURNS TABLE(success BOOLEAN, message TEXT, admin_id UUID, auth_user_id UUID) 
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    admin_record merchants%ROWTYPE;
    auth_user_record auth.users%ROWTYPE;
BEGIN
    -- البحث عن المستخدم في auth.users
    SELECT * INTO auth_user_record 
    FROM auth.users 
    WHERE email = admin_email;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'لم يتم العثور على المستخدم في نظام المصادقة', NULL::UUID, NULL::UUID;
        RETURN;
    END IF;
    
    -- البحث عن سجل الإدمن في جدول merchants
    SELECT * INTO admin_record 
    FROM merchants 
    WHERE email = admin_email AND role = 'admin';
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'لم يتم العثور على حساب الإدمن في جدول التجار', NULL::UUID, NULL::UUID;
        RETURN;
    END IF;
    
    -- ربط المستخدم بحساب الإدمن
    UPDATE merchants 
    SET auth_user_id = auth_user_record.id,
        updated_at = now()
    WHERE id = admin_record.id;
    
    RETURN QUERY SELECT TRUE, 'تم ربط المستخدم بحساب الإدمن بنجاح', admin_record.id, auth_user_record.id;
END;
$$;

-- تشغيل الدالة لحساب admin@platform.com
SELECT * FROM setup_admin_user('admin@platform.com');

-- إذا لم يوجد حساب إدمن، قم بإنشائه
DO $$
DECLARE
    gourmet_restaurant_id UUID;
    admin_exists BOOLEAN := FALSE;
BEGIN
    -- التحقق من وجود حساب إدمن
    SELECT EXISTS(SELECT 1 FROM merchants WHERE email = 'admin@platform.com' AND role = 'admin') INTO admin_exists;
    
    -- إذا لم يوجد، قم بإنشائه
    IF NOT admin_exists THEN
        -- الحصول على معرف مطعم Gourmet Bistro
        SELECT id INTO gourmet_restaurant_id FROM restaurants WHERE name = 'Gourmet Bistro' LIMIT 1;
        
        -- إنشاء حساب إدمن جديد
        INSERT INTO merchants (name, email, restaurant_id, role, auth_user_id)
        VALUES ('Platform Admin', 'admin@platform.com', gourmet_restaurant_id, 'admin', NULL);
        
        RAISE NOTICE 'تم إنشاء حساب إدمن جديد: admin@platform.com';
    ELSE
        RAISE NOTICE 'حساب الإدمن موجود بالفعل: admin@platform.com';
    END IF;
END;
$$;

-- عرض معلومات حسابات الإدمن
SELECT 
    m.id,
    m.name,
    m.email,
    m.role,
    m.auth_user_id,
    CASE 
        WHEN m.auth_user_id IS NOT NULL THEN 'مرتبط'
        ELSE 'غير مرتبط'
    END as link_status,
    r.name as restaurant_name
FROM merchants m
LEFT JOIN restaurants r ON m.restaurant_id = r.id
WHERE m.role = 'admin'
ORDER BY m.created_at;