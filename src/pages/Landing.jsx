import { Link } from 'react-router-dom'
import { Activity, Target, Trophy, User, ChevronRight } from 'lucide-react'

export default function Landing() {
  return (
    <div style={{ minHeight: '100dvh', background: '#080808', color: '#fff' }}>
      <style>{`
        .landing-nav { display: flex; justify-content: space-between; align-items: center; padding: 18px 24px; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .landing-hero { max-width: 1100px; margin: 0 auto; padding: 56px 24px 64px; display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center; }
        .landing-hero-img { display: block; }
        .landing-h1 { font-size: clamp(36px, 5.5vw, 64px); }
        .landing-paths { max-width: 600px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 0 24px 56px; }
        .landing-features { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: repeat(3,1fr); gap: 40px; }
        .path-card:hover { transform: translateY(-2px); }
        .path-card { transition: transform 0.15s ease; }

        @media (max-width: 768px) {
          .landing-nav { padding: 14px 16px; }
          .landing-hero { grid-template-columns: 1fr; gap: 32px; padding: 36px 16px 40px; }
          .landing-hero-img { display: none; }
          .landing-h1 { font-size: 36px; line-height: 1.05; }
          .landing-paths { grid-template-columns: 1fr; padding: 0 16px 40px; }
          .landing-features { grid-template-columns: 1fr; gap: 28px; padding: 0 16px; }
        }
      `}</style>

      {/* Nav */}
      <nav className="landing-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontWeight: 900, fontSize: 22, letterSpacing: '-0.03em' }}>
            Run<span style={{ color: 'var(--orange)' }}>Tejo</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link to="/login" style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.55)', textDecoration: 'none' }}>
            Entrar
          </Link>
          <Link to="/registo" style={{ fontSize: 13, fontWeight: 800, padding: '8px 16px', borderRadius: 10, background: 'var(--orange)', color: '#fff', textDecoration: 'none' }}>
            Registar
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="landing-hero">
        <div>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', color: 'var(--orange)', textTransform: 'uppercase', marginBottom: 14 }}>
            ATLETISMO · COACHING · COMUNIDADE
          </p>
          <h1 className="landing-h1" style={{ fontWeight: 900, lineHeight: 1.0, letterSpacing: '-0.04em', marginBottom: 18 }}>
            O TEU TREINO,{' '}
            <span style={{ color: 'var(--orange)', fontStyle: 'italic' }}>ELEVADO.</span>
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 0, maxWidth: 400 }}>
            Liga-te ao teu treinador, segue o teu plano, sincroniza com o Strava e domina o ranking do grupo.
          </p>
        </div>

        {/* Desktop image */}
        <div className="landing-hero-img" style={{ position: 'relative' }}>
          <div style={{ borderRadius: 20, overflow: 'hidden', aspectRatio: '4/3', background: 'var(--surface)' }}>
            <img src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80" alt="Atleta"
              style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.8)' }} />
          </div>
          <div style={{ position: 'absolute', bottom: -16, left: -16, background: '#141414', borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
            <span style={{ fontSize: 22 }}>🔥</span>
            <div>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Streak Semanal</p>
              <p style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>7 dias seguidos</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── ESCOLHE O TEU CAMINHO ── */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '40px 0', marginBottom: 0 }}>
        <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 800, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: 28 }}>
          Escolhe como entras
        </p>
        <div className="landing-paths">
          {/* Atleta */}
          <div className="path-card" style={{ background: 'linear-gradient(135deg,rgba(255,107,53,0.12),rgba(255,107,53,0.04))', border: '1px solid rgba(255,107,53,0.3)', borderRadius: 20, padding: '28px 22px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,107,53,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              <User size={22} color="var(--orange)" />
            </div>
            <h2 style={{ fontWeight: 900, fontSize: 20, letterSpacing: '-0.02em', marginBottom: 4 }}>Sou Atleta</h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5, marginBottom: 18 }}>
              Segue o teu plano de treino, regista as tuas atividades e acompanha a tua evolução.
            </p>
            <Link to="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '12px 0', borderRadius: 12, background: 'var(--orange)', color: '#fff', fontWeight: 800, fontSize: 14, textDecoration: 'none', marginBottom: 8 }}>
              Entrar <ChevronRight size={15}/>
            </Link>
            <Link to="/registo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px 0', borderRadius: 12, background: 'rgba(255,107,53,0.12)', color: 'var(--orange)', fontWeight: 700, fontSize: 13, textDecoration: 'none', border: '1px solid rgba(255,107,53,0.25)' }}>
              Criar conta grátis
            </Link>
          </div>

          {/* Treinador */}
          <div className="path-card" style={{ background: 'linear-gradient(135deg,rgba(94,92,230,0.12),rgba(94,92,230,0.04))', border: '1px solid rgba(94,92,230,0.3)', borderRadius: 20, padding: '28px 22px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(94,92,230,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              <Trophy size={22} color="#5E5CE6" />
            </div>
            <h2 style={{ fontWeight: 900, fontSize: 20, letterSpacing: '-0.02em', marginBottom: 4 }}>Sou Treinador</h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5, marginBottom: 18 }}>
              Gere os teus atletas, cria planos de treino, acompanha resultados e dá feedback.
            </p>
            <Link to="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '12px 0', borderRadius: 12, background: '#5E5CE6', color: '#fff', fontWeight: 800, fontSize: 14, textDecoration: 'none', marginBottom: 8 }}>
              Entrar <ChevronRight size={15}/>
            </Link>
            <div style={{ padding: '11px 0', borderRadius: 12, textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.07)' }}>
              Acesso por convite do clube
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div style={{ padding: '56px 24px' }}>
        <div className="landing-features">
          {[
            { icon: Activity, title: 'Planos de Precisão',   desc: 'Treinos desenhados pelo teu treinador, com geração automática por IA e sincronização diária.' },
            { icon: Target,   title: 'Regista & Evolui',     desc: 'Confirma os treinos pelo Strava, ganha pontos e vê o feedback do treinador em cada atividade.' },
            { icon: Trophy,   title: 'Competes no Grupo',    desc: 'Ranking semanal, badges de conquista, streaks. Cada quilómetro conta para o teu grupo.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,107,53,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Icon size={22} color="var(--orange)" />
              </div>
              <h3 style={{ fontWeight: 800, fontSize: 16, marginBottom: 8, letterSpacing: '-0.01em' }}>{title}</h3>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
