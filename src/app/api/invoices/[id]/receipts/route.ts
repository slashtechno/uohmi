import { NextRequest, NextResponse } from 'next/server'
import { getTab, uploadFile, addTabReceiptKey, removeTabReceiptKey, deleteFile } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const tab = await getTab(id)
  if (!tab) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const ALLOWED_TYPES: Record<string, string> = {
    'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif',
  }

  const { base64, mediaType } = await req.json()
  if (!base64 || !mediaType) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const ext = ALLOWED_TYPES[mediaType]
  if (!ext) return NextResponse.json({ error: 'Unsupported file type' }, { status: 415 })

  const { nanoid } = await import('nanoid')
  const key = `uohmi/receipts/${id}-${nanoid(8)}.${ext}`
  const uploaded = await uploadFile(key, Buffer.from(base64, 'base64'), mediaType)
  if (!uploaded) return NextResponse.json({ error: 'Upload failed' }, { status: 502 })

  await addTabReceiptKey(id, uploaded)
  return NextResponse.json({ key: uploaded })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const tab = await getTab(id)
  if (!tab) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { key } = await req.json()
  if (!key || !tab.receiptFileKeys?.includes(key)) {
    return NextResponse.json({ error: 'Invalid key' }, { status: 400 })
  }

  await deleteFile(key)
  await removeTabReceiptKey(id, key)
  return NextResponse.json({ ok: true })
}
