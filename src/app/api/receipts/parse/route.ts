import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { parseReceipt } from '@/lib/ai-receipt'

export async function POST(req: NextRequest) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const form = await req.formData()
  const file = form.get('receipt') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const buffer = await file.arrayBuffer()
  const result = await parseReceipt(buffer)
  return NextResponse.json(result)
}
