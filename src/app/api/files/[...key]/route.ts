import { NextRequest, NextResponse } from 'next/server'
import { getFileUrl, getTab } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ key: string[] }> }) {
  const { key } = await params
  const fileKey = key.join('/')

  // Only serve keys in the receipts namespace
  if (!fileKey.startsWith('uohmi/receipts/')) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Verify the key actually belongs to a tab (prevents fishing for arbitrary S3 objects)
  const tabId = fileKey.split('/')[2]?.split('-')[0]
  const tab = tabId ? await getTab(tabId) : null
  if (!tab?.receiptFileKeys?.includes(fileKey)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const url = await getFileUrl(fileKey)
  if (!url) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ url })
}
