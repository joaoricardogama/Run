import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LoadingSpinner from '../components/LoadingSpinner'

export default function StravaRegisterCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code   = params.get('code')
    const err    = params.get('error')

    if (err)   { setError('Acesso ao Strava negado.'); return }
    if (!code) { setError('Código inválido.'); return }

    loadStravaProfile(code)
  }, [])

  async function loadStravaProfile(code) {
    try {
      // Troca código por tokens via função segura server-side
      const res       = await fetch(`/api/strava?action=exchange&code=${encodeURIComponent(code)}`)
      const tokenData = await res.json()

      if (!res.ok || tokenData.error) throw new Error(tokenData.error || 'Erro de autenticação')

      // Busca perfil do Strava (nome, foto, localização, sexo)
      const profileRes = await fetch('https://www.strava.com/api/v3/athlete', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      })
      const profile = await profileRes.json()

      if (profile.errors) throw new Error('Erro ao obter perfil do Strava')

      // Guarda dados em sessionStorage para o formulário de registo
      sessionStorage.setItem('strava_prefill', JSON.stringify({
        name:              [profile.firstname, profile.lastname].filter(Boolean).join(' '),
        avatar_url:        profile.profile_medium || profile.profile || null,
        location:          [profile.city, profile.country].filter(Boolean).join(', '),
        sex:               profile.sex || '',
        strava_athlete_id: profile.id,
        access_token:      tokenData.access_token,
        refresh_token:     tokenData.refresh_token,
        expires_at:        tokenData.expires_at,
      }))

      navigate('/registo')
    } catch (e) {
      setError(e.message)
    }
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6"
        style={{ background: 'var(--dark)' }}>
        <p className="text-base font-bold text-center" style={{ color: '#FF453A' }}>{error}</p>
        <button onClick={() => navigate('/registo')}
          className="px-6 py-3 rounded-xl font-bold text-sm"
          style={{ background: 'var(--orange)', color: 'white' }}>
          Voltar ao registo
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4"
      style={{ background: 'var(--dark)' }}>
      <LoadingSpinner />
      <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
        A obter dados do Strava...
      </p>
    </div>
  )
}
