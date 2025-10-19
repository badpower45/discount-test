# 🔔 إعداد Firebase للإشعارات في التطبيق (Push Notifications)

لكي تعمل الإشعارات في APK، تحتاج إلى إعداد Firebase Cloud Messaging (FCM).

## 📋 الخطوات:

### 1️⃣ إنشاء مشروع Firebase

1. اذهب إلى [Firebase Console](https://console.firebase.google.com/)
2. اضغط "Add project" (إضافة مشروع)
3. أدخل اسم المشروع (مثلاً: DeliveryDeal)
4. اتبع الخطوات حتى يتم إنشاء المشروع

### 2️⃣ إضافة Android App إلى Firebase

1. في Firebase Console، اضغط على أيقونة Android
2. أدخل **Package name**: `com.deliverydeal.app`
   - ⚠️ يجب أن يطابق `appId` في `capacitor.config.ts`
3. أدخل اسم التطبيق: `DeliveryDeal`
4. (اختياري) أدخل SHA-1 certificate fingerprint
5. اضغط "Register app"

### 3️⃣ تنزيل ملف google-services.json

1. في الخطوة التالية، اضغط "Download google-services.json"
2. **ضع الملف في**: `android/app/google-services.json`
   ```
   android/
   └── app/
       └── google-services.json  ← هنا
   ```

### 4️⃣ تحديث Gradle Configuration

#### في `android/build.gradle`:

أضف في قسم `dependencies`:
```gradle
buildscript {
    dependencies {
        // ... existing dependencies
        classpath 'com.google.gms:google-services:4.4.0'  // ← أضف هذا السطر
    }
}
```

#### في `android/app/build.gradle`:

أضف في النهاية (بعد آخر سطر):
```gradle
apply plugin: 'com.google.gms.google-services'  // ← أضف هذا السطر
```

### 5️⃣ إعادة البناء

```bash
npm run build
npm run cap:sync:android
```

---

## 🧪 اختبار الإشعارات:

### من Firebase Console:

1. اذهب إلى **Cloud Messaging** في القائمة الجانبية
2. اضغط "Send your first message"
3. أدخل عنوان ونص الإشعار
4. اختر "Test on device"
5. أدخل FCM Token للجهاز (سيظهر في console logs)

### برمجياً:

```javascript
// في كود React
import { PushNotifications } from '@capacitor/push-notifications';

// طلب الأذونات
await PushNotifications.requestPermissions();

// التسجيل للإشعارات
await PushNotifications.register();

// الحصول على Token
PushNotifications.addListener('registration', (token) => {
  console.log('FCM Token:', token.value);
  // أرسل هذا Token إلى backend
});

// استقبال الإشعارات
PushNotifications.addListener('pushNotificationReceived', (notification) => {
  console.log('Push received:', notification);
});
```

---

## 🔧 خيارات إضافية (اختياري):

### تخصيص أيقونة الإشعار:

1. ضع أيقونة بيضاء شفافة في:
   ```
   android/app/src/main/res/drawable/ic_stat_notification.png
   ```
2. أحجام مختلفة في:
   - `drawable-hdpi/` (72x72)
   - `drawable-mdpi/` (48x48)
   - `drawable-xhdpi/` (96x96)
   - `drawable-xxhdpi/` (144x144)

### تخصيص لون الإشعار:

في `android/app/src/main/res/values/colors.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="colorPrimary">#3B82F6</color>
</resources>
```

---

## ⚠️ ملاحظات مهمة:

1. **Package Name**: يجب أن يكون متطابقاً في:
   - `capacitor.config.ts` (appId)
   - Firebase Console
   - `android/app/build.gradle` (applicationId)

2. **google-services.json**: 
   - لا ترفعه على Git العام (أضفه في .gitignore إذا كان المشروع عام)
   - اصنع نسخة احتياطية منه

3. **Testing**:
   - الإشعارات **لا تعمل في المحاكي** (Emulator)
   - استخدم جهاز حقيقي للاختبار

4. **iOS**:
   - iOS يحتاج Apple Developer Account ($99/year)
   - إعداد مختلف تماماً (APNs بدلاً من FCM)

---

## 📝 Checklist:

- [ ] مشروع Firebase منشأ
- [ ] Android app مضاف في Firebase
- [ ] `google-services.json` موجود في `android/app/`
- [ ] `build.gradle` محدّث بـ google-services plugin
- [ ] `app/build.gradle` يطبق الـ plugin
- [ ] تم إعادة البناء والمزامنة
- [ ] تم الاختبار على جهاز حقيقي

---

## 🆘 مشاكل شائعة:

### خطأ: "google-services.json missing"
**الحل**: تأكد من وضع الملف في `android/app/google-services.json`

### خطأ: "Failed to apply plugin 'com.google.gms.google-services'"
**الحل**: تأكد من إضافة classpath في `android/build.gradle`

### الإشعارات لا تصل:
**الحل**:
- تحقق من أن Package Name متطابق
- تأكد من تسجيل الجهاز (registration successful)
- استخدم جهاز حقيقي وليس محاكي
- تحقق من FCM Token في logs

---

## 🔗 روابط مفيدة:

- [Firebase Console](https://console.firebase.google.com/)
- [Capacitor Push Notifications Docs](https://capacitorjs.com/docs/apis/push-notifications)
- [FCM Documentation](https://firebase.google.com/docs/cloud-messaging)

---

**ملاحظة**: إعداد Firebase اختياري للتطوير. التطبيق يعمل بدونه، لكن الإشعارات Push لن تعمل في APK.
