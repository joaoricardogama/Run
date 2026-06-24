import { formatTime } from '../utils/pace'

const TYPE_CONFIG = {
  CCL:      { label: 'CCL',     border: 'border-l-green-500',  bg: 'bg-green-50',  text: 'text-green-700',  badge: 'bg-green-100 text-green-800' },
  CCN:      { label: 'CCN',     border: 'border-l-yellow-500', bg: 'bg-yellow-50', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-800' },
  CCR:      { label: 'CCR',     border: 'border-l-red-500',    bg: 'bg-red-50',    text: 'text-red-700',    badge: 'bg-red-100 text-red-800' },
  Pista:    { label: 'Pista',   border: 'border-l-purple-500', bg: 'bg-purple-50', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-800' },
  Descanso: { label: 'Desc.',   border: 'border-l-slate-300',  bg: 'bg-slate-50',  text: 'text-slate-500',  badge: 'bg-slate-100 text-slate-600' },
}

export default function SessionCard({ session, day }) {
  if (!session) return null
  const cfg = TYPE_CONFIG[session.type] || TYPE_CONFIG['Descanso']

  return (
    <div className={`rounded-lg bg-white border-l-4 ${cfg.border} shadow-sm p-3 mb-2`}>
      <div className="flex items-center justify-between mb-1">
        {day && <span className="text-xs font-semibold text-slate-500 uppercase">{day}</span>}
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>
          {cfg.label}
        </span>
      </div>

      <p className={`text-sm font-medium ${cfg.text}`}>{session.description}</p>

      {session.distance && (
        <p className="text-xs text-slate-500 mt-0.5">{session.distance} km</p>
      )}

      {session.pace && (
        <p className="pace-mono text-xs text-slate-600 mt-1">
          Ritmo: <span className="font-semibold">{session.pace}</span>
        </p>
      )}

      {session.notes && (
        <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1 mt-1">{session.notes}</p>
      )}

      {session.strength && (
        <div className="mt-2 pt-2 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-700">{session.strength}</p>
          {session.strengthNotes && (
            <p className="text-xs text-amber-700 mt-0.5">{session.strengthNotes}</p>
          )}
        </div>
      )}
    </div>
  )
}
