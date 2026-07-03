// Advertisement client for chabooksaz.ir
//
// The site exposes a JSON API at https://chabooksaz.ir/api/ads/random
// which returns a random ad. If the API is unavailable, we fall back to
// a built-in static ad that promotes chabooksaz.ir itself.
//
// IMPORTANT: The ad banner is ALWAYS shown. But clicking the ad (opening
// the link) is disabled by default. The API response must include
// "clickable": true for the ad link to be openable.

export interface AdData {
  title: string
  description?: string
  image_url?: string
  link_url: string
  cta_text: string
  source: 'api' | 'fallback'
  clickable: boolean // controls whether clicking the ad opens the link
}

// Built-in fallback ad — always shown, but NOT clickable by default
const FALLBACK_AD: AdData = {
  title: 'چابک‌ساز — ایده از شما، ساخت از ما',
  description:
    'ساخت سایت، اپلیکیشن موبایل، ربات و نرم‌افزار اختصاصی. برآورد هزینه آنلاین و شفاف. بدون پیش‌پرداخت — پس از تحویل بپردازید.',
  link_url: 'https://chabooksaz.ir',
  cta_text: 'مشاهده سایت',
  source: 'fallback',
  clickable: false, // Default: ad is shown but NOT clickable
}

const API_URL = 'https://chabooksaz.ir/api/ads/random'
const CACHE_KEY = 'chabooksaz_ad_cache_v3'
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
 * But clicking the ad (opening the link) is disabled by default.
 * To enable clicking, the API response must include:
 *   { "clickable": true, "title": "...", "link_url": "..." }
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

    // If API returns null/empty, use fallback
    if (!data || !data.title || !data.link_url) {
      throw new Error('Invalid ad response')
    }

    const ad: AdData = {
      title: String(data.title),
      description: data.description ? String(data.description) : undefined,
      image_url: data.image_url ? String(data.image_url) : undefined,
      link_url: String(data.link_url),
      cta_text: data.cta_text ? String(data.cta_text) : 'بیشتر ببینید',
      source: 'api',
      // Only enable clicking if API explicitly says clickable: true
      clickable: data.clickable === true,
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
    // Any error → use fallback ad (clickable: false by default)
    return FALLBACK_AD
  }
}

/**
 * Get the fallback ad immediately (no network call).
 */
export function getFallbackAd(): AdData {
  return FALLBACK_AD
}
