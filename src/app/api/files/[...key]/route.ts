import { NextRequest, NextResponse } from 'next/server'
import { getFileUrl, getTab } from '@/lib/db'

// Cache tab receipt key verification to avoid repeated GSDB lookups.
// The list grows on every upload, so a miss must refetch (see GET) rather than 404.
const tabCache = new Map<string, { keys: string[]; at: number }>()
const TAB_TTL = 5 * 60 * 1000

async function getTabReceiptKeys(tabId: string, fresh = false): Promise<string[]> {
  const cached = tabCache.get(tabId)
  if (!fresh && cached && Date.now() - cached.at < TAB_TTL) return cached.keys
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

const NO_STORE = { 'Cache-Control': 'no-store' }
const notFound = () => NextResponse.json({ error: 'Not found' }, { status: 404, headers: NO_STORE })

// Derive the content type from the key (we generate keys ourselves) instead of trusting storage.
const TYPE_BY_EXT: Record<string, string> = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', pdf: 'application/pdf',
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ key: string[] }> }) {
  const { key } = await params
  const fileKey = key.join('/')

  // Only serve keys in the receipts namespace
  if (!fileKey.startsWith('receipts/')) {
    return notFound()
  }

  // Verify the key actually belongs to a tab (prevents fishing for arbitrary S3 objects)
  // Tab ids are fixed-length nanoid(10) and may themselves contain '-', so slice rather than split.
  const tabId = fileKey.split('/')[1]?.slice(0, 10)
  if (!tabId || tabId.length < 10) return notFound()
  // A miss may just be a stale cache entry (file uploaded after it was cached), so refetch once.
  let receiptKeys = await getTabReceiptKeys(tabId)
  if (!receiptKeys.includes(fileKey)) receiptKeys = await getTabReceiptKeys(tabId, true)
  if (!receiptKeys.includes(fileKey)) return notFound()

  const contentType = TYPE_BY_EXT[fileKey.split('.').pop()?.toLowerCase() ?? '']
  if (!contentType) return notFound()
  const isPdf = contentType === 'application/pdf'

  const presignedUrl = await getCachedFileUrl(fileKey)
  if (!presignedUrl) return notFound()

  // Proxy the image content — retries handle S3 write-lag on slow/home-network backends
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt > 0) await new Promise(r => setTimeout(r, 500 * attempt))
    try {
      const upstream = await fetch(presignedUrl)
      if (!upstream.ok) continue
      const body = await upstream.arrayBuffer()
      return new NextResponse(body, {
        headers: {
          'Content-Type': contentType,
          'X-Content-Type-Options': 'nosniff',
          // Browser PDF viewers render nothing inside a CSP sandbox, so PDFs omit it (still no scripts/resources).
          'Content-Security-Policy': isPdf ? "default-src 'none'" : "default-src 'none'; sandbox",
          'Content-Disposition': `inline; filename="${isPdf ? 'receipt.pdf' : 'receipt'}"`,
          // Immutable: file keys include a nanoid, so same key always means same content.
          // Vercel CDN will cache this at the edge after the first request.
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      })
    } catch { continue }
  }

  return NextResponse.json({ error: 'Upstream unavailable' }, { status: 502, headers: NO_STORE })
}
