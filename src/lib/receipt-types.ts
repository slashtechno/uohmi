// Single source of truth for which file types can be uploaded as receipts / staged for parsing.
export const ALLOWED_TYPES: Record<string, string> = {
  'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif', 'application/pdf': 'pdf',
}

export const MEDIA_TYPE_BY_EXT: Record<string, string> = Object.fromEntries(
  Object.entries(ALLOWED_TYPES).map(([type, ext]) => [ext, type])
)
