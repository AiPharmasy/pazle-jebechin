// Advertisement client for chabooksaz.ir
//
// The site exposes a JSON API at https://chabooksaz.ir/api/ads/random
// which returns a random ad. If the API is unavailable, we fall back to
// a built-in static ad that promotes chabooksaz.ir itself.
//
// API response format:
//   { "title": "...", "description": "...", "image_url": "...",
//     "link_url": "...", "cta_text": "..." }
//
// The ad banner is ALWAYS shown. Clicking the ad opens the link — but
// only when the user manually clicks on the banner (never auto-opens).

export interface AdData {
  title: string
  description?: string
  image_url?: string
  link_url: string
  cta_text: string
  source: 'api' | 'fallback'
}

// Built-in fallback ad — always shown when API is unavailable
const FALLBACK_AD: AdData = {
  title: 'چابک‌ساز — ایده از شما، ساخت از ما',
  description:
    'ساخت سایت، اپلیکیشن موبایل، ربات و نرم‌افزار اختصاصی. برآورد هزینه آنلاین و شفاف. بدون پیش‌پرداخت — پس از تحویل بپردازید.',
  link_url: 'https://chabooksaz.ir',
  cta_text: 'مشاهده سایت',
  source: 'fallback',
}

const API_URL = 'https://chabooksaz.ir/api/ads/random'
const CACHE_KEY = 'chabooksaz_ad_cache_v4'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

interface CachedAd {
  ad: AdData
  timestamp: number
}

/**
 * Fetch a random ad from chabooksaz.ir API.
 * Falls back to a built-in ad if the API is unavailable.
 *
 * The ad banner is ALWAYS displayed.
 * Clicking the banner opens the link — but ONLY on user click, never auto.
 */
export async function fetchAd(): Promise<AdData> {
  // Check cache first
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      const parsed: CachedAd = JSON.parse(cached)
      if (Date.now() - parsed.timestamp < CACHE_TTL) {
        return parsed.ad
      }
    }
  } catch {
    /* ignore cache errors */
  }

  // Try fetching from API
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    const res = await fetch(API_URL, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
    clearTimeout(timeout)

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }

    const data = await res.json()

    // If API returns null/empty (no active ads), use fallback
    if (!data || !data.title || !data.link_url) {
      throw new Error('No active ad')
    }

    const ad: AdData = {
      title: String(data.title),
      description: data.description ? String(data.description) : undefined,
      image_url: data.image_url ? String(data.image_url) : undefined,
      link_url: String(data.link_url),
      cta_text: data.cta_text ? String(data.cta_text) : 'بیشتر ببینید',
      source: 'api',
    }

    // Cache it
    try {
      const cache: CachedAd = { ad, timestamp: Date.now() }
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
    } catch {
      /* ignore */
    }

    return ad
  } catch {
    // Any error (network, CORS, timeout, no ads) → use fallback ad
    return FALLBACK_AD
  }
}

/**
 * Get the fallback ad immediately (no network call).
 */
export function getFallbackAd(): AdData {
  return FALLBACK_AD
}
