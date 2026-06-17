import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="max-w-md mx-auto px-4 py-16 md:py-24">
      <div className="text-center">
        <p className="text-4xl mb-4">🤷</p>
        <h1 className="text-2xl font-bold text-ink font-serif mb-2">Not found</h1>
        <p className="text-ink-2 mb-6">This invoice doesn't exist. Either it was paid, forgiven, or you're lost.</p>
        <Link href="/" className="text-accent hover:text-accent-dark underline">
          Back to dashboard
        </Link>
      </div>
    </main>
  )
}