import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { formatDate, formatTime, formatDistance, calcPacePerKm } from '../../utils/pace'
import LoadingSpinner from '../../components/LoadingSpinner'

const GROUP_COLORS = {
  G1: { bg: 'rgba(48,209,88,0.12)',  text: '#30D158' },
  G2: { bg: 'rgba(10,132,255,0.12)', text: '#0A84FF' },
  G3: { bg: 'rgba(255,214,10,0.12)', text: '#FFD60A' },
  G4: { bg: 'rgba(255,159,10,0.12)', text: '#FF9F0A' },
  G5: { bg: 'rgba(255,69,58,0.12)',  text: '#FF453A' },
  G6: { bg: 'rgba(191,90,242,0.12)', text: '#BF5AF2' },
}

const filterInputStyle = {
  background: 'var(--surface2)',
  border: '1px solid var(--border)',
  color: 'var(--text)',
  borderRadius: 10,
  padding: '8px 12px',
  fontSize: 13,
  outline: 'none',
}

export default function ResultsOverview() {
  const [results, setResults] = useState([])
  const [races, setRaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterRace, setFilterRace] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')

  useEffect(() => {
    async function load() {
      const [resRes, racesRes] = await Promise.all([
        supabase.from('results').select('*, athletes(name, group), races(name)').order('date', { ascending: false }),
        supabase.from('races').select('id, name').order('date', { ascending: false }),
      ])
      if (resRes.data) setResults(resRes.data)
      if (racesRes.data) setRaces(racesRes.data)
      setLoading(false)
    }
    load()
  }, [])

  const filtered = results.filter(r => {
    if (filterRace && r.race_id !== filterRace) return false
    if (filterFrom && r.date < filterFrom) return false
    if (filterTo && r.date > filterTo) return false
    return true
  })

  if (loading) return <LoadingSpinner />

  return (
    <div className="p-6" style={{ background: 'var(--dark)', minHeight: '100vh' }}>
      <div className="mb-6">
        <h2 className="text-2xl font-black" style={{ color: 'var(--text)' }}>Resultados</h2>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{filtered.length} resultados</p>
      </div>

      {/* Filters */}
      <div className="rounded-2xl p-4 mb-4 flex flex-wrap gap-3"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <select value={filterRace} onChange={e => setFilterRace(e.target.value)} style={filterInputStyle}
          onFocus={e => e.target.style.borderColor = 'var(--orange)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}>
          <option value="">Todas as corridas</option>
          {races.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} style={filterInputStyle}
            onFocus={e => e.target.style.borderColor = 'var(--orange)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>até</span>
          <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} style={filterInputStyle}
            onFocus={e => e.target.style.borderColor = 'var(--orange)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'} />
        </div>
        {(filterRace || filterFrom || filterTo) && (
          <button onClick={() => { setFilterRace(''); setFilterFrom(''); setFilterTo('') }}
            className="text-sm font-medium" style={{ color: 'var(--orange)' }}>
            Limpar filtros
          </button>
        )}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <table className="w-full text-sm">
          <thead style={{ borderBottom: '1px solid var(--border)' }}>
            <tr>
              <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Atleta</th>
              <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Data</th>
              <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider hidden md:table-cell" style={{ color: 'var(--text-muted)' }}>Corrida</th>
              <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Dist.</th>
              <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Tempo</th>
              <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wider hidden md:table-cell" style={{ color: 'var(--text-muted)' }}>Ritmo</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => {
              const pace = calcPacePerKm(r.time_seconds, r.distance_km)
              const grpClr = GROUP_COLORS[r.athletes?.group] || null
              return (
                <tr key={r.id} style={{ borderTop: '1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td className="px-4 py-3">
                    <p className="font-semibold" style={{ color: 'var(--text)' }}>{r.athletes?.name || '—'}</p>
                    {grpClr && (
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: grpClr.bg, color: grpClr.text }}>
                        {r.athletes?.group}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{formatDate(r.date)}</td>
                  <td className="px-4 py-3 hidden md:table-cell" style={{ color: 'var(--text-muted)' }}>
                    {r.races?.name || <span style={{ color: 'var(--surface3)' }}>—</span>}
                  </td>
                  <td className="px-4 py-3 text-right font-medium" style={{ color: 'var(--text)' }}>
                    {formatDistance(r.distance_km)} km
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="pace-mono font-bold" style={{ color: 'var(--orange)' }}>{formatTime(r.time_seconds)}</span>
                  </td>
                  <td className="px-4 py-3 text-right hidden md:table-cell">
                    {pace
                      ? <span className="pace-mono" style={{ color: 'var(--text-muted)' }}>{formatTime(Math.round(pace))}/km</span>
                      : <span style={{ color: 'var(--surface3)' }}>—</span>
                    }
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>
            Nenhum resultado encontrado.
          </div>
        )}
      </div>
    </div>
  )
}
