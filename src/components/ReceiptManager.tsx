'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Lightbox } from './Lightbox'

interface ReceiptManagerProps {
  tabId: string
  initialUrls: { key: string; url: string }[]
  canUpload: boolean
}

export function ReceiptManager({ tabId, initialUrls, canUpload }: ReceiptManagerProps) {
  const [receipts, setReceipts] = useState(initialUrls)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleUpload(file: File) {
    setUploading(true)
    try {
      const presignRes = await fetch(`/api/invoices/${tabId}/receipts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaType: file.type }),
      })
      if (!presignRes.ok) { toast.error('Failed to start upload.'); return }
      const { key, uploadUrl } = await presignRes.json()

      const putRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (!putRes.ok) {
        await fetch(`/api/invoices/${tabId}/receipts`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key }),
        })
        toast.error('Upload failed. Please try again.')
        return
      }

      const urlRes = await fetch(`/api/files/${key.split('/').map(encodeURIComponent).join('/')}`)
      const url = urlRes.ok ? (await urlRes.json()).url : ''
      setReceipts(prev => [...prev, { key, url }])
      toast.success('Receipt uploaded')
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleRemove(key: string) {
    try {
      const res = await fetch(`/api/invoices/${tabId}/receipts`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      })
      if (!res.ok) { toast.error('Failed to remove receipt.'); return }
      setReceipts(prev => prev.filter(r => r.key !== key))
      if (lightbox === key) setLightbox(null)
      toast.success('Receipt removed')
    } catch {
      toast.error('Something went wrong. Please try again.')
    }
  }

  if (receipts.length === 0 && !canUpload) return null

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
              {canUpload && (
                <button
                  onClick={() => handleRemove(key)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-card border border-border rounded-full text-ink-3 hover:text-s-confirm-text flex items-center justify-center text-xs leading-none transition-opacity"
                  aria-label="Remove receipt"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {canUpload && (
        <div className="space-y-2">
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
        return <Lightbox src={r.url} alt="Receipt" onClose={() => setLightbox(null)} />
      })()}
    </div>
  )
}
