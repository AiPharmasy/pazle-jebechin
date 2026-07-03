# 📢 سیستم مدیریت تبلیغات — chabooksaz.ir

این مستند شامل تمام کدهای لازم برای پیاده‌سازی سیستم تبلیغات پویا روی سایت chabooksaz.ir است.

## 📦 فایل‌های تحویلی

| فایل | توضیح |
|------|-------|
| `admin-panel.html` | پنل مدیریت تبلیغات (Frontend) — آماده استفاده |
| `api-ads-documentation.md` | داکیومنت API (برای توسعه‌دهندگان) |
| این فایل | راهنمای کامل نصب و راه‌اندازی |

---

## 🗄️ گام ۱: ساخت دیتابیس

### MySQL Schema

```sql
-- ایجاد دیتابیس (اگر ندارید)
CREATE DATABASE IF NOT EXISTS chabooksaz
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE chabooksaz;

-- جدول آگهی‌ها
CREATE TABLE IF NOT EXISTS ads (
  id           INT PRIMARY KEY AUTO_INCREMENT,
  title        VARCHAR(60) NOT NULL,
  description  VARCHAR(120),
  image_url    VARCHAR(500),
  link_url     VARCHAR(500) NOT NULL,
  cta_text     VARCHAR(30) DEFAULT 'مشاهده سایت',
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

-- جدول توکن‌های احراز هویت مدیر
CREATE TABLE IF NOT EXISTS admin_tokens (
  id         INT PRIMARY KEY AUTO_INCREMENT,
  token      VARCHAR(64) NOT NULL UNIQUE,
  name       VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  INDEX idx_token (token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- آگهی پیش‌فرض (تبلیغ خود chabooksaz.ir)
INSERT INTO ads (title, description, link_url, cta_text, category, active) VALUES
('چابک‌ساز — ایده از شما، ساخت از ما',
 'ساخت سایت، اپلیکیشن موبایل، ربات و نرم‌افزار اختصاصی. برآورد هزینه آنلاین.',
 'https://chabooksaz.ir',
 'مشاهده سایت',
 'general',
 TRUE);

-- ایجاد توکن مدیر (برای دسترسی API)
INSERT INTO admin_tokens (token, name, expires_at) VALUES
('chabooksaz-admin-secret-token-2026', 'مدیر اصلی', DATE_ADD(NOW(), INTERVAL 10 YEAR));
```

---

## 🔌 گام ۲: پیاده‌سازی API

### گزینه الف: PHP (توصیه شده برای بیشتر هاست‌های ایرانی)

#### فایل ۱: `/api/ads/random.php` (عمومی — دریافت آگهی تصادفی)

```php
<?php
// /api/ads/random.php
// دریافت یک آگهی تصادفی فعال

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Cache-Control: public, max-age=300');

// پاسخ به preflight CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    $db = new PDO(
        'mysql:host=localhost;dbname=chabooksaz;charset=utf8mb4',
        'DB_USERNAME',
        'DB_PASSWORD',
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );

    $category = $_GET['category'] ?? null;

    if ($category) {
        $stmt = $db->prepare(
            "SELECT id, title, description, image_url, link_url, cta_text
             FROM ads
             WHERE active = 1
               AND category = ?
               AND start_date <= NOW()
               AND (end_date IS NULL OR end_date >= NOW())
             ORDER BY RAND()
             LIMIT 1"
        );
        $stmt->execute([$category]);
    } else {
        $stmt = $db->query(
            "SELECT id, title, description, image_url, link_url, cta_text
             FROM ads
             WHERE active = 1
               AND start_date <= NOW()
               AND (end_date IS NULL OR end_date >= NOW())
             ORDER BY RAND()
             LIMIT 1"
        );
    }

    $ad = $stmt->fetch();

    if ($ad) {
        // افزایش شمارنده نمایش
        $upd = $db->prepare("UPDATE ads SET impressions = impressions + 1 WHERE id = ?");
        $upd->execute([$ad['id']]);

        echo json_encode($ad, JSON_UNESCAPED_UNICODE);
    } else {
        // هیچ آگهی فعالی موجود نیست
        echo json_encode(['title' => null, 'link_url' => null], JSON_UNESCAPED_UNICODE);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['title' => null, 'link_url' => null], JSON_UNESCAPED_UNICODE);
}
?>
```

#### فایل ۲: `/api/ads/click.php` (عمومی — ثبت کلیک)

```php
<?php
// /api/ads/click.php
// ثبت کلیک روی آگهی

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$linkUrl = $data['link_url'] ?? '';

if (!$linkUrl) {
    echo json_encode(['ok' => false]);
    exit;
}

try {
    $db = new PDO(
        'mysql:host=localhost;dbname=chabooksaz;charset=utf8mb4',
        'DB_USERNAME',
        'DB_PASSWORD',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $stmt = $db->prepare("UPDATE ads SET clicks = clicks + 1 WHERE link_url = ?");
    $stmt->execute([$linkUrl]);

    echo json_encode(['ok' => true]);

} catch (Exception $e) {
    echo json_encode(['ok' => false]);
}
?>
```

#### فایل ۳: `/api/admin/ads/list.php` (مدیر — لیست همه آگهی‌ها)

```php
<?php
// /api/admin/ads/list.php
// دریافت لیست همه آگهی‌ها (نیاز به توکن)

header('Content-Type: application/json; charset=utf-8');

// بررسی توکن
$token = '';
$headers = getallheaders();
if (isset($headers['Authorization'])) {
    $token = str_replace('Bearer ', '', $headers['Authorization']);
}

if (!$token || !isValidToken($token)) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

try {
    $db = new PDO(
        'mysql:host=localhost;dbname=chabooksaz;charset=utf8mb4',
        'DB_USERNAME',
        'DB_PASSWORD',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $stmt = $db->query("SELECT * FROM ads ORDER BY created_at DESC");
    $ads = $stmt->fetchAll();

    echo json_encode(['ads' => $ads], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
}

function isValidToken($token) {
    $db = new PDO(
        'mysql:host=localhost;dbname=chabooksaz;charset=utf8mb4',
        'DB_USERNAME',
        'DB_PASSWORD'
    );
    $stmt = $db->prepare(
        "SELECT 1 FROM admin_tokens
         WHERE token = ?
         AND (expires_at IS NULL OR expires_at >= NOW())"
    );
    $stmt->execute([$token]);
    return $stmt->fetch() !== false;
}
?>
```

#### فایل ۴: `/api/admin/ads/create.php` (مدیر — ساخت آگهی جدید)

```php
<?php
// /api/admin/ads/create.php
// ساخت آگهی جدید

header('Content-Type: application/json; charset=utf-8');

$token = str_replace('Bearer ', '', getallheaders()['Authorization'] ?? '');
if (!$token || !isValidToken($token)) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

// اعتبارسنجی
if (empty($data['title']) || empty($data['link_url'])) {
    http_response_code(400);
    echo json_encode(['error' => 'title and link_url are required']);
    exit;
}

try {
    $db = new PDO(
        'mysql:host=localhost;dbname=chabooksaz;charset=utf8mb4',
        'DB_USERNAME',
        'DB_PASSWORD',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $stmt = $db->prepare(
        "INSERT INTO ads (title, description, image_url, link_url, cta_text, category, active, start_date, end_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );

    $startDate = !empty($data['start_date']) ? $data['start_date'] : date('Y-m-d H:i:s');
    $endDate = !empty($data['end_date']) ? $data['end_date'] : null;
    $active = isset($data['active']) ? (bool)$data['active'] : true;

    $stmt->execute([
        $data['title'],
        $data['description'] ?? null,
        $data['image_url'] ?? null,
        $data['link_url'],
        $data['cta_text'] ?? 'مشاهده سایت',
        $data['category'] ?? 'general',
        $active,
        $startDate,
        $endDate,
    ]);

    $newId = $db->lastInsertId();
    echo json_encode(['ok' => true, 'id' => $newId], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
}

function isValidToken($token) {
    $db = new PDO(
        'mysql:host=localhost;dbname=chabooksaz;charset=utf8mb4',
        'DB_USERNAME',
        'DB_PASSWORD'
    );
    $stmt = $db->prepare(
        "SELECT 1 FROM admin_tokens WHERE token = ? AND (expires_at IS NULL OR expires_at >= NOW())"
    );
    $stmt->execute([$token]);
    return $stmt->fetch() !== false;
}
?>
```

#### فایل ۵: `/api/admin/ads/update.php` (مدیر — ویرایش/فعال‌سازی/غیرفعال‌سازی)

```php
<?php
// /api/admin/ads/update.php
// ویرایش آگهی

header('Content-Type: application/json; charset=utf-8');

$token = str_replace('Bearer ', '', getallheaders()['Authorization'] ?? '');
if (!$token || !isValidToken($token)) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$id = (int)($data['id'] ?? 0);

if (!$id) {
    http_response_code(400);
    echo json_encode(['error' => 'id is required']);
    exit;
}

try {
    $db = new PDO(
        'mysql:host=localhost;dbname=chabooksaz;charset=utf8mb4',
        'DB_USERNAME',
        'DB_PASSWORD',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $fields = [];
    $values = [];

    foreach (['title', 'description', 'image_url', 'link_url', 'cta_text', 'category', 'active', 'start_date', 'end_date'] as $field) {
        if (array_key_exists($field, $data)) {
            $fields[] = "$field = ?";
            $values[] = $data[$field];
        }
    }

    if (empty($fields)) {
        echo json_encode(['ok' => true, 'message' => 'Nothing to update']);
        exit;
    }

    $values[] = $id;
    $sql = "UPDATE ads SET " . implode(', ', $fields) . " WHERE id = ?";
    $stmt = $db->prepare($sql);
    $stmt->execute($values);

    echo json_encode(['ok' => true]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
}

function isValidToken($token) {
    $db = new PDO('mysql:host=localhost;dbname=chabooksaz;charset=utf8mb4', 'DB_USERNAME', 'DB_PASSWORD');
    $stmt = $db->prepare("SELECT 1 FROM admin_tokens WHERE token = ? AND (expires_at IS NULL OR expires_at >= NOW())");
    $stmt->execute([$token]);
    return $stmt->fetch() !== false;
}
?>
```

#### فایل ۶: `/api/admin/ads/delete.php` (مدیر — حذف آگهی)

```php
<?php
// /api/admin/ads/delete.php
// حذف آگهی

header('Content-Type: application/json; charset=utf-8');

$token = str_replace('Bearer ', '', getallheaders()['Authorization'] ?? '');
if (!$token || !isValidToken($token)) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$id = (int)($data['id'] ?? 0);

if (!$id) {
    http_response_code(400);
    echo json_encode(['error' => 'id is required']);
    exit;
}

try {
    $db = new PDO(
        'mysql:host=localhost;dbname=chabooksaz;charset=utf8mb4',
        'DB_USERNAME',
        'DB_PASSWORD',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $stmt = $db->prepare("DELETE FROM ads WHERE id = ?");
    $stmt->execute([$id]);

    echo json_encode(['ok' => true]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
}

function isValidToken($token) {
    $db = new PDO('mysql:host=localhost;dbname=chabooksaz;charset=utf8mb4', 'DB_USERNAME', 'DB_PASSWORD');
    $stmt = $db->prepare("SELECT 1 FROM admin_tokens WHERE token = ? AND (expires_at IS NULL OR expires_at >= NOW())");
    $stmt->execute([$token]);
    return $stmt->fetch() !== false;
}
?>
```

---

### گزینه ب: Node.js (Express)

#### فایل: `/api/ads.js` (همه endpoint‌ها در یک فایل)

```javascript
// /api/ads.js
// کامل‌ترین نسخه با Express

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// اتصال دیتابیس
const pool = mysql.createPool({
  host: 'localhost',
  user: 'DB_USERNAME',
  password: 'DB_PASSWORD',
  database: 'chabooksaz',
  charset: 'utf8mb4',
});

// ===== عمومی: دریافت آگهی تصادفی =====
app.get('/api/ads/random', async (req, res) => {
  try {
    const { category } = req.query;
    let query, params;

    if (category) {
      query = `
        SELECT id, title, description, image_url, link_url, cta_text
        FROM ads
        WHERE active = 1
          AND category = ?
          AND start_date <= NOW()
          AND (end_date IS NULL OR end_date >= NOW())
        ORDER BY RAND()
        LIMIT 1
      `;
      params = [category];
    } else {
      query = `
        SELECT id, title, description, image_url, link_url, cta_text
        FROM ads
        WHERE active = 1
          AND start_date <= NOW()
          AND (end_date IS NULL OR end_date >= NOW())
        ORDER BY RAND()
        LIMIT 1
      `;
      params = [];
    }

    const [rows] = await pool.query(query, params);

    if (rows.length > 0) {
      const ad = rows[0];
      // افزایش شمارنده نمایش
      await pool.query('UPDATE ads SET impressions = impressions + 1 WHERE id = ?', [ad.id]);
      res.json(ad);
    } else {
      res.json({ title: null, link_url: null });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ title: null, link_url: null });
  }
});

// ===== عمومی: ثبت کلیک =====
app.post('/api/ads/click', async (req, res) => {
  try {
    const { link_url } = req.body;
    if (!link_url) {
      return res.json({ ok: false });
    }
    await pool.query('UPDATE ads SET clicks = clicks + 1 WHERE link_url = ?', [link_url]);
    res.json({ ok: true });
  } catch (err) {
    res.json({ ok: false });
  }
});

// ===== احراز هویت مدیر =====
async function isValidToken(token) {
  if (!token) return false;
  const [rows] = await pool.query(
    'SELECT 1 FROM admin_tokens WHERE token = ? AND (expires_at IS NULL OR expires_at >= NOW())',
    [token]
  );
  return rows.length > 0;
}

function getAuth(req) {
  const auth = req.headers.authorization || '';
  return auth.replace('Bearer ', '');
}

// ===== مدیر: لیست همه آگهی‌ها =====
app.get('/api/admin/ads', async (req, res) => {
  if (!(await isValidToken(getAuth(req)))) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const [rows] = await pool.query('SELECT * FROM ads ORDER BY created_at DESC');
    res.json({ ads: rows });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// ===== مدیر: ساخت آگهی =====
app.post('/api/admin/ads', async (req, res) => {
  if (!(await isValidToken(getAuth(req)))) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const { title, description, image_url, link_url, cta_text, category, active, start_date, end_date } = req.body;

    if (!title || !link_url) {
      return res.status(400).json({ error: 'title and link_url are required' });
    }

    const [result] = await pool.query(
      `INSERT INTO ads (title, description, image_url, link_url, cta_text, category, active, start_date, end_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description || null,
        image_url || null,
        link_url,
        cta_text || 'مشاهده سایت',
        category || 'general',
        active !== false,
        start_date || new Date(),
        end_date || null,
      ]
    );

    res.json({ ok: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// ===== مدیر: ویرایش آگهی =====
app.put('/api/admin/ads/:id', async (req, res) => {
  if (!(await isValidToken(getAuth(req)))) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const { id } = req.params;
    const allowed = ['title', 'description', 'image_url', 'link_url', 'cta_text', 'category', 'active', 'start_date', 'end_date'];
    const fields = [];
    const values = [];

    for (const f of allowed) {
      if (req.body[f] !== undefined) {
        fields.push(`${f} = ?`);
        values.push(req.body[f]);
      }
    }

    if (fields.length === 0) {
      return res.json({ ok: true, message: 'Nothing to update' });
    }

    values.push(id);
    await pool.query(`UPDATE ads SET ${fields.join(', ')} WHERE id = ?`, values);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// ===== مدیر: حذف آگهی =====
app.delete('/api/admin/ads/:id', async (req, res) => {
  if (!(await isValidToken(getAuth(req)))) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM ads WHERE id = ?', [id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// ===== مدیر: آمار کلی =====
app.get('/api/admin/stats', async (req, res) => {
  if (!(await isValidToken(getAuth(req)))) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const [total] = await pool.query('SELECT COUNT(*) as count FROM ads');
    const [active] = await pool.query('SELECT COUNT(*) as count FROM ads WHERE active = 1');
    const [impr] = await pool.query('SELECT COALESCE(SUM(impressions), 0) as sum FROM ads');
    const [clicks] = await pool.query('SELECT COALESCE(SUM(clicks), 0) as sum FROM ads');

    res.json({
      total: total[0].count,
      active: active[0].count,
      impressions: impr[0].sum,
      clicks: clicks[0].sum,
    });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Ads API running on port ${PORT}`);
});
```

---

## 🖥️ گام ۳: نصب پنل مدیریت

### روش ۱: آپلود مستقیم (ساده‌ترین)

1. فایل `admin-panel.html` را در مسیر زیر روی هاست آپلود کنید:
   ```
   https://chabooksaz.ir/admin/ads.html
   ```

2. فایل‌های PHP را در پوشه `api/` آپلود کنید:
   ```
   https://chabooksaz.ir/api/ads/random.php
   https://chabooksaz.ir/api/ads/click.php
   https://chabooksaz.ir/api/admin/ads/list.php
   https://chabooksaz.ir/api/admin/ads/create.php
   https://chabooksaz.ir/api/admin/ads/update.php
   https://chabooksaz.ir/api/admin/ads/delete.php
   ```

3. در فایل `admin-panel.html`، تابع‌های `loadStats()`، `loadAdsList()`، `saveAd()`، `toggleAd()`، `deleteAd()` را به‌روزرسانی کنید تا به جای `sampleAds` از API واقعی استفاده کنند.

### نمونه به‌روزرسانی JavaScript برای اتصال به API واقعی

در فایل `admin-panel.html`، این کد را به انتهای `<script>` اضافه کنید:

```javascript
// ====== API Configuration ======
const API_BASE = 'https://chabooksaz.ir/api';
const ADMIN_TOKEN = 'chabooksaz-admin-secret-token-2026'; // از دیتابیس

// ====== Real API calls ======
async function fetchStats() {
  const res = await fetch(`${API_BASE}/admin/stats`, {
    headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
  });
  return await res.json();
}

async function fetchAds() {
  const res = await fetch(`${API_BASE}/admin/ads`, {
    headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
  });
  const data = await res.json();
  return data.ads || [];
}

async function createAdApi(adData) {
  const res = await fetch(`${API_BASE}/admin/ads`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ADMIN_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(adData),
  });
  return await res.json();
}

async function updateAdApi(id, adData) {
  const res = await fetch(`${API_BASE}/admin/ads/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${ADMIN_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(adData),
  });
  return await res.json();
}

async function deleteAdApi(id) {
  const res = await fetch(`${API_BASE}/admin/ads/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` },
  });
  return await res.json();
}

// ====== Updated functions using real API ======
async function loadStats() {
  try {
    const stats = await fetchStats();
    document.getElementById('stat-total').textContent = stats.total;
    document.getElementById('stat-active').textContent = stats.active;
    document.getElementById('stat-impressions').textContent = stats.impressions.toLocaleString('fa-IR');
    document.getElementById('stat-clicks').textContent = stats.clicks.toLocaleString('fa-IR');
  } catch (err) {
    console.error('Failed to load stats:', err);
  }
}

async function loadAdsList() {
  const tbody = document.getElementById('ads-tbody');
  tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px;">در حال بارگذاری...</td></tr>';

  try {
    const ads = await fetchAds();
    // ... (rest of rendering code stays the same, but uses `ads` instead of `sampleAds`)
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: #dc2626;">خطا در بارگذاری</td></tr>';
  }
}
```

---

## 🔐 گام ۴: امنیت

### ۱. محافظت از پنل مدیریت با .htaccess

فایل `/admin/.htaccess` بسازید:

```apache
# محدودیت دسترسی با IP (اختیاری)
# Order deny,allow
# Deny from all
# Allow from YOUR_IP

# یا محافظت با رمز عبور
AuthType Basic
AuthName "پنل مدیریت چابک‌ساز"
AuthUserFile /path/to/.htpasswd
Require valid-user

# جلوگیری از دسترسی مستقیم به فایل‌ها
<Files "*.php">
  Order allow,deny
  Allow from all
</Files>
```

### ۲. ساخت .htpasswd

```bash
htpasswd -c /path/to/.htpasswd admin
# رمز را دو بار وارد کنید
```

### ۳. تغییر توکن مدیر

توکن پیش‌فرض `chabooksaz-admin-secret-token-2026` را به یک رشته تصادفی ۶۴ کاراکتری تغییر دهید:

```sql
UPDATE admin_tokens SET token = 'YOUR_NEW_RANDOM_TOKEN_HERE' WHERE name = 'مدیر اصلی';
```

---

## 🧪 گام ۵: تست API

### تست با curl

```bash
# دریافت آگهی تصادفی
curl https://chabooksaz.ir/api/ads/random

# تست CORS
curl -H "Origin: http://localhost" -I https://chabooksaz.ir/api/ads/random

# لیست همه آگهی‌ها (مدیر)
curl -H "Authorization: Bearer chabooksaz-admin-secret-token-2026" \
     https://chabooksaz.ir/api/admin/ads

# ساخت آگهی جدید
curl -X POST https://chabooksaz.ir/api/admin/ads \
     -H "Authorization: Bearer chabooksaz-admin-secret-token-2026" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "سایت فروشگاهی بسازید",
       "description": "فروشگاه آنلاین حرفه‌ای",
       "link_url": "https://chabooksaz.ir/ecommerce",
       "cta_text": "سفارش دهید",
       "category": "website",
       "active": true
     }'

# فعال/غیرفعال کردن
curl -X PUT https://chabooksaz.ir/api/admin/ads/1 \
     -H "Authorization: Bearer chabooksaz-admin-secret-token-2026" \
     -H "Content-Type: application/json" \
     -d '{"active": false}'

# حذف
curl -X DELETE https://chabooksaz.ir/api/admin/ads/1 \
     -H "Authorization: Bearer chabooksaz-admin-secret-token-2026"
```

### تست در مرورگر

بازی به‌طور خودکار هر ۵ دقیقه یک درخواست به `/api/ads/random` می‌فرستد. اگر پاسخ درست باشد، تبلیغ جدید نمایش داده می‌شود.

---

## 📊 آمار و گزارش

پنل مدیریت این آمار را نشان می‌دهد:

| متریک | توضیح |
|-------|-------|
| کل آگهی‌ها | تعداد همه آگهی‌ها (فعال و غیرفعال) |
| آگهی‌های فعال | آگهی‌هایی که الان نمایش داده می‌شوند |
| کل نمایش | تعداد دفعاتی که آگهی‌ها نمایش داده شده‌اند |
| کل کلیک | تعداد دفعاتی که کاربران روی آگهی کلیک کرده‌اند |
| CTR | نرخ کلیک (کلیک ÷ نمایش × ۱۰۰) |

---

## ❓ سوالات متداول

**سوال: بازی بدون این API هم کار می‌کند؟**
بله. اگر API وجود نداشته باشد یا قطع باشد، بازی به‌طور خودکار از تبلیغ پیش‌فرض (تبلیغ خود chabooksaz.ir) استفاده می‌کند.

**سوال: چطور یک تبلیغ جدید اضافه کنم؟**
1. وارد پنل مدیریت شوید (`chabooksaz.ir/admin/ads.html`)
2. روی تب «آگهی جدید» کلیک کنید
3. فرم را پر کنید (عنوان، توضیح، لینک، تصویر)
4. روی «ذخیره» کلیک کنید
5. تبلیغ بلافاصله در بازی نمایش داده می‌شود (بعد از ۵ دقیقه کش)

**سوال: چطور یک تبلیغ را متوقف کنم؟**
در پنل مدیریت، روی دکمه «غیرفعال» کنار آگهی کلیک کنید.

**سوال: می‌توانم تبلیغ زمان‌دار بسازم؟**
بله. در فرم ساخت آگهی، «تاریخ شروع» و «تاریخ پایان» را تنظیم کنید. آگهی فقط در این بازه نمایش داده می‌شود.

---

## 📞 پشتیبانی

اگر در نصب یا راه‌اندازی مشکل دارید:
- تلفن: **09154889167**
- وب‌سایت: **chabooksaz.ir**

استودیو چابک‌ساز — ایده از شما، ساخت از ما
