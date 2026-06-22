'use client'
import { useState } from 'react'
import { Modal } from './Modal'

export function DeleteInvoiceButton({ action, isDraft }: { action: () => Promise<void>; isDraft: boolean }) {
  const [open, setOpen] = useState(false)
  const label = isDraft ? 'Delete draft' : 'Delete invoice'
  const message = isDraft
    ? 'Delete this draft? This cannot be undone.'
    : 'Delete this invoice? The invoicee will be notified by email. This cannot be undone.'

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
