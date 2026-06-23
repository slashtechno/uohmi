'use client'
import { useState } from 'react'
import { Modal } from './Modal'

interface ConfirmButtonProps {
  label: string
  pendingLabel?: string
  modalTitle: string
  modalMessage: string
  confirmLabel?: string
  danger?: boolean
  className?: string
  action: () => Promise<void>
}

export function ConfirmButton({
  label,
  pendingLabel,
  modalTitle,
  modalMessage,
  confirmLabel,
  danger = false,
  className,
  action,
}: ConfirmButtonProps) {
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
        className={`${className ?? ''} disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {pending ? (pendingLabel ?? `${label}…`) : label}
      </button>
      {open && (
        <Modal
          title={modalTitle}
          message={modalMessage}
          confirmLabel={confirmLabel ?? label}
          danger={danger}
          onConfirm={handleConfirm}
          onCancel={() => setOpen(false)}
        />
      )}
    </>
  )
}
