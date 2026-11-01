import { NextRequest, NextResponse } from 'next/server'
import { getTab } from '@/lib/db'
import { sendTab, finalizeTab } from '@/lib/tabs'

// Sends the invoice email for a tab created with `send: false` (so attachments exist before it goes out).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!await getTab(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const { finalize } = await req.json().catch(() => ({}))
  await (finalize ? finalizeTab : sendTab)(id, !!finalize)
  return NextResponse.json({ ok: true })
}
