import { NextRequest, NextResponse, after } from 'next/server'
import { nanoid } from 'nanoid'
import { isAuthenticated } from '@/lib/auth'
import { getUploadPresignUrl, sweepStagingFiles } from '@/lib/db'
import { ALLOWED_TYPES } from '@/lib/receipt-types'

// Presigns a short-lived "staging/" upload so the browser can put a file in storage without it passing
// through a function body (Vercel caps those at 4.5 MB). /api/receipts/parse reads it back by key and
// deletes it (and abandoned ones are swept after 1h). Writes nothing to the sheet, so there is no key list to race on.
export async function POST(req: NextRequest) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { mediaType } = await req.json().catch(() => ({}))
  const ext = ALLOWED_TYPES[mediaType]
  if (!ext) return NextResponse.json({ error: 'Unsupported file type' }, { status: 415 })

  // Opportunistic cleanup of anything abandoned earlier, after the response so it never slows an upload.
  after(() => sweepStagingFiles().catch(() => {}))

  const key = `staging/${nanoid(16)}.${ext}`
  const uploadUrl = await getUploadPresignUrl(key)
  if (!uploadUrl) return NextResponse.json({ error: 'Presign failed' }, { status: 502 })
  return NextResponse.json({ key, uploadUrl })
}
