# 📱 راهنمای ساخت نسخه iOS

این راهنما برای ساخت نسخه iOS بازی «پازل جعبه‌چین» است.

## ⚠️ پیش‌نیازها

برای ساخت فایل IPA (نسخه iOS)، **الزاماً** به موارد زیر نیاز دارید:

| پیش‌نیاز | توضیح |
|----------|-------|
| **کامپیوتر Mac** | ساخت iOS فقط روی macOS امکان‌پذیر است (ویندوز/لینوکس کار نمی‌کند) |
| **Xcode 15+** | از App Store رایگان نصب کنید (حدود ۸ گیگابایت) |
| **حساب Apple Developer** | $99/سال برای انتشار در App Store (یا حساب رایگان برای تست شخصی) |
| **CocoaPods** | `sudo gem install cocoapods` |

## 📋 وضعیت فعلی پروژه

پروژه iOS قبلاً آماده شده است:
- ✅ پلتفرم iOS به Capacitor اضافه شده (`ios/` folder)
- ✅ وب‌اَپ در `ios/App/App/public/` کپی شده
- ✅ `Info.plist` پیکربندی شده (RTL، Portrait، بدون دسترسی اضافی)
- ✅ `capacitor.config.ts` تنظیم شده

تنها چیزی که نیاز است: **بیلد با Xcode روی Mac**.

## 🚀 مراحل ساخت IPA روی Mac

### گام ۱: انتقال پروژه به Mac

کد منبع (source code) پروژه (پوشه `my-project/`) را به Mac منتقل کنید:
- با Git: `git clone <repo>`
- یا کپی مستقیم پوشه

### گام ۲: نصب وابستگی‌ها

در ترمینال Mac:

```bash
# نصب CocoaPods (یک بار)
sudo gem install cocoapods

# نصب Node.js و bun (اگر ندارید)
brew install node
npm install -g bun

# نصب وابستگی‌های پروژه
cd my-project
bun install  # یا npm install
```

### گام ۳: بیلد وب‌اَپ و همگام‌سازی

```bash
# بیلد نسخه استاتیک
bun run build

# همگام‌سازی با iOS
npx cap sync ios
```

### گام ۴: باز کردن پروژه در Xcode

```bash
npx cap open ios
```

این دستور فایل `MyApp.xcworkspace` را در Xcode باز می‌کند.

### گام ۵: تنظیم Team و Bundle ID

در Xcode:
1. در پنل سمت چپ، روی `App` کلیک کنید
2. در تب `Signing & Capabilities`:
   - **Team**: حساب Apple Developer خود را انتخاب کنید
   - **Bundle Identifier**: `com.chabooksaz.puzzle` (یا هر ID منحصر‌به‌فرد)
3. اگر حساب رایگان دارید، Bundle ID باید منحصر‌به‌فرد باشد

### گام ۶: تست روی شبیه‌ساز

1. در نوار بالای Xcode، یک شبیه‌ساز انتخاب کنید (مثلاً iPhone 15)
2. روی دکمه ▶️ (Run) کلیک کنید
3. بازی باید در شبیه‌ساز باز شود

### گام ۷: تست روی دستگاه واقعی

1. iPhone را با کابل USB به Mac وصل کنید
2. در Xcode، دستگاه را انتخاب کنید
3. تنظیمات Developer روی iPhone: Settings → General → VPN & Device Management → Trust Developer
4. روی ▶️ کلیک کنید

### گام ۸: ساخت IPA برای انتشار

#### برای App Store:

1. در Xcode: Product → Archive
2. بعد از اتمام Archive، پنجره Organizer باز می‌شود
3. روی **Distribute App** کلیک کنید
4. **App Store Connect** را انتخاب کنید
5. **Upload** را انتخاب کنید
6. مراحل را دنبال کنید

#### برای تست Ad Hoc (تعداد محدود دستگاه):

1. Product → Archive
2. **Distribute App** → **Ad Hoc** → **Development**
3. IPA فایل تولید می‌شود

## 📝 اطلاعات مورد نیاز برای App Store

### توضیحات برای App Store (انگلیسی)

```
Puzzle Box Pusher — A classic Sokoban-style puzzle game with 17 challenging levels!

🧩 17 levels including 2 tutorial stages and 15 levels from the classic Microban collection
🎯 4 difficulty tiers: Tutorial, Easy, Medium, Hard, Expert
⭐ Star rating system — earn 3 stars with fewer moves
🔊 Full sound effects + background music
💾 Auto-save progress
🎮 Touch controls (swipe) + on-screen D-pad
🚫 Works fully offline — no internet required
🆓 No ads, no in-app purchases

How to play: Push the orange crates onto the golden targets. Watch out — if a crate gets pushed into a corner, it's stuck!

Levels source: Microban collection by David W. Skinner (public domain)
```

### توضیحات فارسی (اگر App Store فارسی پشتیبانی کند)

از همان توضیحات نسخه اندروید استفاده کنید.

### کلمات کلیدی (Keywords)

```
puzzle,sokoban,box,push,logic,brain,mind,crate,warehouse,maze
```

### رده سنی

- **4+** (بدون محتوای نامناسب)

### دسته‌بندی

- **Games** → **Puzzle**

## 🎨 آیکون‌های iOS

iOS به آیکون در اندازه‌های مختلف نیاز دارد. آیکون‌های موجود در `download/`:

| فایل | اندازه | کاربرد iOS |
|------|--------|-----------|
| `app-icon-1024.png` (باید ساخته شود) | 1024×1024 | App Store icon |
| `app-icon-180.png` (باید ساخته شود) | 180×180 | iPhone Pro |
| `app-icon-120.png` | 120×120 | iPhone |
| `app-icon-87.png` (باید ساخته شود) | 87×87 | iPad |
| `app-icon-80.png` | 80×80 | iPad |
| `app-icon-60.png` (باید ساخته شود) | 60×60 | Settings |

**نکته:** iOS آیکون‌ها را بدون گوشه گرد می‌خواهد — خود iOS گوشه‌ها را گرد می‌کند.
آیکون فعلی 512×512 ما در `ios/App/App/Assets.xcassets/AppIcon.appiconset/` باید جایگزین شود.

### ساخت آیکون‌های iOS

روی Mac با `sips` (ابزار داخلی macOS):

```bash
cd my-project/download

# ساخت سایزهای مختلف از آیکون 512
for size in 1024 180 120 87 80 60 40 20; do
  sips -z $size $size app-icon-512.png --out app-icon-${size}.png
done
```

سپس این فایل‌ها را در `ios/App/App/Assets.xcassets/AppIcon.appiconset/` کپی کنید.

## 📸 اسکرین‌شات‌های iOS برای App Store

App Store اسکرین‌شات در اندازه‌های زیر نیاز دارد:

| دستگاه | اندازه |
|--------|--------|
| iPhone 6.7" (15 Pro Max) | 1290×2796 |
| iPhone 6.5" (11 Pro Max) | 1242×2688 |
| iPad 12.9" | 2048×2732 |

می‌توانید از اسکرین‌شات‌های موجود (`screenshot-*.png`) استفاده کنید و با `sips` تغییر سایز دهید:

```bash
sips -z 2796 1290 screenshot-01-menu.png --out ios-screenshot-1.png
```

## 🔐 حریم خصوصی iOS

Apple سوالات حریم خصوصی در App Store Connect می‌پرسد. پاسخ‌ها:

| سوال | پاسخ |
|------|------|
| Does your app collect data? | **No** |
| Does your app use tracking? | **No** |
| Does your app use third-party SDKs? | **No** (هیچ SDK تحلیلی استفاده نمی‌شود) |
| Privacy Policy URL | `https://chabooksaz.ir/privacy` |

## 💰 هزینه انتشار iOS

| مورد | هزینه |
|------|-------|
| Apple Developer Program | $99/سال |
| App Store انتشار | رایگان (شامل در $99) |
| تست روی دستگاه شخصی | رایگان (با حساب Apple ID معمولی) |

## 🆘 مشکل‌گیری

### "Unsupported arch" خطا
- مطمئن شوید Xcode 15+ نصب است
- `npx cap sync ios` را اجرا کنید

### "Could not find team" خطا
- در Xcode → Signing & Capabilities → Team را تنظیم کنید

### آیکون نمایش داده نمی‌شود
- فایل‌های PNG را در `AppIcon.appiconset` جایگزین کنید
- `Contents.json` را به‌روز کنید

### موسیقی پخش نمی‌شود
- در Info.plist، `UIBackgroundModes` → `audio` اضافه شده (✅ انجام شده)

## 📞 پشتیبانی

اگر در ساخت iOS مشکل دارید:
- تلفن: 09154889167
- وب‌سایت: chabooksaz.ir

استودیو چابک‌ساز — ایده از شما، ساخت از ما
