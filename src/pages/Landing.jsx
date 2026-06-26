import { Link } from 'react-router-dom'
import { Activity, Target, Trophy } from 'lucide-react'

export default function Landing() {
  return (
    <div style={{ minHeight: '100dvh', background: '#080808', color: '#fff' }}>
      <style>{`
        .landing-nav { display: flex; justify-content: space-between; align-items: center; padding: 18px 24px; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .landing-nav-actions { display: flex; align-items: center; gap: 12px; }
        .landing-hero { max-width: 1100px; margin: 0 auto; padding: 56px 24px 72px; display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center; }
        .landing-hero-img { display: block; }
        .landing-h1 { font-size: clamp(36px, 5.5vw, 68px); }
        .landing-features { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: repeat(3,1fr); gap: 40px; }
        .landing-cta { padding: 56px 24px 72px; border-top: 1px solid rgba(255,255,255,0.06); text-align: center; }
        .landing-cta-h2 { font-size: clamp(24px, 3.5vw, 44px); }

        @media (max-width: 768px) {
          .landing-nav { padding: 14px 16px; }
          .landing-hero { grid-template-columns: 1fr; gap: 32px; padding: 40px 16px 48px; }
          .landing-hero-img { display: none; }
          .landing-h1 { font-size: 38px; line-height: 1.05; }
          .landing-features { grid-template-columns: 1fr; gap: 28px; padding: 0 16px; }
          .landing-cta { padding: 40px 16px 56px; }
        }
      `}</style>

      {/* Nav */}
      <nav className="landing-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontWeight: 900, fontSize: 22, letterSpacing: '-0.03em' }}>
            H<span style={{ color: 'var(--heh-green)' }}>é</span>H
          </span>
          <span style={{ color: 'var(--heh-green)', fontSize: 9, marginTop: -4 }}>✦</span>
        </div>
        <div className="landing-nav-actions">
          <Link to="/login" style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>
            Entrar
          </Link>
          <Link to="/registo" style={{ fontSize: 14, fontWeight: 800, padding: '10px 18px', borderRadius: 10, background: 'var(--heh-green)', color: '#080808', textDecoration: 'none' }}>
            Começar
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="landing-hero">
        <div>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', color: 'var(--heh-green)', textTransform: 'uppercase', marginBottom: 16 }}>
            CORRE · VIVE · REPETE
          </p>
          <h1 className="landing-h1" style={{ fontWeight: 900, lineHeight: 1.0, letterSpacing: '-0.04em', marginBottom: 20 }}>
            O TEU TREINO,{' '}
            <span style={{ color: 'var(--heh-green)', fontStyle: 'italic' }}>ARMADO.</span>
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 32, maxWidth: 400 }}>
            HéH liga atletas e treinadores numa plataforma de alta intensidade.
            Executa o plano, acumula pontos, domina o ranking do grupo.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/registo" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '15px 28px', borderRadius: 12, background: 'var(--heh-green)', color: '#080808', fontWeight: 900, fontSize: 15, textDecoration: 'none', letterSpacing: '-0.01em' }}>
              COMEÇAR AGORA →
            </Link>
            <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', padding: '15px 24px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', fontWeight: 700, fontSize: 14, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)' }}>
              Entrar
            </Link>
          </div>

          {/* Mobile floating card */}
          <div className="landing-hero-img" style={{ display: 'none' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginTop: 24, background: 'var(--surface)', borderRadius: 14, padding: '12px 16px', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: 20 }}>⚡</span>
              <div>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Pontos Semanais</p>
                <p style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em' }}>1.450</p>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop image */}
        <div className="landing-hero-img" style={{ position: 'relative' }}>
          <div style={{ borderRadius: 20, overflow: 'hidden', aspectRatio: '4/3', background: 'var(--surface)' }}>
            <img src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80" alt="Atleta"
              style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.85)' }} />
          </div>
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
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '56px 24px' }}>
        <div className="landing-features">
          {[
            { icon: Activity, title: 'Planos de Precisão',   desc: 'Treinos desenhados pelo teu treinador, sincronizados com o teu calendário diário.' },
            { icon: Target,   title: 'Executa & Regista',    desc: 'Confirma os treinos pelo Strava ou manualmente. Ganha pontos por cada sessão cumprida.' },
            { icon: Trophy,   title: 'Guerra de Grupos',     desc: 'Compete contra o teu grupo no ranking semanal. Cada quilómetro conta.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(184,255,0,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Icon size={22} style={{ color: 'var(--heh-green)' }} />
              </div>
              <h3 style={{ fontWeight: 800, fontSize: 16, marginBottom: 8, letterSpacing: '-0.01em' }}>{title}</h3>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="landing-cta">
        <h2 className="landing-cta-h2" style={{ fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 14 }}>
          Pronto para <span style={{ color: 'var(--heh-green)', fontStyle: 'italic' }}>dominar?</span>
        </h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>
          Junta-te ao clube. O teu grupo espera-te.
        </p>
        <Link to="/registo" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '15px 32px', borderRadius: 12, background: 'var(--heh-green)', color: '#080808', fontWeight: 900, fontSize: 15, textDecoration: 'none' }}>
          Criar conta grátis →
        </Link>
      </div>
    </div>
  )
}
