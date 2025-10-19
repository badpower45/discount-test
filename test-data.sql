-- ===================================
-- ملف البيانات التجريبية للاختبار الشامل
-- Test Data Setup for End-to-End Testing
-- ===================================

-- 1️⃣ إضافة مطاعم تجريبية
-- Adding Test Restaurants
INSERT INTO restaurants (name, description, category, discount_percentage, image_url, is_active)
VALUES 
  ('مطعم البيك', 'أشهر مطعم للدجاج المقلي في السعودية - وجبات عائلية شهية', 'restaurant', 25, 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400', true),
  ('مقهى ستاربكس', 'قهوة عالمية بجودة عالية - مشروبات ساخنة وباردة', 'cafe', 15, 'https://images.unsplash.com/photo-1559305616-3b03921c4593?w=400', true),
  ('مطعم ماكدونالدز', 'وجبات سريعة لجميع الأعمار - برجر وبطاطس', 'restaurant', 20, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400', true),
  ('مطعم كنتاكي KFC', 'دجاج مقلي بوصفة سرية - وجبات عائلية', 'restaurant', 30, 'https://images.unsplash.com/photo-1585238341710-502f989c3c80?w=400', true),
  ('مقهى كوستا', 'قهوة فاخرة ومشروبات متنوعة', 'cafe', 12, 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400', true)
ON CONFLICT DO NOTHING;

-- 2️⃣ إضافة سائقين تجريبيين
-- Adding Test Delivery Drivers
INSERT INTO delivery_drivers (full_name, phone_number, email, vehicle_type, status, rating, total_deliveries, city, current_location)
VALUES 
  ('أحمد محمد السائق', '+966501234567', 'ahmed.driver@test.com', 'motorcycle', 'available', 4.8, 150, 'القاهرة', '{"lat": 30.0444, "lng": 31.2357}'),
  ('خالد علي التوصيل', '+966502234567', 'khaled.driver@test.com', 'bicycle', 'available', 4.9, 200, 'القاهرة', '{"lat": 30.0500, "lng": 31.2400}'),
  ('محمود حسن الموصل', '+966503234567', 'mahmoud.driver@test.com', 'car', 'available', 4.7, 180, 'القاهرة', '{"lat": 30.0600, "lng": 31.2500}'),
  ('عمر يوسف', '+966504234567', 'omar.driver@test.com', 'motorcycle', 'available', 4.6, 120, 'القاهرة', '{"lat": 30.0550, "lng": 31.2450}'),
  ('سامي عبدالله', '+966505234567', 'sami.driver@test.com', 'scooter', 'available', 4.9, 250, 'القاهرة', '{"lat": 30.0480, "lng": 31.2380}')
ON CONFLICT DO NOTHING;

-- 3️⃣ إضافة عملاء تجريبيين
-- Adding Test Customers
INSERT INTO customers (name, email, phone)
VALUES 
  ('محمد العميل', 'customer1@test.com', '+966555111222'),
  ('فاطمة أحمد', 'customer2@test.com', '+966555222333'),
  ('علي حسن', 'customer3@test.com', '+966555333444')
ON CONFLICT DO NOTHING;

-- 4️⃣ ملاحظة: إضافة موزع
-- Note: Adding Dispatcher
-- لإضافة موزع، يجب تحديث حساب تاجر موجود ليكون موزع:
-- To add a dispatcher, update an existing merchant account to have dispatcher role:

-- أولاً، قم بإنشاء حساب تاجر عبر واجهة Supabase Auth
-- ثم قم بتشغيل الأمر التالي (استبدل 'user-id-here' بالـ ID الفعلي):
-- First, create a merchant account via Supabase Auth interface
-- Then run this command (replace 'user-id-here' with actual ID):

-- UPDATE merchants 
-- SET role = 'dispatcher' 
-- WHERE auth_user_id = 'user-id-here';

-- أو إضافة مباشرة (إذا كان الجدول يسمح):
-- Or direct insert (if table allows):

-- INSERT INTO merchants (name, email, phone_number, role, is_active, auth_user_id)
-- VALUES 
--   ('موزع الطلبات الرئيسي', 'dispatcher@test.com', '+966555000111', 'dispatcher', true, 'auth-user-id-here')
-- ON CONFLICT DO NOTHING;

-- ===================================
-- تحقق من البيانات المضافة
-- Verify Inserted Data
-- ===================================

-- عرض المطاعم
SELECT id, name, discount_percentage, category FROM restaurants;

-- عرض السائقين
SELECT id, full_name, vehicle_type, status, rating FROM delivery_drivers;

-- عرض العملاء
SELECT id, name, phone FROM customers;

-- ===================================
-- ملاحظات إضافية
-- Additional Notes
-- ===================================

-- لمسح البيانات التجريبية لاحقاً (استخدم بحذر!):
-- To clear test data later (use with caution!):

-- DELETE FROM orders WHERE customer_name LIKE '%العميل%';
-- DELETE FROM delivery_drivers WHERE email LIKE '%@test.com%';
-- DELETE FROM customers WHERE email LIKE '%@test.com%';
-- DELETE FROM restaurants WHERE name IN ('مطعم البيك', 'مقهى ستاربكس', 'مطعم ماكدونالدز', 'مطعم كنتاكي KFC', 'مقهى كوستا');

-- ===================================
-- تم! الآن يمكنك البدء بالاختبار
-- Done! You can now start testing
-- ===================================
