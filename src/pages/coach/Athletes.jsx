import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { formatTime, parseTime, formatDate } from '../../utils/pace'
import { Plus, X, Edit2, MapPin, Tag } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'
import { assignGroup } from '../../utils/groupAssignment'

const GROUPS = ['G1', 'G2', 'G3', 'G4', 'G5', 'G6']

const GROUP_COLORS = {
  G1: { bg: 'rgba(48,209,88,0.12)',  text: '#30D158' },
  G2: { bg: 'rgba(10,132,255,0.12)', text: '#0A84FF' },
  G3: { bg: 'rgba(255,214,10,0.12)', text: '#FFD60A' },
  G4: { bg: 'rgba(255,159,10,0.12)', text: '#FF9F0A' },
  G5: { bg: 'rgba(255,69,58,0.12)',  text: '#FF453A' },
  G6: { bg: 'rgba(191,90,242,0.12)', text: '#BF5AF2' },
}

const inputStyle = {
  background: 'var(--surface2)',
  border: '1px solid var(--border)',
  color: 'var(--text)',
  borderRadius: 10,
  padding: '10px 14px',
  fontSize: 13,
  width: '100%',
  outline: 'none',
}
const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
  letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 5,
}

function AthleteModal({ athlete, onClose, onSaved }) {
  const isNew = !athlete
  const [form, setForm] = useState({
    name: athlete?.name || '', email: athlete?.email || '', group: athlete?.group || 'G1',
    pr_5km: athlete?.pr_5km ? formatTime(athlete.pr_5km) : '',
    pr_10km: athlete?.pr_10km ? formatTime(athlete.pr_10km) : '',
    strava_url: athlete?.strava_url || '', notes: athlete?.notes || '', active: athlete?.active ?? true,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(field, value) { setForm(prev => ({ ...prev, [field]: value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const pr5 = form.pr_5km ? parseTime(form.pr_5km) : null
    const pr10 = form.pr_10km ? parseTime(form.pr_10km) : null
    if (form.pr_5km && !pr5) { setError('PR 5km inválido (MM:SS)'); setSaving(false); return }
    if (form.pr_10km && !pr10) { setError('PR 10km inválido (MM:SS)'); setSaving(false); return }
    const payload = { name: form.name, email: form.email, group: form.group, pr_5km: pr5, pr_10km: pr10, strava_url: form.strava_url || null, notes: form.notes || null, active: form.active }
    const result = isNew
      ? await supabase.from('athletes').insert(payload).select().single()
      : await supabase.from('athletes').update(payload).eq('id', athlete.id).select().single()
    if (result.error) { setError('Erro: ' + result.error.message) }
    else { onSaved(result.data); onClose() }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-lg overflow-y-auto max-h-[90vh] rounded-2xl shadow-2xl"
        style={{ background: 'var(--surface)' }}>
        <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <h3 className="font-black" style={{ color: 'var(--text)' }}>{isNew ? 'Adicionar Atleta' : 'Editar Atleta'}</h3>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label style={labelStyle}>Nome</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} required style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--orange)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} required style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--orange)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>
            <div>
              <label style={labelStyle}>Grupo</label>
              <select value={form.group} onChange={e => set('group', e.target.value)} style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--orange)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}>
                {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>PR 5km (MM:SS)</label>
              <input value={form.pr_5km} onChange={e => set('pr_5km', e.target.value)} placeholder="22:30"
                className="pace-mono" style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--orange)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>
            <div>
              <label style={labelStyle}>PR 10km (MM:SS)</label>
              <input value={form.pr_10km} onChange={e => set('pr_10km', e.target.value)} placeholder="48:00"
                className="pace-mono" style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--orange)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Strava URL</label>
            <input type="url" value={form.strava_url} onChange={e => set('strava_url', e.target.value)} style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--orange)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </div>
          <div>
            <label style={labelStyle}>Notas / Lesões</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
              style={{ ...inputStyle, resize: 'none' }}
              onFocus={e => e.target.style.borderColor = 'var(--orange)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} />
            <span className="text-sm" style={{ color: 'var(--text)' }}>Atleta ativo</span>
          </label>
          {error && (
            <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(255,69,58,0.12)', color: '#FF453A' }}>{error}</div>
          )}
          <button type="submit" disabled={saving}
            className="w-full py-3.5 rounded-xl text-sm font-bold disabled:opacity-50"
            style={{ background: 'var(--orange)', color: 'white' }}>
            {saving ? 'A guardar...' : 'Guardar'}
          </button>
        </form>
      </div>
    </div>
  )
}

function AthleteDetail({ athlete, onClose, onUpdated }) {
  const [results, setResults] = useState([])
  const [plan, setPlan] = useState(null)
  const [showEdit, setShowEdit] = useState(false)
  const grpClr = GROUP_COLORS[athlete.group] || GROUP_COLORS.G1

  useEffect(() => {
    async function load() {
      const [resRes, planRes] = await Promise.all([
        supabase.from('results').select('*, races(name)').eq('athlete_id', athlete.id).order('date', { ascending: false }).limit(10),
        supabase.from('individual_plans').select('*').eq('athlete_id', athlete.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ])
      if (resRes.data) setResults(resRes.data)
      if (planRes.data) setPlan(planRes.data)
    }
    load()
  }, [athlete.id])

  async function createPlan(objective) {
    const { data, error } = await supabase.from('individual_plans')
      .insert({ athlete_id: athlete.id, objective, weeks: 3, content: {} })
      .select().single()
    if (!error && data) setPlan(data)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-2xl rounded-2xl overflow-y-auto max-h-[90vh] shadow-2xl"
        style={{ background: 'var(--surface)' }}>
        <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black"
              style={{ background: grpClr.bg, color: grpClr.text }}>
              {athlete.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <h3 className="font-black" style={{ color: 'var(--text)' }}>{athlete.name}</h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{athlete.email} · {athlete.group}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowEdit(true)} style={{ color: 'var(--text-muted)' }}><Edit2 size={18} /></button>
            <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Info row */}
          <div className="flex flex-wrap gap-2">
            {athlete.sex && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: 'var(--surface2)', color: 'var(--text-muted)' }}>
                {athlete.sex === 'M' ? 'Masculino' : 'Feminino'}
              </span>
            )}
            {athlete.location && (
              <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: 'var(--surface2)', color: 'var(--text-muted)' }}>
                <MapPin size={11} /> {athlete.location}
              </span>
            )}
            {athlete.nationality && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: 'var(--surface2)', color: 'var(--text-muted)' }}>
                {athlete.nationality}
              </span>
            )}
            {(athlete.modalities || []).map(m => (
              <span key={m} className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(252,76,2,0.1)', color: 'var(--orange)' }}>{m}</span>
            ))}
          </div>

          {(athlete.specializations || []).length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {athlete.specializations.map(s => (
                <span key={s} className="text-xs px-2 py-0.5 rounded-lg"
                  style={{ background: 'var(--surface2)', color: 'var(--text-muted)' }}>{s}</span>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {[{ label: 'PR 5km', val: athlete.pr_5km }, { label: 'PR 10km', val: athlete.pr_10km }].map(({ label, val }) => (
              <div key={label} className="rounded-xl p-3 text-center" style={{ background: 'var(--surface2)' }}>
                <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
                <p className="pace-mono font-bold" style={{ color: 'var(--text)' }}>{val ? formatTime(val) : '—'}</p>
              </div>
            ))}
          </div>

          {athlete.notes && (
            <div className="rounded-xl p-3 text-sm"
              style={{ background: 'rgba(255,214,10,0.08)', border: '1px solid rgba(255,214,10,0.2)', color: '#FFD60A' }}>
              ⚠ {athlete.notes}
            </div>
          )}

          <div>
            <h4 className="text-sm font-bold mb-2" style={{ color: 'var(--text-muted)' }}>Plano Individual</h4>
            {plan ? (
              <div className="rounded-xl p-3 text-sm"
                style={{ background: 'rgba(10,132,255,0.08)', border: '1px solid rgba(10,132,255,0.2)', color: '#0A84FF' }}>
                Objetivo: <strong>{plan.objective}</strong> · {plan.weeks} semanas
              </div>
            ) : (
              <div className="flex gap-2">
                {['5km', '10km'].map(obj => (
                  <button key={obj} onClick={() => createPlan(obj)}
                    className="flex-1 py-2 rounded-xl text-sm font-bold transition-colors"
                    style={{ background: 'rgba(252,76,2,0.12)', color: 'var(--orange)', border: '1px solid rgba(252,76,2,0.3)' }}>
                    Criar plano {obj}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="text-sm font-bold mb-2" style={{ color: 'var(--text-muted)' }}>Resultados recentes</h4>
            {results.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sem resultados.</p>
            ) : (
              <div className="space-y-2">
                {results.slice(0, 5).map(r => (
                  <div key={r.id} className="flex items-center justify-between text-sm rounded-xl px-3 py-2"
                    style={{ background: 'var(--surface2)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {formatDate(r.date)} · {r.distance_km}km {r.races?.name ? `— ${r.races.name}` : ''}
                    </span>
                    <span className="pace-mono font-bold" style={{ color: 'var(--text)' }}>{formatTime(r.time_seconds)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {showEdit && (
          <AthleteModal athlete={athlete} onClose={() => setShowEdit(false)}
            onSaved={(updated) => { onUpdated(updated); setShowEdit(false) }} />
        )}
      </div>
    </div>
  )
}

export default function Athletes() {
  const [athletes, setAthletes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('athletes').select('*').order('name')
      if (data) setAthletes(data)
      setLoading(false)
    }
    load()
  }, [])

  function handleSaved(a) {
    setAthletes(prev => {
      const idx = prev.findIndex(x => x.id === a.id)
      if (idx >= 0) { const n = [...prev]; n[idx] = a; return n }
      return [...prev, a].sort((a, b) => a.name.localeCompare(b.name))
    })
  }

  const filtered = athletes.filter(a =>
    a.name.toLowerCase().includes(filter.toLowerCase()) ||
    a.email.toLowerCase().includes(filter.toLowerCase()) ||
    (a.group || '').toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div className="p-6" style={{ background: 'var(--dark)', minHeight: '100vh' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black" style={{ color: 'var(--text)' }}>Atletas</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{athletes.length} atletas registados</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: 'var(--orange)', color: 'white' }}>
          <Plus size={18} /> Novo Atleta
        </button>
      </div>

      <input value={filter} onChange={e => setFilter(e.target.value)}
        placeholder="Pesquisar por nome, email ou grupo..."
        className="w-full mb-4"
        style={{
          background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)',
          borderRadius: 12, padding: '10px 16px', fontSize: 14, outline: 'none',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--orange)'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'} />

      {loading ? <LoadingSpinner /> : (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <table className="w-full text-sm">
            <thead style={{ borderBottom: '1px solid var(--border)' }}>
              <tr>
                {['Nome', 'Grupo', 'PR 5km', 'PR 10km', 'Estado'].map((h, i) => (
                  <th key={h} className={`text-left px-4 py-3 text-xs font-bold uppercase tracking-wider ${i >= 2 && i <= 3 ? 'hidden md:table-cell' : ''}`}
                    style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => {
                const grpClr = GROUP_COLORS[a.group] || GROUP_COLORS.G1
                return (
                  <tr key={a.id} onClick={() => setSelected(a)}
                    className="cursor-pointer transition-colors"
                    style={{ borderTop: '1px solid var(--border)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td className="px-4 py-3">
                      <p className="font-semibold" style={{ color: 'var(--text)' }}>{a.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{a.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: grpClr.bg, color: grpClr.text }}>
                        {a.group || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell pace-mono" style={{ color: 'var(--text-muted)' }}>
                      {a.pr_5km ? formatTime(a.pr_5km) : '—'}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell pace-mono" style={{ color: 'var(--text-muted)' }}>
                      {a.pr_10km ? formatTime(a.pr_10km) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{
                          background: a.active ? 'rgba(48,209,88,0.12)' : 'rgba(142,142,147,0.12)',
                          color: a.active ? '#30D158' : 'var(--text-muted)',
                        }}>
                        {a.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>
              Nenhum atleta encontrado.
            </div>
          )}
        </div>
      )}

      {showAdd && <AthleteModal onClose={() => setShowAdd(false)} onSaved={handleSaved} />}
      {selected && (
        <AthleteDetail athlete={selected} onClose={() => setSelected(null)}
          onUpdated={(a) => { handleSaved(a); setSelected(a) }} />
      )}
    </div>
  )
}
