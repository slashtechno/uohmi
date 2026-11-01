import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { parseReceipt } from '@/lib/ai-receipt'

export async function POST(req: NextRequest) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const form = await req.formData()
  const files = form.getAll('receipts') as File[]
  if (files.length === 0) return NextResponse.json({ error: 'No files provided' }, { status: 400 })

  // Parse each receipt in parallel and merge the line items into a single flat list.
  let results
  try {
    results = await Promise.all(
      files.map(async (file) => parseReceipt(await file.arrayBuffer(), file.type))
    )
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Parse failed' }, { status: 502 })
  }
  const items = results.flatMap((r) => r.items)
  return NextResponse.json({ items })
}
