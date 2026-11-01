import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { parseReceipt, UnsupportedReceiptError } from '@/lib/ai-receipt'
import { downloadFile, deleteFile } from '@/lib/db'
import { MEDIA_TYPE_BY_EXT } from '@/lib/receipt-types'

// nanoid(16) from /api/receipts/uploads; the extension is validated against the allowed types below.
const STAGING_KEY = /^staging\/[\w-]{16}\.(\w+)$/

// Parses one staged receipt (see /api/receipts/uploads) and removes it from storage afterwards.
export async function POST(req: NextRequest) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { key } = await req.json().catch(() => ({}))
  const match = typeof key === 'string' ? STAGING_KEY.exec(key) : null
  const mediaType = match && MEDIA_TYPE_BY_EXT[match[1]]
  if (!match || !mediaType) return NextResponse.json({ error: 'Invalid key' }, { status: 400 })

  try {
    const bytes = await downloadFile(key)
    if (!bytes) return NextResponse.json({ error: 'Could not read the uploaded file.' }, { status: 502 })
    return NextResponse.json(await parseReceipt(bytes, mediaType))
  } catch (e) {
    if (e instanceof UnsupportedReceiptError) {
      return NextResponse.json({ error: e.message }, { status: 422 })
    }
    console.error('Receipt parse failed:', e)
    return NextResponse.json({ error: 'Could not parse receipt.' }, { status: 502 })
  } finally {
    await deleteFile(key)
  }
}
