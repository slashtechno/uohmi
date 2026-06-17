import { NextRequest, NextResponse } from 'next/server'
import { addPayment, getTabFull } from '@/lib/db'
import { uploadFile } from '@/lib/db'
import { verifyScreenshot } from '@/lib/ai-verify'
import { notifications } from '@/lib/notify'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { tabId, amountCents, method, senderNote, screenshotBase64, screenshotMediaType } = body

  if (!tabId || !amountCents || !method) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const full = await getTabFull(tabId)
  if (!full) return NextResponse.json({ error: 'Tab not found' }, { status: 404 })

  let aiPassed = false
  let aiVerdict = 'No screenshot provided'
  let screenshotFileKey = ''

  if (screenshotBase64 && screenshotMediaType) {
    const result = await verifyScreenshot(screenshotBase64, screenshotMediaType, full.total, method)
    aiPassed = result.passed
    aiVerdict = result.verdict

    const ext = screenshotMediaType.split('/')[1] ?? 'png'
    const { nanoid } = await import('nanoid')
    const paymentId = nanoid(10)
    screenshotFileKey = await uploadFile(
      `uohmi/screenshots/${paymentId}.${ext}`,
      Buffer.from(screenshotBase64, 'base64'), screenshotMediaType
    ) ?? ''
  }

  const payment = await addPayment({
    tabId, amountCents, method: method as any,
    confirmed: false, aiVerdict, aiPassed, screenshotFileKey, senderNote
  })

  await notifications.paymentClaimed(full.tab.recipientName, method, full.tab.id)

  return NextResponse.json({ payment })
}