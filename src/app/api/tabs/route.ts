import { NextRequest, NextResponse } from 'next/server'
import { createTab, addItem, uploadFile, setTabReceiptKey } from '@/lib/db'
import { sendTab, finalizeTab } from '@/lib/tabs'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { recipientName, recipientEmail, isRunning, notes, items, receiptBase64, receiptMediaType, finalize } = body

  if (!recipientName || !recipientEmail) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const tab = await createTab({ recipientName, recipientEmail, isRunning, notes })

  if (items && items.length > 0) {
    for (const item of items) {
      await addItem(tab.id, item.description, item.amountCents)
    }
  }

  if (receiptBase64 && receiptMediaType) {
    const ext = receiptMediaType.split('/')[1] ?? 'png'
    const receiptFileKey = await uploadFile(
      `uohmi/receipts/${tab.id}.${ext}`,
      Buffer.from(receiptBase64, 'base64'), receiptMediaType
    )
    if (receiptFileKey) await setTabReceiptKey(tab.id, receiptFileKey)
  }

  await (finalize ? finalizeTab : sendTab)(tab.id, finalize)

  return NextResponse.json({ id: tab.id, token: tab.token })
}