const TYPE_CONFIG = {
  CCL:      { label: 'CCL',   color: 'var(--ccl)',   bg: 'rgba(48,209,88,0.08)',   text: '#30D158' },
  CCN:      { label: 'CCN',   color: 'var(--ccn)',   bg: 'rgba(255,214,10,0.08)',  text: '#FFD60A' },
  CCR:      { label: 'CCR',   color: 'var(--ccr)',   bg: 'rgba(255,69,58,0.08)',   text: '#FF453A' },
  Pista:    { label: 'Pista', color: 'var(--track)', bg: 'rgba(191,90,242,0.08)', text: '#BF5AF2' },
  Descanso: { label: 'Off',   color: 'var(--rest)',  bg: 'rgba(72,72,74,0.3)',    text: '#8E8E93' },
}

export default function SessionCard({ session, day }) {
  if (!session) return null
  const cfg = TYPE_CONFIG[session.type] || TYPE_CONFIG['Descanso']

  return (
    <div className="rounded-xl mb-2 overflow-hidden"
      style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
      <div className="flex items-stretch">
        {/* Color bar */}
        <div className="w-1 flex-shrink-0" style={{ background: cfg.color }} />

        <div className="flex-1 p-3">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              {day && (
                <span className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: 'var(--text-muted)' }}>{day}</span>
              )}
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: cfg.bg, color: cfg.text }}>
                {cfg.label}
              </span>
            </div>
            {session.distance && (
              <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
                {session.distance} km
              </span>
            )}
          </div>

          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
            {session.description}
          </p>

          {session.pace && (
            <p className="pace-mono text-xs mt-1.5 font-medium" style={{ color: cfg.text }}>
              {session.pace}
            </p>
          )}

          {session.notes && (
            <p className="text-xs mt-2 px-2 py-1.5 rounded-lg"
              style={{ background: 'rgba(255,214,10,0.1)', color: '#FFD60A' }}>
              ⚠ {session.notes}
            </p>
          )}

          {session.strength && (
            <div className="mt-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                💪 {session.strength}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
