import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { calculateZones, formatZoneRange } from '../../utils/pace'
import { Camera, LogOut, Save, ChevronDown } from 'lucide-react'

// ─── Dados ────────────────────────────────────────────────────
const COUNTRIES = [
  'Portuguesa', 'Angolana', 'Brasileira', 'Cabo-verdiana', 'Espanhola',
  'Francesa', 'Alemã', 'Italiana', 'Inglesa', 'Holandesa', 'Belga',
  'Suíça', 'Sueca', 'Norueguesa', 'Dinamarquesa', 'Polaca', 'Romena',
  'Ucraniana', 'Russa', 'Americana', 'Canadiana', 'Australiana',
  'Japonesa', 'Chinesa', 'Indiana', 'Marroquina', 'Senegalesa',
  'Moçambicana', 'Sul-africana', 'Outra',
]

const MODALITY_OPTIONS = [
  'Atletismo', 'Ciclismo', 'Natação', 'Triatlo', 'Trail Running',
  'Corrida de Estrada', 'Pista', 'Cross Country', 'Marcha Atlética',
]

const SPEC_OPTIONS = {
  'Atletismo': ['Provas de Estrada', 'Pista', 'Cross Country', 'Saltos', 'Lançamentos'],
  'Corrida de Estrada': ['5km', '10km', 'Meia Maratona', 'Maratona', 'Ultra'],
  'Trail Running': ['Short Trail', 'Long Trail', 'Ultra Trail'],
  'Triatlo': ['Sprint', 'Olímpico', 'Half Ironman', 'Ironman'],
}

const GROUP_COLORS = {
  G1: '#FF6B35', G2: '#F7C59F', G3: '#c8c89e',
  G4: '#4d9fd6', G5: '#1A936F', G6: '#88D498',
}

const ZONE_CONFIG = [
  { key: 'CCL', label: 'CCL', bg: 'rgba(48,209,88,0.12)', text: '#30D158' },
  { key: 'CCN', label: 'CCN', bg: 'rgba(255,214,10,0.12)', text: '#FFD60A' },
  { key: 'CCR', label: 'CCR', bg: 'rgba(255,69,58,0.12)', text: '#FF453A' },
]

// ─── PR Time Picker ───────────────────────────────────────────
function PRPicker({ label, value, onChange }) {
  const mins = value ? Math.floor(value / 60) : ''
  const secs = value ? value % 60 : ''

  const setVal = (m, s) => {
    const mv = parseInt(m)
    const sv = parseInt(s)
    if (!isNaN(mv) && !isNaN(sv)) onChange(mv * 60 + sv)
    else if (m === '' && s === '') onChange(null)
  }

  return (
    <div>
      <label style={{ color: 'var(--text-muted)', fontSize: 11, display: 'block', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface2)', borderRadius: 12, padding: '10px 14px', border: '1px solid var(--border)' }}>
        <select
          value={mins}
          onChange={e => setVal(e.target.value, secs !== '' ? secs : 0)}
          style={{ background: 'transparent', border: 'none', color: 'var(--text)', fontSize: 20, fontWeight: 700, fontFamily: 'monospace', width: 52, cursor: 'pointer', outline: 'none' }}>
          <option value="">--</option>
          {Array.from({ length: 90 }, (_, i) => <option key={i} value={i}>{String(i).padStart(2, '0')}</option>)}
        </select>
        <span style={{ color: 'var(--text)', fontWeight: 800, fontSize: 20 }}>:</span>
        <select
          value={secs !== '' ? String(secs).padStart(2, '0') : ''}
          onChange={e => setVal(mins !== '' ? mins : 0, e.target.value)}
          style={{ background: 'transparent', border: 'none', color: 'var(--text)', fontSize: 20, fontWeight: 700, fontFamily: 'monospace', width: 52, cursor: 'pointer', outline: 'none' }}>
          <option value="">--</option>
          {[0, 15, 30, 45].map(s => <option key={s} value={s}>{String(s).padStart(2, '0')}</option>)}
          {Array.from({ length: 60 }, (_, i) => i).filter(i => ![0, 15, 30, 45].includes(i)).map(s => (
            <option key={s} value={s}>{String(s).padStart(2, '0')}</option>
          ))}
        </select>
        <span style={{ color: 'var(--text-muted)', fontSize: 11, marginLeft: 4 }}>MM:SS</span>
      </div>
    </div>
  )
}

// ─── Select com pesquisa ──────────────────────────────────────
function SearchSelect({ label, value, onChange, options, placeholder = 'Selecionar…' }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const filtered = options.filter(o => o.toLowerCase().includes(q.toLowerCase()))

  return (
    <div style={{ position: 'relative' }}>
      <label style={{ color: 'var(--text-muted)', fontSize: 11, display: 'block', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</label>
      <button onClick={() => setOpen(o => !o)} type="button"
        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12, padding: '11px 14px', color: value ? 'var(--text)' : 'var(--text-muted)', fontSize: 14, cursor: 'pointer', textAlign: 'left', fontWeight: value ? 600 : 400 }}>
        {value || placeholder}
        <ChevronDown size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, marginTop: 4, maxHeight: 240, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
          <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
            <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Pesquisar…"
              style={{ width: '100%', background: 'var(--surface2)', border: 'none', borderRadius: 8, padding: '7px 10px', color: 'var(--text)', fontSize: 13, boxSizing: 'border-box', outline: 'none' }} />
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filtered.map(o => (
              <button key={o} type="button" onClick={() => { onChange(o); setOpen(false); setQ('') }}
                style={{ width: '100%', padding: '10px 14px', background: o === value ? 'rgba(255,107,53,0.1)' : 'transparent', border: 'none', color: o === value ? 'var(--orange)' : 'var(--text)', fontSize: 14, textAlign: 'left', cursor: 'pointer', fontWeight: o === value ? 700 : 400 }}>
                {o}
              </button>
            ))}
            {!filtered.length && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 16, fontSize: 13 }}>Sem resultados</p>}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Multi-select chips ───────────────────────────────────────
function ChipSelect({ label, options, value = [], onChange }) {
  return (
    <div>
      <label style={{ color: 'var(--text-muted)', fontSize: 11, display: 'block', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
        {options.map(o => {
          const selected = value.includes(o)
          return (
            <button key={o} type="button"
              onClick={() => onChange(selected ? value.filter(v => v !== o) : [...value, o])}
              style={{ padding: '7px 13px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: selected ? 'var(--orange)' : 'var(--surface2)', color: selected ? '#fff' : 'var(--text-muted)', transition: 'all 0.15s' }}>
              {o}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Card section ─────────────────────────────────────────────
function Card({ title, children }) {
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 18, padding: 20, marginBottom: 16, border: '1px solid var(--border)' }}>
      {title && <p style={{ color: 'var(--orange)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>{title}</p>}
      {children}
    </div>
  )
}

// ─── Avatar upload ────────────────────────────────────────────
function AvatarUpload({ athlete, onUploaded }) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef()
  const gc = GROUP_COLORS[athlete.group] || 'var(--orange)'

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${athlete.id}.${ext}`
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (upErr) { setUploading(false); alert(upErr.message); return }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    await supabase.from('athletes').update({ avatar_url: publicUrl + '?t=' + Date.now() }).eq('id', athlete.id)
    setUploading(false)
    onUploaded(publicUrl)
  }

  return (
    <div style={{ textAlign: 'center', marginBottom: 8 }}>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        {athlete.avatar_url
          ? <img src={athlete.avatar_url} alt="avatar" style={{ width: 88, height: 88, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${gc}` }} />
          : (
            <div style={{ width: 88, height: 88, borderRadius: '50%', background: gc + '33', border: `3px solid ${gc}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, fontWeight: 800, color: gc }}>
              {athlete.name?.[0]?.toUpperCase()}
            </div>
          )
        }
        <button onClick={() => inputRef.current?.click()} disabled={uploading}
          style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: '50%', background: 'var(--orange)', border: '2px solid var(--dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Camera size={13} color="#fff" />
        </button>
        <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
      </div>
      {uploading && <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 8 }}>A carregar foto…</p>}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────
export default function MyProfile() {
  const { athlete: initAthlete, signOut, refreshAthlete } = useAuth()
  const navigate = useNavigate()
  const [athlete, setAthlete] = useState(initAthlete)
  const [form, setForm] = useState(() => ({
    name: initAthlete?.name || '',
    sex: initAthlete?.sex || 'M',
    date_of_birth: initAthlete?.date_of_birth || '',
    nationality: initAthlete?.nationality || 'Portuguesa',
    location: initAthlete?.location || '',
    postal_code: initAthlete?.postal_code || '',
    nif: initAthlete?.nif || '',
    pr_10km: initAthlete?.pr_10km || null,
    pr_5km: initAthlete?.pr_5km || null,
    modalities: initAthlete?.modalities || [],
    specializations: initAthlete?.specializations || [],
    strava_url: initAthlete?.strava_url || '',
  }))
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState(null)

  if (!athlete) return null

  const gc = GROUP_COLORS[athlete.group] || 'var(--orange)'
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const availableSpecs = [
    ...new Set(form.modalities.flatMap(m => SPEC_OPTIONS[m] || []))
  ]

  const zones10 = form.pr_10km ? calculateZones(form.pr_10km, 10) : null
  const zones5 = form.pr_5km ? calculateZones(form.pr_5km, 5) : null

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase.from('athletes').update({
      name: form.name,
      sex: form.sex,
      date_of_birth: form.date_of_birth || null,
      nationality: form.nationality,
      location: form.location,
      postal_code: form.postal_code,
      nif: form.nif,
      pr_10km: form.pr_10km,
      pr_5km: form.pr_5km,
      modalities: form.modalities,
      specializations: form.specializations,
      strava_url: form.strava_url,
    }).eq('id', athlete.id)
    setSaving(false)
    if (error) { setStatus({ ok: false, msg: error.message }); return }
    setStatus({ ok: true, msg: '✓ Perfil guardado!' })
    await refreshAthlete()
    setTimeout(() => setStatus(null), 3000)
  }

  const inp = {
    style: {
      background: 'var(--surface2)', border: '1px solid var(--border)',
      color: 'var(--text)', borderRadius: 12, padding: '11px 14px',
      width: '100%', fontSize: 14, boxSizing: 'border-box',
    }
  }

  const formatPR = secs => {
    if (!secs) return null
    return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`
  }

  return (
    <div style={{ maxWidth: 540, margin: '0 auto', padding: '24px 16px 120px', background: 'var(--dark)', minHeight: '100vh' }}>

      {/* Avatar + nome + grupo */}
      <AvatarUpload athlete={athlete} onUploaded={url => setAthlete(a => ({ ...a, avatar_url: url }))} />
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h2 style={{ color: 'var(--text)', fontWeight: 800, fontSize: 20 }}>{athlete.name}</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 8 }}>{athlete.email}</p>
        <span style={{ display: 'inline-block', background: gc + '22', color: gc, fontWeight: 800, padding: '4px 16px', borderRadius: 20, fontSize: 13 }}>
          {athlete.group}
        </span>
      </div>

      {/* Zonas de ritmo */}
      {(zones10 || zones5) && (
        <Card title="Zonas de ritmo">
          {[
            { zones: zones10, label: `10km — ${formatPR(form.pr_10km)}` },
            { zones: zones5, label: `5km — ${formatPR(form.pr_5km)}` },
          ].filter(x => x.zones).map(({ zones, label }) => (
            <div key={label} style={{ marginBottom: 14 }}>
              <p style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 8, fontWeight: 600 }}>{label}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                {ZONE_CONFIG.map(({ key, label: l, bg, text }) => (
                  <div key={key} style={{ background: bg, borderRadius: 10, padding: 10, textAlign: 'center' }}>
                    <p style={{ color: text, fontWeight: 800, fontSize: 11, marginBottom: 3 }}>{l}</p>
                    <p style={{ color: 'var(--text)', fontSize: 11, fontFamily: 'monospace' }}>{formatZoneRange(zones[key])}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Dados pessoais */}
      <Card title="Dados pessoais">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ color: 'var(--text-muted)', fontSize: 11, display: 'block', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Nome completo</label>
            <input {...inp} value={form.name} onChange={e => set('name', e.target.value)} />
          </div>

          <div>
            <label style={{ color: 'var(--text-muted)', fontSize: 11, display: 'block', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Sexo</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[['M', 'Masculino'], ['F', 'Feminino']].map(([v, l]) => (
                <button key={v} type="button" onClick={() => set('sex', v)}
                  style={{ flex: 1, padding: '10px', borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, background: form.sex === v ? 'var(--orange)' : 'var(--surface2)', color: form.sex === v ? '#fff' : 'var(--text-muted)' }}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ color: 'var(--text-muted)', fontSize: 11, display: 'block', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Data de nascimento</label>
            <input {...inp} type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} />
          </div>

          <SearchSelect label="Nacionalidade" value={form.nationality} onChange={v => set('nationality', v)} options={COUNTRIES} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ color: 'var(--text-muted)', fontSize: 11, display: 'block', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Localidade</label>
              <input {...inp} value={form.location} onChange={e => set('location', e.target.value)} />
            </div>
            <div>
              <label style={{ color: 'var(--text-muted)', fontSize: 11, display: 'block', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Código postal</label>
              <input {...inp} value={form.postal_code} onChange={e => set('postal_code', e.target.value)} />
            </div>
          </div>

          <div>
            <label style={{ color: 'var(--text-muted)', fontSize: 11, display: 'block', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>NIF</label>
            <input {...inp} value={form.nif} onChange={e => set('nif', e.target.value)} />
          </div>
        </div>
      </Card>

      {/* Dados desportivos */}
      <Card title="Dados desportivos">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <PRPicker label="PR 10km" value={form.pr_10km} onChange={v => set('pr_10km', v)} />
            <PRPicker label="PR 5km" value={form.pr_5km} onChange={v => set('pr_5km', v)} />
          </div>

          <ChipSelect label="Modalidades" options={MODALITY_OPTIONS} value={form.modalities} onChange={v => set('modalities', v)} />

          {availableSpecs.length > 0 && (
            <ChipSelect label="Especializações" options={availableSpecs} value={form.specializations} onChange={v => set('specializations', v)} />
          )}

          <div>
            <label style={{ color: 'var(--text-muted)', fontSize: 11, display: 'block', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>URL Strava</label>
            <input {...inp} placeholder="https://www.strava.com/athletes/…" value={form.strava_url} onChange={e => set('strava_url', e.target.value)} />
          </div>
        </div>
      </Card>

      {/* Guardar */}
      {status && (
        <p style={{ color: status.ok ? '#30D158' : '#FF453A', fontSize: 14, fontWeight: 600, textAlign: 'center', marginBottom: 12 }}>{status.msg}</p>
      )}
      <button onClick={handleSave} disabled={saving}
        style={{ width: '100%', padding: 15, background: 'var(--orange)', border: 'none', borderRadius: 14, color: '#fff', fontWeight: 800, fontSize: 15, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
        <Save size={16} /> {saving ? 'A guardar…' : 'Guardar perfil'}
      </button>

      <button onClick={async () => { await signOut(); navigate('/') }}
        style={{ width: '100%', padding: 13, background: 'none', border: '1px solid var(--border)', borderRadius: 14, color: 'var(--text-muted)', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <LogOut size={15} /> Terminar sessão
      </button>
    </div>
  )
}
