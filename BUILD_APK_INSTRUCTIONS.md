# 📱 تعليمات بناء APK للأندرويد

هذا المشروع جاهز الآن لبناء APK باستخدام Capacitor! 🎉

## ✅ ما تم إعداده:

- ✅ Capacitor مثبت ومهيأ
- ✅ Android platform مضاف
- ✅ Push Notifications plugins مثبتة (تحتاج Firebase - راجع `FIREBASE_SETUP.md`)
- ✅ Splash Screen و Status Bar جاهزة
- ✅ PWA features موجودة

## 🔔 ملاحظة مهمة عن الإشعارات:

**للحصول على إشعارات Push في APK**، تحتاج إلى إعداد Firebase Cloud Messaging.
- اقرأ ملف `FIREBASE_SETUP.md` للتعليمات الكاملة
- الإشعارات ستعمل كـ Web Push في PWA بدون Firebase
- لكن في APK الأصلي، تحتاج Firebase لإرسال الإشعارات

## 🔧 طرق البناء:

### **الطريقة 1: على جهازك (الأفضل)**

#### المتطلبات:
- Android Studio مثبت على جهازك
- Java JDK 17+ مثبت

#### الخطوات:

1. **نزّل المشروع** من Replit:
   ```bash
   # استخدم Download as Zip أو Git Clone
   ```

2. **افتح terminal في مجلد المشروع وقم بما يلي:**
   ```bash
   # تثبيت dependencies
   npm install

   # بناء المشروع
   npm run build

   # مزامنة Capacitor مع Android
   npm run cap:sync:android

   # فتح Android Studio
   npm run cap:open:android
   ```

3. **(اختياري) إعداد Firebase للإشعارات:**
   - اقرأ `FIREBASE_SETUP.md` للتعليمات الكاملة
   - ضع `google-services.json` في `android/app/`
   - حدّث Gradle configs

4. **في Android Studio:**
   - انتظر حتى ينتهي Gradle Sync
   - من القائمة: `Build > Build Bundle(s) / APK(s) > Build APK(s)`
   - ستجد APK في: `android/app/build/outputs/apk/debug/app-debug.apk`

---

### **الطريقة 2: باستخدام EAS Build (سحابي)**

#### المتطلبات:
- حساب Expo (مجاني)
- EAS CLI مثبت

#### الخطوات:

1. **تثبيت EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **تسجيل الدخول:**
   ```bash
   eas login
   ```

3. **إعداد المشروع:**
   ```bash
   eas build:configure
   ```

4. **بناء APK:**
   ```bash
   eas build --platform android --profile preview
   ```

5. **تنزيل APK** من الرابط الذي سيظهر لك

---

### **الطريقة 3: باستخدام GitHub Actions (مجاني)**

#### إنشاء workflow:

1. **أنشئ ملف** `.github/workflows/build-android.yml`:

```yaml
name: Build Android APK

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm install
      
    - name: Build web assets
      run: npm run build
      
    - name: Setup Java
      uses: actions/setup-java@v3
      with:
        distribution: 'zulu'
        java-version: '17'
        
    - name: Sync Capacitor
      run: npx cap sync android
      
    - name: Build APK
      run: |
        cd android
        chmod +x gradlew
        ./gradlew assembleDebug
        
    - name: Upload APK
      uses: actions/upload-artifact@v3
      with:
        name: app-debug
        path: android/app/build/outputs/apk/debug/app-debug.apk
```

2. **ارفع على GitHub** وستجد APK في Artifacts

---

## 🎨 تخصيص التطبيق:

### تغيير اسم التطبيق:
في `capacitor.config.ts`:
```typescript
appName: 'اسم تطبيقك'
```

### تغيير App ID:
في `capacitor.config.ts`:
```typescript
appId: 'com.yourcompany.yourapp'
```

### تغيير الأيقونة:
1. ضع الأيقونة في `public/icon-512.png`
2. استخدم: https://icon.kitchen لتوليد جميع الأحجام
3. ضع الأيقونات في `android/app/src/main/res/`

### تغيير Splash Screen:
في `capacitor.config.ts`:
```typescript
SplashScreen: {
  backgroundColor: '#لون_تطبيقك',
  // ...
}
```

---

## 🔑 إعداد التوقيع (للنشر على Play Store):

### إنشاء Keystore:
```bash
keytool -genkey -v -keystore my-release-key.keystore \
  -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

### إضافة في `android/app/build.gradle`:
```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file('my-release-key.keystore')
            storePassword 'password'
            keyAlias 'my-key-alias'
            keyPassword 'password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

### بناء Release APK:
```bash
cd android
./gradlew assembleRelease
```

---

## 📦 Scripts المتاحة:

```bash
# بناء web assets
npm run build

# مزامنة مع Android
npm run cap:sync:android

# فتح Android Studio
npm run cap:open:android

# تشغيل على جهاز متصل
npm run cap:run:android

# بناء كامل وفتح Android Studio
npm run android:build
```

---

## 🚨 مشاكل شائعة:

### مشكلة: Gradle build failed
**الحل:**
```bash
cd android
./gradlew clean
cd ..
npm run cap:sync:android
```

### مشكلة: SDK not found
**الحل:**
- افتح Android Studio
- Tools > SDK Manager
- ثبت Android SDK 33+

### مشكلة: Java version
**الحل:**
```bash
# تأكد من استخدام Java 17
java -version
```

---

## 📱 اختبار APK:

1. **نقل APK للموبايل**
2. **فعّل "مصادر غير معروفة"** في إعدادات الأمان
3. **افتح ملف APK** للتثبيت
4. **جرّب التطبيق!**

---

## 🎯 نشر على Google Play:

1. **إنشاء حساب مطور** ($25 مرة واحدة)
2. **بناء Release AAB** (Android App Bundle):
   ```bash
   cd android
   ./gradlew bundleRelease
   ```
3. **رفع على Play Console**
4. **ملء معلومات التطبيق**
5. **إرسال للمراجعة**

---

## 💡 نصائح:

- **للتطوير**: استخدم `app-debug.apk`
- **للنشر**: استخدم `app-release.aab`
- **الأيقونات**: يجب أن تكون 512x512 بدون شفافية
- **الاختبار**: جرّب على أجهزة مختلفة

---

## 📞 إذا واجهت مشاكل:

1. تحقق من أن Android Studio مثبت بشكل صحيح
2. تأكد من Java JDK 17 موجود
3. راجع logs في Android Studio
4. ابحث عن الخطأ في [Capacitor Docs](https://capacitorjs.com/docs)

---

**بالتوفيق! 🚀**
