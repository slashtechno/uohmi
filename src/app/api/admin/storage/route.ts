import { NextRequest, NextResponse } from 'next/server'
import { getOrphanedFileKeys, deleteFile } from '@/lib/db'

export async function GET() {
  const orphans = await getOrphanedFileKeys()
  return NextResponse.json({ orphans })
}

export async function DELETE(req: NextRequest) {
  const { key } = await req.json()
  if (!key || typeof key !== 'string' || !key.startsWith('receipts/')) {
    return NextResponse.json({ error: 'Invalid key' }, { status: 400 })
  }
  // Re-verify it's still an orphan at delete time
  const orphans = await getOrphanedFileKeys()
  if (!orphans.includes(key)) {
    return NextResponse.json({ error: 'Not an orphan' }, { status: 409 })
  }
  await deleteFile(key)
  return NextResponse.json({ ok: true })
}
