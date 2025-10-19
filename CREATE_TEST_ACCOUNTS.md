# 👥 دليل إنشاء حسابات الاختبار
## Create Test Accounts Guide

---

## 🎯 الهدف

إنشاء حسابات تجريبية للتاجر والموزع والسائق لإجراء الاختبار الشامل.

---

## الطريقة 1: استخدام Supabase Dashboard (الموصى بها) ⭐

### الخطوة 1: إنشاء حساب التاجر (Merchant Account)

#### 1.1 إنشاء المستخدم في Authentication

1. **افتح** [Supabase Dashboard](https://supabase.com/dashboard)
2. اذهب إلى مشروعك: `njrippnwixshmuxdweav`
3. من القائمة الجانبية: **Authentication** → **Users**
4. اضغط **Add user** → **Create new user**
5. املأ البيانات:
   ```
   Email: merchant@test.com
   Password: Test1234!
   ✓ Auto Confirm User (مهم!)
   ```
6. اضغط **Create user**
7. **انسخ** الـ `User UID` الذي يظهر (مثل: 12345678-1234-1234-1234-123456789abc)

#### 1.2 ربط المستخدم بجدول merchants

1. من القائمة الجانبية: **Table Editor** → **merchants**
2. اضغط **Insert** → **Insert row**
3. املأ البيانات:
   ```
   name: مطعم الاختبار
   email: merchant@test.com
   phone_number: +966555000111
   role: merchant
   is_active: true
   auth_user_id: [الصق الـ UID الذي نسخته]
   ```
4. اضغط **Save**

#### 1.3 ربط التاجر بمطعم

```sql
-- افتح SQL Editor ونفذ:
UPDATE merchants 
SET restaurant_id = (SELECT id FROM restaurants LIMIT 1)
WHERE email = 'merchant@test.com';
```

✅ **الآن يمكنك تسجيل الدخول بـ**: `merchant@test.com` / `Test1234!`

---

### الخطوة 2: إنشاء حساب الموزع (Dispatcher Account)

#### الطريقة الأولى: تحويل التاجر إلى موزع

```sql
-- في SQL Editor:
UPDATE merchants 
SET role = 'dispatcher' 
WHERE email = 'merchant@test.com';
```

#### الطريقة الثانية: إنشاء موزع منفصل

1. **كرر الخطوة 1.1** لإنشاء مستخدم جديد:
   ```
   Email: dispatcher@test.com
   Password: Test1234!
   ```

2. **أضف سجل في جدول merchants**:
   ```
   name: موزع الطلبات
   email: dispatcher@test.com
   phone_number: +966555000222
   role: dispatcher
   is_active: true
   auth_user_id: [UID الجديد]
   ```

✅ **الآن يمكنك تسجيل الدخول بـ**: `dispatcher@test.com` / `Test1234!`

---

### الخطوة 3: إنشاء حساب السائق (Driver Account)

#### 3.1 إنشاء المستخدم في Authentication

```
Email: driver@test.com
Password: Test1234!
✓ Auto Confirm User
```

#### 3.2 ربط المستخدم بجدول delivery_drivers

**الخيار 1: عبر SQL**

```sql
-- في SQL Editor:
UPDATE delivery_drivers 
SET auth_user_id = '[UID المستخدم الجديد]',
    email = 'driver@test.com'
WHERE email = 'ahmed.driver@test.com';
```

**الخيار 2: عبر Table Editor**

1. افتح **Table Editor** → **delivery_drivers**
2. اختر سجل أحمد محمد (أو أي سائق آخر)
3. عدّل الحقول:
   ```
   email: driver@test.com
   auth_user_id: [UID الجديد]
   ```
4. احفظ التغييرات

✅ **الآن يمكنك تسجيل الدخول بـ**: `driver@test.com` / `Test1234!`

---

## الطريقة 2: استخدام SQL Script الشامل ⚡

```sql
-- ===================================
-- ملاحظة: هذا يعمل فقط إذا كانت لديك صلاحيات service_role
-- أو إذا قمت بإنشاء المستخدمين يدوياً أولاً
-- ===================================

-- 1️⃣ بعد إنشاء merchant@test.com في Auth:
DO $$
DECLARE
    merchant_uid uuid;
    first_restaurant_id uuid;
BEGIN
    -- احصل على UID المستخدم من Auth (استبدل بالقيمة الفعلية)
    merchant_uid := 'YOUR-MERCHANT-UID-HERE';
    
    -- احصل على أول مطعم
    SELECT id INTO first_restaurant_id FROM restaurants LIMIT 1;
    
    -- أضف سجل التاجر
    INSERT INTO merchants (name, email, phone_number, role, is_active, auth_user_id, restaurant_id)
    VALUES ('مطعم الاختبار', 'merchant@test.com', '+966555000111', 'merchant', true, merchant_uid, first_restaurant_id)
    ON CONFLICT (email) DO UPDATE 
    SET auth_user_id = merchant_uid, 
        restaurant_id = first_restaurant_id;
    
    RAISE NOTICE 'Merchant account created successfully!';
END $$;

-- 2️⃣ بعد إنشاء dispatcher@test.com في Auth:
DO $$
DECLARE
    dispatcher_uid uuid;
BEGIN
    -- احصل على UID المستخدم من Auth (استبدل بالقيمة الفعلية)
    dispatcher_uid := 'YOUR-DISPATCHER-UID-HERE';
    
    -- أضف سجل الموزع
    INSERT INTO merchants (name, email, phone_number, role, is_active, auth_user_id)
    VALUES ('موزع الطلبات', 'dispatcher@test.com', '+966555000222', 'dispatcher', true, dispatcher_uid)
    ON CONFLICT (email) DO UPDATE 
    SET auth_user_id = dispatcher_uid,
        role = 'dispatcher';
    
    RAISE NOTICE 'Dispatcher account created successfully!';
END $$;

-- 3️⃣ بعد إنشاء driver@test.com في Auth:
DO $$
DECLARE
    driver_uid uuid;
BEGIN
    -- احصل على UID المستخدم من Auth (استبدل بالقيمة الفعلية)
    driver_uid := 'YOUR-DRIVER-UID-HERE';
    
    -- ربط السائق بالمستخدم
    UPDATE delivery_drivers 
    SET auth_user_id = driver_uid,
        email = 'driver@test.com'
    WHERE email = 'ahmed.driver@test.com';
    
    RAISE NOTICE 'Driver account linked successfully!';
END $$;
```

---

## ✅ التحقق من الحسابات

### تحقق عبر SQL

```sql
-- عرض التاجر
SELECT id, name, email, role, auth_user_id, restaurant_id 
FROM merchants 
WHERE email = 'merchant@test.com';

-- عرض الموزع
SELECT id, name, email, role, auth_user_id 
FROM merchants 
WHERE email = 'dispatcher@test.com' OR role = 'dispatcher';

-- عرض السائق
SELECT id, full_name, email, auth_user_id, status 
FROM delivery_drivers 
WHERE email = 'driver@test.com';
```

### تحقق عبر تسجيل الدخول

1. **اختبر التاجر**:
   - افتح: `http://localhost:5000/merchant`
   - سجّل دخول بـ: `merchant@test.com` / `Test1234!`
   - يجب أن تظهر لوحة التاجر

2. **اختبر الموزع**:
   - افتح: `http://localhost:5000/dispatcher`
   - سجّل دخول بـ: `dispatcher@test.com` / `Test1234!`
   - يجب أن تظهر لوحة الموزع

3. **اختبر السائق**:
   - افتح: `http://localhost:5000/driver`
   - سجّل دخول بـ: `driver@test.com` / `Test1234!`
   - يجب أن تظهر لوحة السائق

---

## 🔐 ملاحظات الأمان

⚠️ **مهم**:
- هذه حسابات تجريبية فقط - **لا تستخدمها في الإنتاج!**
- كلمات المرور بسيطة للاختبار - استخدم كلمات مرور قوية في الإنتاج
- احذف هذه الحسابات بعد الاختبار

```sql
-- حذف حسابات الاختبار:
DELETE FROM merchants WHERE email IN ('merchant@test.com', 'dispatcher@test.com');
UPDATE delivery_drivers SET auth_user_id = NULL WHERE email = 'driver@test.com';

-- ثم احذف المستخدمين من Authentication في Dashboard
```

---

## 🆘 حل المشاكل

### المشكلة: "User not authorized"

**السبب**: `auth_user_id` غير صحيح أو مفقود

**الحل**:
1. تحقق من أن UID صحيح في جدول merchants/delivery_drivers
2. تأكد من أن المستخدم موجود في Authentication → Users

### المشكلة: "Restaurant not found" في لوحة التاجر

**السبب**: `restaurant_id` مفقود

**الحل**:
```sql
UPDATE merchants 
SET restaurant_id = (SELECT id FROM restaurants LIMIT 1)
WHERE email = 'merchant@test.com';
```

### المشكلة: "Role mismatch"

**السبب**: الـ role في جدول merchants غير صحيح

**الحل**:
```sql
-- للتاجر:
UPDATE merchants SET role = 'merchant' WHERE email = 'merchant@test.com';

-- للموزع:
UPDATE merchants SET role = 'dispatcher' WHERE email = 'dispatcher@test.com';
```

---

## ✅ قائمة التحقق

قبل البدء بالاختبار، تأكد من:

- [ ] ✅ حساب التاجر تم إنشاؤه وربطه بمطعم
- [ ] ✅ حساب الموزع تم إنشاؤه مع role='dispatcher'
- [ ] ✅ حساب السائق تم ربطه بسجل في delivery_drivers
- [ ] ✅ جميع الحسابات يمكن تسجيل الدخول بها
- [ ] ✅ اللوحات تفتح بدون أخطاء

---

**الآن أنت جاهز لإجراء الاختبار الشامل!** 🎉

ارجع إلى `QUICK_START_TESTING.md` لبدء سيناريو الاختبار.
