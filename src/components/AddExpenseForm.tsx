'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

type ParsedItem = { description: string; amountCents: number }

export function AddExpenseForm({ tabId }: { tabId: string }) {
  const router = useRouter()
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [adding, setAdding] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [preview, setPreview] = useState<ParsedItem[] | null>(null)
  const [error, setError] = useState('')
  const receiptRef = useRef<HTMLInputElement>(null)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!description || !amount) return
    setAdding(true)
    setError('')
    try {
      const res = await fetch(`/api/tabs/${tabId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, amountCents: Math.round(parseFloat(amount) * 100) }),
      })
      if (!res.ok) throw new Error()
      setDescription('')
      setAmount('')
      router.refresh()
    } catch {
      setError('Failed to add item.')
    } finally {
      setAdding(false)
    }
  }

  async function handleParseReceipt() {
    const file = receiptRef.current?.files?.[0]
    if (!file) return
    setParsing(true)
    setError('')
    setPreview(null)
    try {
      const form = new FormData()
      form.append('receipt', file)
      const res = await fetch('/api/receipts/parse', { method: 'POST', body: form })
      if (!res.ok) throw new Error()
      const { items } = await res.json()
      setPreview(items)
    } catch {
      setError('Could not parse receipt.')
    } finally {
      setParsing(false)
    }
  }

  async function handleImportAll() {
    if (!preview?.length) return
    setAdding(true)
    setError('')
    try {
      const res = await fetch(`/api/tabs/${tabId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: preview }),
      })
      if (!res.ok) throw new Error()
      setPreview(null)
      if (receiptRef.current) receiptRef.current.value = ''
      router.refresh()
    } catch {
      setError('Failed to import items.')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="mt-4 pt-4 border-t border-border space-y-4">
      <h3 className="text-sm font-medium text-ink-2">Add expense</h3>

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="What was this for?"
          required
          className="flex-1 px-3 py-2 border border-border rounded-lg bg-card text-ink placeholder-ink-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-bg transition-colors text-sm"
        />
        <input
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="$0.00"
          required
          className="w-24 px-3 py-2 border border-border rounded-lg bg-card text-ink placeholder-ink-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-bg transition-colors text-sm text-right"
        />
        <button
          type="submit"
          disabled={adding}
          className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent-dark disabled:opacity-50 transition-colors"
        >
          Add
        </button>
      </form>

      <div className="p-3 bg-card-hover rounded-lg border border-border">
        <p className="text-xs font-medium text-ink-2 mb-2">Or import from receipt</p>
        <div className="flex gap-2">
          <input
            ref={receiptRef}
            type="file"
            accept="image/*"
            className="flex-1 text-sm text-ink file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-accent-bg file:text-accent-dark hover:file:bg-accent-bg/80 file:cursor-pointer"
          />
          <button
            type="button"
            onClick={handleParseReceipt}
            disabled={parsing}
            className="px-3 py-1.5 bg-accent text-white text-xs font-medium rounded-md hover:bg-accent-dark disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {parsing ? 'Parsing...' : 'Parse receipt'}
          </button>
        </div>
      </div>

      {preview && (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="bg-card-hover px-3 py-2 flex items-center justify-between">
            <span className="text-xs font-medium text-ink-2">{preview.length} items found</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="text-xs text-ink-3 hover:text-ink transition-colors"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleImportAll}
                disabled={adding}
                className="text-xs text-accent hover:text-accent-dark font-medium disabled:opacity-50 transition-colors"
              >
                {adding ? 'Importing...' : 'Import all'}
              </button>
            </div>
          </div>
          <div className="divide-y divide-border">
            {preview.map((item, i) => (
              <div key={i} className="flex justify-between items-center px-3 py-2">
                <span className="text-sm text-ink">{item.description}</span>
                <span className="text-sm text-ink-2">${(item.amountCents / 100).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-s-confirm-text">{error}</p>
      )}
    </div>
  )
}
