'use client'

import { useRef, useState } from 'react'

interface ReceiptManagerProps {
  tabId: string
  initialUrls: { key: string; url: string }[]
  canEdit: boolean
}

export function ReceiptManager({ tabId, initialUrls, canEdit }: ReceiptManagerProps) {
  const [receipts, setReceipts] = useState(initialUrls)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleUpload(file: File) {
    setUploading(true)
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve((reader.result as string).split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      const res = await fetch(`/api/invoices/${tabId}/receipts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64, mediaType: file.type }),
      })
      if (!res.ok) return
      // Fetch the URL for the newly uploaded receipt via the existing getFileUrl path
      const { key } = await res.json()
      const urlRes = await fetch(`/api/files/${key.split('/').map(encodeURIComponent).join('/')}`)
      const url = urlRes.ok ? (await urlRes.json()).url : ''
      setReceipts(prev => [...prev, { key, url }])
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleRemove(key: string) {
    await fetch(`/api/invoices/${tabId}/receipts`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    })
    setReceipts(prev => prev.filter(r => r.key !== key))
    if (lightbox === key) setLightbox(null)
  }

  if (receipts.length === 0 && !canEdit) return null

  return (
    <div className="bg-card border border-border rounded-xl p-4 md:p-6 mb-6">
      <h2 className="text-lg font-medium text-ink mb-4">Receipts ({receipts.length})</h2>

      {receipts.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {receipts.map(({ key, url }) => (
            <div key={key} className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt="Receipt"
                onClick={() => setLightbox(key)}
                className="w-20 h-20 object-cover rounded-lg border border-border cursor-zoom-in hover:opacity-90 transition-opacity"
              />
              {canEdit && (
                <button
                  onClick={() => handleRemove(key)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-card border border-border rounded-full text-ink-3 hover:text-s-confirm-text flex items-center justify-center text-xs leading-none md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                  aria-label="Remove receipt"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {canEdit && (
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f) }}
          />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="px-3 py-1.5 bg-card border border-border text-ink text-sm rounded-lg hover:bg-card-hover transition-colors disabled:opacity-50"
          >
            {uploading ? 'Uploading…' : '+ Add receipt'}
          </button>
        </div>
      )}

      {lightbox && (() => {
        const r = receipts.find(r => r.key === lightbox)
        if (!r) return null
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
            onClick={() => setLightbox(null)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={r.url}
              alt="Receipt"
              onClick={e => e.stopPropagation()}
              className="max-w-[90vw] max-h-[90vh] rounded-xl shadow-2xl"
            />
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-card text-ink hover:bg-card-hover"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        )
      })()}
    </div>
  )
}
