import { NextRequest, NextResponse } from 'next/server'
import { addPayment, getTabFull, getTabByToken } from '@/lib/db'
import type { Method } from '@/lib/db'
import { notifications } from '@/lib/notify'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { tabToken, amountCents, method, senderNote } = body

  if (!tabToken || !amountCents || !method) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const tokenTab = await getTabByToken(tabToken)
  if (!tokenTab) return NextResponse.json({ error: 'Tab not found' }, { status: 404 })

  const full = await getTabFull(tokenTab.id)
  if (!full) return NextResponse.json({ error: 'Tab not found' }, { status: 404 })

  const payment = await addPayment({
    tabId: tokenTab.id, amountCents, method: method as Method,
    confirmed: false, senderNote
  })

  await notifications.paymentClaimed(full.tab.recipientName, method, full.tab.id)

  return NextResponse.json({ payment })
}
