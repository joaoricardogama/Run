export default function LoadingSpinner({ message = 'A carregar...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-9 h-9 rounded-full border-2 animate-spin"
        style={{ borderColor: 'var(--surface3)', borderTopColor: 'var(--orange)' }} />
      <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{message}</span>
    </div>
  )
}
