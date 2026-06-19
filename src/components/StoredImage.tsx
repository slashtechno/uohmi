import { getFileUrl } from '@/lib/db'

export async function StoredImage({ fileKey, alt, className = '' }: { fileKey: string; alt: string; className?: string }) {
  if (!fileKey) return null
  const url = await getFileUrl(fileKey)
  if (!url) return (
    <div className={`rounded-lg border border-dashed border-stone-300 p-4 text-center text-sm text-stone-400 ${className}`}>
      Image unavailable
    </div>
  )
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} className={`rounded-lg max-w-full ${className}`} />
}