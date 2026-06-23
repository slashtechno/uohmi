'use client'
import { useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { toast } from 'sonner'

export function ToastHandler() {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const message = params.get('toast')
    const kind = params.get('toastKind') ?? 'success'
    if (!message) return

    if (kind === 'error') toast.error(message)
    else if (kind === 'warning') toast.warning(message)
    else toast.success(message)

    const next = new URLSearchParams(params.toString())
    next.delete('toast')
    next.delete('toastKind')
    const qs = next.toString()
    router.replace(pathname + (qs ? `?${qs}` : ''))
  }, [params, router, pathname])

  return null
}
