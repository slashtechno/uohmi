import { getTabFull, updateTabStatus, updateTab, deleteItem, deleteTabCascade } from '@/lib/db'
import { appUrl } from '@/lib/url'
import { confirmPaymentAndMaybeClose, sendReminder, finalizeTab } from '@/lib/tabs'
import { sendTabEmail } from '@/lib/email'
import { AddExpenseForm } from '@/components/AddExpenseForm'
import { redirect } from 'next/navigation'
import { StatusBadge } from '@/components/StatusBadge'
import { CopyButton } from '@/components/CopyButton'
import { DeleteInvoiceButton } from '@/components/DeleteInvoiceButton'
import { formatMoney, timeAgo } from '@/lib/utils'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const full = await getTabFull(id)
  if (!full) notFound()

  const { tab, items, payments, total, confirmedPaid, balance, hasUnconfirmed } = full

  const canEditItems = tab.status === 'DRAFT' || (tab.status === 'OPEN' && payments.length === 0)

  async function handleDeleteItem(itemId: string) {
    'use server'
    const current = await getTabFull(tab.id)
    if (!current) return
    const itemBelongsHere = current.items.some(i => i.id === itemId)
    const stillEditable = current.tab.status === 'DRAFT' || (current.tab.status === 'OPEN' && current.payments.length === 0)
    if (!itemBelongsHere || !stillEditable) return
    await deleteItem(itemId)
    redirect(`/invoices/${tab.id}`)
  }

  async function handleDeleteTab() {
    'use server'
    const current = await getTabFull(tab.id)
    if (!current || current.tab.status === 'FORGIVEN') return
    const { tab: t, items, total, balance } = current
    if (t.status !== 'DRAFT' && t.recipientEmail) {
      await sendTabEmail({ kind: 'cancelled', tab: t, items, total, balance })
    }
    await deleteTabCascade(tab.id)
    redirect('/')
  }

  async function handleEditDetails(formData: FormData) {
    'use server'
    const current = await getTabFull(tab.id)
    if (!current || !['DRAFT', 'OPEN'].includes(current.tab.status)) return
    await updateTab(tab.id, {
      recipientName: formData.get('recipientName') as string,
      recipientEmail: formData.get('recipientEmail') as string,
      notes: formData.get('notes') as string,
    })
    redirect(`/invoices/${tab.id}`)
  }

  async function handleSendReminder() {
    'use server'
    const current = await getTabFull(tab.id)
    if (!current || !['OPEN', 'CLOSED'].includes(current.tab.status)) return
    await sendReminder(tab.id)
    redirect(`/invoices/${tab.id}`)
  }

  async function handleFinalize() {
    'use server'
    const current = await getTabFull(tab.id)
    if (!current || current.tab.status !== 'DRAFT') return
    await finalizeTab(tab.id)
    redirect(`/invoices/${tab.id}`)
  }

  async function handleForgive() {
    'use server'
    const current = await getTabFull(tab.id)
    if (!current || ['PAID', 'FORGIVEN'].includes(current.tab.status)) return
    await updateTabStatus(tab.id, 'FORGIVEN')
    redirect(`/invoices/${tab.id}`)
  }

  const payUrl = `${appUrl()}/pay/${tab.token}`
  const canEdit = tab.status === 'DRAFT' || tab.status === 'OPEN'
  const canRemind = tab.status === 'OPEN' || tab.status === 'CLOSED'

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

        {tab.status !== 'DRAFT' && (
          <div className="flex items-center gap-2 mb-4 p-2 bg-card-hover rounded-lg">
            <span className="text-xs text-ink-3 truncate flex-1 font-mono">{payUrl}</span>
            <CopyButton text={payUrl} />
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
            <div key={item.id} className="flex justify-between items-center py-2 border-b border-border last:border-0 group">
              <span className="text-ink">{item.description}</span>
              <div className="flex items-center gap-3">
                <span className="text-ink-2">{formatMoney(item.amountCents)}</span>
                {canEditItems && (
                  <form action={handleDeleteItem.bind(null, item.id)}>
                    <button type="submit" className="text-ink-3 hover:text-s-confirm-text transition-colors opacity-0 group-hover:opacity-100" aria-label="Delete item">
                      ✕
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>

        {tab.status === 'OPEN' && <AddExpenseForm tabId={tab.id} />}
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

      {canEdit && (
        <div className="bg-card border border-border rounded-xl p-4 md:p-6 mb-6">
          <h2 className="text-sm font-medium text-ink-2 mb-3">Edit details</h2>
          <form action={handleEditDetails} className="space-y-3">
            <div className="flex gap-2">
              <input name="recipientName" defaultValue={tab.recipientName} placeholder="Name" required
                className="flex-1 px-3 py-2 border border-border rounded-lg bg-card text-ink placeholder-ink-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-bg transition-colors text-sm" />
              <input name="recipientEmail" type="email" defaultValue={tab.recipientEmail} placeholder="Email" required
                className="flex-1 px-3 py-2 border border-border rounded-lg bg-card text-ink placeholder-ink-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-bg transition-colors text-sm" />
            </div>
            <input name="notes" defaultValue={tab.notes ?? ''} placeholder="Note (optional)"
              className="w-full px-3 py-2 border border-border rounded-lg bg-card text-ink placeholder-ink-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-bg transition-colors text-sm" />
            <button type="submit" className="px-4 py-2 bg-card border border-border text-ink text-sm font-medium rounded-lg hover:bg-card-hover transition-colors">
              Save
            </button>
          </form>
        </div>
      )}

      {tab.status !== 'FORGIVEN' && (
        <div className="flex flex-col sm:flex-row gap-3">
          {tab.status === 'DRAFT' && (
            <form action={handleFinalize} className="flex-1">
              <button type="submit" className="w-full py-3 px-4 bg-accent text-white font-medium rounded-lg hover:bg-accent-dark transition-colors">
                Finalize & send
              </button>
            </form>
          )}
          {canRemind && (
            <form action={handleSendReminder} className="flex-1">
              <button type="submit" className="w-full py-3 px-4 bg-card border border-border text-ink font-medium rounded-lg hover:bg-card-hover transition-colors">
                Send reminder
              </button>
            </form>
          )}
          {tab.status !== 'PAID' && (
            <form action={handleForgive} className="flex-1">
              <button type="submit" className="w-full py-3 px-4 bg-s-forgiven-bg text-s-forgiven-text font-medium rounded-lg hover:bg-card-hover transition-colors">
                Forgive this one
              </button>
            </form>
          )}
          <DeleteInvoiceButton action={handleDeleteTab} isDraft={tab.status === 'DRAFT'} />
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
    redirect(`/invoices/${tabId}`)
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

