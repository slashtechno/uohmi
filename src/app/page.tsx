import { getTabs } from '@/lib/db'
import { getTabFull } from '@/lib/db'
import { StatusBadge } from '@/components/StatusBadge'
import { formatMoney, timeAgo } from '@/lib/utils'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const tabs = await getTabs()

  let totalOutstanding = 0
  for (const tab of tabs) {
    const full = await getTabFull(tab.id)
    if (full) totalOutstanding += full.balance
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 md:py-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-accent font-serif">uohmi</h1>
          <p className="text-ink-2 mt-1">
            {tabs.length === 0
              ? "No invoices yet. Either your friends are very generous, or you haven't started."
              : `Outstanding: ${formatMoney(totalOutstanding)}`}
          </p>
        </div>
        <Link
          href="/invoices/new"
          className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 bg-accent text-white font-medium rounded-lg hover:bg-accent-dark transition-colors"
        >
          New invoice
        </Link>
      </div>

      {tabs.length === 0 && (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <p className="text-ink-2 text-lg">Create your first invoice</p>
          <p className="text-ink-3 text-sm mt-2">Track who owes you what, slightly sarcastically.</p>
        </div>
      )}

      <div className="space-y-3">
        {tabs.map((tab) => (
          <InvoiceCard key={tab.id} tab={tab} />
        ))}
      </div>
    </main>
  )
}

async function InvoiceCard({ tab }: { tab: any }) {
  const full = await getTabFull(tab.id)
  if (!full) return null

  const { total, balance, hasUnconfirmed } = full

  return (
    <Link href={`/invoices/${tab.id}`}>
      <div className="bg-card border border-border rounded-xl p-4 md:p-6 hover:border-accent hover:shadow-sm transition-all cursor-pointer">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-ink truncate">{tab.recipientName}</h3>
              <StatusBadge status={tab.status} hasUnconfirmed={hasUnconfirmed} />
            </div>
            <p className="text-sm text-ink-2">
              {full.items.length} item{full.items.length !== 1 ? 's' : ''} · {timeAgo(tab.createdAt)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-ink">{formatMoney(total)}</p>
            {balance < total && (
              <p className="text-xs text-s-paid-text">{formatMoney(total - balance)} paid</p>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}