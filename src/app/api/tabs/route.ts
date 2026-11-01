import { NextRequest, NextResponse } from 'next/server'
import { createTab, addItem } from '@/lib/db'
import { sendTab, finalizeTab } from '@/lib/tabs'
import { resolveMode } from '@/lib/branding'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { recipientName, recipientEmail, notes, items, finalize, mode, send } = body

  if (!recipientName || !recipientEmail) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const tab = await createTab({ recipientName, recipientEmail, notes, mode: resolveMode(mode) })

  if (items && items.length > 0) {
    for (const item of items) {
      await addItem(tab.id, item.description, item.amountCents)
    }
  }

  // send: false lets the client upload attachments first, then send via /api/tabs/[id]/send.
  if (send !== false) await (finalize ? finalizeTab : sendTab)(tab.id, finalize)

  return NextResponse.json({ id: tab.id, token: tab.token })
}