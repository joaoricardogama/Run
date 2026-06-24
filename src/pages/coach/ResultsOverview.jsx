import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { formatDate, formatTime, formatDistance, calcPacePerKm } from '../../utils/pace'
import LoadingSpinner from '../../components/LoadingSpinner'

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
        supabase
          .from('results')
          .select('*, athletes(name, group), races(name)')
          .order('date', { ascending: false }),
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
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Resultados</h2>
        <p className="text-sm text-slate-500 mt-0.5">{filtered.length} resultados</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-4 flex flex-wrap gap-3">
        <select value={filterRace} onChange={e => setFilterRace(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#38bdf8]">
          <option value="">Todas as corridas</option>
          {races.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#38bdf8]" />
          <span className="text-slate-400 text-sm">até</span>
          <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#38bdf8]" />
        </div>
        {(filterRace || filterFrom || filterTo) && (
          <button onClick={() => { setFilterRace(''); setFilterFrom(''); setFilterTo('') }}
            className="text-sm text-[#38bdf8] hover:text-sky-600">
            Limpar filtros
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Atleta</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Data</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Corrida</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Dist.</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Tempo</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Ritmo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map(r => {
              const pace = calcPacePerKm(r.time_seconds, r.distance_km)
              return (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{r.athletes?.name || '—'}</p>
                    <p className="text-xs text-slate-500">{r.athletes?.group || ''}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(r.date)}</td>
                  <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
                    {r.races?.name || <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700 font-medium">
                    {formatDistance(r.distance_km)} km
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="pace-mono font-bold text-slate-800">{formatTime(r.time_seconds)}</span>
                  </td>
                  <td className="px-4 py-3 text-right hidden md:table-cell">
                    {pace
                      ? <span className="pace-mono text-slate-600">{formatTime(Math.round(pace))}/km</span>
                      : '—'
                    }
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-sm">Nenhum resultado encontrado.</div>
        )}
      </div>
    </div>
  )
}
