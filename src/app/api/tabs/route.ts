import { NextRequest, NextResponse } from 'next/server'
import { createTab, addItem, uploadFile, addTabReceiptKey } from '@/lib/db'
import { sendTab, finalizeTab } from '@/lib/tabs'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { recipientName, recipientEmail, notes, items, receipts, finalize } = body

  if (!recipientName || !recipientEmail) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const tab = await createTab({ recipientName, recipientEmail, notes })

  if (items && items.length > 0) {
    for (const item of items) {
      await addItem(tab.id, item.description, item.amountCents)
    }
  }

  if (Array.isArray(receipts) && receipts.length > 0) {
    for (let i = 0; i < receipts.length; i++) {
      const { base64, mediaType } = receipts[i]
      if (!base64 || !mediaType) continue
      const ext = mediaType.split('/')[1] ?? 'png'
      const key = await uploadFile(
        `uohmi/receipts/${tab.id}-${i}.${ext}`,
        Buffer.from(base64, 'base64'), mediaType
      )
      if (key) await addTabReceiptKey(tab.id, key)
    }
  }

  await (finalize ? finalizeTab : sendTab)(tab.id, finalize)

  return NextResponse.json({ id: tab.id, token: tab.token })
}