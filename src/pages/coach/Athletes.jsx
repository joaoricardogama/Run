import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { generateIndividualPlan } from '../../utils/planGenerator'
import { calculateZones, formatZoneRange, formatDate } from '../../utils/pace'
import { assignGroup } from '../../utils/groupAssignment'
import SessionCard from '../../components/SessionCard'
import LoadingSpinner from '../../components/LoadingSpinner'
import { Plus, X, ChevronLeft, Edit2, Calendar, ClipboardList, User, Trash2 } from 'lucide-react'

const GROUPS = {
  G1: '#FF6B35', G2: '#F7C59F', G3: '#c8c89e',
  G4: '#4d9fd6', G5: '#1A936F', G6: '#88D498',
}

const DAYS_PT = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']

const ZONE_CONFIG = [
  { key: 'CCL', label: 'CCL', bg: 'rgba(48,209,88,0.12)', text: '#30D158' },
  { key: 'CCN', label: 'CCN', bg: 'rgba(255,214,10,0.12)', text: '#FFD60A' },
  { key: 'CCR', label: 'CCR', bg: 'rgba(255,69,58,0.12)', text: '#FF453A' },
]

function secsToStr(s) {
  if (!s) return ''
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

function strToSecs(str) {
  if (!str || !str.includes(':')) return null
  const [m, s] = str.split(':').map(Number)
  return m * 60 + (s || 0)
}

const Section = ({ label }) => (
  <p style={{ color: 'var(--orange)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '16px 0 10px' }}>{label}</p>
)
const Grid = ({ children }) => <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 4 }}>{children}</div>
const Full = ({ children }) => <div style={{ gridColumn: '1 / -1' }}>{children}</div>
const Half = ({ children }) => <div>{children}</div>

// ─── Form para adicionar / editar atleta ───────────────────────
const EMPTY = {
  name: '', email: '', sex: 'M', date_of_birth: '',
  nationality: 'Portuguesa', location: '', postal_code: '', nif: '',
  pr_10km: '', pr_5km: '', modalities: [], specializations: [],
  coach_id: null, strava_url: '', notes: '', active: true, gdpr_consent: false,
}

function AthleteFormModal({ athlete, coaches, onSave, onClose }) {
  const [form, setForm] = useState(() => athlete
    ? { ...athlete, pr_10km: secsToStr(athlete.pr_10km), pr_5km: secsToStr(athlete.pr_5km), modalities: athlete.modalities || [], specializations: athlete.specializations || [] }
    : { ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const computedGroup = form.pr_10km && form.sex
    ? assignGroup(form.sex, strToSecs(form.pr_10km)) : null

  async function handleSave() {
    if (!form.name || !form.email) { setError('Nome e email são obrigatórios.'); return }
    setSaving(true); setError('')
    const payload = {
      name: form.name, email: form.email, sex: form.sex,
      date_of_birth: form.date_of_birth || null,
      nationality: form.nationality, location: form.location,
      postal_code: form.postal_code, nif: form.nif,
      pr_10km: strToSecs(form.pr_10km), pr_5km: strToSecs(form.pr_5km),
      group: computedGroup || form.group || 'G6',
      modalities: form.modalities, specializations: form.specializations,
      coach_id: form.coach_id || null, strava_url: form.strava_url,
      notes: form.notes, active: form.active, gdpr_consent: form.gdpr_consent,
      gdpr_consent_date: form.gdpr_consent ? new Date().toISOString() : null,
    }
    const res = athlete?.id
      ? await supabase.from('athletes').update(payload).eq('id', athlete.id)
      : await supabase.from('athletes').insert(payload)
    setSaving(false)
    if (res.error) { setError(res.error.message); return }
    onSave()
  }

  const I = { style: { background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 10, padding: '10px 12px', width: '100%', fontSize: 14, boxSizing: 'border-box' } }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '24px 16px' }}>
      <div style={{ background: 'var(--surface)', borderRadius: 20, padding: 24, width: '100%', maxWidth: 540, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ color: 'var(--text)', fontWeight: 800, fontSize: 17 }}>{athlete ? 'Editar atleta' : 'Adicionar atleta'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <Section label="Dados pessoais" />
        <Grid>
          <Full><input {...I} placeholder="Nome completo *" value={form.name} onChange={e => set('name', e.target.value)} /></Full>
          <Full><input {...I} placeholder="Email *" type="email" value={form.email} onChange={e => set('email', e.target.value)} /></Full>
          <Half>
            <select {...I} value={form.sex} onChange={e => set('sex', e.target.value)}>
              <option value="M">Masculino</option>
              <option value="F">Feminino</option>
            </select>
          </Half>
          <Half><input {...I} type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} /></Half>
          <Full><input {...I} placeholder="Nacionalidade" value={form.nationality} onChange={e => set('nationality', e.target.value)} /></Full>
          <Half><input {...I} placeholder="Localidade" value={form.location} onChange={e => set('location', e.target.value)} /></Half>
          <Half><input {...I} placeholder="Código postal" value={form.postal_code} onChange={e => set('postal_code', e.target.value)} /></Half>
          <Full><input {...I} placeholder="NIF" value={form.nif} onChange={e => set('nif', e.target.value)} /></Full>
        </Grid>

        <Section label="Dados desportivos" />
        <Grid>
          <Half>
            <label style={{ color: 'var(--text-muted)', fontSize: 11, display: 'block', marginBottom: 4 }}>PR 10km (MM:SS)</label>
            <input {...I} placeholder="35:00" value={form.pr_10km} onChange={e => set('pr_10km', e.target.value)} />
          </Half>
          <Half>
            <label style={{ color: 'var(--text-muted)', fontSize: 11, display: 'block', marginBottom: 4 }}>PR 5km (MM:SS)</label>
            <input {...I} placeholder="17:00" value={form.pr_5km} onChange={e => set('pr_5km', e.target.value)} />
          </Half>
        </Grid>
        {computedGroup && (
          <div style={{ margin: '8px 0 14px', padding: '8px 14px', background: 'rgba(255,107,53,0.1)', borderRadius: 10, display: 'inline-block' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Grupo calculado: </span>
            <span style={{ color: GROUPS[computedGroup], fontWeight: 800 }}>{computedGroup}</span>
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <label style={{ color: 'var(--text-muted)', fontSize: 11, display: 'block', marginBottom: 4 }}>Treinador</label>
          <select {...I} value={form.coach_id || ''} onChange={e => set('coach_id', e.target.value || null)}>
            <option value="">— sem treinador —</option>
            {coaches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <Grid>
          <Full><input {...I} placeholder="URL Strava" value={form.strava_url || ''} onChange={e => set('strava_url', e.target.value)} /></Full>
          <Full><textarea {...I} placeholder="Notas" rows={3} value={form.notes || ''} onChange={e => set('notes', e.target.value)} style={{ ...I.style, resize: 'vertical' }} /></Full>
        </Grid>

        <div style={{ display: 'flex', gap: 20, margin: '14px 0' }}>
          {[['active', 'Ativo'], ['gdpr_consent', 'RGPD aceite']].map(([k, label]) => (
            <label key={k} style={{ color: 'var(--text)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
              <input type="checkbox" checked={form[k]} onChange={e => set(k, e.target.checked)} /> {label}
            </label>
          ))}
        </div>

        {error && <p style={{ color: '#FF453A', fontSize: 13, marginBottom: 12 }}>{error}</p>}
        <button onClick={handleSave} disabled={saving} style={{ width: '100%', padding: 13, background: 'var(--orange)', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 15, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'A guardar…' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}

// ─── Vista do plano do atleta ──────────────────────────────────
function AthletePlanView({ athlete }) {
  const [indPlan, setIndPlan] = useState(null)
  const [genPlan, setGenPlan] = useState(null)
  const [generated, setGenerated] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [iR, gR] = await Promise.all([
        supabase.from('individual_plans').select('*').eq('athlete_id', athlete.id)
          .order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('general_plans').select('*')
          .order('week_start', { ascending: false }).limit(1).maybeSingle(),
      ])
      if (iR.data) { setIndPlan(iR.data); setGenerated(generateIndividualPlan(athlete, iR.data.objective, iR.data.weeks || 3)) }
      if (gR.data) setGenPlan(gR.data)
      setLoading(false)
    }
    load()
  }, [athlete.id])

  if (loading) return <LoadingSpinner />

  const prSecs = indPlan ? (indPlan.objective === '5km' ? athlete.pr_5km : athlete.pr_10km) : null
  const zones = prSecs ? calculateZones(prSecs, indPlan.objective === '5km' ? 5 : 10) : null

  return (
    <div>
      <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 16 }}>
        Exatamente o que <strong style={{ color: 'var(--text)' }}>{athlete.name}</strong> vê na app.
      </p>
      {zones && (
        <div style={{ background: 'var(--surface2)', borderRadius: 14, padding: 16, marginBottom: 16 }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 10 }}>Zonas — {indPlan.objective}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
            {ZONE_CONFIG.map(({ key, label, bg, text }) => (
              <div key={key} style={{ background: bg, borderRadius: 10, padding: 10, textAlign: 'center' }}>
                <p style={{ color: text, fontWeight: 800, fontSize: 11, marginBottom: 3 }}>{label}</p>
                <p style={{ color: 'var(--text)', fontSize: 11, fontFamily: 'monospace' }}>{formatZoneRange(zones[key])}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {indPlan && generated
        ? generated.map(w => (
          <div key={w.week} style={{ marginBottom: 20 }}>
            <p style={{ color: 'var(--orange)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>{w.label}</p>
            {w.days.map(({ day, session }) => <SessionCard key={day} session={session} day={day} />)}
          </div>
        ))
        : genPlan
          ? (
            <>
              <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: 'var(--text-muted)' }}>
                Plano do grupo <span style={{ color: 'var(--orange)', fontWeight: 700 }}>{athlete.group}</span> — sem plano individual.
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 10 }}>Semana de {formatDate(genPlan.week_start)}</p>
              {DAYS_PT.map(day => {
                const sessions = genPlan.content?.[athlete.group]?.[day.toLowerCase()] || []
                return sessions.length ? (
                  <div key={day} style={{ marginBottom: 10 }}>
                    {sessions.map((s, i) => <SessionCard key={i} session={s} day={day} />)}
                  </div>
                ) : null
              })}
            </>
          )
          : <p style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: 40 }}>Sem plano publicado.</p>
      }
    </div>
  )
}

// ─── Plano individual (coach cria/edita) ───────────────────────
function IndividualPlanForm({ athlete, onSaved }) {
  const [existing, setExisting] = useState(null)
  const [objective, setObjective] = useState('10km')
  const [weeks, setWeeks] = useState(4)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase.from('individual_plans').select('*').eq('athlete_id', athlete.id)
      .order('created_at', { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => { if (data) { setExisting(data); setObjective(data.objective); setWeeks(data.weeks || 4) } })
  }, [athlete.id])

  async function handleSave() {
    setSaving(true)
    const payload = { athlete_id: athlete.id, objective, weeks }
    const res = existing
      ? await supabase.from('individual_plans').update(payload).eq('id', existing.id)
      : await supabase.from('individual_plans').insert(payload)
    setSaving(false)
    if (!res.error) { setSaved(true); setPreview(null); onSaved?.(); setTimeout(() => setSaved(false), 3000) }
  }

  const Btn = ({ active, onClick, children }) => (
    <button onClick={onClick} style={{ padding: '8px 18px', borderRadius: 10, border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', background: active ? 'var(--orange)' : 'var(--surface2)', color: active ? '#fff' : 'var(--text-muted)' }}>
      {children}
    </button>
  )

  return (
    <div>
      {existing && (
        <div style={{ padding: '10px 14px', background: 'rgba(255,107,53,0.1)', borderRadius: 12, marginBottom: 16, fontSize: 13, color: 'var(--text)' }}>
          Plano atual: <strong>{existing.objective}</strong> · {existing.weeks} semanas
        </div>
      )}
      <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 8 }}>Objetivo</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <Btn active={objective === '5km'} onClick={() => setObjective('5km')}>5km</Btn>
        <Btn active={objective === '10km'} onClick={() => setObjective('10km')}>10km</Btn>
      </div>

      <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 8 }}>
        Semanas: <strong style={{ color: 'var(--text)' }}>{weeks}</strong>
      </p>
      <input type="range" min={1} max={12} value={weeks} onChange={e => setWeeks(+e.target.value)}
        style={{ width: '100%', marginBottom: 24, accentColor: 'var(--orange)' }} />

      {saved && <p style={{ color: '#30D158', fontSize: 13, marginBottom: 10 }}>✓ Plano guardado!</p>}

      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        <button onClick={() => setPreview(generateIndividualPlan(athlete, objective, weeks))}
          style={{ flex: 1, padding: 11, background: 'var(--surface2)', border: 'none', borderRadius: 12, color: 'var(--text)', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
          Pré-visualizar
        </button>
        <button onClick={handleSave} disabled={saving}
          style={{ flex: 1, padding: 11, background: 'var(--orange)', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'A guardar…' : existing ? 'Atualizar' : 'Criar plano'}
        </button>
      </div>

      {preview && (
        <div>
          <p style={{ color: 'var(--orange)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>Pré-visualização ({objective} · {weeks} sem.)</p>
          {preview.map(w => (
            <div key={w.week} style={{ marginBottom: 20 }}>
              <p style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, marginBottom: 8 }}>{w.label}</p>
              {w.days.map(({ day, session }) => <SessionCard key={day} session={session} day={day} />)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Tab corridas ──────────────────────────────────────────────
function RacesTab({ athlete }) {
  const [races, setRaces] = useState([])
  const [enrolled, setEnrolled] = useState(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [rR, aR] = await Promise.all([
        supabase.from('races').select('*').order('date'),
        supabase.from('athlete_races').select('race_id').eq('athlete_id', athlete.id),
      ])
      setRaces(rR.data || [])
      setEnrolled(new Set((aR.data || []).map(r => r.race_id)))
      setLoading(false)
    }
    load()
  }, [athlete.id])

  async function toggle(raceId) {
    if (enrolled.has(raceId)) {
      await supabase.from('athlete_races').delete().eq('athlete_id', athlete.id).eq('race_id', raceId)
      setEnrolled(s => { const n = new Set(s); n.delete(raceId); return n })
    } else {
      await supabase.from('athlete_races').insert({ athlete_id: athlete.id, race_id: raceId })
      setEnrolled(s => new Set([...s, raceId]))
    }
  }

  if (loading) return <LoadingSpinner />
  if (!races.length) return <p style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: 40 }}>Sem provas no calendário.</p>

  return (
    <div>
      {races.map(r => {
        const past = new Date(r.date) < new Date()
        const inRace = enrolled.has(r.id)
        return (
          <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, background: 'var(--surface2)', borderRadius: 14, marginBottom: 10, opacity: past ? 0.55 : 1 }}>
            <div style={{ textAlign: 'center', minWidth: 40 }}>
              <p style={{ color: 'var(--orange)', fontWeight: 800, fontSize: 18, lineHeight: 1 }}>{new Date(r.date).getDate()}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 10 }}>{new Date(r.date).toLocaleString('pt', { month: 'short' }).toUpperCase()}</p>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: 'var(--text)', fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>{r.location} · {r.distance_km}km</p>
            </div>
            <button onClick={() => toggle(r.id)} style={{ padding: '7px 14px', borderRadius: 10, border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer', background: inRace ? 'rgba(48,209,88,0.15)' : 'var(--surface)', color: inRace ? '#30D158' : 'var(--text-muted)', flexShrink: 0 }}>
              {inRace ? '✓ Inscrito' : '+ Inscrever'}
            </button>
          </div>
        )
      })}
    </div>
  )
}

// ─── Detalhe do atleta ─────────────────────────────────────────
function AthleteDetail({ athlete: init, coaches, onBack, onRefresh }) {
  const [athlete, setAthlete] = useState(init)
  const [tab, setTab] = useState('perfil')
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function refresh() {
    const { data } = await supabase.from('athletes').select('*').eq('id', init.id).single()
    if (data) setAthlete(data)
    onRefresh?.()
  }

  async function handleDelete() {
    setDeleting(true)
    const { error } = await supabase.rpc('delete_athlete_account', { p_athlete_id: athlete.id })
    setDeleting(false)
    if (!error) { onRefresh?.(); onBack() }
    else alert('Erro ao eliminar: ' + error.message)
  }

  const gc = GROUPS[athlete.group] || 'var(--text-muted)'

  const TABS = [
    { id: 'perfil', label: 'Perfil', icon: <User size={13} /> },
    { id: 'corridas', label: 'Corridas', icon: <Calendar size={13} /> },
    { id: 'plano', label: 'Ver plano', icon: <ClipboardList size={13} /> },
    { id: 'plano-ind', label: 'Plano individual', icon: <Edit2 size={13} /> },
  ]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}><ChevronLeft size={22} /></button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ color: 'var(--text)', fontWeight: 800, fontSize: 18, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{athlete.name}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{athlete.email}</p>
        </div>
        <span style={{ background: gc + '22', color: gc, fontWeight: 800, fontSize: 13, padding: '4px 12px', borderRadius: 20, flexShrink: 0 }}>{athlete.group}</span>
        <button onClick={() => setEditing(true)} style={{ background: 'var(--surface2)', border: 'none', color: 'var(--orange)', padding: '8px 14px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>Editar</button>
        <button onClick={() => setConfirmDelete(true)} style={{ background: 'rgba(255,69,58,0.12)', border: 'none', color: '#FF453A', padding: '8px 12px', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <Trash2 size={15} />
        </button>
      </div>

      {/* Confirmação de eliminação */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'var(--surface)', borderRadius: 20, padding: 28, maxWidth: 380, width: '100%' }}>
            <h3 style={{ color: 'var(--text)', fontWeight: 800, fontSize: 17, marginBottom: 10 }}>Eliminar conta?</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
              Isto vai eliminar <strong style={{ color: 'var(--text)' }}>{athlete.name}</strong> da base de dados e da autenticação. Esta ação é irreversível.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmDelete(false)} style={{ flex: 1, padding: 12, background: 'var(--surface2)', border: 'none', borderRadius: 12, color: 'var(--text)', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, padding: 12, background: '#FF453A', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 14, cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.7 : 1 }}>
                {deleting ? 'A eliminar…' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto', paddingBottom: 2 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 13px', borderRadius: 20, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 700, fontSize: 12, background: tab === t.id ? 'var(--orange)' : 'var(--surface2)', color: tab === t.id ? '#fff' : 'var(--text-muted)' }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'perfil' && (
        <div>
          {[
            ['Sexo', athlete.sex === 'M' ? 'Masculino' : 'Feminino'],
            ['Nascimento', athlete.date_of_birth],
            ['Nacionalidade', athlete.nationality],
            ['Localidade', athlete.location],
            ['Código postal', athlete.postal_code],
            ['NIF', athlete.nif],
            ['PR 10km', secsToStr(athlete.pr_10km)],
            ['PR 5km', secsToStr(athlete.pr_5km)],
            ['Modalidades', athlete.modalities?.join(', ')],
            ['Especializações', athlete.specializations?.join(', ')],
            ['Strava', athlete.strava_url],
            ['Notas', athlete.notes],
            ['Estado', athlete.active ? 'Ativo' : 'Inativo'],
            ['RGPD', athlete.gdpr_consent ? `Aceite em ${athlete.gdpr_consent_date?.slice(0, 10)}` : 'Não aceite'],
          ].filter(([, v]) => v).map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '11px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{label}</span>
              <span style={{ color: 'var(--text)', fontSize: 13, fontWeight: 600, maxWidth: '60%', textAlign: 'right', wordBreak: 'break-word' }}>{value}</span>
            </div>
          ))}
        </div>
      )}
      {tab === 'corridas' && <RacesTab athlete={athlete} />}
      {tab === 'plano' && <AthletePlanView athlete={athlete} />}
      {tab === 'plano-ind' && <IndividualPlanForm athlete={athlete} onSaved={refresh} />}

      {editing && (
        <AthleteFormModal athlete={athlete} coaches={coaches}
          onClose={() => setEditing(false)}
          onSave={() => { setEditing(false); refresh() }} />
      )}
    </div>
  )
}

// ─── Lista principal ───────────────────────────────────────────
export default function Athletes() {
  const [athletes, setAthletes] = useState([])
  const [coaches, setCoaches] = useState([])
  const [search, setSearch] = useState('')
  const [groupFilter, setGroupFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [adding, setAdding] = useState(false)

  async function load() {
    const [aR, cR] = await Promise.all([
      supabase.from('athletes').select('*').order('name'),
      supabase.from('coaches').select('*').order('name'),
    ])
    setAthletes(aR.data || [])
    setCoaches(cR.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = athletes.filter(a => {
    const q = search.toLowerCase()
    return (!q || a.name?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q))
      && (groupFilter === 'all' || a.group === groupFilter)
  })

  if (loading) return <LoadingSpinner />

  if (selected) {
    return (
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px' }}>
        <AthleteDetail athlete={selected} coaches={coaches}
          onBack={() => setSelected(null)} onRefresh={load} />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ color: 'var(--text)', fontWeight: 800, fontSize: 20 }}>
          Atletas <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 15 }}>({athletes.length})</span>
        </h2>
        <button onClick={() => setAdding(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: 'var(--orange)', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
          <Plus size={15} /> Adicionar
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input placeholder="Pesquisar…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 180, padding: '10px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 12, fontSize: 14 }} />
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {['all', 'G1', 'G2', 'G3', 'G4', 'G5', 'G6'].map(g => (
            <button key={g} onClick={() => setGroupFilter(g)} style={{ padding: '8px 11px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12, background: groupFilter === g ? (GROUPS[g] || 'var(--orange)') : 'var(--surface2)', color: groupFilter === g ? '#000' : 'var(--text-muted)' }}>
              {g === 'all' ? 'Todos' : g}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: 'var(--surface)', borderRadius: 16, overflow: 'hidden' }}>
        {!filtered.length
          ? <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 48 }}>Nenhum atleta encontrado.</p>
          : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Nome', 'Grupo', 'PR 10km', 'PR 5km', 'Estado'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => {
                  const gc = GROUPS[a.group] || 'var(--text-muted)'
                  return (
                    <tr key={a.id} onClick={() => setSelected(a)}
                      style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}>
                      <td style={{ padding: '13px 16px' }}>
                        <p style={{ color: 'var(--text)', fontWeight: 700, fontSize: 14 }}>{a.name}</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>{a.email}</p>
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{ background: gc + '22', color: gc, fontWeight: 800, fontSize: 12, padding: '3px 10px', borderRadius: 20 }}>{a.group}</span>
                      </td>
                      <td style={{ padding: '13px 16px', color: 'var(--text)', fontSize: 13, fontFamily: 'monospace' }}>{secsToStr(a.pr_10km) || '—'}</td>
                      <td style={{ padding: '13px 16px', color: 'var(--text)', fontSize: 13, fontFamily: 'monospace' }}>{secsToStr(a.pr_5km) || '—'}</td>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{ color: a.active ? '#30D158' : '#FF453A', fontWeight: 700, fontSize: 12 }}>{a.active ? 'Ativo' : 'Inativo'}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )
        }
      </div>

      {adding && (
        <AthleteFormModal athlete={null} coaches={coaches}
          onClose={() => setAdding(false)}
          onSave={() => { setAdding(false); load() }} />
      )}
    </div>
  )
}
