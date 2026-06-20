'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import confetti from 'canvas-confetti'

type Tab = {
  recipientName: string
  notes?: string
  status: string
}

type Item = {
  description: string
  amountCents: number
}

type FullTab = {
  tab: Tab
  items: Item[]
  total: number
  balance: number
  status: string
  receiptUrls: { key: string; url: string }[]
}

export default function PayPage() {
  const params = useParams()
  const token = params.token as string

  const [data, setData] = useState<FullTab | null>(null)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [method, setMethod] = useState<string>('')
  const [amount, setAmount] = useState('')
  const [senderNote, setSenderNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    fetch(`/api/public/tabs/${token}`)
      .then(r => r.json())
      .then(d => {
        setData(d)
        setLoading(false)
      })
      .catch(() => {
        setError('Invoice not found. Either it was paid, forgiven, or you\'re lost.')
        setLoading(false)
      })
  }, [token])

  useEffect(() => {
    if (data?.status === 'PAID') {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } })
    }
  }, [data?.status])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!method || !data) return
    const effectiveAmount = amount || (Math.max(0, balance) / 100).toFixed(2)

    setSubmitting(true)
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tabToken: token,
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


  if (loading) {
    return (
      <main className="max-w-md mx-auto px-4 py-16 md:py-24">
        <div className="text-center text-ink-2">Loading...</div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="max-w-md mx-auto px-4 py-16 md:py-24">
        <div className="text-center">
          <p className="text-4xl mb-4">🤷</p>
          <p className="text-ink-2 text-lg">{error}</p>
        </div>
      </main>
    )
  }

  if (!data) return null

  const { tab, items, total, balance, status, receiptUrls } = data

  if (submitted) {
    return (
      <main className="max-w-md mx-auto px-4 py-16 md:py-24">
        <div className="bg-card border border-border rounded-xl p-6 text-center animate-fade-in">
          <p className="text-4xl mb-4">💸</p>
          <h2 className="text-xl font-bold text-ink font-serif mb-2">Payment submitted</h2>
          <p className="text-ink-2">Payment noted, thank you for your generosity.</p>
        </div>
      </main>
    )
  }

  if (status === 'PAID') {
    return (
      <main className="max-w-md mx-auto px-4 py-16 md:py-24">
        <div className="bg-card border border-border rounded-xl p-6 text-center animate-fade-in">
          <p className="text-4xl mb-4">✅</p>
          <h2 className="text-xl font-bold text-ink font-serif mb-2">Already paid</h2>
          <p className="text-ink-2">Settled. You&apos;re free. Your conscience is clean.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-md mx-auto px-4 py-8 md:py-12">
      <div className="bg-card border border-border rounded-xl p-4 md:p-6 mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-accent font-serif mb-2">uohmi</h1>
        <p className="text-ink-2 mb-6">An itemized record of your friend&apos;s generosity.</p>

        <div className="mb-6">
          <div className="space-y-2 mb-4">
            {items.map((item, i) => (
              <div key={i} className="flex justify-between items-center py-1">
                <span className="text-ink text-sm">{item.description}</span>
                <span className="text-ink-2 text-sm">${(item.amountCents / 100).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-ink-2">Total</span>
              <span className="text-lg font-bold text-accent">${(total / 100).toFixed(2)}</span>
            </div>
            {balance < total && (
              <div className="flex justify-between items-center mb-2">
                <span className="text-ink-2">Already paid</span>
                <span className="text-s-paid-text">${((total - balance) / 100).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-ink font-medium">Balance due</span>
              <span className="text-xl font-bold text-s-confirm-text">${(Math.max(0, balance) / 100).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {tab.notes && (
          <div className="bg-accent-bg rounded-lg p-3 mb-6">
            <p className="text-accent-dark text-sm italic">&ldquo;{tab.notes}&rdquo;</p>
          </div>
        )}

        {receiptUrls?.length > 0 && (
          <div className="mb-6">
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
          </div>
        )}

        {lightbox && (() => {
          const r = receiptUrls?.find(r => r.key === lightbox)
          if (!r) return null
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setLightbox(null)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.url} alt="Receipt" onClick={e => e.stopPropagation()} className="max-w-[90vw] max-h-[90vh] rounded-xl shadow-2xl" />
              <button onClick={() => setLightbox(null)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-card text-ink hover:bg-card-hover" aria-label="Close">✕</button>
            </div>
          )
        })()}

        {status === 'OPEN' && (
          <div className="bg-s-open-bg rounded-lg p-3 mb-6">
            <p className="text-s-open-text text-sm">Still adding expenses — pay now or wait for the final total.</p>
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl p-4 md:p-6 animate-fade-in">
        <h2 className="text-lg font-medium text-ink mb-4">How are you paying?</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {['CASH', 'ZELLE', 'OTHER'].map((m) => (
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
                {m === 'CASH' && '💵 '}
                {m === 'ZELLE' && '💸 '}
                {m === 'OTHER' && '💳 '}
                {m.charAt(0) + m.slice(1).toLowerCase()}
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
              <label htmlFor="amount" className="block text-sm font-medium text-ink-2 mb-1">
                Amount
              </label>
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`$${(Math.max(0, balance) / 100).toFixed(2)}`}
                className="w-full px-4 py-3 border border-border rounded-lg bg-card text-ink placeholder-ink-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-bg transition-colors"
              />
            </div>
          )}

          <div>
            <label htmlFor="senderNote" className="block text-sm font-medium text-ink-2 mb-1">
              Note (optional)
            </label>
            <input
              id="senderNote"
              type="text"
              value={senderNote}
              onChange={(e) => setSenderNote(e.target.value)}
              placeholder="A brief, apologetic note..."
              className="w-full px-4 py-3 border border-border rounded-lg bg-card text-ink placeholder-ink-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-bg transition-colors"
            />
          </div>

          {error && (
            <p className="text-sm text-s-confirm-text bg-s-confirm-bg p-3 rounded-lg" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!method || submitting}
            className="w-full py-3 px-4 bg-accent text-white font-medium rounded-lg hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Submitting...' : method === 'CASH' ? 'Mark as paid' : 'Submit payment'}
          </button>
        </form>
      </div>
    </main>
  )
}