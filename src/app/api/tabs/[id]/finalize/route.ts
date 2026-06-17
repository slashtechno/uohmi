import { NextRequest, NextResponse } from 'next/server'
import { finalizeTab } from '@/lib/tabs'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await finalizeTab(id)
  return NextResponse.json({ success: true })
}