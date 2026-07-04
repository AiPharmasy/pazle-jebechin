// Advertisement client for chabooksaz.ir
//
// API: GET https://chabooksaz.ir/api/ads/random
// Response: { "title", "description", "image_url", "link_url", "cta_text" }
//
// Ad banner is shown in BOTH the main menu AND the win modal.
// Clicking the banner opens the link — but ONLY on manual user click.
// NO caching — fresh ad fetched every time.
//
// CORS NOTE: If the API doesn't send CORS headers, the browser will
// block the response. In that case we fall back to the built-in ad.
// The site admin must add: Access-Control-Allow-Origin: *

export interface AdData {
  title: string
  description?: string
  image_url?: string
  link_url: string
  cta_text: string
  source: 'api' | 'fallback'
}

const FALLBACK_AD: AdData = {
  title: 'چابک‌ساز — ایده از شما، ساخت از ما',
  description:
    'ساخت سایت، اپلیکیشن موبایل، ربات و نرم‌افزار اختصاصی. برآورد هزینه آنلاین و شفاف. بدون پیش‌پرداخت — پس از تحویل بپردازید.',
  link_url: 'https://chabooksaz.ir',
  cta_text: 'مشاهده سایت',
  source: 'fallback',
}

const API_URL = 'https://chabooksaz.ir/api/ads/random'

export async function fetchAd(): Promise<AdData> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const res = await fetch(API_URL, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })
    clearTimeout(timeout)

    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const data = await res.json()
    if (!data || !data.title || !data.link_url) throw new Error('No ad')

    return {
      title: String(data.title),
      description: data.description ? String(data.description) : undefined,
      image_url: data.image_url ? String(data.image_url) : undefined,
      link_url: String(data.link_url),
      cta_text: data.cta_text ? String(data.cta_text) : 'بیشتر ببینید',
      source: 'api',
    }
  } catch {
    return FALLBACK_AD
  }
}

export function getFallbackAd(): AdData {
  return FALLBACK_AD
}
