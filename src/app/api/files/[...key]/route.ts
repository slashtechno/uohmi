import { NextRequest, NextResponse } from 'next/server'
import { getFileUrl, getTab } from '@/lib/db'

// Cache tab receipt key verification to avoid repeated GSDB lookups.
// Keys are immutable once written, so a 5-minute TTL is safe.
const tabCache = new Map<string, { keys: string[]; at: number }>()
const TAB_TTL = 5 * 60 * 1000

async function getTabReceiptKeys(tabId: string): Promise<string[]> {
  const cached = tabCache.get(tabId)
  if (cached && Date.now() - cached.at < TAB_TTL) return cached.keys
  const tab = await getTab(tabId)
  const keys = tab?.receiptFileKeys ?? []
  tabCache.set(tabId, { keys, at: Date.now() })
  return keys
}

// Cache presigned GET URLs per file key to avoid repeated GSDB presign calls.
// Presigned URLs typically expire in 1 hour; use a 45-minute TTL to stay safe.
const urlCache = new Map<string, { url: string; at: number }>()
const URL_TTL = 45 * 60 * 1000

async function getCachedFileUrl(fileKey: string): Promise<string | null> {
  const cached = urlCache.get(fileKey)
  if (cached && Date.now() - cached.at < URL_TTL) return cached.url
  const url = await getFileUrl(fileKey)
  if (url) urlCache.set(fileKey, { url, at: Date.now() })
  return url ?? null
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ key: string[] }> }) {
  const { key } = await params
  const fileKey = key.join('/')

  // Only serve keys in the receipts namespace
  if (!fileKey.startsWith('receipts/')) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Verify the key actually belongs to a tab (prevents fishing for arbitrary S3 objects)
  const tabId = fileKey.split('/')[1]?.split('-')[0]
  if (!tabId) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const receiptKeys = await getTabReceiptKeys(tabId)
  if (!receiptKeys.includes(fileKey)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const presignedUrl = await getCachedFileUrl(fileKey)
  if (!presignedUrl) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const SAFE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

  // Proxy the image content — retries handle S3 write-lag on slow/home-network backends
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt > 0) await new Promise(r => setTimeout(r, 500 * attempt))
    try {
      const upstream = await fetch(presignedUrl)
      if (!upstream.ok) continue
      const rawType = (upstream.headers.get('content-type') ?? '').split(';')[0].trim()
      // Never reflect an arbitrary upstream Content-Type — constrain to known-safe image
      // types to prevent same-origin XSS if the Pi's S3 ever returns unexpected content.
      const contentType = SAFE_TYPES.has(rawType) ? rawType : 'application/octet-stream'
      const body = await upstream.arrayBuffer()
      return new NextResponse(body, {
        headers: {
          'Content-Type': contentType,
          'X-Content-Type-Options': 'nosniff',
          'Content-Security-Policy': "default-src 'none'; sandbox",
          'Content-Disposition': 'inline; filename="receipt"',
          // Immutable: file keys include a nanoid, so same key always means same content.
          // Vercel CDN will cache this at the edge after the first request.
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      })
    } catch { continue }
  }

  return NextResponse.json({ error: 'Upstream unavailable' }, { status: 502 })
}
