# 🎮 پازل جعبه‌چین

بازی پازل سبک سُوکوبان برای اندروید — ۲۵ مرحله چالش‌برانگیز

## 📋 مشخصات
- **Package:** `ir.chabooksaz.jabechin`
- **مراحل:** ۲۵ (۳ آموزشی + ۲۲ Microban)
- **تکنولوژی:** Next.js 16 + Capacitor 8 + TypeScript
- **صدا:** Web Audio API (بدون فایل خارجی)
- **تبلیغ:** از API چابک‌ساز دریافت می‌شود

## 🔨 بیلد

```bash
npm install
npx next build
npx cap sync android
cd android && ./gradlew assembleRelease
```

## 🚀 ریلیز خودکار

GitHub Actions به‌صورت خودکار APK می‌سازد. برای ریلیز:

```bash
git tag v1.0
git push origin v1.0
```

APK امضاشده در صفحه Releases دانلود می‌شود.

## 🔑 Keystore
- **فایل:** `chabooksaz-release-keystore.jks` (در GitHub Secrets)
- **Alias:** `chabooksaz-key`
- **رمز:** در GitHub Secrets (`KEYSTORE_PASSWORD`, `KEY_PASSWORD`)

## 📞 تماس
- وب‌سایت: [chabooksaz.ir](https://chabooksaz.ir)
- شعار: ایده از شما، ساخت از ما
