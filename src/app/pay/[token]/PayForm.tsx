'use client'
import { useState } from 'react'
import { Lightbox } from '@/components/Lightbox'
import { Input } from '@/components/Input'
import { ErrorMessage } from '@/components/ErrorMessage'

interface PayFormProps {
  tabToken: string
  balance: number
  receiptUrls: { key: string; url: string }[]
}

const METHODS = ['CASH', 'ZELLE', 'OTHER'] as const
type Method = typeof METHODS[number]

const METHOD_ICONS: Record<Method, string> = { CASH: '💵 ', ZELLE: '💸 ', OTHER: '💳 ' }

export function PayForm({ tabToken, balance, receiptUrls }: PayFormProps) {
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [method, setMethod] = useState<Method | ''>('')
  const [amount, setAmount] = useState('')
  const [senderNote, setSenderNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!method) return
    const effectiveAmount = amount || (Math.max(0, balance) / 100).toFixed(2)
    setSubmitting(true)
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tabToken,
          amountCents: Math.round(parseFloat(effectiveAmount) * 100),
          method,
          senderNote,
        }),
      })
      if (res.ok) {
        setSubmitted(true)
      } else {
        setError('Something went wrong. Try again.')
      }
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 text-center animate-fade-in">
        <p className="text-4xl mb-4">💸</p>
        <h2 className="text-xl font-bold text-ink font-serif mb-2">Payment submitted</h2>
        <p className="text-ink-2">Payment noted, thank you for your generosity.</p>
      </div>
    )
  }

  return (
    <>
      {receiptUrls.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4 md:p-6 mb-6 animate-fade-in">
          <p className="text-xs text-ink-3 mb-2">Receipts</p>
          <div className="flex flex-wrap gap-2">
            {receiptUrls.map(({ key, url }) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={key}
                src={url}
                alt="Receipt"
                onClick={() => setLightbox(key)}
                className="w-16 h-16 object-cover rounded-lg border border-border cursor-zoom-in hover:opacity-90 transition-opacity"
              />
            ))}
          </div>
          {lightbox && (() => {
            const r = receiptUrls.find(r => r.key === lightbox)
            if (!r) return null
            return <Lightbox src={r.url} alt="Receipt" onClose={() => setLightbox(null)} />
          })()}
        </div>
      )}

      <div className="bg-card border border-border rounded-xl p-4 md:p-6 animate-fade-in">
        <h2 className="text-lg font-medium text-ink mb-4">How are you paying?</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {METHODS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={`py-3 px-4 border rounded-lg font-medium transition-colors ${
                  method === m
                    ? 'border-accent bg-accent-bg text-accent-dark'
                    : 'border-border bg-card text-ink-2 hover:border-accent'
                }`}
              >
                {METHOD_ICONS[m]}{m.charAt(0) + m.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {method && (
            <div className="animate-fade-in">
              {method === 'CASH' && (
                <div className="bg-s-draft-bg rounded-lg p-3 mb-3">
                  <p className="text-s-draft-text text-sm">Classic. Untraceable. We like it.</p>
                </div>
              )}
              <label htmlFor="amount" className="block text-sm font-medium text-ink-2 mb-1">Amount</label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`$${(Math.max(0, balance) / 100).toFixed(2)}`}
                className="w-full px-4 py-3"
              />
            </div>
          )}

          <div>
            <label htmlFor="senderNote" className="block text-sm font-medium text-ink-2 mb-1">Note (optional)</label>
            <Input
              id="senderNote"
              type="text"
              value={senderNote}
              onChange={(e) => setSenderNote(e.target.value)}
              placeholder="A brief, apologetic note..."
              className="w-full px-4 py-3"
            />
          </div>

          <ErrorMessage message={error} />

          <button
            type="submit"
            disabled={!method || submitting}
            className="w-full py-3 px-4 bg-accent text-white font-medium rounded-lg hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Submitting...' : method === 'CASH' ? 'Mark as paid' : 'Submit payment'}
          </button>
        </form>
      </div>
    </>
  )
}
