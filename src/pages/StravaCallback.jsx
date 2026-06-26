import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import LoadingSpinner from '../components/LoadingSpinner'

export default function StravaCallback() {
  const navigate = useNavigate()
  const { athlete, refreshAthlete } = useAuth()
  const [status, setStatus] = useState('A ligar ao Strava...')
  const [error, setError]   = useState(null)
  const [done, setDone]     = useState(false)

  useEffect(() => {
    const params   = new URLSearchParams(window.location.search)
    const code     = params.get('code')
    const errParam = params.get('error')

    if (errParam) { setError('Acesso ao Strava negado.'); return }
    if (!code)    { setError('Código inválido.'); return }
    if (!athlete) { setError('Sessão expirada. Faz login novamente.'); return }

    exchange(code)
  }, [athlete])

  async function exchange(code) {
    try {
      // Troca o código por tokens via função server-side (secret protegido)
      const res  = await fetch(`/api/strava?action=exchange&code=${code}`)
      const data = await res.json()

      if (!res.ok || data.error) {
        setError('Erro ao ligar ao Strava: ' + (data.error || 'desconhecido'))
        return
      }

      setStatus('A guardar ligação...')

      const { error: dbErr } = await supabase
        .from('athletes')
        .update({
          strava_athlete_id:       data.strava_athlete_id,
          strava_access_token:     data.access_token,
          strava_refresh_token:    data.refresh_token,
          strava_token_expires_at: data.expires_at,
        })
        .eq('id', athlete.id)

      if (dbErr) { setError('Erro ao guardar: ' + dbErr.message); return }

      await refreshAthlete()
      setDone(true)
      setStatus('Strava ligado com sucesso!')
      setTimeout(() => navigate('/dashboard'), 2000)
    } catch (e) {
      setError('Erro de rede: ' + e.message)
    }
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6"
        style={{ background: 'var(--dark)' }}>
        <p className="text-base font-bold text-center" style={{ color: '#FF453A' }}>{error}</p>
        <button onClick={() => navigate('/dashboard')}
          className="px-6 py-3 rounded-xl font-bold text-sm"
          style={{ background: 'var(--orange)', color: 'white' }}>
          Voltar ao Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4"
      style={{ background: 'var(--dark)' }}>
      {done ? (
        <div className="text-center">
          <div className="text-5xl mb-4">🎉</div>
          <p className="text-lg font-black" style={{ color: 'var(--text)' }}>Strava ligado!</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>A redirecionar...</p>
        </div>
      ) : (
        <>
          <LoadingSpinner />
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{status}</p>
        </>
      )}
    </div>
  )
}
