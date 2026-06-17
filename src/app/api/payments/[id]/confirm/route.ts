import { NextRequest, NextResponse } from 'next/server'
import { confirmPaymentAndMaybeClose } from '@/lib/tabs'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await _req.json()
  const { tabId } = body

  if (!tabId) return NextResponse.json({ error: 'Missing tabId' }, { status: 400 })

  await confirmPaymentAndMaybeClose(id, tabId)
  return NextResponse.json({ success: true })
}