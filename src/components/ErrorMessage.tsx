export function ErrorMessage({ message }: { message: string }) {
  if (!message) return null
  return (
    <p className="text-sm text-s-confirm-text bg-s-confirm-bg p-3 rounded-lg" role="alert">
      {message}
    </p>
  )
}
