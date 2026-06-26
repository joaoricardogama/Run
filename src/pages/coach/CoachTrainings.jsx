import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import LoadingSpinner from '../../components/LoadingSpinner'
import { WorkoutDataPreview } from '../../components/WorkoutUpload'
import { ChevronDown, ChevronUp, Camera, Activity } from 'lucide-react'

const GROUP_COLORS = {
  G1: '#30D158', G2: '#0A84FF', G3: '#FFD60A',
  G4: '#FF9F0A', G5: '#FF453A', G6: '#BF5AF2',
}

const SOURCE_BADGE = {
  screenshot: { bg: 'rgba(10,132,255,0.15)',  text: '#0A84FF',    icon: '📷', label: 'Screenshot' },
  strava:     { bg: 'rgba(252,76,2,0.15)',    text: '#FC4C02',    icon: '🟠', label: 'Strava'      },
  manual:     { bg: 'rgba(255,255,255,0.07)', text: '#888',       icon: '✓',  label: 'Manual'      },
}

function formatDur(sec) {
  if (!sec) return null
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60)
  return h > 0 ? `${h}h${String(m).padStart(2,'0')}m` : `${m}min`
}

function toYMD(d) { return d.toISOString().split('T')[0] }

function getWeekStart(offset = 0) {
  const today = new Date()
  const dow = today.getDay()
  const mon = new Date(today)
  mon.setDate(today.getDate() - ((dow + 6) % 7) + offset * 7)
  mon.setHours(0,0,0,0)
  return mon
}

export default function CoachTrainings() {
  const [completions, setCompletions]   = useState([])
  const [loading, setLoading]           = useState(true)
  const [weekOffset, setWeekOffset]     = useState(0)
  const [filterGroup, setFilterGroup]   = useState('')
  const [filterSource, setFilterSource] = useState('')
  const [expanded, setExpanded]         = useState(null)  // id of expanded row

  const weekStart = getWeekStart(weekOffset)
  const weekEnd   = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6)
  const weekLabel = weekStart.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' })

  useEffect(() => {
    load()
  }, [weekOffset])

  async function load() {
    setLoading(true)
    const ws = toYMD(weekStart)
    const we = toYMD(weekEnd)
    const { data } = await supabase
      .from('training_completions')
      .select(`
        id, athlete_id, date, session_label, points, source,
        confirmed_by_strava, screenshot_url, ai_summary,
        distance_km, duration_sec, pace_avg, hr_avg, hr_max,
        cadence_avg, power_avg, elevation_m, laps, hr_zones, power_zones,
        athletes(id, name, group, avatar_url)
      `)
      .gte('date', ws).lte('date', we)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
    setCompletions(data || [])
    setLoading(false)
  }

  const filtered = completions.filter(c => {
    if (filterGroup && c.athletes?.group !== filterGroup) return false
    if (filterSource && (c.source || 'manual') !== filterSource) return false
    return true
  })

  // Group by date
  const byDate = {}
  filtered.forEach(c => {
    if (!byDate[c.date]) byDate[c.date] = []
    byDate[c.date].push(c)
  })
  const dates = Object.keys(byDate).sort().reverse()

  if (loading) return <LoadingSpinner />

  const screenshotCount = completions.filter(c => c.source === 'screenshot').length
  const totalKm = completions.reduce((s, c) => s + (c.distance_km || 0), 0)

  return (
    <div style={{ padding: '24px 24px', background: 'var(--dark)', minHeight: '100vh' }}>
      <style>{`
        @media (max-width: 768px) {
          .coach-trainings-header { flex-direction: column; gap: 12px; align-items: flex-start !important; }
          .coach-trainings-filters { flex-wrap: wrap; }
        }
      `}</style>

      {/* Header */}
      <div className="coach-trainings-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontWeight: 900, fontSize: 'clamp(20px,3vw,28px)', letterSpacing: '-0.04em', fontStyle: 'italic', color: 'var(--text)', marginBottom: 2 }}>
            TREINOS DA SEMANA
          </h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
            {weekLabel} · {filtered.length} registos · {totalKm.toFixed(1)} km total
          </p>
        </div>
        {/* Week nav */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setWeekOffset(w => w - 1)}
            style={{ padding: '8px 14px', borderRadius: 10, background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            ←
          </button>
          {weekOffset !== 0 && (
            <button onClick={() => setWeekOffset(0)}
              style={{ padding: '8px 12px', borderRadius: 10, background: 'rgba(184,255,0,0.08)', color: 'var(--heh-green)', border: '1px solid rgba(184,255,0,0.2)', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
              Esta semana
            </button>
          )}
          <button onClick={() => setWeekOffset(w => w + 1)}
            style={{ padding: '8px 14px', borderRadius: 10, background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            →
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px,1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'TOTAL REGISTOS', value: completions.length,            accent: false },
          { label: 'COM SCREENSHOT', value: screenshotCount,               accent: screenshotCount > 0 },
          { label: 'KM TOTAL',       value: `${totalKm.toFixed(1)} km`,    accent: false },
          { label: 'STRAVA',         value: completions.filter(c => c.confirmed_by_strava || c.source === 'strava').length, accent: false },
        ].map(({ label, value, accent }) => (
          <div key={label} style={{ background: accent ? 'rgba(184,255,0,0.08)' : 'var(--surface)', borderRadius: 14, padding: '14px 16px', border: accent ? '1px solid rgba(184,255,0,0.3)' : '1px solid var(--border)' }}>
            <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', color: accent ? 'var(--heh-green)' : 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>{label}</p>
            <p style={{ fontSize: 22, fontWeight: 900, color: accent ? 'var(--heh-green)' : 'var(--text)', letterSpacing: '-0.03em' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="coach-trainings-filters" style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <select value={filterGroup} onChange={e => setFilterGroup(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13, outline: 'none', cursor: 'pointer' }}>
          <option value="">Todos os grupos</option>
          {['G1','G2','G3','G4','G5','G6'].map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <select value={filterSource} onChange={e => setFilterSource(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13, outline: 'none', cursor: 'pointer' }}>
          <option value="">Todas as fontes</option>
          <option value="screenshot">Screenshot</option>
          <option value="strava">Strava</option>
          <option value="manual">Manual</option>
        </select>
        {(filterGroup || filterSource) && (
          <button onClick={() => { setFilterGroup(''); setFilterSource('') }}
            style={{ padding: '8px 12px', borderRadius: 10, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>
            Limpar
          </button>
        )}
      </div>

      {/* Completions by date */}
      {dates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', background: 'var(--surface)', borderRadius: 18, border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 14 }}>
          Sem treinos registados esta semana.
        </div>
      ) : dates.map(date => (
        <div key={date} style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>
            {new Date(date + 'T12:00').toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}
          </p>
          <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
            {byDate[date].map((c, i) => {
              const src = SOURCE_BADGE[c.source || 'manual'] || SOURCE_BADGE.manual
              const grp = c.athletes?.group
              const grpColor = GROUP_COLORS[grp] || '#888'
              const isExp = expanded === c.id
              const hasMetrics = c.source === 'screenshot' && (c.distance_km || c.hr_avg || c.laps?.length)

              return (
                <div key={c.id} style={{ borderBottom: i < byDate[date].length - 1 ? '1px solid var(--border)' : 'none' }}>
                  {/* Row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', cursor: hasMetrics ? 'pointer' : 'default' }}
                    onClick={() => hasMetrics && setExpanded(isExp ? null : c.id)}>

                    {/* Avatar */}
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: grpColor, flexShrink: 0, overflow: 'hidden' }}>
                      {c.athletes?.avatar_url
                        ? <img src={c.athletes.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : (c.athletes?.name || '?').slice(0,2).toUpperCase()}
                    </div>

                    {/* Name + group */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{c.athletes?.name || '—'}</p>
                        {grp && (
                          <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 6, background: grpColor + '22', color: grpColor }}>
                            {grp}
                          </span>
                        )}
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: src.bg, color: src.text }}>
                          {src.icon} {src.label}
                        </span>
                      </div>
                      {/* Quick metrics */}
                      <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
                        {c.distance_km && <span style={{ fontSize: 11, color: 'var(--heh-green)', fontWeight: 700 }}>{c.distance_km} km</span>}
                        {c.pace_avg && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>⏱ {c.pace_avg}</span>}
                        {c.hr_avg && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>♥ {c.hr_avg} bpm</span>}
                        {c.cadence_avg && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>↻ {c.cadence_avg} spm</span>}
                        {c.power_avg && <span style={{ fontSize: 11, color: '#FFD60A', fontWeight: 700 }}>⚡ {c.power_avg}W</span>}
                        {!c.distance_km && !c.hr_avg && (
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.ai_summary || c.session_label}</span>
                        )}
                      </div>
                    </div>

                    {/* Points */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 900, color: 'var(--heh-green)' }}>+{c.points}</p>
                      <p style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700 }}>PTS</p>
                    </div>

                    {/* Expand chevron */}
                    {hasMetrics && (
                      <div style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
                        {isExp ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    )}
                  </div>

                  {/* Expanded detail */}
                  {isExp && hasMetrics && (
                    <div style={{ padding: '0 18px 18px' }}>
                      <WorkoutDataPreview
                        data={{
                          source_app:   c.source === 'screenshot' ? 'Screenshot' : 'Strava',
                          workout_type: 'Run',
                          distance_km:  c.distance_km,
                          duration_sec: c.duration_sec,
                          pace_avg:     c.pace_avg,
                          hr_avg:       c.hr_avg,
                          hr_max:       c.hr_max,
                          cadence_avg:  c.cadence_avg,
                          power_avg:    c.power_avg,
                          elevation_m:  c.elevation_m,
                          laps:         c.laps,
                          hr_zones:     c.hr_zones,
                          power_zones:  c.power_zones,
                          ai_summary:   c.ai_summary,
                        }}
                        onConfirm={null}
                        onCancel={null}
                        loading={false}
                        readOnly
                      />
                      {c.screenshot_url && (
                        <a href={c.screenshot_url} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: 12, fontWeight: 700, color: '#0A84FF', textDecoration: 'none' }}>
                          <Camera size={14} /> Ver screenshot original
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
