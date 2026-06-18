import { NextRequest, NextResponse } from 'next/server'
import { addPayment, getTabFull } from '@/lib/db'
import { notifications } from '@/lib/notify'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { tabId, amountCents, method, senderNote } = body

  if (!tabId || !amountCents || !method) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const full = await getTabFull(tabId)
  if (!full) return NextResponse.json({ error: 'Tab not found' }, { status: 404 })

  const payment = await addPayment({
    tabId, amountCents, method: method as any,
    confirmed: false, senderNote
  })

  await notifications.paymentClaimed(full.tab.recipientName, method, full.tab.id)

  return NextResponse.json({ payment })
}
