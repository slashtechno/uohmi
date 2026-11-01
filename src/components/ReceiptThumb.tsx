'use client'

import { useState } from 'react'

export const isPdfKey = (key: string) => key.toLowerCase().endsWith('.pdf')

interface ReceiptThumbProps {
  fileKey: string
  url: string
  /** Optional local preview (blob URL) shown instead of `url`, e.g. right after upload. */
  previewUrl?: string
  sizeClass: string
  onOpen: () => void
}

/** Image thumbnail (opens lightbox) or PDF tile (opens in a new tab). Retries a failed image once. */
export function ReceiptThumb({ fileKey, url, previewUrl, sizeClass, onOpen }: ReceiptThumbProps) {
  const [retried, setRetried] = useState(false)
  const base = `${sizeClass} rounded-lg border border-border hover:opacity-90 transition-opacity`

  if (isPdfKey(fileKey)) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`${base} flex flex-col items-center justify-center bg-card-hover text-ink-2 text-xs font-medium`}
        aria-label="Open PDF receipt"
      >
        <span className="text-lg leading-none mb-0.5">📄</span>PDF
      </a>
    )
  }

  const src = previewUrl ?? (retried ? `${url}?r=1` : url)
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Receipt"
      onClick={onOpen}
      onError={() => { if (!previewUrl && !retried) setTimeout(() => setRetried(true), 1500) }}
      className={`${base} object-cover cursor-zoom-in`}
    />
  )
}
