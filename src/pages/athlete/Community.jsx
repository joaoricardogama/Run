import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { Users, Zap, Activity } from 'lucide-react'

function fmtPace(s) {
  if (!s) return null
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}/km`
}
function fmtDur(s) {
  if (!s) return null
  const m = Math.floor(s / 60)
  return m >= 60 ? `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}m` : `${m}m`
}
function fmtDate(d) {
  if (!d) return ''
  const dt = new Date(d + 'T00:00')
  const diff = Math.floor((Date.now() - dt) / 86400000)
  if (diff === 0) return 'Hoje'
  if (diff === 1) return 'Ontem'
  if (diff < 7) return dt.toLocaleDateString('pt-PT', { weekday: 'short', day: 'numeric' })
  return dt.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })
}
function initials(name) {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}
function avatarColor(name) {
  const colors = ['#FF6B35','#1A5CA8','#1F8C3B','#9B59B6','#E67E22','#E74C3C','#16A085','#2980B9']
  if (!name) return colors[0]
  return colors[name.charCodeAt(0) % colors.length]
}

// ── Card de atividade ─────────────────────────────────────────
function FeedCard({ completion, athlete }) {
  const isStrava = completion.confirmed_by_strava
  const hasStats = completion.distance_km || completion.duration_s || completion.pace_avg

  return (
    <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', marginBottom: 12, overflow: 'hidden' }}>
      <div style={{ padding: '12px 14px' }}>
        {/* Atleta header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          {athlete?.avatar_url ? (
            <img src={athlete.avatar_url} alt=""
              style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
          ) : (
            <div style={{ width: 36, height: 36, borderRadius: 10, background: avatarColor(athlete?.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
              {initials(athlete?.name)}
            </div>
          )}
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>{athlete?.name || 'Atleta'}</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {fmtDate(completion.date)}
              {isStrava && <span style={{ color: '#FC4C02', marginLeft: 4 }}>· Strava</span>}
            </p>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--orange)', background: 'rgba(184,255,0,0.1)', padding: '3px 8px', borderRadius: 8 }}>
            +{completion.points} pts
          </span>
        </div>

        {/* Título da atividade */}
        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: hasStats ? 10 : 0 }}>
          {completion.strava_name || completion.session_label || 'Treino'}
          {completion.strava_type && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, marginLeft: 6 }}>· {completion.strava_type}</span>}
        </p>

        {/* Stats */}
        {hasStats && (
          <div style={{ display: 'flex', gap: 6 }}>
            {completion.distance_km && (
              <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '7px 12px', flex: 1, textAlign: 'center' }}>
                <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>DIST.</p>
                <p style={{ fontSize: 15, fontWeight: 900, color: 'var(--text)', fontFamily: 'monospace' }}>{Number(completion.distance_km).toFixed(2)} km</p>
              </div>
            )}
            {completion.pace_avg && (
              <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '7px 12px', flex: 1, textAlign: 'center' }}>
                <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>RITMO</p>
                <p style={{ fontSize: 15, fontWeight: 900, color: 'var(--text)', fontFamily: 'monospace' }}>{fmtPace(completion.pace_avg)}</p>
              </div>
            )}
            {completion.duration_s && (
              <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '7px 12px', flex: 1, textAlign: 'center' }}>
                <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>TEMPO</p>
                <p style={{ fontSize: 15, fontWeight: 900, color: 'var(--text)', fontFamily: 'monospace' }}>{fmtDur(completion.duration_s)}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Painel de membros do clube ────────────────────────────────
function ClubMembers({ members, myId }) {
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', padding: '14px 16px', marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <Users size={14} color="var(--text-muted)" />
        <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Membros ({members.length})
        </p>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {members.map(m => (
          <div key={m.id} title={m.name}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface2)', borderRadius: 20, padding: '5px 10px 5px 5px', border: m.id === myId ? '1px solid rgba(184,255,0,0.3)' : '1px solid transparent' }}>
            {m.avatar_url ? (
              <img src={m.avatar_url} alt="" style={{ width: 22, height: 22, borderRadius: 6, objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 22, height: 22, borderRadius: 6, background: avatarColor(m.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: '#fff' }}>
                {initials(m.name)}
              </div>
            )}
            <span style={{ fontSize: 12, fontWeight: m.id === myId ? 800 : 500, color: m.id === myId ? 'var(--heh-green)' : 'var(--text)' }}>
              {m.name?.split(' ')[0]}{m.id === myId ? ' (tu)' : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────
export default function Community() {
  const { user } = useAuth()
  const [athlete, setAthlete] = useState(null)
  const [club, setClub] = useState(null)
  const [members, setMembers] = useState([])
  const [feed, setFeed] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.email) return
    async function load() {
      // Buscar atleta actual
      const { data: me } = await supabase
        .from('athletes')
        .select('*')
        .eq('email', user.email)
        .single()
      if (!me) { setLoading(false); return }
      setAthlete(me)

      if (!me.club_id) { setLoading(false); return }

      // Buscar info do clube
      const { data: clubData } = await supabase
        .from('clubs')
        .select('*')
        .eq('id', me.club_id)
        .single()
      setClub(clubData)

      // Buscar membros do clube
      const { data: clubMembers } = await supabase
        .from('athletes')
        .select('id,name,avatar_url,email')
        .eq('club_id', me.club_id)
        .order('name')
      setMembers(clubMembers || [])

      // Buscar atividades recentes do clube (últimos 14 dias)
      const since = new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0]
      const memberIds = (clubMembers || []).map(m => m.id)
      if (memberIds.length) {
        const { data: completions } = await supabase
          .from('training_completions')
          .select('*')
          .in('athlete_id', memberIds)
          .gte('date', since)
          .order('date', { ascending: false })
          .limit(40)
        setFeed(completions || [])
      }

      setLoading(false)
    }
    load()
  }, [user?.email])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ width: 28, height: 28, border: '3px solid var(--border)', borderTopColor: 'var(--heh-green)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  )

  // Sem clube associado
  if (!athlete?.club_id) return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🏟️</div>
      <h2 style={{ fontWeight: 900, fontSize: 22, color: 'var(--text)', marginBottom: 8 }}>Sem clube associado</h2>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>
        O teu treinador ainda não te associou a um clube.<br />
        Quando estiveres num clube, verás aqui os treinos de todos os colegas.
      </p>
    </div>
  )

  // Agrupar atletaMap por id para lookup rápido
  const athleteMap = Object.fromEntries(members.map(m => [m.id, m]))

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 16px 100px' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Cabeçalho do clube */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <div style={{ width: 44, height: 44, borderRadius: 13, background: 'rgba(184,255,0,0.1)', border: '1px solid rgba(184,255,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
            🏟️
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.02em' }}>
              {club?.name || 'Clube'}
            </h1>
            {club?.location && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{club.location}</p>}
          </div>
        </div>
      </div>

      {/* Membros */}
      {members.length > 0 && <ClubMembers members={members} myId={athlete?.id} />}

      {/* Feed */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <Activity size={13} color="var(--text-muted)" />
        <p style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          Atividades Recentes
        </p>
      </div>

      {feed.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 14 }}>
          <Zap size={28} style={{ marginBottom: 8, opacity: 0.4 }} />
          <p>Sem atividades nos últimos 14 dias.<br />Alguém precisa de correr! 🏃</p>
        </div>
      ) : (
        feed.map(c => (
          <FeedCard key={c.id} completion={c} athlete={athleteMap[c.athlete_id]} />
        ))
      )}
    </div>
  )
}
