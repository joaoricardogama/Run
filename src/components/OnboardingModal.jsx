import { useState } from 'react'

const STEPS = [
  {
    emoji: '📋',
    title: 'O teu plano está aqui',
    desc: 'O teu treinador publica o plano semanal com todos os treinos, distâncias e ritmos. Tens tudo no telemóvel, sem PDFs nem WhatsApp.',
    accent: '#B8FF00',
  },
  {
    emoji: '🏃',
    title: 'Regista cada treino',
    desc: 'Marca os treinos feitos e ganha pontos. Quanto mais consistente fores, mais pontos acumulas e mais alto ficas no ranking do grupo.',
    accent: '#FFD60A',
  },
  {
    emoji: '🔗',
    title: 'Liga o Strava ou faz upload',
    desc: 'Confirma treinos pelo Strava (+20 pts) ou faz upload do screenshot do Garmin/Apple/Polar para registar os teus dados reais.',
    accent: '#FC4C02',
  },
]

export default function OnboardingModal({ onClose }) {
  const [step, setStep] = useState(0)
  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  function finish() {
    localStorage.setItem('nexo_onboarded', '1')
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      padding: '0 0 24px',
    }}>
      <div style={{
        width: '100%', maxWidth: 480,
        background: 'var(--surface)',
        borderRadius: '24px 24px 20px 20px',
        border: '1px solid var(--border)',
        padding: '32px 28px 28px',
        margin: '0 12px',
        animation: 'slideUp 0.3s ease',
      }}>
        <style>{`
          @keyframes slideUp {
            from { transform: translateY(40px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}</style>

        {/* Skip */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
          <button onClick={finish}
            style={{ fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            Saltar
          </button>
        </div>

        {/* Content */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 80, height: 80, borderRadius: 24, margin: '0 auto 20px',
            background: `${current.accent}18`,
            border: `1px solid ${current.accent}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 36,
          }}>
            {current.emoji}
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.03em', marginBottom: 12 }}>
            {current.title}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 320, margin: '0 auto' }}>
            {current.desc}
          </p>
        </div>

        {/* Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
          {STEPS.map((_, i) => (
            <div key={i} onClick={() => setStep(i)} style={{
              width: i === step ? 20 : 8, height: 8, borderRadius: 4,
              background: i === step ? current.accent : 'var(--border)',
              transition: 'all 0.2s', cursor: 'pointer',
            }} />
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={() => isLast ? finish() : setStep(s => s + 1)}
          style={{
            width: '100%', padding: '15px',
            borderRadius: 14, border: 'none', cursor: 'pointer',
            background: current.accent,
            color: '#080808', fontWeight: 900, fontSize: 15,
            letterSpacing: '-0.01em',
          }}
        >
          {isLast ? 'Começar 🚀' : 'Seguinte →'}
        </button>
      </div>
    </div>
  )
}
