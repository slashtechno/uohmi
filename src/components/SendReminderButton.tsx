'use client'
import { useState } from 'react'
import { Modal } from './Modal'

export function SendReminderButton({ action }: { action: () => Promise<void> }) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)

  async function handleConfirm() {
    setOpen(false)
    setPending(true)
    try {
      await action()
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() => setOpen(true)}
        className="flex-1 w-full py-3 px-4 bg-card border border-border text-ink font-medium rounded-lg hover:bg-card-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? 'Sending…' : 'Send reminder'}
      </button>
      {open && (
        <Modal
          title="Send reminder"
          message="Send a reminder email to the invoicee?"
          confirmLabel="Send reminder"
          onConfirm={handleConfirm}
          onCancel={() => setOpen(false)}
        />
      )}
    </>
  )
}
