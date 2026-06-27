import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { calculateZones, formatZoneRange } from '../../utils/pace'
import { getEscalao, escalaoColor, formatTime, DISTANCES, MEDAL_COLORS, getMedalFromPosition } from '../../utils/escalao'
import { Camera, LogOut, Save, ChevronDown, Plus, Trash2, Shield } from 'lucide-react'

const COUNTRIES = [
  'Portuguesa','Angolana','Brasileira','Cabo-verdiana','Espanhola','Francesa',
  'Alemã','Italiana','Inglesa','Holandesa','Belga','Suíça','Sueca','Norueguesa',
  'Dinamarquesa','Polaca','Romena','Ucraniana','Russa','Americana','Canadiana',
  'Australiana','Japonesa','Chinesa','Indiana','Marroquina','Senegalesa',
  'Moçambicana','Sul-africana','Outra',
]

const MODALITY_OPTIONS = [
  'Corrida de Estrada','Pista','Cross Country','Trail Running',
  'Marcha Atlética','Saltos','Lançamentos','Combinadas','Triatlo',
]

const GROUP_COLORS = {
  G1:'#FF6B35',G2:'#F7C59F',G3:'#c8c89e',G4:'#4d9fd6',G5:'#1A936F',G6:'#88D498',
}

const ZONE_CONFIG = [
  { key:'CCL', label:'CCL', bg:'rgba(48,209,88,0.12)',  text:'#30D158' },
  { key:'CCN', label:'CCN', bg:'rgba(255,214,10,0.12)', text:'#FFD60A' },
  { key:'CCR', label:'CCR', bg:'rgba(255,69,58,0.12)',  text:'#FF453A' },
]

const PR_FIELDS = [
  { key:'pr_100m',  label:'100m',  type:'track', placeholder:'11.42' },
  { key:'pr_200m',  label:'200m',  type:'track', placeholder:'23.15' },
  { key:'pr_400m',  label:'400m',  type:'track', placeholder:'52.30' },
  { key:'pr_800m',  label:'800m',  type:'mid',   placeholder:'2:01.50' },
  { key:'pr_1500m', label:'1500m', type:'mid',   placeholder:'4:12.00' },
  { key:'pr_3000m', label:'3000m', type:'mid',   placeholder:'9:30.00' },
  { key:'pr_5km',   label:'5km',   type:'road',  placeholder:'17:30' },
  { key:'pr_10km',  label:'10km',  type:'road',  placeholder:'35:00' },
]

// ── Utilitários de conversão ──────────────────────────────────
function parseTrackTime(str) {
  // "11.42" → 11.42 (seconds)
  const n = parseFloat(str.replace(',','.'))
  return isNaN(n) ? null : n
}
function parseMidTime(str) {
  // "2:01.50" → 121.50 seconds  or "2:01" → 121
  if (!str) return null
  if (str.includes(':')) {
    const [m, s] = str.split(':')
    const mins = parseInt(m)
    const secs = parseFloat(s.replace(',','.'))
    if (isNaN(mins) || isNaN(secs)) return null
    return mins * 60 + secs
  }
  return parseFloat(str) || null
}
function parseRoadTime(str) {
  // "35:00" → 2100
  if (!str) return null
  if (str.includes(':')) {
    const [m, s] = str.split(':')
    return parseInt(m) * 60 + parseInt(s)
  }
  return null
}
function secsToRoad(s) {
  if (!s) return ''
  return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`
}
function secsToMid(s) {
  if (!s) return ''
  const m = Math.floor(s/60)
  const sec = (s%60).toFixed(2).padStart(5,'0')
  return `${m}:${sec}`
}

// ── Input style ───────────────────────────────────────────────
const inp = {
  style:{
    background:'var(--surface2)',border:'1px solid var(--border)',
    color:'var(--text)',borderRadius:12,padding:'11px 14px',
    width:'100%',fontSize:14,boxSizing:'border-box',outline:'none',
  }
}

// ── Components ────────────────────────────────────────────────
function Label({ children }) {
  return <label style={{color:'var(--text-muted)',fontSize:11,display:'block',marginBottom:6,fontWeight:600,textTransform:'uppercase',letterSpacing:0.5}}>{children}</label>
}
function Card({ title, children, accent }) {
  return (
    <div style={{background:'var(--surface)',borderRadius:18,padding:20,marginBottom:16,border:'1px solid var(--border)'}}>
      {title && <p style={{color:accent||'var(--orange)',fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:1,marginBottom:16}}>{title}</p>}
      {children}
    </div>
  )
}
function Row({ children }) { return <div style={{display:'flex',gap:10,marginBottom:14}}>{children}</div> }
function Col({ children, flex=1 }) { return <div style={{flex}}>{children}</div> }

function AvatarUpload({ athlete, onUploaded }) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef()
  const gc = GROUP_COLORS[athlete.group]||'var(--orange)'
  async function handleFile(e) {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${athlete.id}.${ext}`
    await supabase.storage.from('avatars').upload(path, file, { upsert:true })
    const { data:{ publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    await supabase.from('athletes').update({ avatar_url: publicUrl+'?t='+Date.now() }).eq('id', athlete.id)
    setUploading(false); onUploaded(publicUrl)
  }
  return (
    <div style={{textAlign:'center',marginBottom:8}}>
      <div style={{position:'relative',display:'inline-block'}}>
        {athlete.avatar_url
          ? <img src={athlete.avatar_url} alt="avatar" style={{width:88,height:88,borderRadius:'50%',objectFit:'cover',border:`3px solid ${gc}`}} />
          : <div style={{width:88,height:88,borderRadius:'50%',background:gc+'33',border:`3px solid ${gc}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:34,fontWeight:800,color:gc}}>{athlete.name?.[0]?.toUpperCase()}</div>
        }
        {athlete.is_federated && (
          <div style={{position:'absolute',bottom:-2,left:-4,background:'#0A84FF',borderRadius:'50%',width:24,height:24,display:'flex',alignItems:'center',justifyContent:'center',border:'2px solid var(--dark)'}} title="Federado FPA">
            <Shield size={12} color="#fff" />
          </div>
        )}
        <button onClick={()=>inputRef.current?.click()} disabled={uploading}
          style={{position:'absolute',bottom:0,right:0,width:28,height:28,borderRadius:'50%',background:'var(--orange)',border:'2px solid var(--dark)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
          <Camera size={13} color="#fff"/>
        </button>
        <input ref={inputRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleFile}/>
      </div>
      {uploading && <p style={{color:'var(--text-muted)',fontSize:12,marginTop:8}}>A carregar…</p>}
    </div>
  )
}

// ── Medal card ────────────────────────────────────────────────
function MedalCard({ medal }) {
  const mc = MEDAL_COLORS[medal.medal] || MEDAL_COLORS.default
  return (
    <div style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',background:mc.bg,borderRadius:12,border:`1px solid ${mc.border}`,marginBottom:8}}>
      <span style={{fontSize:24,flexShrink:0}}>{mc.emoji}</span>
      <div style={{flex:1,minWidth:0}}>
        <p style={{fontSize:13,fontWeight:800,color:mc.text}}>{medal.competition_name}</p>
        <p style={{fontSize:12,color:'var(--text-muted)'}}>{medal.distance} · {medal.category||''} · {medal.competition_date?.slice(0,4)||''}</p>
        {medal.time_seconds && <p style={{fontSize:12,color:'var(--text)',fontFamily:'monospace'}}>{formatTime(medal.time_seconds, medal.distance)}</p>}
      </div>
      <div style={{textAlign:'right',flexShrink:0}}>
        <p style={{fontSize:10,fontWeight:700,color:mc.text,textTransform:'uppercase'}}>{medal.competition_type}</p>
        {medal.position && <p style={{fontSize:18,fontWeight:900,color:mc.text}}>#{medal.position}</p>}
      </div>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────
export default function MyProfile() {
  const { athlete:initAthlete, signOut, refreshAthlete } = useAuth()
  const navigate = useNavigate()
  const [athlete, setAthlete] = useState(initAthlete)
  const [medals, setMedals] = useState([])
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState(null)

  const [form, setForm] = useState(() => ({
    name:             initAthlete?.name||'',
    sex:              initAthlete?.sex||'M',
    date_of_birth:    initAthlete?.date_of_birth||'',
    nationality:      initAthlete?.nationality||'Portuguesa',
    location:         initAthlete?.location||'',
    postal_code:      initAthlete?.postal_code||'',
    nif:              initAthlete?.nif||'',
    club:             initAthlete?.club||'',
    is_federated:     initAthlete?.is_federated||false,
    federation_id:    initAthlete?.federation_id||'',
    height_cm:        initAthlete?.height_cm||'',
    weight_kg:        initAthlete?.weight_kg||'',
    equipment_watch:  initAthlete?.equipment_watch||'',
    equipment_shoes:  initAthlete?.equipment_shoes||'',
    trainer_grade:    initAthlete?.trainer_grade||'',
    modalities:       initAthlete?.modalities||[],
    strava_url:       initAthlete?.strava_url||'',
    // PRs — stored as strings for editing
    pr_100m:  initAthlete?.pr_100m  ? String(initAthlete.pr_100m)  : '',
    pr_200m:  initAthlete?.pr_200m  ? String(initAthlete.pr_200m)  : '',
    pr_400m:  initAthlete?.pr_400m  ? String(initAthlete.pr_400m)  : '',
    pr_800m:  initAthlete?.pr_800m  ? secsToMid(initAthlete.pr_800m)  : '',
    pr_1500m: initAthlete?.pr_1500m ? secsToMid(initAthlete.pr_1500m) : '',
    pr_3000m: initAthlete?.pr_3000m ? secsToMid(initAthlete.pr_3000m) : '',
    pr_5km:   initAthlete?.pr_5km   ? secsToRoad(initAthlete.pr_5km)  : '',
    pr_10km:  initAthlete?.pr_10km  ? secsToRoad(initAthlete.pr_10km) : '',
  }))

  useEffect(() => {
    if (!initAthlete) return
    supabase.from('athlete_medals').select('*').eq('athlete_id', initAthlete.id)
      .order('competition_date', { ascending: false })
      .then(({ data }) => setMedals(data||[]))
  }, [initAthlete?.id])

  if (!athlete) return null
  const gc = GROUP_COLORS[athlete.group]||'var(--orange)'
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const escalao = getEscalao(form.date_of_birth, form.sex)
  const escalaoC = escalaoColor(escalao)
  const zones10 = form.pr_10km ? calculateZones(parseRoadTime(form.pr_10km), 10) : null
  const zones5  = form.pr_5km  ? calculateZones(parseRoadTime(form.pr_5km),  5)  : null

  const medalCount = { ouro:0, prata:0, bronze:0 }
  medals.forEach(m => { if (m.medal && medalCount[m.medal] !== undefined) medalCount[m.medal]++ })
  const totalMedals = medalCount.ouro + medalCount.prata + medalCount.bronze

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase.from('athletes').update({
      name: form.name, sex: form.sex,
      date_of_birth: form.date_of_birth||null,
      nationality: form.nationality,
      location: form.location, postal_code: form.postal_code, nif: form.nif,
      club: form.club, is_federated: form.is_federated,
      federation_id: form.federation_id||null,
      height_cm: form.height_cm ? parseInt(form.height_cm) : null,
      weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
      equipment_watch: form.equipment_watch||null,
      equipment_shoes: form.equipment_shoes||null,
      trainer_grade: form.trainer_grade||null,
      modalities: form.modalities,
      strava_url: form.strava_url||null,
      pr_100m:  form.pr_100m  ? parseTrackTime(form.pr_100m)  : null,
      pr_200m:  form.pr_200m  ? parseTrackTime(form.pr_200m)  : null,
      pr_400m:  form.pr_400m  ? parseTrackTime(form.pr_400m)  : null,
      pr_800m:  form.pr_800m  ? parseMidTime(form.pr_800m)   : null,
      pr_1500m: form.pr_1500m ? parseMidTime(form.pr_1500m)  : null,
      pr_3000m: form.pr_3000m ? parseMidTime(form.pr_3000m)  : null,
      pr_5km:   form.pr_5km   ? parseRoadTime(form.pr_5km)   : null,
      pr_10km:  form.pr_10km  ? parseRoadTime(form.pr_10km)  : null,
    }).eq('id', athlete.id)
    setSaving(false)
    if (error) { setStatus({ok:false,msg:error.message}); return }
    setStatus({ok:true,msg:'✓ Perfil guardado!'})
    await refreshAthlete()
    setTimeout(()=>setStatus(null),3000)
  }

  const MODALITY_OPTIONS = [
    'Corrida de Estrada','Pista','Cross Country','Trail Running',
    'Marcha Atlética','Saltos','Lançamentos','Combinadas','Triatlo',
  ]

  return (
    <div style={{maxWidth:540,margin:'0 auto',padding:'24px 16px 120px',background:'var(--dark)',minHeight:'100vh'}}>

      {/* Avatar */}
      <AvatarUpload athlete={athlete} onUploaded={url=>setAthlete(a=>({...a,avatar_url:url}))} />

      {/* Header */}
      <div style={{textAlign:'center',marginBottom:24}}>
        <h2 style={{color:'var(--text)',fontWeight:800,fontSize:20,marginBottom:4}}>{athlete.name}</h2>
        <p style={{color:'var(--text-muted)',fontSize:13,marginBottom:8}}>{athlete.email}</p>
        <div style={{display:'flex',justifyContent:'center',gap:8,flexWrap:'wrap'}}>
          <span style={{background:gc+'22',color:gc,fontWeight:800,padding:'4px 14px',borderRadius:20,fontSize:13}}>{athlete.group}</span>
          {escalao && (
            <span style={{background:escalaoC+'22',color:escalaoC,fontWeight:700,padding:'4px 14px',borderRadius:20,fontSize:13}}>{escalao}</span>
          )}
          {athlete.is_federated && (
            <span style={{background:'rgba(10,132,255,0.15)',color:'#0A84FF',fontWeight:800,padding:'4px 14px',borderRadius:20,fontSize:13,display:'flex',alignItems:'center',gap:4}}>
              <Shield size={11}/> FPA {athlete.federation_id ? `#${athlete.federation_id}` : ''}
            </span>
          )}
          {athlete.club && (
            <span style={{background:'rgba(255,255,255,0.07)',color:'var(--text-muted)',fontWeight:600,padding:'4px 14px',borderRadius:20,fontSize:13}}>🏟 {athlete.club}</span>
          )}
        </div>
      </div>

      {/* Medalhas — resumo */}
      {totalMedals > 0 && (
        <Card title="Conquistas" accent="#FFD60A">
          <div style={{display:'flex',justifyContent:'center',gap:20,marginBottom:16}}>
            {[['ouro','🥇','#FFD60A'],['prata','🥈','#C0C0C0'],['bronze','🥉','#CD7F32']].map(([type,em,col])=>(
              <div key={type} style={{textAlign:'center'}}>
                <div style={{fontSize:28}}>{em}</div>
                <div style={{fontSize:22,fontWeight:900,color:col}}>{medalCount[type]}</div>
                <div style={{fontSize:10,color:'var(--text-muted)',textTransform:'uppercase',fontWeight:600}}>{type}</div>
              </div>
            ))}
          </div>
          <p style={{textAlign:'center',fontSize:12,color:'var(--text-muted)'}}>Total: <strong style={{color:'var(--text)'}}>{totalMedals} medalhas</strong></p>
        </Card>
      )}

      {/* Lista de medalhas */}
      {medals.length > 0 && (
        <Card title={`Medalhas & Resultados (${medals.length})`} accent="#FFD60A">
          {medals.map(m => <MedalCard key={m.id} medal={m} />)}
        </Card>
      )}

      {/* Records pessoais */}
      <Card title="Records Pessoais">
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          {PR_FIELDS.map(({key,label,type,placeholder})=>(
            <div key={key}>
              <Label>{label}</Label>
              <input {...inp} value={form[key]} onChange={e=>set(key,e.target.value)}
                placeholder={placeholder}
                style={{...inp.style,fontFamily:'monospace',fontSize:16,fontWeight:700}}
              />
            </div>
          ))}
        </div>
        <p style={{fontSize:11,color:'var(--text-muted)',marginTop:10}}>
          100m/200m/400m: SS.ss (ex: 11.42) · 800m–3000m: M:SS.ss · 5km/10km: MM:SS
        </p>
      </Card>

      {/* Zonas de ritmo */}
      {(zones10||zones5) && (
        <Card title="Zonas de ritmo">
          {[{zones:zones10,label:`10km`},{zones:zones5,label:`5km`}].filter(x=>x.zones).map(({zones,label})=>(
            <div key={label} style={{marginBottom:14}}>
              <p style={{color:'var(--text-muted)',fontSize:11,marginBottom:8,fontWeight:600}}>{label}</p>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
                {ZONE_CONFIG.map(({key,label:l,bg,text})=>(
                  <div key={key} style={{background:bg,borderRadius:10,padding:10,textAlign:'center'}}>
                    <p style={{color:text,fontWeight:800,fontSize:11,marginBottom:3}}>{l}</p>
                    <p style={{color:'var(--text)',fontSize:11,fontFamily:'monospace'}}>{formatZoneRange(zones[key])}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Dados pessoais */}
      <Card title="Dados pessoais">
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div><Label>Nome completo</Label><input {...inp} value={form.name} onChange={e=>set('name',e.target.value)}/></div>
          <div>
            <Label>Sexo</Label>
            <div style={{display:'flex',gap:8}}>
              {[['M','Masculino'],['F','Feminino']].map(([v,l])=>(
                <button key={v} type="button" onClick={()=>set('sex',v)}
                  style={{flex:1,padding:'10px',borderRadius:12,border:'none',cursor:'pointer',fontWeight:700,fontSize:14,background:form.sex===v?'var(--orange)':'var(--surface2)',color:form.sex===v?'#fff':'var(--text-muted)'}}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div><Label>Data de nascimento</Label><input {...inp} type="date" value={form.date_of_birth} onChange={e=>set('date_of_birth',e.target.value)}/></div>
          <Row>
            <Col><Label>Localidade</Label><input {...inp} value={form.location} onChange={e=>set('location',e.target.value)}/></Col>
            <Col><Label>Código postal</Label><input {...inp} value={form.postal_code} onChange={e=>set('postal_code',e.target.value)}/></Col>
          </Row>
          <div><Label>Clube</Label><input {...inp} value={form.club} onChange={e=>set('club',e.target.value)} placeholder="ex: Run Tejo"/></div>
        </div>
      </Card>

      {/* Dados federativos */}
      <Card title="Federação" accent="#0A84FF">
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <label style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer'}}>
            <input type="checkbox" checked={form.is_federated} onChange={e=>set('is_federated',e.target.checked)}
              style={{width:18,height:18,accentColor:'#0A84FF'}}/>
            <span style={{color:'var(--text)',fontSize:14,fontWeight:600}}>Atleta federado FPA</span>
          </label>
          {form.is_federated && (
            <div><Label>Nº de federado</Label><input {...inp} value={form.federation_id} onChange={e=>set('federation_id',e.target.value)} placeholder="ex: 12345"/></div>
          )}
          {escalao && (
            <div style={{padding:'10px 14px',background:escalaoC+'15',borderRadius:12,border:`1px solid ${escalaoC}33`}}>
              <p style={{fontSize:11,color:'var(--text-muted)',marginBottom:2}}>Escalão FPA</p>
              <p style={{fontSize:16,fontWeight:800,color:escalaoC}}>{escalao}</p>
            </div>
          )}
          <div><Label>Grau de treinador (se aplicável)</Label>
            <select style={{...inp.style}} value={form.trainer_grade} onChange={e=>set('trainer_grade',e.target.value)}>
              <option value="">— não aplicável —</option>
              <option value="Grau I">Grau I</option>
              <option value="Grau II">Grau II</option>
              <option value="Grau III">Grau III</option>
              <option value="Grau IV">Grau IV</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Dados físicos & equipamento */}
      <Card title="Físico & Equipamento">
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <Row>
            <Col><Label>Altura (cm)</Label><input {...inp} type="number" value={form.height_cm} onChange={e=>set('height_cm',e.target.value)} placeholder="170"/></Col>
            <Col><Label>Peso (kg)</Label><input {...inp} type="number" step="0.1" value={form.weight_kg} onChange={e=>set('weight_kg',e.target.value)} placeholder="65.0"/></Col>
          </Row>
          <div><Label>Relógio GPS</Label><input {...inp} value={form.equipment_watch} onChange={e=>set('equipment_watch',e.target.value)} placeholder="ex: Garmin Forerunner 965"/></div>
          <div><Label>Ténis de corrida</Label><input {...inp} value={form.equipment_shoes} onChange={e=>set('equipment_shoes',e.target.value)} placeholder="ex: Nike Vaporfly 3"/></div>
        </div>
      </Card>

      {/* Modalidades */}
      <Card title="Modalidades">
        <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
          {MODALITY_OPTIONS.map(o=>{
            const sel = form.modalities.includes(o)
            return (
              <button key={o} type="button" onClick={()=>set('modalities',sel?form.modalities.filter(m=>m!==o):[...form.modalities,o])}
                style={{padding:'7px 13px',borderRadius:20,border:'none',cursor:'pointer',fontSize:13,fontWeight:600,background:sel?'var(--orange)':'var(--surface2)',color:sel?'#fff':'var(--text-muted)'}}>
                {o}
              </button>
            )
          })}
        </div>
      </Card>

      {/* Strava */}
      <Card title="Integrações">
        <div><Label>URL Strava</Label><input {...inp} placeholder="https://www.strava.com/athletes/…" value={form.strava_url} onChange={e=>set('strava_url',e.target.value)}/></div>
      </Card>

      {/* Guardar */}
      {status && <p style={{color:status.ok?'#30D158':'#FF453A',fontSize:14,fontWeight:600,textAlign:'center',marginBottom:12}}>{status.msg}</p>}
      <button onClick={handleSave} disabled={saving}
        style={{width:'100%',padding:15,background:'var(--orange)',border:'none',borderRadius:14,color:'#fff',fontWeight:800,fontSize:15,cursor:saving?'not-allowed':'pointer',opacity:saving?0.7:1,display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginBottom:12}}>
        <Save size={16}/> {saving?'A guardar…':'Guardar perfil'}
      </button>
      <button onClick={async()=>{await signOut();navigate('/')}}
        style={{width:'100%',padding:13,background:'none',border:'1px solid var(--border)',borderRadius:14,color:'var(--text-muted)',fontWeight:700,fontSize:14,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
        <LogOut size={15}/> Terminar sessão
      </button>
    </div>
  )
}
