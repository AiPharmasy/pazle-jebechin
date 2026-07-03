# API داکیومنت تبلیغات — chabooksaz.ir

این داکیومنت برای تیم وب chabooksaz.ir است تا API تبلیغات پویا را پیاده‌سازی کند.

## Endpoint

```
GET https://chabooksaz.ir/api/ads/random
```

## هدف

بازی «پازل جعبه‌چین» این endpoint را برای دریافت یک آگهی تصادفی صدا می‌زند. اگر API پاسخ ندهد یا خطا بدهد، بازی به‌طور خودکار از یک آگهی پیش‌فرض (تبلیغ خود chabooksaz.ir) استفاده می‌کند — پس بازی همیشه کار می‌کند.

## درخواست

### HTTP Request

```http
GET /api/ads/random HTTP/1.1
Host: chabooksaz.ir
Accept: application/json
```

### پارامترهای Query (اختیاری)

| پارامتر | نوع | پیش‌فرض | توضیح |
|---------|-----|---------|-------|
| `category` | string | (همه) | فیلتر دسته. مثلاً `game`, `product`, `service` |
| `count` | int | 1 | تعداد آگهی برگشتی (حداکثر ۵) |

### مثال درخواست

```
GET /api/ads/random
GET /api/ads/random?category=product&count=3
```

## پاسخ

### موفق (200 OK)

```json
{
  "title": "چابک‌ساز — ایده از شما، ساخت از ما",
  "description": "ساخت سایت، اپلیکیشن موبایل، ربات و نرم‌افزار اختصاصی. برآورد هزینه آنلاین. بدون پیش‌پرداخت.",
  "image_url": "https://chabooksaz.ir/ads/studio-promo.jpg",
  "link_url": "https://chabooksaz.ir",
  "cta_text": "مشاهده سایت"
}
```

### وقتی آگهی فعالی موجود نیست (200 OK)

```json
{
  "title": null,
  "link_url": null
}
```

در این صورت بازی از تبلیغ پیش‌فرض (fallback) استفاده می‌کند.

### خطا (4xx, 5xx)

بازی از fallback استفاده می‌کند. کاربر چیزی نمی‌بیند.

## فیلدهای پاسخ

| فیلد | نوع | الزامی | محدودیت | توضیح |
|------|-----|--------|---------|-------|
| `title` | string | بله | ۶۰ کاراکتر | عنوان آگهی |
| `description` | string | خیر | ۱۲۰ کاراکتر | توضیح کوتاه |
| `image_url` | string (URL) | خیر | — | تصویر آگهی (پیشنهاد: ۲۰۰×۲۰۰ JPG/PNG) |
| `link_url` | string (URL) | بله | — | صفحه مقصد کلیک |
| `cta_text` | string | خیر | ۳۰ کاراکتر | متن دکمه (پیش‌فرض: «بیشتر ببینید») |

## الزامات سرور

### ۱. CORS (الزامی)

بازی درون WebView اجرا می‌شود، پس هدرهای CORS لازم است:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Content-Type, Accept
```

### ۲. HTTPS (الزامی)

Android 9+ درخواست‌های HTTP را مسدود می‌کند. فقط HTTPS.

### ۳. Timeout

بازی ۳ ثانیه صبر می‌کند. اگر پاسخ طولانی‌تر شود، بازی از fallback استفاده می‌کند.

### ۴. Cache

بازی نتیجه را ۵ دقیقه در `localStorage` کش می‌کند. هدرهای Cache-Control توصیه می‌شود:

```
Cache-Control: public, max-age=300
```

### ۵. Rate Limiting

بازی هر ۵ دقیقه یک درخواست می‌فرستد. اگر کاربر چند بار منو را باز و بسته کند، باز هم از کش استفاده می‌شود. پس محدودیت خاصی لازم نیست.

## نمونه پیاده‌سازی

### PHP (با MySQL)

```php
<?php
// /api/ads/random.php

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Cache-Control: public, max-age=300');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    $db = new PDO(
        'mysql:host=localhost;dbname=chabooksaz;charset=utf8mb4',
        'username',
        'password',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $category = $_GET['category'] ?? null;
    $count = min((int)($_GET['count'] ?? 1), 5);

    if ($category) {
        $stmt = $db->prepare(
            "SELECT title, description, image_url, link_url, cta_text
             FROM ads
             WHERE active = 1
               AND category = ?
               AND start_date <= NOW()
               AND (end_date IS NULL OR end_date >= NOW())
             ORDER BY RAND()
             LIMIT ?"
        );
        $stmt->execute([$category, $count]);
    } else {
        $stmt = $db->prepare(
            "SELECT title, description, image_url, link_url, cta_text
             FROM ads
             WHERE active = 1
               AND start_date <= NOW()
               AND (end_date IS NULL OR end_date >= NOW())
             ORDER BY RAND()
             LIMIT ?"
        );
        $stmt->execute([$count]);
    }

    // Increment impression count for served ads (optional analytics)
    $ads = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if ($count === 1) {
        if (!empty($ads)) {
            // Update impressions
            $upd = $db->prepare("UPDATE ads SET impressions = impressions + 1 WHERE title = ?");
            $upd->execute([$ads[0]['title']]);
            echo json_encode($ads[0]);
        } else {
            echo json_encode(['title' => null, 'link_url' => null]);
        }
    } else {
        echo json_encode(['ads' => $ads]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['title' => null, 'link_url' => null]);
}
?>
```

### Node.js (Express)

```javascript
// /api/ads/random.js
import { pool } from '../../lib/db.js'

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Cache-Control', 'public, max-age=300')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const { category } = req.query
    const count = Math.min(parseInt(req.query.count || '1'), 5)

    let query, params
    if (category) {
      query = `
        SELECT title, description, image_url, link_url, cta_text
        FROM ads
        WHERE active = 1
          AND category = ?
          AND start_date <= NOW()
          AND (end_date IS NULL OR end_date >= NOW())
        ORDER BY RAND()
        LIMIT ?
      `
      params = [category, count]
    } else {
      query = `
        SELECT title, description, image_url, link_url, cta_text
        FROM ads
        WHERE active = 1
          AND start_date <= NOW()
          AND (end_date IS NULL OR end_date >= NOW())
        ORDER BY RAND()
        LIMIT ?
      `
      params = [count]
    }

    const [rows] = await pool.query(query, params)

    if (count === 1) {
      if (rows.length > 0) {
        // Update impressions
        await pool.query('UPDATE ads SET impressions = impressions + 1 WHERE title = ?', [rows[0].title])
        res.status(200).json(rows[0])
      } else {
        res.status(200).json({ title: null, link_url: null })
      }
    } else {
      res.status(200).json({ ads: rows })
    }
  } catch (err) {
    console.error('Ad API error:', err)
    res.status(500).json({ title: null, link_url: null })
  }
}
```

## ساختار دیتابیس

```sql
CREATE TABLE IF NOT EXISTS ads (
  id           INT PRIMARY KEY AUTO_INCREMENT,
  title        VARCHAR(60) NOT NULL,
  description  VARCHAR(120),
  image_url    VARCHAR(500),
  link_url     VARCHAR(500) NOT NULL,
  cta_text     VARCHAR(30) DEFAULT 'بیشتر ببینید',
  category     VARCHAR(30) DEFAULT 'general',
  active       BOOLEAN DEFAULT TRUE,
  start_date   DATETIME DEFAULT CURRENT_TIMESTAMP,
  end_date     DATETIME NULL,
  clicks       INT DEFAULT 0,
  impressions  INT DEFAULT 0,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_active (active, start_date, end_date),
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## ردیابی کلیک (اختیاری)

برای ردیابی کلیک‌ها، endpoint دیگری بسازید:

```
POST https://chabooksaz.ir/api/ads/click
Content-Type: application/json

{
  "link_url": "https://chabooksaz.ir/products/custom-chabook"
}
```

### پاسخ

```json
{ "ok": true }
```

### PHP

```php
<?php
// /api/ads/click.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$link = $data['link_url'] ?? '';

if (!$link) {
    echo json_encode(['ok' => false]);
    exit;
}

$db = new PDO('mysql:host=localhost;dbname=chabooksaz', 'user', 'pass');
$stmt = $db->prepare("UPDATE ads SET clicks = clicks + 1 WHERE link_url = ?");
$stmt->execute([$link]);

echo json_encode(['ok' => true]);
?>
```

## پنل مدیریت آگهی‌ها

یک پنل ساده برای مدیریت آگهی‌ها بسازید:

### صفحات پیشنهادی

| صفحه | مسیر | کاربرد |
|------|------|--------|
| لیست آگهی‌ها | `/admin/ads` | نمایش همه آگهی‌ها |
| افزودن آگهی | `/admin/ads/new` | فرم ساخت آگهی جدید |
| ویرایش آگهی | `/admin/ads/[id]` | فرم ویرایش |
| آمار | `/admin/ads/stats` | نمودار کلیک/نمایش |

### فیلدهای فرم

- عنوان (text, max 60)
- توضیح (textarea, max 120)
- تصویر (file upload — پیشنهاد ۲۰۰×۲۰۰)
- لینک مقصد (URL)
- متن دکمه (text, max 30)
- دسته (select)
- فعال (checkbox)
- تاریخ شروع (datetime)
- تاریخ پایان (datetime, optional)

## تست API

### با curl

```bash
# دریافت یک آگهی تصادفی
curl https://chabooksaz.ir/api/ads/random

# با دسته
curl "https://chabooksaz.ir/api/ads/random?category=product"

# چند آگهی
curl "https://chabooksaz.ir/api/ads/random?count=3"

# تست CORS
curl -H "Origin: http://localhost" -I https://chabooksaz.ir/api/ads/random
```

### پاسخ مورد انتظار

```json
{
  "title": "چابک‌ساز — ایده از شما، ساخت از ما",
  "description": "ساخت سایت، اپلیکیشن موبایل، ربات و نرم‌افزار اختصاصی...",
  "image_url": "https://chabooksaz.ir/ads/studio-promo.jpg",
  "link_url": "https://chabooksaz.ir",
  "cta_text": "مشاهده سایت"
}
```

## امنیت

1. **SQL Injection**: از prepared statements استفاده کنید (در نمونه‌ها آمده)
2. **XSS**: title/description را قبل از ذخیره escape کنید (یا در خروجی JSON ایمن است چون بازی از React استفاده می‌کند)
3. **Rate Limiting**: اختیاری — بازی ۵ دقیقه یک بار صدا می‌زند
4. **Authentication**: endpoint عمومی است، احراز هویت لازم نیست
5. **HTTPS**: الزامی

## پشتیبانی

اگر سوالی دارید یا API را پیاده‌سازی کردید، اطلاع دهید تا تست کنیم.
