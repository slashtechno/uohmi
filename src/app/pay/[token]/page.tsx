import { notFound } from 'next/navigation'
import { after } from 'next/server'
import { getTabByToken, getItems, getPayments, getFileUrl } from '@/lib/db'
import { notifications } from '@/lib/notify'
import { formatMoney } from '@/lib/utils'
import { ConfettiTrigger } from './ConfettiTrigger'
import { PayForm } from './PayForm'

export default async function PayPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const tab = await getTabByToken(token)
  if (!tab) notFound()

  after(() => notifications.payOpened(tab.recipientName, tab.id).catch(() => {}))

  const [items, payments] = await Promise.all([getItems(tab.id), getPayments(tab.id)])
  const total = items.reduce((s, i) => s + i.amountCents, 0)
  const confirmedPaid = payments.filter(p => p.confirmed).reduce((s, p) => s + p.amountCents, 0)
  const balance = total - confirmedPaid

  const receiptUrls = await Promise.all(
    (tab.receiptFileKeys ?? []).map(async key => ({ key, url: (await getFileUrl(key)) ?? '' }))
  ).then(rs => rs.filter(r => r.url))

  if (tab.status === 'PAID') {
    return (
      <main className="max-w-md mx-auto px-4 py-16 md:py-24">
        <ConfettiTrigger />
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
        <p className="text-ink-2 mb-6">A legally questionable record of kindness.</p>

        <div className="mb-6">
          <div className="space-y-2 mb-4">
            {items.map((item, i) => (
              <div key={i} className="flex justify-between items-center py-1">
                <span className="text-ink text-sm">{item.description}</span>
                <span className="text-ink-2 text-sm">{formatMoney(item.amountCents)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-ink-2">Total</span>
              <span className="text-lg font-bold text-accent">{formatMoney(total)}</span>
            </div>
            {balance < total && (
              <div className="flex justify-between items-center mb-2">
                <span className="text-ink-2">Already paid</span>
                <span className="text-s-paid-text">{formatMoney(total - balance)}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-ink font-medium">Balance due</span>
              <span className="text-xl font-bold text-s-confirm-text">{formatMoney(Math.max(0, balance))}</span>
            </div>
          </div>
        </div>

        {tab.notes && (
          <div className="bg-accent-bg rounded-lg p-3 mb-6">
            <p className="text-accent-dark text-sm italic">&ldquo;{tab.notes}&rdquo;</p>
          </div>
        )}

        {tab.status === 'OPEN' && (
          <div className="bg-s-open-bg rounded-lg p-3">
            <p className="text-s-open-text text-sm">Still adding expenses — pay now or wait for the final total.</p>
          </div>
        )}
      </div>

      <PayForm tabToken={token} balance={balance} receiptUrls={receiptUrls} />
    </main>
  )
}
