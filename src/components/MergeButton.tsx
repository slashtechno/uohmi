'use client'
import { useState, useRef } from 'react'
import { Modal } from './Modal'

interface MergeTarget {
  id: string
  label: string
}

interface MergeButtonProps {
  targets: MergeTarget[]
  action: (targetId: string) => Promise<void>
}

export function MergeButton({ targets, action }: MergeButtonProps) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const selectRef = useRef<HTMLSelectElement>(null)

  async function handleConfirm() {
    const targetId = selectRef.current?.value
    if (!targetId) return
    setOpen(false)
    setPending(true)
    try {
      await action(targetId)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex gap-2">
      <select
        ref={selectRef}
        className="flex-1 px-3 py-2 text-sm bg-card border border-border rounded-lg text-ink focus:outline-none focus:border-accent"
      >
        {targets.map(t => (
          <option key={t.id} value={t.id}>{t.label}</option>
        ))}
      </select>
      <button
        type="button"
        disabled={pending}
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-card border border-border text-ink text-sm font-medium rounded-lg hover:bg-card-hover transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? 'Merging…' : 'Merge →'}
      </button>
      {open && (
        <Modal
          title="Merge invoice"
          message="This invoice's items and payments will move to the selected invoice, then this one will be deleted. The invoicee will be notified."
          confirmLabel="Merge"
          onConfirm={handleConfirm}
          onCancel={() => setOpen(false)}
        />
      )}
    </div>
  )
}
