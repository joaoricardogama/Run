import { useEffect, useState } from 'react'
import anaIsabelPhoto from '../assets/ana-isabel.jpg'

// Sábado, 19 de setembro de 2026, 23:45 (hora de Lisboa, WEST = UTC+1)
const ARRIVAL_DATE = new Date('2026-09-19T23:45:00+01:00')

function getTimeLeft() {
  const diff = ARRIVAL_DATE.getTime() - Date.now()
  const clamped = Math.max(diff, 0)

  return {
    total: clamped,
    days: Math.floor(clamped / (1000 * 60 * 60 * 24)),
    hours: Math.floor((clamped / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((clamped / (1000 * 60)) % 60),
    seconds: Math.floor((clamped / 1000) % 60),
  }
}

function TimeUnit({ value, label }) {
  return (
    <div className="flex flex-col items-center min-w-[64px] sm:min-w-[84px]">
      <div className="text-4xl sm:text-6xl font-extrabold tabular-nums text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
        {String(value).padStart(2, '0')}
      </div>
      <div className="mt-1 text-[10px] sm:text-xs uppercase tracking-[0.2em] text-white/80">
        {label}
      </div>
    </div>
  )
}

export default function AnaIsabel() {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft)

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(getTimeLeft()), 1000)
    return () => clearInterval(id)
  }, [])

  const arrived = timeLeft.total <= 0

  return (
    <div className="relative min-h-[100svh] w-full overflow-hidden bg-black">
      <img
        src={anaIsabelPhoto}
        alt="Ana Isabel e João"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />

      <div className="relative z-10 flex min-h-[100svh] flex-col items-center justify-end px-6 pb-12 pt-24 text-center sm:justify-center sm:pb-0">
        <p className="text-sm sm:text-base font-medium uppercase tracking-[0.3em] text-white/80">
          Grécia → Lisboa
        </p>

        {arrived ? (
          <>
            <h1 className="mt-3 text-3xl sm:text-5xl font-extrabold text-white drop-shadow-lg">
              Ela chegou! ❤️
            </h1>
            <p className="mt-4 max-w-xs sm:max-w-md text-base sm:text-lg text-white/90">
              A Ana Isabel está de volta a Lisboa. Bem-vinda a casa!
            </p>
          </>
        ) : (
          <>
            <h1 className="mt-3 text-2xl sm:text-4xl font-extrabold text-white drop-shadow-lg">
              A Ana Isabel está a chegar
            </h1>

            <div className="mt-8 flex items-start justify-center gap-3 sm:gap-6">
              <TimeUnit value={timeLeft.days} label="dias" />
              <TimeUnit value={timeLeft.hours} label="horas" />
              <TimeUnit value={timeLeft.minutes} label="min" />
              <TimeUnit value={timeLeft.seconds} label="seg" />
            </div>

            <p className="mt-8 text-sm sm:text-base text-white/80">
              Sábado, 19 de setembro · 23:45
            </p>
          </>
        )}
      </div>
    </div>
  )
}
