// Browser-only: downscale an image for AI parsing so the request stays well under Vercel's 4.5 MB
// body limit. Vision models downscale internally anyway, so this costs no accuracy. Only the copy
// sent for parsing is shrunk; attachments keep the original. Falls back to the original file
// when the browser can't decode it (e.g. HEIC outside Safari) or when it's not an image.
const MAX_EDGE = 2000

export async function shrinkForParsing(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
    if (scale === 1 && file.size < 1_000_000) { bitmap.close(); return file }
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) { bitmap.close(); return file }
    ctx.fillStyle = '#fff' // JPEG has no alpha; keep transparent PNGs readable
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', 0.85))
    if (!blob || blob.size >= file.size) return file
    return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' })
  } catch {
    return file
  }
}
