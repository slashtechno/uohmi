'use client'
import { useState, useRef } from 'react'

type ParsedItem = { description: string; amountCents: number }

export function ReceiptImportField({ onParsed }: { onParsed: (items: ParsedItem[]) => void }) {
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState('')
  const [fileCount, setFileCount] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleParse() {
    const files = Array.from(inputRef.current?.files ?? [])
    if (files.length === 0) return
    setParsing(true)
    setError('')
    try {
      const form = new FormData()
      for (const file of files) form.append('receipts', file)
      const res = await fetch('/api/receipts/parse', { method: 'POST', body: form })
      if (!res.ok) throw new Error()
      const { items } = await res.json()
      onParsed(items)
      // Reset the picker so the same files aren't accidentally parsed twice.
      if (inputRef.current) inputRef.current.value = ''
      setFileCount(0)
    } catch {
      setError('Could not parse receipt.')
    } finally {
      setParsing(false)
    }
  }

  return (
    <div className="p-3 bg-card-hover rounded-lg border border-border">
      <p className="text-xs font-medium text-ink-2 mb-2">Import from receipt</p>
      <div className="flex flex-col sm:flex-row gap-2 w-full min-w-0">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setFileCount(e.target.files?.length ?? 0)}
          className="min-w-0 w-full sm:flex-1 text-sm text-ink file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-accent-bg file:text-accent-dark hover:file:bg-accent-bg/80 file:cursor-pointer"
        />
        <button
          type="button"
          onClick={handleParse}
          disabled={parsing || fileCount === 0}
          className="w-full sm:w-auto px-3 py-1.5 bg-accent text-white text-xs font-medium rounded-md hover:bg-accent-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
        >
          {parsing ? 'Parsing...' : fileCount > 1 ? `Parse ${fileCount} receipts` : 'Parse receipt'}
        </button>
      </div>
      {error && <p className="text-xs text-s-confirm-text mt-2">{error}</p>}
    </div>
  )
}
