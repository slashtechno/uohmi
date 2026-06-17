import type { TabStatus } from './db'

export function formatMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

export function statusBadge(status: TabStatus, hasUnconfirmed?: boolean) {
  const badges: Record<TabStatus, { bg: string; text: string; label: string }> = {
    DRAFT:    { bg: 'bg-s-draft-bg',    text: 'text-s-draft-text',    label: 'Draft' },
    OPEN:     { bg: 'bg-s-open-bg',     text: 'text-s-open-text',     label: 'Running tab' },
    CLOSED:   { bg: 'bg-s-closed-bg',   text: 'text-s-closed-text',   label: 'Awaiting payment' },
    PAID:     { bg: 'bg-s-paid-bg',     text: 'text-s-paid-text',     label: 'Paid ✓' },
    FORGIVEN: { bg: 'bg-s-forgiven-bg', text: 'text-s-forgiven-text', label: 'Forgiven (ugh)' },
  }
  const base = badges[status]
  if (hasUnconfirmed) {
    return { bg: 'bg-s-confirm-bg', text: 'text-s-confirm-text', label: 'Payment to confirm' }
  }
  return base
}

export function timeAgo(date: string): string {
  const now = Date.now()
  const then = new Date(date).getTime()
  const diff = now - then
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}