import { statusBadge } from '@/lib/utils'
import type { TabStatus } from '@/lib/db'

export function StatusBadge({ status, hasUnconfirmed }: { status: TabStatus; hasUnconfirmed?: boolean }) {
  const { bg, text, label } = statusBadge(status, hasUnconfirmed)
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
      {label}
    </span>
  )
}