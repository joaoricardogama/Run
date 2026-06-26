import { Link } from 'react-router-dom'
import { Activity, Target, Trophy } from 'lucide-react'

export default function Landing() {
  return (
    <div style={{ minHeight: '100dvh', background: '#080808', color: '#fff', fontFamily: 'inherit' }}>

      {/* Nav */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontWeight: 900, fontSize: 22, letterSpacing: '-0.03em' }}>
            H<span style={{ color: 'var(--heh-green)' }}>é</span>H
          </span>
          <span style={{ color: 'var(--heh-green)', fontSize: 9, marginTop: -4 }}>✦</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link to="/login" style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>
            Entrar
          </Link>
          <Link to="/registo" style={{ fontSize: 14, fontWeight: 800, padding: '10px 20px', borderRadius: 10, background: 'var(--heh-green)', color: '#080808', textDecoration: 'none' }}>
            Juntar-me
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 32px 80px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', color: 'var(--heh-green)', textTransform: 'uppercase', marginBottom: 16 }}>
            CORRE · VIVE · REPETE
          </p>
          <h1 style={{ fontSize: 'clamp(42px, 6vw, 72px)', fontWeight: 900, lineHeight: 1.0, letterSpacing: '-0.04em', marginBottom: 24 }}>
            O TEU TREINO,{' '}
            <span style={{ color: 'var(--heh-green)', fontStyle: 'italic' }}>ARMADO.</span>
          </h1>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginBottom: 36, maxWidth: 400 }}>
            HéH liga atletas e treinadores numa plataforma de alta intensidade.
            Executa o teu plano, acumula pontos, domina o ranking do grupo.
          </p>
          <Link to="/registo"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '16px 32px', borderRadius: 12, background: 'var(--heh-green)', color: '#080808', fontWeight: 900, fontSize: 15, textDecoration: 'none', letterSpacing: '-0.01em' }}>
            COMEÇAR AGORA →
          </Link>
        </div>

        {/* Hero visual */}
        <div style={{ position: 'relative' }}>
          <div style={{ borderRadius: 20, overflow: 'hidden', aspectRatio: '4/3', background: 'var(--surface)' }}>
            <img
              src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80"
              alt="Atleta a correr"
              style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.85)' }}
            />
          </div>
          {/* Floating points card */}
          <div style={{ position: 'absolute', bottom: -16, left: -16, background: '#141414', borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(184,255,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 16 }}>⚡</span>
            </div>
            <div>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Pontos Semanais</p>
              <p style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em' }}>1.450</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '64px 32px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 40 }}>
          {[
            { icon: Activity, title: 'Planos de Precisão', desc: 'Treinos desenhados pelo teu treinador, sincronizados com o teu calendário diário.' },
            { icon: Target,   title: 'Executa & Regista', desc: 'Confirma os treinos pelo Strava ou manualmente. Ganha pontos por cada sessão cumprida.' },
            { icon: Trophy,   title: 'Guerra de Grupos', desc: 'Compete contra o teu grupo no ranking semanal. Cada quilómetro conta.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title}>
              <div style={{ marginBottom: 16 }}>
                <Icon size={24} style={{ color: 'var(--heh-green)' }} />
              </div>
              <h3 style={{ fontWeight: 800, fontSize: 16, marginBottom: 8, letterSpacing: '-0.01em' }}>{title}</h3>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA bottom */}
      <div style={{ textAlign: 'center', padding: '60px 32px 80px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 16 }}>
          Pronto para <span style={{ color: 'var(--heh-green)', fontStyle: 'italic' }}>dominar?</span>
        </h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', marginBottom: 28 }}>
          Junta-te ao clube. O teu grupo espera-te.
        </p>
        <Link to="/registo" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '16px 36px', borderRadius: 12, background: 'var(--heh-green)', color: '#080808', fontWeight: 900, fontSize: 15, textDecoration: 'none' }}>
          Criar conta grátis →
        </Link>
      </div>
    </div>
  )
}
