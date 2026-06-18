'use client'
import { useState } from 'react'

export function CopyButton({ text, label = 'Copy link' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copy}
      className="text-xs text-accent hover:text-accent-dark font-medium transition-colors"
    >
      {copied ? 'Copied!' : label}
    </button>
  )
}
