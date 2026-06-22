'use client'

import { useFormStatus } from 'react-dom'

function Inner() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => { if (!window.confirm('Send a reminder email?')) e.preventDefault() }}
      className="w-full py-3 px-4 bg-card border border-border text-ink font-medium rounded-lg hover:bg-card-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? 'Sending…' : 'Send reminder'}
    </button>
  )
}

export function SendReminderButton({ action }: { action: () => Promise<void> }) {
  return (
    <form action={action} className="flex-1">
      <Inner />
    </form>
  )
}
