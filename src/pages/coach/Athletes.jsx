import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { formatDate } from '../../utils/pace'
import { assignGroup } from '../../utils/groupAssignment'
import { getEscalao, escalaoColor, formatTime, DISTANCES, MEDAL_COLORS, getMedalFromPosition } from '../../utils/escalao'
import SessionCard from '../../components/SessionCard'
import LoadingSpinner from '../../components/LoadingSpinner'
import { Plus, X, ChevronLeft, Edit2, Calendar, ClipboardList, User, Trash2, Shield, Medal } from 'lucide-react'

const GROUPS = {
  G1: '#FF6B35', G2: '#F7C59F', G3: '#c8c89e',
  G4: '#4d9fd6', G5: '#1A936F', G6: '#88D498',
}

const DAYS_PT = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']



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
  club: '', is_federated: false, federation_id: '', trainer_grade: '',
  height_cm: '', weight_kg: '', equipment_watch: '', equipment_shoes: '',
  pr_100m: '', pr_200m: '', pr_400m: '', pr_800m: '', pr_1500m: '', pr_3000m: '',
  pr_10km: '', pr_5km: '', modalities: [], specializations: [],
  coach_id: null, strava_url: '', notes: '', active: true, gdpr_consent: false,
}

function secsToMid(s) {
  if (!s) return ''
  const m = Math.floor(s/60)
  const sec = (s%60).toFixed(2).padStart(5,'0')
  return `${m}:${sec}`
}
function parseMidTime(str) {
  if (!str) return null
  if (str.includes(':')) {
    const [m, s] = str.split(':')
    return parseInt(m)*60 + parseFloat(s)||0
  }
  return parseFloat(str)||null
}

function AthleteFormModal({ athlete, coaches, onSave, onClose }) {
  const [form, setForm] = useState(() => athlete
    ? {
        ...athlete,
        pr_10km: secsToStr(athlete.pr_10km), pr_5km: secsToStr(athlete.pr_5km),
        pr_800m: secsToMid(athlete.pr_800m), pr_1500m: secsToMid(athlete.pr_1500m), pr_3000m: secsToMid(athlete.pr_3000m),
        pr_100m: athlete.pr_100m ? String(athlete.pr_100m) : '',
        pr_200m: athlete.pr_200m ? String(athlete.pr_200m) : '',
        pr_400m: athlete.pr_400m ? String(athlete.pr_400m) : '',
        modalities: athlete.modalities || [], specializations: athlete.specializations || [],
        club: athlete.club||'', is_federated: athlete.is_federated||false,
        federation_id: athlete.federation_id||'', trainer_grade: athlete.trainer_grade||'',
        height_cm: athlete.height_cm||'', weight_kg: athlete.weight_kg||'',
        equipment_watch: athlete.equipment_watch||'', equipment_shoes: athlete.equipment_shoes||'',
      }
    : { ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [activeSection, setActiveSection] = useState('pessoal')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const computedGroup = form.pr_10km && form.sex
    ? assignGroup(form.sex, strToSecs(form.pr_10km)) : null
  const escalao = getEscalao(form.date_of_birth, form.sex)

  async function handleSave() {
    if (!form.name || !form.email) { setError('Nome e email são obrigatórios.'); return }
    setSaving(true); setError('')
    const payload = {
      name: form.name, email: form.email, sex: form.sex,
      date_of_birth: form.date_of_birth || null,
      nationality: form.nationality, location: form.location,
      postal_code: form.postal_code, nif: form.nif,
      club: form.club||null, is_federated: form.is_federated,
      federation_id: form.federation_id||null, trainer_grade: form.trainer_grade||null,
      height_cm: form.height_cm ? parseInt(form.height_cm) : null,
      weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
      equipment_watch: form.equipment_watch||null,
      equipment_shoes: form.equipment_shoes||null,
      pr_100m: form.pr_100m ? parseFloat(form.pr_100m) : null,
      pr_200m: form.pr_200m ? parseFloat(form.pr_200m) : null,
      pr_400m: form.pr_400m ? parseFloat(form.pr_400m) : null,
      pr_800m: form.pr_800m ? parseMidTime(form.pr_800m) : null,
      pr_1500m: form.pr_1500m ? parseMidTime(form.pr_1500m) : null,
      pr_3000m: form.pr_3000m ? parseMidTime(form.pr_3000m) : null,
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

  const SECTIONS = [
    { id:'pessoal', label:'Pessoal' },
    { id:'federativo', label:'Fed. & PRs' },
    { id:'fisico', label:'Físico' },
    { id:'outro', label:'Outro' },
  ]

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '24px 16px' }}>
      <div style={{ background: 'var(--surface)', borderRadius: 20, padding: 24, width: '100%', maxWidth: 540, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ color: 'var(--text)', fontWeight: 800, fontSize: 17 }}>{athlete ? 'Editar atleta' : 'Adicionar atleta'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        {/* Section tabs */}
        <div style={{ display:'flex', gap:6, marginBottom:16, overflowX:'auto' }}>
          {SECTIONS.map(s=>(
            <button key={s.id} onClick={()=>setActiveSection(s.id)}
              style={{ padding:'6px 12px', borderRadius:20, border:'none', cursor:'pointer', fontWeight:700, fontSize:12, whiteSpace:'nowrap',
                background: activeSection===s.id?'var(--orange)':'var(--surface2)',
                color: activeSection===s.id?'#fff':'var(--text-muted)' }}>
              {s.label}
            </button>
          ))}
        </div>

        {activeSection==='pessoal' && (
          <>
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
              <Full><input {...I} placeholder="Clube" value={form.club} onChange={e => set('club', e.target.value)} /></Full>
            </Grid>
          </>
        )}

        {activeSection==='federativo' && (
          <>
            <Section label="Federação" />
            <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:16 }}>
              <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', color:'var(--text)', fontSize:14 }}>
                <input type="checkbox" checked={form.is_federated} onChange={e=>set('is_federated',e.target.checked)} style={{ width:18,height:18,accentColor:'#0A84FF' }}/>
                Atleta federado FPA
              </label>
              {form.is_federated && <input {...I} placeholder="Nº federado" value={form.federation_id} onChange={e=>set('federation_id',e.target.value)} />}
              {escalao && <div style={{ padding:'8px 12px', background: escalaoColor(escalao)+'15', borderRadius:10, fontSize:13, color: escalaoColor(escalao), fontWeight:700 }}>Escalão: {escalao}</div>}
              <div>
                <label style={{ color:'var(--text-muted)', fontSize:11, display:'block', marginBottom:4 }}>Grau de treinador</label>
                <select {...I} value={form.trainer_grade} onChange={e=>set('trainer_grade',e.target.value)}>
                  <option value="">— não aplicável —</option>
                  <option value="Grau I">Grau I</option>
                  <option value="Grau II">Grau II</option>
                  <option value="Grau III">Grau III</option>
                  <option value="Grau IV">Grau IV</option>
                </select>
              </div>
            </div>

            <Section label="Records Pessoais" />
            <Grid>
              {[['pr_100m','100m','ex: 11.42'],['pr_200m','200m','ex: 23.15'],['pr_400m','400m','ex: 52.30'],
                ['pr_800m','800m','ex: 2:01.50'],['pr_1500m','1500m','ex: 4:12.00'],['pr_3000m','3000m','ex: 9:30.00'],
                ['pr_5km','5km','ex: 17:30'],['pr_10km','10km','ex: 35:00']].map(([key,label,ph])=>(
                <Half key={key}>
                  <label style={{ color:'var(--text-muted)', fontSize:11, display:'block', marginBottom:4 }}>{label}</label>
                  <input {...I} placeholder={ph} value={form[key]||''} onChange={e=>set(key,e.target.value)} style={{ ...I.style, fontFamily:'monospace' }}/>
                </Half>
              ))}
            </Grid>
            {computedGroup && (
              <div style={{ margin:'8px 0 14px', padding:'8px 14px', background:'rgba(255,107,53,0.1)', borderRadius:10, display:'inline-block' }}>
                <span style={{ color:'var(--text-muted)', fontSize:12 }}>Grupo calculado: </span>
                <span style={{ color:GROUPS[computedGroup], fontWeight:800 }}>{computedGroup}</span>
              </div>
            )}
          </>
        )}

        {activeSection==='fisico' && (
          <>
            <Section label="Dados físicos" />
            <Grid>
              <Half>
                <label style={{ color:'var(--text-muted)', fontSize:11, display:'block', marginBottom:4 }}>Altura (cm)</label>
                <input {...I} type="number" placeholder="170" value={form.height_cm} onChange={e=>set('height_cm',e.target.value)} />
              </Half>
              <Half>
                <label style={{ color:'var(--text-muted)', fontSize:11, display:'block', marginBottom:4 }}>Peso (kg)</label>
                <input {...I} type="number" step="0.1" placeholder="65.0" value={form.weight_kg} onChange={e=>set('weight_kg',e.target.value)} />
              </Half>
              <Full>
                <label style={{ color:'var(--text-muted)', fontSize:11, display:'block', marginBottom:4 }}>Relógio GPS</label>
                <input {...I} placeholder="ex: Garmin Forerunner 965" value={form.equipment_watch} onChange={e=>set('equipment_watch',e.target.value)} />
              </Full>
              <Full>
                <label style={{ color:'var(--text-muted)', fontSize:11, display:'block', marginBottom:4 }}>Ténis de corrida</label>
                <input {...I} placeholder="ex: Nike Vaporfly 3" value={form.equipment_shoes} onChange={e=>set('equipment_shoes',e.target.value)} />
              </Full>
            </Grid>
          </>
        )}

        {activeSection==='outro' && (
          <>
            <Section label="Treinador & Opções" />
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
          </>
        )}

        {error && <p style={{ color: '#FF453A', fontSize: 13, marginBottom: 12 }}>{error}</p>}
        <button onClick={handleSave} disabled={saving} style={{ width: '100%', padding: 13, background: 'var(--orange)', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 15, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, marginTop:8 }}>
          {saving ? 'A guardar…' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}

// ─── Tab medalhas (coach) ──────────────────────────────────────
function MedalsTab({ athlete }) {
  const [medals, setMedals] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ competition_name:'', competition_type:'official', competition_date:'', distance:'', position:'', time_seconds:'', category:'', notes:'' })
  const [saving, setSaving] = useState(false)

  const load = () => supabase.from('athlete_medals').select('*').eq('athlete_id', athlete.id)
    .order('competition_date', { ascending:false })
    .then(({ data }) => { setMedals(data||[]); setLoading(false) })

  useEffect(() => { load() }, [athlete.id])

  const setF = (k,v) => setForm(f=>({...f,[k]:v}))

  async function addMedal() {
    setSaving(true)
    const pos = parseInt(form.position)||null
    const payload = {
      athlete_id: athlete.id,
      competition_name: form.competition_name,
      competition_type: form.competition_type,
      competition_date: form.competition_date||null,
      distance: form.distance,
      position: pos,
      medal: getMedalFromPosition(pos),
      time_seconds: form.time_seconds ? parseFloat(form.time_seconds) : null,
      category: form.category||null,
      notes: form.notes||null,
    }
    await supabase.from('athlete_medals').insert(payload)
    setSaving(false); setShowForm(false)
    setForm({ competition_name:'', competition_type:'official', competition_date:'', distance:'', position:'', time_seconds:'', category:'', notes:'' })
    load()
  }

  async function deleteMedal(id) {
    await supabase.from('athlete_medals').delete().eq('id', id)
    setMedals(m => m.filter(x=>x.id!==id))
  }

  const I = { style:{ background:'var(--surface)', border:'1px solid var(--border)', color:'var(--text)', borderRadius:10, padding:'9px 12px', width:'100%', fontSize:13, boxSizing:'border-box' }}

  if (loading) return <LoadingSpinner/>

  const medalCount = { ouro:0, prata:0, bronze:0 }
  medals.forEach(m=>{ if(m.medal && medalCount[m.medal]!==undefined) medalCount[m.medal]++ })

  return (
    <div>
      {/* Resumo */}
      {medals.length > 0 && (
        <div style={{ display:'flex', gap:16, marginBottom:20, padding:'14px 18px', background:'var(--surface2)', borderRadius:14 }}>
          {[['ouro','🥇','#FFD60A'],['prata','🥈','#C0C0C0'],['bronze','🥉','#CD7F32']].map(([type,em,col])=>(
            <div key={type} style={{ textAlign:'center' }}>
              <div style={{ fontSize:22 }}>{em}</div>
              <div style={{ fontSize:20, fontWeight:900, color:col }}>{medalCount[type]}</div>
              <div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', fontWeight:600 }}>{type}</div>
            </div>
          ))}
          <div style={{ flex:1, textAlign:'right', display:'flex', alignItems:'center', justifyContent:'flex-end' }}>
            <span style={{ fontSize:13, color:'var(--text-muted)' }}>Total: <strong style={{ color:'var(--text)' }}>{medals.length} registos</strong></span>
          </div>
        </div>
      )}

      <button onClick={()=>setShowForm(s=>!s)} style={{ width:'100%', padding:'10px', borderRadius:12, border:'1px dashed var(--border)', background:'none', color:'var(--orange)', fontWeight:700, fontSize:14, cursor:'pointer', marginBottom:16 }}>
        {showForm ? '✕ Cancelar' : '+ Adicionar resultado / medalha'}
      </button>

      {showForm && (
        <div style={{ background:'var(--surface2)', borderRadius:14, padding:16, marginBottom:16 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div style={{ gridColumn:'1/-1' }}>
              <label style={{ color:'var(--text-muted)', fontSize:11, display:'block', marginBottom:4 }}>Nome da prova *</label>
              <input {...I} placeholder="ex: Lisboa Meia Maratona 2024" value={form.competition_name} onChange={e=>setF('competition_name',e.target.value)}/>
            </div>
            <div>
              <label style={{ color:'var(--text-muted)', fontSize:11, display:'block', marginBottom:4 }}>Tipo</label>
              <select {...I} value={form.competition_type} onChange={e=>setF('competition_type',e.target.value)}>
                <option value="FPA">FPA</option>
                <option value="official">Oficial</option>
                <option value="unofficial">Não oficial</option>
              </select>
            </div>
            <div>
              <label style={{ color:'var(--text-muted)', fontSize:11, display:'block', marginBottom:4 }}>Data</label>
              <input {...I} type="date" value={form.competition_date} onChange={e=>setF('competition_date',e.target.value)}/>
            </div>
            <div>
              <label style={{ color:'var(--text-muted)', fontSize:11, display:'block', marginBottom:4 }}>Distância</label>
              <select {...I} value={form.distance} onChange={e=>setF('distance',e.target.value)}>
                <option value="">— escolher —</option>
                {DISTANCES.map(d=><option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color:'var(--text-muted)', fontSize:11, display:'block', marginBottom:4 }}>Posição (1=🥇 2=🥈 3=🥉)</label>
              <input {...I} type="number" min="1" placeholder="1" value={form.position} onChange={e=>setF('position',e.target.value)}/>
            </div>
            <div>
              <label style={{ color:'var(--text-muted)', fontSize:11, display:'block', marginBottom:4 }}>Tempo (segundos)</label>
              <input {...I} type="number" step="0.01" placeholder="ex: 4920.00 = 1:22:00" value={form.time_seconds} onChange={e=>setF('time_seconds',e.target.value)}/>
            </div>
            <div>
              <label style={{ color:'var(--text-muted)', fontSize:11, display:'block', marginBottom:4 }}>Escalão / Categoria</label>
              <input {...I} placeholder="ex: Sénior M, V40 M…" value={form.category} onChange={e=>setF('category',e.target.value)}/>
            </div>
            <div>
              <label style={{ color:'var(--text-muted)', fontSize:11, display:'block', marginBottom:4 }}>Notas</label>
              <input {...I} placeholder="observações" value={form.notes} onChange={e=>setF('notes',e.target.value)}/>
            </div>
          </div>
          <button onClick={addMedal} disabled={!form.competition_name||!form.distance||saving}
            style={{ marginTop:12, padding:'10px 20px', background:'var(--orange)', border:'none', borderRadius:10, color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer', opacity:saving?0.7:1 }}>
            {saving?'A guardar…':'Guardar'}
          </button>
        </div>
      )}

      {medals.map(m=>{
        const mc = MEDAL_COLORS[m.medal]||MEDAL_COLORS.default
        return (
          <div key={m.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 14px', background:mc.bg, borderRadius:12, border:`1px solid ${mc.border}`, marginBottom:8 }}>
            <span style={{ fontSize:22,flexShrink:0 }}>{mc.emoji}</span>
            <div style={{ flex:1,minWidth:0 }}>
              <p style={{ fontSize:13,fontWeight:800,color:mc.text }}>{m.competition_name}</p>
              <p style={{ fontSize:12,color:'var(--text-muted)' }}>{m.distance} · {m.competition_date?.slice(0,10)||''} · {m.competition_type}</p>
              {m.time_seconds && <p style={{ fontSize:12,color:'var(--text)',fontFamily:'monospace' }}>{formatTime(m.time_seconds,m.distance)}</p>}
            </div>
            {m.position && <div style={{ textAlign:'center',flexShrink:0 }}>
              <p style={{ fontSize:22,fontWeight:900,color:mc.text }}>#{m.position}</p>
            </div>}
            <button onClick={()=>deleteMedal(m.id)} style={{ padding:'5px 8px',borderRadius:8,background:'rgba(255,69,58,0.1)',border:'none',color:'#FF453A',cursor:'pointer',flexShrink:0 }}>
              <Trash2 size={13}/>
            </button>
          </div>
        )
      })}

      {medals.length===0 && !showForm && (
        <p style={{ color:'var(--text-muted)', textAlign:'center', paddingTop:30, fontSize:13 }}>Sem resultados registados para este atleta.</p>
      )}
    </div>
  )
}

// ─── Helpers de semana ────────────────────────────────────────
const DAYS_KEY_ORDER = ['segunda','terça','quarta','quinta','sexta','sábado','domingo']
const DAYS_DISPLAY   = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo']
const SESSION_TYPES_IND = ['CCL','CCN','CCR','Pista','Subidas','Força','Descanso','Prova','Blocos']

function getMondayOf(date) {
  const d = new Date(date)
  const dow = d.getDay()
  d.setDate(d.getDate() - ((dow + 6) % 7))
  d.setHours(0,0,0,0)
  return d
}
function toYMD(d) { return d.toISOString().split('T')[0] }
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r }
function fmtWeek(d) {
  const end = addDays(d, 6)
  return `${d.getDate()}/${d.getMonth()+1} – ${end.getDate()}/${end.getMonth()+1}`
}

// ─── Session editor (inline) ───────────────────────────────────
const edInput = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  color: 'var(--text)', borderRadius: 8, padding: '8px 12px',
  fontSize: 13, width: '100%', boxSizing: 'border-box',
}
function SessionEditorInd({ session, onSave, onCancel }) {
  const [form, setForm] = useState(session || { type: 'CCL', description: '', distance: '', pace: '', notes: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, marginTop: 8 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <select value={form.type} onChange={e => set('type', e.target.value)} style={edInput}>
          {SESSION_TYPES_IND.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <input value={form.distance || ''} onChange={e => set('distance', e.target.value ? Number(e.target.value) : '')}
          type="number" min="0" step="0.5" placeholder="Distância (km)" style={edInput} />
      </div>
      <input value={form.description} onChange={e => set('description', e.target.value)}
        placeholder="Descrição da sessão" style={{ ...edInput, marginBottom: 8 }} />
      <input value={form.pace || ''} onChange={e => set('pace', e.target.value)}
        placeholder="Ritmo (ex: 05:30-05:45/km)" style={{ ...edInput, fontFamily: 'monospace', marginBottom: 8 }} />
      <input value={form.notes || ''} onChange={e => set('notes', e.target.value)}
        placeholder="Notas adicionais" style={{ ...edInput, marginBottom: 10 }} />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button onClick={onCancel} style={{ fontSize: 13, padding: '6px 14px', borderRadius: 8, background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer' }}>Cancelar</button>
        <button onClick={() => onSave(form)} style={{ fontSize: 13, padding: '6px 14px', borderRadius: 8, background: 'var(--orange)', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Guardar</button>
      </div>
    </div>
  )
}

// ─── Vista do plano do atleta ──────────────────────────────────
function AthletePlanView({ athlete }) {
  const [indPlan, setIndPlan] = useState(null)
  const [genPlan, setGenPlan] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const weekStart = toYMD(getMondayOf(new Date()))
      const [iR, gR] = await Promise.all([
        supabase.from('athlete_weekly_plans').select('*').eq('athlete_id', athlete.id)
          .gte('week_start', weekStart).order('week_start').limit(1).maybeSingle(),
        supabase.from('general_plans').select('*')
          .order('week_start', { ascending: false }).limit(1).maybeSingle(),
      ])
      setIndPlan(iR.data)
      setGenPlan(gR.data)
      setLoading(false)
    }
    load()
  }, [athlete.id])

  if (loading) return <LoadingSpinner />

  if (indPlan) {
    const hasAnySessions = DAYS_KEY_ORDER.some(d => (indPlan.content[d] || []).length > 0)
    return (
      <div>
        <div style={{ padding: '8px 14px', background: 'rgba(184,255,0,0.08)', borderRadius: 10, marginBottom: 16, fontSize: 13, color: 'var(--text-muted)', border: '1px solid rgba(184,255,0,0.2)' }}>
          Plano individual · semana de {fmtWeek(new Date(indPlan.week_start + 'T00:00'))}
        </div>
        {indPlan.notes && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, fontStyle: 'italic' }}>{indPlan.notes}</p>}
        {DAYS_KEY_ORDER.map((dayKey, i) => {
          const sessions = indPlan.content[dayKey] || []
          return (
            <div key={dayKey} style={{ marginBottom: 8 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{DAYS_DISPLAY[i]}</p>
              {sessions.length ? sessions.map((s, si) => <SessionCard key={si} session={s} day={DAYS_DISPLAY[i]} />)
                : <p style={{ fontSize: 12, color: 'var(--border)', fontStyle: 'italic', paddingLeft: 4 }}>Descanso</p>}
            </div>
          )
        })}
      </div>
    )
  }

  if (genPlan) {
    return (
      <>
        <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: 'var(--text-muted)' }}>
          Plano do grupo <span style={{ color: 'var(--orange)', fontWeight: 700 }}>{athlete.group}</span> — sem plano individual esta semana.
        </div>
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
  }

  return <p style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: 40 }}>Sem plano publicado.</p>
}

// ─── Editor de plano individual por semana ─────────────────────
function IndividualPlanForm({ athlete, onSaved }) {
  const [weekOffset, setWeekOffset] = useState(0)
  const [content, setContent] = useState({})
  const [notes, setNotes] = useState('')
  const [existingId, setExistingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [addingDay, setAddingDay] = useState(null)
  const [editingKey, setEditingKey] = useState(null) // `${day}:${idx}`
  const [generatingAI, setGeneratingAI] = useState(false)
  const [aiError, setAiError] = useState('')

  const monday = getMondayOf(addDays(new Date(), weekOffset * 7))
  const weekStart = toYMD(monday)

  useEffect(() => {
    setLoading(true)
    setContent({})
    setNotes('')
    setExistingId(null)
    setAddingDay(null)
    setEditingKey(null)
    supabase.from('athlete_weekly_plans').select('*')
      .eq('athlete_id', athlete.id).eq('week_start', weekStart)
      .maybeSingle()
      .then(({ data }) => {
        if (data) { setContent(data.content || {}); setNotes(data.notes || ''); setExistingId(data.id) }
        setLoading(false)
      })
  }, [athlete.id, weekStart])

  function addSession(day, session) {
    setContent(c => ({ ...c, [day]: [...(c[day] || []), session] }))
    setAddingDay(null)
  }
  function updateSession(day, idx, session) {
    setContent(c => { const days = [...(c[day] || [])]; days[idx] = session; return { ...c, [day]: days } })
    setEditingKey(null)
  }
  function removeSession(day, idx) {
    setContent(c => ({ ...c, [day]: (c[day] || []).filter((_, i) => i !== idx) }))
  }

  async function generateWithAI() {
    setGeneratingAI(true); setAiError('')
    try {
      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athlete }),
      })
      const data = await res.json()
      if (data.error) { setAiError(data.error); return }
      setContent(data.plan)
      setAddingDay(null); setEditingKey(null)
    } catch (e) {
      setAiError('Erro de ligação: ' + e.message)
    } finally {
      setGeneratingAI(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    const payload = { athlete_id: athlete.id, week_start: weekStart, content, notes, updated_at: new Date().toISOString() }
    const res = existingId
      ? await supabase.from('athlete_weekly_plans').update(payload).eq('id', existingId)
      : await supabase.from('athlete_weekly_plans').insert(payload).select().single()
    setSaving(false)
    if (!res.error) {
      if (!existingId && res.data) setExistingId(res.data.id)
      setSaved(true); onSaved?.()
      setTimeout(() => setSaved(false), 3000)
    }
  }

  const TYPE_COLORS = { CCL:'#30D158', CCN:'#FFD60A', CCR:'#FF453A', Pista:'#0A84FF', Subidas:'#BF5AF2', Força:'#00D4FF', Descanso:'#555', Prova:'#FF2D55', Blocos:'#00D4FF' }

  return (
    <div>
      {/* Week navigator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button onClick={() => setWeekOffset(w => w - 1)}
          style={{ padding: '7px 12px', borderRadius: 10, background: 'var(--surface2)', border: 'none', color: 'var(--text)', cursor: 'pointer', fontWeight: 700 }}>←</button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: weekOffset === 0 ? 'var(--heh-green,#B8FF00)' : 'var(--text)' }}>
            {weekOffset === 0 ? 'Esta semana' : weekOffset === 1 ? 'Próxima semana' : weekOffset === -1 ? 'Semana passada' : `Semana ${weekOffset > 0 ? '+' : ''}${weekOffset}`}
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fmtWeek(monday)}</p>
        </div>
        <button onClick={() => setWeekOffset(w => w + 1)}
          style={{ padding: '7px 12px', borderRadius: 10, background: 'var(--surface2)', border: 'none', color: 'var(--text)', cursor: 'pointer', fontWeight: 700 }}>→</button>
      </div>

      {existingId && (
        <div style={{ padding: '6px 12px', background: 'rgba(184,255,0,0.08)', borderRadius: 8, marginBottom: 12, fontSize: 12, color: 'rgba(184,255,0,0.8)', border: '1px solid rgba(184,255,0,0.15)' }}>
          ✓ Plano já existe para esta semana — a editar
        </div>
      )}

      {loading ? <LoadingSpinner /> : (
        <>
          {/* Gerar com IA */}
          <div style={{ marginBottom: 16 }}>
            <button onClick={generateWithAI} disabled={generatingAI}
              style={{ width: '100%', padding: '12px', borderRadius: 12, border: 'none', cursor: generatingAI ? 'wait' : 'pointer', background: 'linear-gradient(135deg, #1a0a2e 0%, #0a0a1e 100%)', borderColor: '#BF5AF2', outline: '1px solid rgba(191,90,242,0.4)', color: '#BF5AF2', fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: generatingAI ? 0.7 : 1 }}>
              {generatingAI ? (
                <>
                  <span style={{ display: 'inline-block', animation: 'spin 0.8s linear infinite', fontSize: 16 }}>⟳</span>
                  A gerar plano com IA…
                </>
              ) : (
                <>✨ Gerar plano com IA</>
              )}
            </button>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 6 }}>
              Considera grupo {athlete.group}, {athlete.sex === 'M' ? 'masculino' : 'feminino'}{athlete.pr_10km ? `, PR 10km ${Math.floor(athlete.pr_10km/60)}:${String(athlete.pr_10km%60).padStart(2,'0')}` : ''} · inclui reforço muscular
            </p>
            {aiError && <p style={{ color: '#FF453A', fontSize: 12, marginTop: 6, textAlign: 'center' }}>{aiError}</p>}
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

          {/* Separator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>OU EDITA MANUALMENTE</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {/* Days */}
          {DAYS_KEY_ORDER.map((dayKey, i) => {
            const sessions = content[dayKey] || []
            return (
              <div key={dayKey} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
                    {DAYS_DISPLAY[i]}
                  </span>
                  <button onClick={() => { setAddingDay(dayKey); setEditingKey(null) }}
                    style={{ fontSize: 12, padding: '4px 10px', borderRadius: 8, background: 'var(--surface2)', border: 'none', color: 'var(--orange)', cursor: 'pointer', fontWeight: 700 }}>
                    + Sessão
                  </button>
                </div>

                {sessions.map((s, idx) => {
                  const key = `${dayKey}:${idx}`
                  const color = TYPE_COLORS[s.type] || '#B8FF00'
                  return editingKey === key ? (
                    <SessionEditorInd key={key} session={s}
                      onSave={updated => updateSession(dayKey, idx, updated)}
                      onCancel={() => setEditingKey(null)} />
                  ) : (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: 'var(--surface2)', borderRadius: 10, marginBottom: 6, borderLeft: `3px solid ${color}` }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color, background: color + '18', padding: '2px 7px', borderRadius: 6 }}>{s.type}</span>
                          {s.distance && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.distance} km</span>}
                          {s.pace && <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{s.pace}</span>}
                        </div>
                        {s.description && <p style={{ fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.description}</p>}
                      </div>
                      <button onClick={() => { setEditingKey(key); setAddingDay(null) }}
                        style={{ fontSize: 11, padding: '4px 10px', borderRadius: 7, background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer' }}>Editar</button>
                      <button onClick={() => removeSession(dayKey, idx)}
                        style={{ fontSize: 11, padding: '4px 8px', borderRadius: 7, background: 'rgba(255,69,58,0.1)', border: 'none', color: '#FF453A', cursor: 'pointer' }}>✕</button>
                    </div>
                  )
                })}

                {sessions.length === 0 && addingDay !== dayKey && (
                  <p style={{ fontSize: 12, color: 'var(--border)', fontStyle: 'italic', paddingLeft: 4 }}>Descanso / sem sessão</p>
                )}

                {addingDay === dayKey && (
                  <SessionEditorInd
                    onSave={s => addSession(dayKey, s)}
                    onCancel={() => setAddingDay(null)} />
                )}
              </div>
            )
          })}

          {/* Notes */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Notas para o atleta (opcional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="Ex: Foca no ritmo de CCL, não forçar…"
              style={{ width: '100%', boxSizing: 'border-box', background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 10, padding: '10px 12px', fontSize: 13, resize: 'vertical' }} />
          </div>

          {saved && <p style={{ color: '#30D158', fontSize: 13, marginBottom: 10 }}>✓ Plano guardado!</p>}

          <button onClick={handleSave} disabled={saving}
            style={{ width: '100%', padding: 13, background: 'var(--orange)', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 15, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'A guardar…' : existingId ? 'Atualizar plano' : 'Publicar plano'}
          </button>
        </>
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
    { id: 'medalhas', label: 'Medalhas', icon: <Medal size={13} /> },
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

      {tab === 'perfil' && (() => {
        const escalao = getEscalao(athlete.date_of_birth, athlete.sex)
        const ec = escalaoColor(escalao)
        const PR_ROWS = [
          ['100m', athlete.pr_100m ? athlete.pr_100m.toFixed(2)+'s' : null],
          ['200m', athlete.pr_200m ? athlete.pr_200m.toFixed(2)+'s' : null],
          ['400m', athlete.pr_400m ? athlete.pr_400m.toFixed(2)+'s' : null],
          ['800m', athlete.pr_800m ? formatTime(athlete.pr_800m,'800m') : null],
          ['1500m', athlete.pr_1500m ? formatTime(athlete.pr_1500m,'1500m') : null],
          ['3000m', athlete.pr_3000m ? formatTime(athlete.pr_3000m,'3000m') : null],
          ['5km', secsToStr(athlete.pr_5km)],
          ['10km', secsToStr(athlete.pr_10km)],
        ].filter(([,v])=>v)
        return (
          <div>
            {/* Badges */}
            <div style={{ display:'flex', flexWrap:'wrap', gap:7, marginBottom:14 }}>
              {escalao && <span style={{ background:ec+'22',color:ec,fontWeight:700,padding:'4px 12px',borderRadius:20,fontSize:12 }}>{escalao}</span>}
              {athlete.is_federated && (
                <span style={{ background:'rgba(10,132,255,0.15)',color:'#0A84FF',fontWeight:700,padding:'4px 12px',borderRadius:20,fontSize:12,display:'flex',alignItems:'center',gap:4 }}>
                  <Shield size={10}/> FPA {athlete.federation_id?`#${athlete.federation_id}`:''}
                </span>
              )}
              {athlete.club && <span style={{ background:'rgba(255,255,255,0.07)',color:'var(--text-muted)',fontWeight:600,padding:'4px 12px',borderRadius:20,fontSize:12 }}>🏟 {athlete.club}</span>}
              {athlete.trainer_grade && <span style={{ background:'rgba(191,90,242,0.15)',color:'#BF5AF2',fontWeight:600,padding:'4px 12px',borderRadius:20,fontSize:12 }}>🏅 {athlete.trainer_grade}</span>}
            </div>

            {/* PRs grid */}
            {PR_ROWS.length > 0 && (
              <div style={{ marginBottom:14 }}>
                <p style={{ color:'var(--orange)',fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:1,marginBottom:10 }}>Records Pessoais</p>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
                  {PR_ROWS.map(([dist,val])=>(
                    <div key={dist} style={{ background:'var(--surface2)',borderRadius:10,padding:'8px 10px',textAlign:'center' }}>
                      <p style={{ fontSize:10,color:'var(--text-muted)',fontWeight:600,marginBottom:3 }}>{dist}</p>
                      <p style={{ fontSize:14,fontWeight:800,color:'var(--text)',fontFamily:'monospace' }}>{val}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dados */}
            {[
              ['Sexo', athlete.sex === 'M' ? 'Masculino' : 'Feminino'],
              ['Nascimento', athlete.date_of_birth],
              ['Nacionalidade', athlete.nationality],
              ['Localidade', athlete.location],
              ['Código postal', athlete.postal_code],
              ['Altura', athlete.height_cm ? `${athlete.height_cm} cm` : null],
              ['Peso', athlete.weight_kg ? `${athlete.weight_kg} kg` : null],
              ['Relógio', athlete.equipment_watch],
              ['Ténis', athlete.equipment_shoes],
              ['Modalidades', athlete.modalities?.join(', ')],
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
        )
      })()}
      {tab === 'medalhas' && <MedalsTab athlete={athlete} />}
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
