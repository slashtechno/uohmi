import { NextRequest, NextResponse } from 'next/server'
import { addItem, deleteItem, getItems } from '@/lib/db'
import { addItemAndNotify } from '@/lib/tabs'
import { getTab } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { description, amountCents } = body

  if (!description || !amountCents) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const tab = await getTab(id)
  if (!tab) return NextResponse.json({ error: 'Tab not found' }, { status: 404 })

  await addItemAndNotify(id, description, amountCents)
  const items = await getItems(id)
  return NextResponse.json({ items })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { searchParams } = new URL(req.url)
  const itemId = searchParams.get('itemId')
  
  if (!itemId) return NextResponse.json({ error: 'Missing itemId' }, { status: 400 })
  
  await deleteItem(itemId)
  const items = await getItems(id)
  return NextResponse.json({ items })
}