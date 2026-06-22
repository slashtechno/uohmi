'use client'
import { useState } from 'react'
import { Modal } from './Modal'

export function RerollTokenButton({ action }: { action: () => Promise<void> }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-ink-3 hover:text-ink transition-colors px-2 py-1 rounded hover:bg-card"
        title="Invalidate current link and generate a new one"
      >
        ↺ reroll
      </button>
      {open && (
        <Modal
          title="Reroll payment link"
          message="The current link will stop working and the invoicee will be emailed the new one."
          confirmLabel="Reroll link"
          onConfirm={() => { setOpen(false); action() }}
          onCancel={() => setOpen(false)}
        />
      )}
    </>
  )
}
