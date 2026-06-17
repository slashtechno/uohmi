import { getTabFull, updateTabStatus, addItem } from '@/lib/db'
import { confirmPaymentAndMaybeClose, addItemAndNotify } from '@/lib/tabs'
import { StatusBadge } from '@/components/StatusBadge'
import { StoredImage } from '@/components/StoredImage'
import { formatMoney, timeAgo } from '@/lib/utils'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const full = await getTabFull(id)
  if (!full) notFound()

  const { tab, items, payments, total, confirmedPaid, balance, hasUnconfirmed } = full

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 md:py-12">
      <Link href="/" className="text-accent hover:text-accent-dark text-sm mb-4 inline-block">
        ← Back to dashboard
      </Link>

      <div className="bg-card border border-border rounded-xl p-4 md:p-6 mb-6 animate-fade-in">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-ink font-serif">{tab.recipientName}</h1>
            <p className="text-ink-2 text-sm">{tab.recipientEmail}</p>
          </div>
          <StatusBadge status={tab.status} hasUnconfirmed={hasUnconfirmed} />
        </div>

        {tab.notes && (
          <div className="bg-accent-bg rounded-lg p-3 mb-4">
            <p className="text-accent-dark text-sm italic">"{tab.notes}"</p>
          </div>
        )}

        <div className="border-t border-border pt-4 mt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-ink-2">Total</span>
            <span className="text-lg font-bold text-accent">{formatMoney(total)}</span>
          </div>
          {confirmedPaid > 0 && (
            <div className="flex justify-between items-center mb-2">
              <span className="text-ink-2">Paid</span>
              <span className="text-s-paid-text">{formatMoney(confirmedPaid)}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-ink-2 font-medium">Balance</span>
            <span className={`text-xl font-bold ${balance > 0 ? 'text-s-confirm-text' : 'text-s-paid-text'}`}>
              {formatMoney(Math.max(0, balance))}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 md:p-6 mb-6">
        <h2 className="text-lg font-medium text-ink mb-4">Items ({items.length})</h2>
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between items-center py-2 border-b border-border last:border-0">
              <span className="text-ink">{item.description}</span>
              <span className="text-ink-2">{formatMoney(item.amountCents)}</span>
            </div>
          ))}
        </div>

        {tab.status === 'OPEN' && (
          <AddExpenseForm tabId={tab.id} />
        )}
      </div>

      {payments.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4 md:p-6 mb-6">
          <h2 className="text-lg font-medium text-ink mb-4">Payments ({payments.length})</h2>
          <div className="space-y-3">
            {payments.map((payment) => (
              <PaymentCard key={payment.id} payment={payment} tabId={tab.id} />
            ))}
          </div>
        </div>
      )}

      {tab.status !== 'PAID' && tab.status !== 'FORGIVEN' && (
        <div className="flex flex-col sm:flex-row gap-3">
          {tab.status === 'DRAFT' && (
            <>
              <form action={`/api/tabs/${tab.id}/finalize`} method="POST" className="flex-1">
                <button type="submit" className="w-full py-3 px-4 bg-accent text-white font-medium rounded-lg hover:bg-accent-dark transition-colors">
                  Finalize & send
                </button>
              </form>
            </>
          )}
          <form action={`/api/tabs/${tab.id}/forgive`} method="POST" className="flex-1">
            <button type="submit" className="w-full py-3 px-4 bg-s-forgiven-bg text-s-forgiven-text font-medium rounded-lg hover:bg-card-hover transition-colors">
              Forgive this one
            </button>
          </form>
        </div>
      )}

      {tab.status === 'PAID' && (
        <div className="text-center py-8">
          <p className="text-4xl mb-2">💸</p>
          <p className="text-s-paid-text text-lg font-medium">Paid in full</p>
          <p className="text-ink-2 text-sm mt-1">Well, color me shocked. Paid in full.</p>
        </div>
      )}

      {tab.status === 'FORGIVEN' && (
        <div className="text-center py-8">
          <p className="text-4xl mb-2">🙏</p>
          <p className="text-s-forgiven-text text-lg font-medium">Forgiven</p>
          <p className="text-ink-2 text-sm mt-1">You forgave this one. You're a saint. A financially irresponsible saint.</p>
        </div>
      )}
    </main>
  )
}

async function PaymentCard({ payment, tabId }: { payment: any; tabId: string }) {
  const methodLabels: Record<string, string> = {
    CASH: 'Cash',
    ZELLE: 'Zelle',
    OTHER: 'Other',
  }

  async function handleConfirm() {
    'use server'
    await confirmPaymentAndMaybeClose(payment.id, tabId)
  }

  return (
    <div className="border border-border rounded-lg p-3">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="font-medium text-ink">{formatMoney(payment.amountCents)}</p>
          <p className="text-sm text-ink-2">{methodLabels[payment.method] || payment.method}</p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full ${payment.confirmed ? 'bg-s-paid-bg text-s-paid-text' : 'bg-s-confirm-bg text-s-confirm-text'}`}>
          {payment.confirmed ? 'Confirmed' : 'Pending'}
        </span>
      </div>

      {payment.senderNote && (
        <p className="text-sm text-ink-2 italic mb-2">"{payment.senderNote}"</p>
      )}

      {payment.aiVerdict && (
        <div className="bg-card-hover rounded p-2 mb-2">
          <p className="text-xs text-ink-2">
            AI: {payment.aiVerdict} {payment.aiPassed ? '✓' : '✕'}
          </p>
        </div>
      )}

      {payment.screenshotFileKey && (
        <div className="mb-2">
          <StoredImage fileKey={payment.screenshotFileKey} alt="Payment screenshot" className="max-h-48" />
        </div>
      )}

      {!payment.confirmed && (
        <form action={handleConfirm}>
          <button type="submit" className="w-full py-2 px-3 bg-s-paid-bg text-s-paid-text text-sm font-medium rounded-lg hover:bg-s-paid-bg/80 transition-colors">
            Confirm payment
          </button>
        </form>
      )}
    </div>
  )
}

async function AddExpenseForm({ tabId }: { tabId: string }) {
  async function handleAdd(formData: FormData) {
    'use server'
    const description = formData.get('description') as string
    const amountCents = Math.round(parseFloat(formData.get('amountCents') as string) * 100)
    await addItemAndNotify(tabId, description, amountCents)
  }

  return (
    <form action={handleAdd} className="mt-4 pt-4 border-t border-border space-y-3">
      <h3 className="text-sm font-medium text-ink-2">Add expense</h3>
      <div className="flex gap-2">
        <input
          name="description"
          type="text"
          placeholder="What was this for?"
          required
          className="flex-1 px-3 py-2 border border-border rounded-lg bg-card text-ink placeholder-ink-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-bg transition-colors text-sm"
        />
        <input
          name="amountCents"
          type="number"
          step="0.01"
          min="0"
          placeholder="$0.00"
          required
          className="w-24 px-3 py-2 border border-border rounded-lg bg-card text-ink placeholder-ink-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-bg transition-colors text-sm text-right"
        />
        <button type="submit" className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent-dark transition-colors">
          Add
        </button>
      </div>
    </form>
  )
}