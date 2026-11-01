// Client-side helper: presign → PUT straight to storage → roll back the recorded key if the PUT fails.
// The presign route records the key before the upload, so a failed PUT must DELETE it again.
export async function uploadReceipt(tabId: string, file: File): Promise<{ key: string; url: string }> {
  const presignRes = await fetch(`/api/invoices/${tabId}/receipts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mediaType: file.type }),
  })
  if (presignRes.status === 415) throw new Error('Unsupported file type.')
  if (!presignRes.ok) throw new Error('Failed to start upload.')
  const { key, uploadUrl } = await presignRes.json()

  const putRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  })
  if (!putRes.ok) {
    await fetch(`/api/invoices/${tabId}/receipts`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    }).catch(() => {})
    throw new Error('Upload failed.')
  }

  return { key, url: `/api/files/${key.split('/').map(encodeURIComponent).join('/')}` }
}
