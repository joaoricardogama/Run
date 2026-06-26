import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Plus, Pencil, Trash2, Trophy, Activity, X, ChevronDown, ChevronUp } from 'lucide-react'

// Eventos suportados para PBs
const PB_EVENTS = [
  { group: 'Estrada', events: ['5k','10k','Meia Maratona','Maratona'] },
  { group: 'Trail',   events: ['Trail Curto','Trail Médio','Ultra Trail'] },
  { group: 'Pista',   events: ['100m','200m','400m','800m','1500m','3000m','5000m','10000m'] },
  { group: 'Campo',   events: ['Salto em Comprimento','Salto em Altura','Lançamento do Dardo','Lançamento do Martelo'] },
]

const ALL_EVENTS = PB_EVENTS.flatMap(g => g.events)

function formatTime(seconds) {
  if (!seconds) return null
  const s = Math.round(seconds)
  if (s < 3600) {
    return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`
  }
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
}

function parseTimeToSeconds(str) {
  if (!str) return null
  const parts = str.split(':').map(Number)
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  return null
}

const sourceLabel = { manual: 'Manual', strava: 'Strava', official: 'Oficial' }
const sourceBadge = {
  manual:   { bg: 'rgba(255,255,255,0.07)', color: 'var(--text-muted)' },
  strava:   { bg: 'rgba(252,76,2,0.12)',    color: '#FC4C02' },
  official: { bg: 'rgba(184,255,0,0.12)',   color: 'var(--heh-green)' },
}

function PBModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(
    initial || { event: '10k', mark: '', source: 'manual', recorded_at: '', notes: '' }
  )
  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function handleSave() {
    const time_seconds = parseTimeToSeconds(form.mark)
    onSave({ ...form, time_seconds })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.7)' }}>
      <div style={{ width: '100%', maxWidth: 440, background: 'var(--surface)', borderRadius: '24px 24px 0 0', padding: '24px 20px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontWeight: 900, fontSize: 18, color: 'var(--text)' }}>
            {initial ? 'Editar recorde' : 'Adicionar recorde'}
          </h3>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none', padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 6 }}>
              Evento
            </label>
            <select value={form.event} onChange={e => set('event', e.target.value)}
              style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px', fontSize: 15, color: 'var(--text)', outline: 'none' }}>
              {PB_EVENTS.map(({ group, events }) => (
                <optgroup key={group} label={group}>
                  {events.map(ev => <option key={ev} value={ev}>{ev}</option>)}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 6 }}>
              Resultado (tempo ou marca)
            </label>
            <input value={form.mark} onChange={e => set('mark', e.target.value)}
              placeholder="Ex: 45:30 ou 8.50m"
              style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px', fontSize: 15, color: 'var(--text)', outline: 'none' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 6 }}>
              Fonte
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['manual','strava','official'].map(s => (
                <button key={s} type="button" onClick={() => set('source', s)}
                  style={{
                    flex: 1, padding: '10px 8px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                    cursor: 'pointer', border: form.source === s ? '1.5px solid rgba(184,255,0,0.5)' : '1px solid var(--border)',
                    background: form.source === s ? 'rgba(184,255,0,0.10)' : 'var(--surface2)',
                    color: form.source === s ? 'var(--heh-green)' : 'var(--text-muted)',
                  }}>
                  {sourceLabel[s]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 6 }}>
              Data
            </label>
            <input type="date" value={form.recorded_at} onChange={e => set('recorded_at', e.target.value)}
              style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px', fontSize: 15, color: 'var(--text)', outline: 'none' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 6 }}>
              Notas (opcional)
            </label>
            <input value={form.notes || ''} onChange={e => set('notes', e.target.value)}
              placeholder="Prova, condições, etc."
              style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px', fontSize: 15, color: 'var(--text)', outline: 'none' }} />
          </div>

          <button onClick={handleSave} disabled={!form.mark}
            style={{
              width: '100%', padding: '15px', borderRadius: 14, fontWeight: 900, fontSize: 15,
              border: 'none', cursor: 'pointer', marginTop: 4,
              background: form.mark ? 'var(--heh-green)' : 'var(--surface2)',
              color: form.mark ? '#080808' : 'var(--text-muted)',
            }}>
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

function RaceResultModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || { race_name: '', event: '10k', result: '', position: '', category: '', location: '', race_date: '' })
  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function handleSave() {
    const time_seconds = parseTimeToSeconds(form.result)
    onSave({ ...form, time_seconds, official: true })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.7)' }}>
      <div style={{ width: '100%', maxWidth: 440, background: 'var(--surface)', borderRadius: '24px 24px 0 0', padding: '24px 20px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontWeight: 900, fontSize: 18, color: 'var(--text)' }}>
            {initial ? 'Editar resultado' : 'Adicionar resultado oficial'}
          </h3>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { k: 'race_name', l: 'Nome da prova', p: 'Ex: Meia Maratona de Lisboa 2025' },
            { k: 'event',     l: 'Distância / Prova', p: 'Ex: Meia Maratona', type: 'select' },
            { k: 'result',    l: 'Resultado', p: 'Ex: 1:42:15' },
            { k: 'position',  l: 'Posição (opcional)', p: 'Ex: 23', type: 'number' },
            { k: 'category',  l: 'Categoria (opcional)', p: 'Ex: Sénior M' },
            { k: 'location',  l: 'Local (opcional)', p: 'Ex: Lisboa' },
            { k: 'race_date', l: 'Data', type: 'date' },
          ].map(({ k, l, p, type }) => (
            <div key={k}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 5 }}>{l}</label>
              {type === 'select' ? (
                <select value={form[k]} onChange={e => set(k, e.target.value)}
                  style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '11px 12px', fontSize: 14, color: 'var(--text)', outline: 'none' }}>
                  {ALL_EVENTS.map(ev => <option key={ev} value={ev}>{ev}</option>)}
                </select>
              ) : (
                <input type={type || 'text'} value={form[k]} onChange={e => set(k, e.target.value)} placeholder={p}
                  style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '11px 12px', fontSize: 14, color: 'var(--text)', outline: 'none' }} />
              )}
            </div>
          ))}
          <button onClick={handleSave} disabled={!form.race_name || !form.result || !form.race_date}
            style={{
              width: '100%', padding: '14px', borderRadius: 12, fontWeight: 900, fontSize: 14,
              border: 'none', cursor: 'pointer', marginTop: 6,
              background: 'var(--heh-green)', color: '#080808',
            }}>
            Guardar resultado
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AthleteProfile() {
  const { user } = useAuth()
  const [athlete, setAthlete]     = useState(null)
  const [pbs, setPbs]             = useState([])
  const [results, setResults]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [pbModal, setPbModal]     = useState(null)  // null | 'new' | pb object
  const [raceModal, setRaceModal] = useState(null)  // null | 'new' | result object
  const [showAllPbs, setShowAllPbs]       = useState(false)
  const [showAllResults, setShowAllResults] = useState(false)

  async function load() {
    const { data: at } = await supabase.from('athletes').select('*').eq('email', user.email).maybeSingle()
    setAthlete(at)
    if (at) {
      const { data: pbData }  = await supabase.from('athlete_personal_bests').select('*').eq('athlete_id', at.id).order('event')
      const { data: resData } = await supabase.from('athlete_race_results').select('*').eq('athlete_id', at.id).order('race_date', { ascending: false })
      setPbs(pbData || [])
      setResults(resData || [])
    }
    setLoading(false)
  }

  useEffect(() => { if (user) load() }, [user])

  async function savePB(form) {
    const payload = {
      ...form,
      athlete_id: athlete.id,
      recorded_at: form.recorded_at || null,
    }
    if (form.id) {
      await supabase.from('athlete_personal_bests').update(payload).eq('id', form.id)
    } else {
      // upsert on (athlete_id, event, source)
      await supabase.from('athlete_personal_bests').upsert(payload, { onConflict: 'athlete_id,event,source' })
    }
    setPbModal(null)
    load()
  }

  async function deletePB(id) {
    await supabase.from('athlete_personal_bests').delete().eq('id', id)
    load()
  }

  async function saveResult(form) {
    const payload = { ...form, athlete_id: athlete.id, race_date: form.race_date || null, position: form.position ? Number(form.position) : null }
    if (form.id) {
      await supabase.from('athlete_race_results').update(payload).eq('id', form.id)
    } else {
      await supabase.from('athlete_race_results').insert(payload)
    }
    setRaceModal(null)
    load()
  }

  async function deleteResult(id) {
    await supabase.from('athlete_race_results').delete().eq('id', id)
    load()
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--dark)' }}>
      <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--heh-green)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  const visiblePbs     = showAllPbs ? pbs : pbs.slice(0, 6)
  const visibleResults = showAllResults ? results : results.slice(0, 5)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)', paddingBottom: 100 }}>

      {/* Header / Hero */}
      <div style={{ padding: '40px 20px 24px', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 520, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20, flexShrink: 0,
            background: 'rgba(184,255,0,0.12)', border: '2px solid rgba(184,255,0,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 900, color: 'var(--heh-green)',
          }}>
            {athlete?.avatar_url ? (
              <img src={athlete.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: 18, objectFit: 'cover' }} />
            ) : (
              athlete?.name?.charAt(0) || '?'
            )}
          </div>
          <div>
            <h1 style={{ fontWeight: 900, fontSize: 22, color: 'var(--text)', letterSpacing: '-0.03em', marginBottom: 2 }}>{athlete?.name}</h1>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {athlete?.group && (
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'rgba(184,255,0,0.12)', color: 'var(--heh-green)' }}>
                  {athlete.group}
                </span>
              )}
              {athlete?.nationality && (
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>{athlete.nationality}</span>
              )}
              {athlete?.strava_athlete_id && (
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: 'rgba(252,76,2,0.12)', color: '#FC4C02' }}>
                  Strava
                </span>
              )}
            </div>
            {athlete?.specializations?.length > 0 && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                {athlete.specializations.slice(0, 3).join(' · ')}
                {athlete.specializations.length > 3 && ` +${athlete.specializations.length - 3}`}
              </p>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 16px' }}>

        {/* ── RECORDES PESSOAIS ── */}
        <section style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={16} style={{ color: 'var(--heh-green)' }} />
              <h2 style={{ fontWeight: 900, fontSize: 16, color: 'var(--text)', letterSpacing: '-0.02em' }}>Recordes Pessoais</h2>
            </div>
            <button onClick={() => setPbModal('new')}
              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 700, color: 'var(--heh-green)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: 8, background: 'rgba(184,255,0,0.08)' }}>
              <Plus size={14} /> Adicionar
            </button>
          </div>

          {pbs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 20px', background: 'var(--surface)', borderRadius: 16, border: '1px dashed var(--border)' }}>
              <Activity size={28} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Sem recordes pessoais ainda</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>Adiciona os teus melhores tempos</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {visiblePbs.map(pb => {
                const badge = sourceBadge[pb.source] || sourceBadge.manual
                return (
                  <div key={pb.id} style={{ display: 'flex', alignItems: 'center', padding: '13px 14px', background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)' }}>{pb.event}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, ...badge }}>
                          {sourceLabel[pb.source] || pb.source}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontWeight: 900, fontSize: 20, color: 'var(--heh-green)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
                          {pb.mark || formatTime(pb.time_seconds) || '—'}
                        </span>
                        {pb.recorded_at && (
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {new Date(pb.recorded_at).toLocaleDateString('pt-PT', { month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                      {pb.notes && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{pb.notes}</p>}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => setPbModal(pb)} style={{ color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none', padding: 4 }}>
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => deletePB(pb.id)} style={{ color: '#FF453A', cursor: 'pointer', background: 'none', border: 'none', padding: 4 }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
              {pbs.length > 6 && (
                <button onClick={() => setShowAllPbs(s => !s)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '10px', color: 'var(--text-muted)', background: 'none', border: '1px solid var(--border)', borderRadius: 12, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  {showAllPbs ? <><ChevronUp size={14} /> Mostrar menos</> : <><ChevronDown size={14} /> Ver todos ({pbs.length})</>}
                </button>
              )}
            </div>
          )}
        </section>

        {/* ── RESULTADOS OFICIAIS ── */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Trophy size={16} style={{ color: 'var(--heh-green)' }} />
              <h2 style={{ fontWeight: 900, fontSize: 16, color: 'var(--text)', letterSpacing: '-0.02em' }}>Resultados Oficiais</h2>
            </div>
            <button onClick={() => setRaceModal('new')}
              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 700, color: 'var(--heh-green)', background: 'rgba(184,255,0,0.08)', border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: 8 }}>
              <Plus size={14} /> Adicionar
            </button>
          </div>

          {results.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 20px', background: 'var(--surface)', borderRadius: 16, border: '1px dashed var(--border)' }}>
              <Trophy size={28} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Sem resultados de prova ainda</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>Regista os teus resultados oficiais</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {visibleResults.map(res => (
                <div key={res.id} style={{ padding: '14px', background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)', marginBottom: 2 }}>{res.race_name}</p>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{res.event}</span>
                        {res.race_date && (
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            · {new Date(res.race_date).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <span style={{ fontWeight: 900, fontSize: 22, color: 'var(--heh-green)', letterSpacing: '-0.02em' }}>
                          {res.result}
                        </span>
                        {res.position && (
                          <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'rgba(255,214,10,0.12)', color: '#FFD60A' }}>
                            {res.position}º lugar
                          </span>
                        )}
                        {res.category && (
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{res.category}</span>
                        )}
                      </div>
                      {res.location && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{res.location}</p>}
                    </div>
                    <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
                      <button onClick={() => setRaceModal(res)} style={{ color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none', padding: 4 }}>
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => deleteResult(res.id)} style={{ color: '#FF453A', cursor: 'pointer', background: 'none', border: 'none', padding: 4 }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {results.length > 5 && (
                <button onClick={() => setShowAllResults(s => !s)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '10px', color: 'var(--text-muted)', background: 'none', border: '1px solid var(--border)', borderRadius: 12, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  {showAllResults ? <><ChevronUp size={14} /> Mostrar menos</> : <><ChevronDown size={14} /> Ver todos ({results.length})</>}
                </button>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Modals */}
      {pbModal && (
        <PBModal
          initial={pbModal !== 'new' ? pbModal : null}
          onSave={savePB}
          onClose={() => setPbModal(null)}
        />
      )}
      {raceModal && (
        <RaceResultModal
          initial={raceModal !== 'new' ? raceModal : null}
          onSave={saveResult}
          onClose={() => setRaceModal(null)}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
