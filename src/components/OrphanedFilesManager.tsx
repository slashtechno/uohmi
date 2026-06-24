'use client'

import { useState } from 'react'
import { toast } from 'sonner'

interface Props {
  initialOrphans: string[]
}

function shortKey(key: string) {
  // receipts/tabid-nanoid.ext → nanoid.ext
  return key.replace(/^receipts\//, '')
}

export function OrphanedFilesManager({ initialOrphans }: Props) {
  const [orphans, setOrphans] = useState(initialOrphans)
  const [deleting, setDeleting] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  async function refresh() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/storage')
      if (!res.ok) throw new Error('Failed to load')
      const { orphans: fresh } = await res.json()
      setOrphans(fresh)
      toast.success(`Found ${fresh.length} orphaned file${fresh.length !== 1 ? 's' : ''}`)
    } catch {
      toast.error('Could not fetch orphaned files')
    } finally {
      setLoading(false)
    }
  }

  async function deleteOne(key: string) {
    setDeleting(prev => new Set(prev).add(key))
    try {
      const res = await fetch('/api/admin/storage', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      })
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: 'Delete failed' }))
        throw new Error(error)
      }
      setOrphans(prev => prev.filter(k => k !== key))
      toast.success('Deleted')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed')
    } finally {
      setDeleting(prev => { const s = new Set(prev); s.delete(key); return s })
    }
  }

  async function deleteAll() {
    const toDelete = [...orphans]
    for (const key of toDelete) await deleteOne(key)
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4 md:p-6 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-ink-2">Orphaned receipt files</h2>
        <div className="flex gap-2">
          <button
            onClick={refresh}
            disabled={loading}
            className="text-xs px-2 py-1 bg-card border border-border text-ink-2 rounded-lg hover:bg-card-hover transition-colors disabled:opacity-50"
          >
            {loading ? 'Checking…' : 'Refresh'}
          </button>
          {orphans.length > 1 && (
            <button
              onClick={deleteAll}
              className="text-xs px-2 py-1 bg-s-confirm-bg text-s-confirm-text rounded-lg hover:opacity-80 transition-colors"
            >
              Delete all ({orphans.length})
            </button>
          )}
        </div>
      </div>

      {orphans.length === 0 ? (
        <p className="text-sm text-ink-3">No orphaned files found.</p>
      ) : (
        <ul className="space-y-2">
          {orphans.map(key => (
            <li key={key} className="flex items-center justify-between gap-2 text-sm">
              <span className="font-mono text-ink-2 text-xs truncate">{shortKey(key)}</span>
              <button
                onClick={() => deleteOne(key)}
                disabled={deleting.has(key)}
                className="shrink-0 text-xs px-2 py-1 bg-s-confirm-bg text-s-confirm-text rounded-lg hover:opacity-80 transition-colors disabled:opacity-50"
              >
                {deleting.has(key) ? 'Deleting…' : 'Delete'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
