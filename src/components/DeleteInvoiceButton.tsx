'use client'
import { useState } from 'react'
import { Modal } from './Modal'

export function DeleteInvoiceButton({ action }: { action: () => Promise<void> }) {
  const [open, setOpen] = useState(false)
  const label = 'Delete invoice'
  const message = 'Delete this invoice? The invoicee will be notified by email. This cannot be undone.'

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full py-3 px-4 border border-s-confirm-text text-s-confirm-text font-medium rounded-lg hover:bg-s-confirm-bg transition-colors"
      >
        {label}
      </button>
      {open && (
        <Modal
          title={label}
          message={message}
          confirmLabel={label}
          danger
          onConfirm={() => { setOpen(false); action() }}
          onCancel={() => setOpen(false)}
        />
      )}
    </>
  )
}
