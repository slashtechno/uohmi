'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ReceiptImportField } from '@/components/ReceiptImportField'
import { parseMoney } from '@/lib/utils'

export default function NewInvoicePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [items, setItems] = useState([{ description: '', amountCents: 0 }])
  const [amountInputs, setAmountInputs] = useState([''])
  const [recipientName, setRecipientName] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [notes, setNotes] = useState('')

  function addItem() {
    setItems([...items, { description: '', amountCents: 0 }])
    setAmountInputs([...amountInputs, ''])
  }

  function removeItem(index: number) {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
      setAmountInputs(amountInputs.filter((_, i) => i !== index))
    }
  }

  function updateItem(index: number, field: string, value: string) {
    const updated = [...items]
    if (field === 'amountCents') {
      const updatedInputs = [...amountInputs]
      updatedInputs[index] = value
      setAmountInputs(updatedInputs)
      updated[index].amountCents = parseMoney(value)
    } else {
      updated[index].description = value
    }
    setItems(updated)
  }

  function handleImportedItems(parsed: { description: string; amountCents: number }[]) {
    setItems(parsed)
    setAmountInputs(parsed.map(item => (item.amountCents / 100).toFixed(2)))
  }

  async function handleSubmit(finalize: boolean) {
    setError('')
    if (!recipientName || !recipientEmail) {
      setError('Recipient name and email are required.')
      return
    }
    if (items.length === 0 || items.every(i => !i.description || i.amountCents === 0)) {
      setError('Add at least one item with a description and amount.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/tabs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientName,
          recipientEmail,
          notes,
          items: items.filter(i => i.description && i.amountCents > 0),
          finalize,
        }),
      })
      if (res.ok) {
        const { id } = await res.json()
        router.push(`/invoices/${id}`)
      } else {
        setError('Something went wrong. Try again.')
      }
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }


  return (
    <main className="max-w-2xl mx-auto px-4 py-8 md:py-12">
      <Link href="/" className="text-accent hover:text-accent-dark text-sm mb-4 inline-block">
        ← Back to dashboard
      </Link>

      <div className="bg-card border border-border rounded-xl p-4 md:p-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-accent font-serif mb-6">New invoice</h1>

        <div className="space-y-4 mb-6">
          <div>
            <label htmlFor="recipientName" className="block text-sm font-medium text-ink-2 mb-1">
              Who owes you?
            </label>
            <input
              id="recipientName"
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Friend's name"
              className="w-full px-4 py-3 border border-border rounded-lg bg-card text-ink placeholder-ink-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-bg transition-colors"
            />
          </div>

          <div>
            <label htmlFor="recipientEmail" className="block text-sm font-medium text-ink-2 mb-1">
              Their email
            </label>
            <input
              id="recipientEmail"
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="friend@example.com"
              className="w-full px-4 py-3 border border-border rounded-lg bg-card text-ink placeholder-ink-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-bg transition-colors"
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-ink-2 mb-1">
              Note (optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="A gentle reminder of their debt..."
              rows={2}
              className="w-full px-4 py-3 border border-border rounded-lg bg-card text-ink placeholder-ink-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-bg transition-colors resize-none"
            />
          </div>
        </div>

        <div className="mb-4">
          <ReceiptImportField onParsed={(parsed) => { if (parsed?.length) handleImportedItems(parsed) }} />
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-ink-2">Items</h2>
            <button
              type="button"
              onClick={addItem}
              className="text-sm text-accent hover:text-accent-dark transition-colors"
            >
              + Add item
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="flex gap-2 items-start">
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => updateItem(i, 'description', e.target.value)}
                  placeholder="What was this for?"
                  className="flex-1 px-3 py-2.5 border border-border rounded-lg bg-card text-ink placeholder-ink-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-bg transition-colors text-sm"
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amountInputs[i] ?? ''}
                  onChange={(e) => updateItem(i, 'amountCents', e.target.value)}
                  placeholder="$0.00"
                  className="w-24 px-3 py-2.5 border border-border rounded-lg bg-card text-ink placeholder-ink-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-bg transition-colors text-sm text-right"
                />
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    className="p-2.5 text-ink-3 hover:text-s-confirm-text transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-sm text-s-confirm-text bg-s-confirm-bg p-3 rounded-lg mb-4" role="alert">
            {error}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => handleSubmit(false)}
            disabled={loading}
            className="flex-1 py-3 px-4 bg-card border border-border text-ink font-medium rounded-lg hover:bg-card-hover focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Sending...' : 'Send & keep open'}
          </button>
          <button
            onClick={() => handleSubmit(true)}
            disabled={loading}
            className="flex-1 py-3 px-4 bg-accent text-white font-medium rounded-lg hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Sending...' : 'Send & finalize'}
          </button>
        </div>
      </div>
    </main>
  )
}