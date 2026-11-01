'use client'
import { useState, useRef } from 'react'
import { ErrorMessage } from './ErrorMessage'

type ParsedItem = { description: string; amountCents: number }

// Vercel caps request bodies at 4.5 MB, so each file goes in its own request (a few at a time).
const CONCURRENCY = 3

async function parseOne(file: File): Promise<ParsedItem[]> {
  const form = new FormData()
  form.append('receipts', file)
  const res = await fetch('/api/receipts/parse', { method: 'POST', body: form })
  if (!res.ok) {
    throw new Error((await res.json().catch(() => null))?.error || 'Could not parse receipt.')
  }
  return (await res.json()).items
}

export function ReceiptImportField({ onParsed }: {
  // `files` are the successfully parsed files, or [] when the user unticked "Also attach".
  onParsed: (items: ParsedItem[], files: File[]) => void
}) {
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState('')
  const [fileCount, setFileCount] = useState(0)
  const [attach, setAttach] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleParse() {
    const files = Array.from(inputRef.current?.files ?? [])
    if (files.length === 0) return
    setParsing(true)
    setError('')
    try {
      const results: PromiseSettledResult<ParsedItem[]>[] = new Array(files.length)
      let next = 0
      await Promise.all(Array.from({ length: Math.min(CONCURRENCY, files.length) }, async () => {
        while (next < files.length) {
          const i = next++
          try { results[i] = { status: 'fulfilled', value: await parseOne(files[i]) } }
          catch (reason) { results[i] = { status: 'rejected', reason } }
        }
      }))

      const items: ParsedItem[] = []
      const okFiles: File[] = []
      const failures: string[] = []
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') { items.push(...r.value); okFiles.push(files[i]) }
        else failures.push(`${files[i].name}: ${r.reason instanceof Error ? r.reason.message : 'failed'}`)
      })

      if (okFiles.length > 0) {
        onParsed(items, attach ? okFiles : [])
        if (inputRef.current) inputRef.current.value = ''
        setFileCount(0)
      }
      if (failures.length > 0) {
        setError(okFiles.length > 0
          ? `Parsed ${okFiles.length} of ${files.length}. ${failures.join('; ')}`
          : failures.join('; '))
      }
    } finally {
      setParsing(false)
    }
  }

  return (
    <div className="p-3 bg-card-hover rounded-lg border border-border">
      <p className="text-xs font-medium text-ink-2 mb-2">Import from receipts</p>
      <div className="flex flex-col sm:flex-row gap-2 w-full min-w-0">
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
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
      <label className="flex items-center gap-2 mt-2 text-xs text-ink-2 cursor-pointer">
        <input type="checkbox" checked={attach} onChange={(e) => setAttach(e.target.checked)} />
        Also attach these files to the invoice
      </label>
      <ErrorMessage message={error} />
    </div>
  )
}
