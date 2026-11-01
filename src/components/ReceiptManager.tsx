'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Lightbox } from './Lightbox'
import { ReceiptThumb, isPdfKey } from './ReceiptThumb'
import { uploadReceipt } from '@/lib/upload-receipt'

interface ReceiptManagerProps {
  tabId: string
  initialUrls: { key: string; url: string }[]
  canUpload: boolean
}

export function ReceiptManager({ tabId, initialUrls, canUpload }: ReceiptManagerProps) {
  const [receipts, setReceipts] = useState<{ key: string; url: string; previewUrl?: string }[]>(initialUrls)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleUpload(files: File[]) {
    setUploading(true)
    try {
      const results = await Promise.allSettled(files.map(async (file) => {
        const { key, url } = await uploadReceipt(tabId, file)
        // Show the local file right away so the thumbnail never races the proxy/storage write-lag.
        const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
        setReceipts(prev => [...prev, { key, url, previewUrl }])
      }))
      const failed = results.length - results.filter(r => r.status === 'fulfilled').length
      if (failed > 0) toast.error(`${failed} upload${failed > 1 ? 's' : ''} failed. Please try again.`)
      else toast.success(files.length > 1 ? `${files.length} receipts uploaded` : 'Receipt uploaded')
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
      setReceipts(prev => {
        const preview = prev.find(r => r.key === key)?.previewUrl
        if (preview) URL.revokeObjectURL(preview)
        return prev.filter(r => r.key !== key)
      })
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
          {receipts.map(({ key, url, previewUrl }) => (
            <div key={key} className="relative group">
              <ReceiptThumb fileKey={key} url={url} previewUrl={previewUrl} sizeClass="w-20 h-20" onOpen={() => setLightbox(key)} />
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
            accept="image/*,application/pdf"
            multiple
            className="hidden"
            onChange={e => { const fs = Array.from(e.target.files ?? []); if (fs.length) handleUpload(fs) }}
          />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="px-3 py-1.5 bg-card border border-border text-ink text-sm rounded-lg hover:bg-card-hover transition-colors disabled:opacity-50"
          >
            {uploading ? 'Uploading…' : '+ Add receipts or PDFs'}
          </button>
        </div>
      )}

      {lightbox && (() => {
        const r = receipts.find(r => r.key === lightbox)
        if (!r || isPdfKey(r.key)) return null
        return <Lightbox src={r.previewUrl ?? r.url} alt="Receipt" onClose={() => setLightbox(null)} />
      })()}
    </div>
  )
}
