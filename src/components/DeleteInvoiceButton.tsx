'use client'

export function DeleteInvoiceButton({ action, isDraft }: { action: () => Promise<void>; isDraft: boolean }) {
  const label = isDraft ? 'Delete draft' : 'Delete invoice'
  const message = isDraft
    ? 'Delete this draft? This cannot be undone.'
    : 'Delete this invoice? The invoicee will be notified by email. This cannot be undone.'

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(message)) e.preventDefault()
      }}
    >
      <button
        type="submit"
        className="w-full py-3 px-4 border border-s-confirm-text text-s-confirm-text font-medium rounded-lg hover:bg-s-confirm-bg transition-colors"
      >
        {label}
      </button>
    </form>
  )
}
