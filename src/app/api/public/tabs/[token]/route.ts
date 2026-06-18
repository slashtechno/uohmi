import { NextRequest, NextResponse } from 'next/server'
import { getTabByToken, getItems } from '@/lib/db'
import { notifications } from '@/lib/notify'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const tab = await getTabByToken(token)
  if (!tab) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  notifications.payOpened(tab.recipientName, tab.id).catch(() => {})

  const items = await getItems(tab.id)
  const total = items.reduce((s, i) => s + i.amountCents, 0)

  return NextResponse.json({
    tab: { id: tab.id, recipientName: tab.recipientName, notes: tab.notes, status: tab.status },
    items,
    total,
    balance: total,
    status: tab.status,
  })
}