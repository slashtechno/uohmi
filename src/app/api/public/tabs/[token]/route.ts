import { NextRequest, NextResponse } from 'next/server'
import { getTabByToken, getItems, getPayments } from '@/lib/db'
import { notifications } from '@/lib/notify'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const tab = await getTabByToken(token)
  if (!tab) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  notifications.payOpened(tab.recipientName, tab.id).catch(() => {})

  const [items, payments] = await Promise.all([getItems(tab.id), getPayments(tab.id)])
  const total = items.reduce((s, i) => s + i.amountCents, 0)
  const confirmedPaid = payments.filter(p => p.confirmed).reduce((s, p) => s + p.amountCents, 0)
  const balance = total - confirmedPaid

  return NextResponse.json({
    tab: { id: tab.id, recipientName: tab.recipientName, notes: tab.notes, status: tab.status },
    items,
    total,
    balance,
    status: tab.status,
  })
}