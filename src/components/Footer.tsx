'use client'

import { useRouter } from 'next/navigation'

export function Footer() {
  const router = useRouter()

  const handleReload = () => {
    router.refresh()
  }

  return (
    <footer className="mt-16 border-t border-border">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm text-ink-2">
              made with <span className="text-accent">♥</span> and necessity
            </p>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/slashtechno/uohmi"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-accent hover:text-accent-dark transition-colors"
            >
              github
            </a>
            <button
              onClick={handleReload}
              className="text-sm px-3 py-1.5 rounded border border-border hover:border-accent hover:text-accent transition-colors"
            >
              reload
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
