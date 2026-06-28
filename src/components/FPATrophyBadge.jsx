/**
 * FPATrophyBadge — apenas o troféu da Federação Portuguesa de Atletismo
 * Desenhado a partir do logótipo oficial: vermelho + verde + azul
 */
export default function FPATrophyBadge({ size = 28, withTooltip = true }) {
  const s = size
  return (
    <span title={withTooltip ? 'Federado FPA' : undefined}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: s, height: s }}>
      <svg width={s} height={s} viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
        {/* ── Arco superior / handles ── */}
        {/* Vermelho — exterior */}
        <path d="M20 18 Q50 4 80 18" stroke="#D12A2A" strokeWidth="5" fill="none" strokeLinecap="round"/>
        {/* Azul — meio */}
        <path d="M25 22 Q50 10 75 22" stroke="#1A5CA8" strokeWidth="4" fill="none" strokeLinecap="round"/>
        {/* Verde — interior */}
        <path d="M30 26 Q50 15 70 26" stroke="#1F8C3B" strokeWidth="3" fill="none" strokeLinecap="round"/>

        {/* ── Picos (spikes) acima do arco ── */}
        <line x1="35" y1="22" x2="33" y2="4"  stroke="#1F8C3B" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="45" y1="17" x2="43" y2="2"  stroke="#1A5CA8" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="55" y1="17" x2="57" y2="2"  stroke="#1A5CA8" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="65" y1="22" x2="67" y2="4"  stroke="#1F8C3B" strokeWidth="2.5" strokeLinecap="round"/>

        {/* ── Handles laterais ── */}
        {/* Esquerda */}
        <path d="M20 30 Q8 40 10 60 Q12 68 22 68" stroke="#D12A2A" strokeWidth="5" fill="none" strokeLinecap="round"/>
        <path d="M23 35 Q13 44 14 60 Q16 66 24 66" stroke="#1A5CA8" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
        <path d="M25 40 Q18 48 18 60 Q19 64 26 64" stroke="#1F8C3B" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        {/* Direita */}
        <path d="M80 30 Q92 40 90 60 Q88 68 78 68" stroke="#D12A2A" strokeWidth="5" fill="none" strokeLinecap="round"/>
        <path d="M77 35 Q87 44 86 60 Q84 66 76 66" stroke="#1A5CA8" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
        <path d="M75 40 Q82 48 82 60 Q81 64 74 64" stroke="#1F8C3B" strokeWidth="2.5" fill="none" strokeLinecap="round"/>

        {/* ── Corpo do copo — triângulo invertido ── */}
        {/* Vermelho exterior */}
        <path d="M22 28 L50 95 L78 28 Z" stroke="#D12A2A" strokeWidth="4.5" fill="none" strokeLinejoin="round"/>
        {/* Azul */}
        <path d="M27 28 L50 90 L73 28 Z" stroke="#1A5CA8" strokeWidth="3.5" fill="none" strokeLinejoin="round"/>
        {/* Verde */}
        <path d="M32 28 L50 85 L68 28 Z" stroke="#1F8C3B" strokeWidth="2.5" fill="none" strokeLinejoin="round"/>

        {/* ── Escudo FPA (quinas) centrado no copo ── */}
        <g transform="translate(50,52) scale(0.55)">
          {/* Escudo azul */}
          <path d="M0,-22 L14,-12 L14,8 Q14,20 0,26 Q-14,20 -14,8 L-14,-12 Z"
            fill="#1A5CA8" opacity="0.9"/>
          {/* Quinas brancas estilizadas */}
          <rect x="-6" y="-8" width="4" height="4" rx="0.5" fill="white" opacity="0.9"/>
          <rect x="2"  y="-8" width="4" height="4" rx="0.5" fill="white" opacity="0.9"/>
          <rect x="-2" y="-2" width="4" height="4" rx="0.5" fill="white" opacity="0.9"/>
          <rect x="-6" y="4"  width="4" height="4" rx="0.5" fill="white" opacity="0.9"/>
          <rect x="2"  y="4"  width="4" height="4" rx="0.5" fill="white" opacity="0.9"/>
        </g>

        {/* ── Base ── */}
        <rect x="38" y="95" width="24" height="5" rx="2.5"
          fill="none" stroke="#D12A2A" strokeWidth="3"/>
        <rect x="30" y="100" width="40" height="5" rx="2.5"
          fill="none" stroke="#D12A2A" strokeWidth="3"/>
      </svg>
    </span>
  )
}
