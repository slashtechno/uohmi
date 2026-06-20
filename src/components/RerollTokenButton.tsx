'use client'

export function RerollTokenButton({ action }: { action: () => Promise<void> }) {
  return (
    <form action={action} onSubmit={e => {
      if (!confirm('Reroll the payment link? The current link will stop working and the invoicee will be emailed the new one.')) {
        e.preventDefault()
      }
    }}>
      <button type="submit" className="text-xs text-ink-3 hover:text-ink transition-colors px-2 py-1 rounded hover:bg-card" title="Invalidate current link and generate a new one">
        ↺ reroll
      </button>
    </form>
  )
}
