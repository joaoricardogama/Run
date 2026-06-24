export default function LoadingSpinner({ message = 'A carregar...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-[#38bdf8] rounded-full animate-spin mb-3" />
      <span className="text-sm">{message}</span>
    </div>
  )
}
