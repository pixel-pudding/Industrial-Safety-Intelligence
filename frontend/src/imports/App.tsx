import { useState, useEffect, useRef } from 'react'
import Dashboard from './Dashboard'

const HERO_IMAGE = 'https://images.unsplash.com/photo-1768128834332-7d3479c8d634?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxpbmR1c3RyaWFsJTIwY2hlbWljYWwlMjBwbGFudCUyMHJlZmluZXJ5JTIwbmlnaHQlMjBhZXJpYWx8ZW58MXx8fHwxNzg0NzA0MjQ5fDA&ixlib=rb-4.1.0&q=80&w=1080'

const NAV_LINKS = ['Platform', 'Pricing', 'Contact', 'Blog']

const LOGOS = ['Tata Chemicals', 'ONGC', 'Reliance', 'HPCL', 'Coromandel', 'Deepak Nitrite']

const FEATURES = [
  {
    num: '01',
    title: 'Sees what humans miss',
    card: {
      label: 'AI detected',
      items: ['Cooling tower degrading', 'Pressure variance +12%', 'VOC threshold 87%'],
    },
    desc: 'Most safety systems raise alarms after the incident. SafetyIQ correlates data across 40+ SCADA, IoT, and permit systems simultaneously — catching compound risks 13 minutes before they become emergencies.',
  },
  {
    num: '02',
    title: 'Explains every decision',
    card: {
      label: 'AI reasoning',
      items: ['Checked 5 independent systems', 'Matched 3 historical incidents', 'Confidence: 94%'],
    },
    desc: 'Unlike black-box alerts, every AI recommendation comes with full reasoning, evidence strength, and historical precedent. Inspectors understand why before they act.',
  },
  {
    num: '03',
    title: 'Guides the right action',
    card: {
      label: 'Recommended',
      items: ['Evacuate Zone D', 'Suspend work permit', 'Notify fire team'],
    },
    desc: 'The AI doesn\'t just detect — it prescribes. Context-aware recommendations ranked by urgency, aligned with DGMS regulations, and delivered to the right person at the right time.',
  },
  {
    num: '04',
    title: 'Gets smarter over time',
    card: {
      label: 'Learning',
      items: ['23 incident patterns indexed', 'DGMS rules updated', 'Plant model refined'],
    },
    desc: 'Every incident, near-miss, and successful intervention feeds the intelligence layer. SafetyIQ compounds knowledge across your entire operational history and across the industry.',
  },
]

const STATS = [
  { value: '94%', label: 'AI prediction accuracy' },
  { value: '13 min', label: 'avg. early warning window' },
  { value: '40+', label: 'systems correlated in real-time' },
  { value: '0', label: 'critical incidents at pilot sites' },
]

const STEPS = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="3" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M6 7h8M6 10h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Connect your plant',
    desc: 'We integrate with SCADA, DCS, IoT sensors, permit systems, and HR databases in 48 hours. No rip-and-replace.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: 'AI learns your plant',
    desc: 'SafetyIQ builds a digital twin of your facility, indexes historical incidents, and calibrates to your specific risk profile.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M3 10l4 4 10-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Stay ahead of risk',
    desc: 'Your team gets early warnings, ranked recommendations, and full AI reasoning — before the crisis, not during it.',
  },
]

function FeatureCard({ items, label }: { items: string[]; label: string }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(99,102,241,0.12)',
        borderRadius: '16px',
        padding: '20px 22px',
        boxShadow: '0 4px 32px rgba(99,102,241,0.08)',
        minWidth: 220,
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(99,102,241,0.1)',
          borderRadius: 20,
          padding: '3px 10px',
          marginBottom: 14,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#6366f1',
            display: 'inline-block',
            animation: 'pulse-dot 2s ease-in-out infinite',
          }}
        />
        <span style={{ fontSize: 11, fontWeight: 600, color: '#6366f1', letterSpacing: '0.04em' }}>
          {label}
        </span>
      </div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((item) => (
          <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: '#6366f1',
                flexShrink: 0,
                opacity: 0.6,
              }}
            />
            <span style={{ fontSize: 13, color: '#3730a3', fontWeight: 500 }}>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function CountUp({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [value, setValue] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const duration = 1400
          const start = performance.now()
          const step = (now: number) => {
            const progress = Math.min((now - start) / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setValue(Math.round(eased * target))
            if (progress < 1) requestAnimationFrame(step)
          }
          requestAnimationFrame(step)
        }
      },
      { threshold: 0.5 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [target])

  return (
    <span ref={ref}>
      {value}
      {suffix}
    </span>
  )
}

export default function App() {
  const [view, setView] = useState<'landing' | 'dashboard'>('landing')

  if (view === 'dashboard') {
    return <Dashboard onExit={() => setView('landing')} />
  }

  return <LandingPage onLaunch={() => setView('dashboard')} />
}

function LandingPage({ onLaunch }: { onLaunch: () => void }) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeFeature, setActiveFeature] = useState(0)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const id = setInterval(() => setActiveFeature((f) => (f + 1) % FEATURES.length), 3200)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#f7f7f4', color: '#0f0f0e', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes float-card { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes slide-in { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fade-in { from{opacity:0} to{opacity:1} }
        @keyframes spin-slow { to { transform: rotate(360deg); } }
        html { scroll-behavior: smooth; }
        ::selection { background: rgba(99,102,241,0.18); }
      `}</style>

      {/* ── NAV ─────────────────────────────────────────── */}
      <header
        style={{
          position: 'fixed',
          top: scrolled ? 12 : 20,
          left: '50%',
          transform: 'translateX(-50%)',
          width: scrolled ? 'calc(100% - 48px)' : 'calc(100% - 64px)',
          maxWidth: 1120,
          zIndex: 100,
          transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
          borderRadius: 16,
          background: scrolled ? 'rgba(247,247,244,0.88)' : 'transparent',
          backdropFilter: scrolled ? 'blur(24px)' : 'none',
          border: scrolled ? '1px solid rgba(0,0,0,0.07)' : '1px solid transparent',
          boxShadow: scrolled ? '0 4px 40px rgba(0,0,0,0.08)' : 'none',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #6366f1, #818cf8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2L14 6v8H2V6L8 2z" stroke="white" strokeWidth="1.4" fill="none"/>
              <circle cx="8" cy="9" r="2" fill="white" opacity="0.8"/>
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em', color: scrolled ? '#0f0f0e' : 'white' }}>
            SafetyIQ
          </span>
        </div>

        <nav style={{ display: 'flex', gap: 2 }}>
          {NAV_LINKS.map((l) => (
            <a
              key={l}
              href="#"
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: scrolled ? '#3f3f46' : 'rgba(255,255,255,0.82)',
                textDecoration: 'none',
                padding: '6px 14px',
                borderRadius: 8,
                transition: 'color 0.2s, background 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = scrolled ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.12)'
                e.currentTarget.style.color = scrolled ? '#0f0f0e' : 'white'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = scrolled ? '#3f3f46' : 'rgba(255,255,255,0.82)'
              }}
            >
              {l}
            </a>
          ))}
        </nav>

        <button
          style={{
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            color: 'white',
            border: 'none',
            borderRadius: 10,
            padding: '9px 18px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            letterSpacing: '-0.01em',
            boxShadow: '0 2px 12px rgba(99,102,241,0.35)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)'
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,102,241,0.45)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = ''
            e.currentTarget.style.boxShadow = '0 2px 12px rgba(99,102,241,0.35)'
          }}
        >
          Get started free
        </button>
      </header>

      {/* ── HERO ────────────────────────────────────────── */}
      <section
        style={{
          position: 'relative',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          paddingTop: 80,
        }}
      >
        {/* Background image */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${HERO_IMAGE})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 40%',
            filter: 'brightness(0.55) saturate(0.8)',
          }}
        />
        {/* Gradient overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to bottom, rgba(10,8,30,0.35) 0%, rgba(10,8,30,0.15) 50%, rgba(247,247,244,1) 100%)',
          }}
        />

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            textAlign: 'center',
            maxWidth: 820,
            padding: '0 24px',
            animation: 'slide-in 0.9s ease both',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 24,
              padding: '6px 14px',
              marginBottom: 32,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#4ade80',
                animation: 'pulse-dot 2s ease-in-out infinite',
              }}
            />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.06em' }}>
              TRUSTED BY 200+ INDUSTRIAL SITES
            </span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(44px, 7vw, 80px)',
              fontWeight: 900,
              lineHeight: 1.06,
              letterSpacing: '-0.04em',
              color: 'white',
              marginBottom: 24,
            }}
          >
            The AI that works{' '}
            <em style={{ fontStyle: 'italic', color: '#a5b4fc' }}>with</em>
            {' '}your safety team,
            <br />
            not instead of it.
          </h1>

          <p
            style={{
              fontSize: 'clamp(16px, 2vw, 20px)',
              lineHeight: 1.65,
              color: 'rgba(255,255,255,0.72)',
              maxWidth: 560,
              margin: '0 auto 40px',
              fontWeight: 400,
            }}
          >
            SafetyIQ correlates 40+ plant systems in real time — detecting compound risks
            before they become incidents, and explaining every decision in plain language.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              style={{
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                color: 'white',
                border: 'none',
                borderRadius: 12,
                padding: '14px 28px',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '-0.01em',
                boxShadow: '0 4px 32px rgba(99,102,241,0.5)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 40px rgba(99,102,241,0.6)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = ''
                e.currentTarget.style.boxShadow = '0 4px 32px rgba(99,102,241,0.5)'
              }}
              onClick={onLaunch}
            >
              Launch AI Command Center →
            </button>
            <button
              style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 12,
                padding: '14px 28px',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.18)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
              }}
            >
              Watch a demo
            </button>
          </div>
        </div>
      </section>

      {/* ── LOGOS ───────────────────────────────────────── */}
      <section style={{ background: '#f7f7f4', padding: '56px 24px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', color: '#a1a1aa', marginBottom: 32 }}>
          TRUSTED BY INDIA'S LEADING INDUSTRIAL OPERATORS
        </p>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 48,
            flexWrap: 'wrap',
          }}
        >
          {LOGOS.map((logo) => (
            <span
              key={logo}
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#a1a1aa',
                letterSpacing: '-0.01em',
                transition: 'color 0.2s',
                cursor: 'default',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#6366f1')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#a1a1aa')}
            >
              {logo}
            </span>
          ))}
        </div>
      </section>

      {/* ── WHY SECTION ─────────────────────────────────── */}
      <section style={{ padding: 'clamp(80px, 10vw, 128px) clamp(24px, 6vw, 80px)', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 72 }}>
          <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', color: '#6366f1', marginBottom: 16 }}>
            WHY SAFETYIQ
          </p>
          <h2
            style={{
              fontSize: 'clamp(32px, 4.5vw, 56px)',
              fontWeight: 900,
              letterSpacing: '-0.035em',
              lineHeight: 1.1,
              maxWidth: 600,
            }}
          >
            A real intelligence layer,
            <br />
            not another alert system.
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {FEATURES.map((f, i) => (
            <div
              key={f.num}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 48,
                padding: '52px 0',
                borderTop: '1px solid rgba(0,0,0,0.07)',
                alignItems: 'center',
                transition: 'opacity 0.3s',
              }}
              onMouseEnter={() => setActiveFeature(i)}
            >
              {/* Number */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <span
                  style={{
                    fontSize: 52,
                    fontWeight: 900,
                    letterSpacing: '-0.04em',
                    color: activeFeature === i ? '#6366f1' : '#e4e4e7',
                    lineHeight: 1,
                    transition: 'color 0.4s',
                  }}
                >
                  {f.num}
                </span>
                <h3
                  style={{
                    fontSize: 'clamp(20px, 2.2vw, 26px)',
                    fontWeight: 800,
                    letterSpacing: '-0.025em',
                    lineHeight: 1.25,
                  }}
                >
                  {f.title}
                </h3>
              </div>

              {/* Card */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  animation: activeFeature === i ? 'float-card 4s ease-in-out infinite' : 'none',
                }}
              >
                <FeatureCard label={f.card.label} items={f.card.items} />
              </div>

              {/* Desc */}
              <p style={{ fontSize: 16, lineHeight: 1.7, color: '#71717a', fontWeight: 400 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── STATS ───────────────────────────────────────── */}
      <section
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
          padding: 'clamp(64px, 8vw, 96px) clamp(24px, 6vw, 80px)',
        }}
      >
        <div
          style={{
            maxWidth: 1000,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 48,
            textAlign: 'center',
          }}
        >
          {STATS.map((s) => {
            const numMatch = s.value.match(/[\d.]+/)
            const num = numMatch ? parseFloat(numMatch[0]) : 0
            const suffix = s.value.replace(/[\d.]+/, '')
            return (
              <div key={s.label}>
                <div
                  style={{
                    fontSize: 'clamp(36px, 4vw, 52px)',
                    fontWeight: 900,
                    letterSpacing: '-0.04em',
                    color: 'white',
                    lineHeight: 1,
                    marginBottom: 10,
                  }}
                >
                  {Number.isInteger(num) && num > 0 ? (
                    <CountUp target={num} suffix={suffix} />
                  ) : (
                    s.value
                  )}
                </div>
                <p style={{ fontSize: 13, color: 'rgba(165,180,252,0.8)', fontWeight: 500, lineHeight: 1.5 }}>
                  {s.label}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────── */}
      <section style={{ padding: 'clamp(80px, 10vw, 128px) clamp(24px, 6vw, 80px)', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 72 }}>
          <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', color: '#6366f1', marginBottom: 16 }}>
            HOW IT WORKS
          </p>
          <h2
            style={{
              fontSize: 'clamp(30px, 4vw, 52px)',
              fontWeight: 900,
              letterSpacing: '-0.035em',
              lineHeight: 1.1,
            }}
          >
            Up and running in 48 hours.
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 24,
          }}
        >
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              style={{
                background: 'rgba(255,255,255,0.72)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(0,0,0,0.07)',
                borderRadius: 20,
                padding: '36px 32px',
                boxShadow: '0 4px 32px rgba(0,0,0,0.04)',
                transition: 'transform 0.25s, box-shadow 0.25s',
                cursor: 'default',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 12px 48px rgba(99,102,241,0.12)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = ''
                e.currentTarget.style.boxShadow = '0 4px 32px rgba(0,0,0,0.04)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(99,102,241,0.06))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#6366f1',
                  }}
                >
                  {step.icon}
                </div>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#c7d2fe',
                    background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  STEP {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 12 }}>
                {step.title}
              </h3>
              <p style={{ fontSize: 14, lineHeight: 1.65, color: '#71717a' }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── AI PREVIEW SECTION ──────────────────────────── */}
      <section
        style={{
          padding: 'clamp(64px, 8vw, 96px) clamp(24px, 6vw, 80px)',
          background: '#f0f0ec',
        }}
      >
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', color: '#6366f1', marginBottom: 16 }}>
              AI INTELLIGENCE LAYER
            </p>
            <h2
              style={{
                fontSize: 'clamp(28px, 3.5vw, 46px)',
                fontWeight: 900,
                letterSpacing: '-0.035em',
                lineHeight: 1.15,
                marginBottom: 20,
              }}
            >
              Ask why.
              <br />
              Get a real answer.
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: '#71717a', marginBottom: 32 }}>
              Every SafetyIQ alert includes the full reasoning chain — which sensors triggered,
              what historical incidents match, which DGMS regulations apply, and how confident
              the AI is. Your team makes informed decisions, not blind ones.
            </p>
            <button
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                color: 'white',
                border: 'none',
                borderRadius: 10,
                padding: '12px 22px',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
                transition: 'transform 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = '')}
            >
              See the AI in action →
            </button>
          </div>

          {/* Animated reasoning card */}
          <div
            style={{
              background: 'rgba(255,255,255,0.8)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(99,102,241,0.12)',
              borderRadius: 24,
              padding: '28px 28px',
              boxShadow: '0 8px 48px rgba(99,102,241,0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="3" fill="white" opacity="0.9"/>
                  <path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </div>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#1e1b4b' }}>AI Reasoning</span>
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#4ade80',
                  background: 'rgba(74,222,128,0.12)',
                  padding: '3px 8px',
                  borderRadius: 20,
                }}
              >
                LIVE
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Reading SCADA data...', done: true },
                { label: 'Checking IoT sensors...', done: true },
                { label: 'Reading permit database...', done: true },
                { label: 'Checking worker locations...', done: true },
                { label: 'Comparing DGMS rules...', done: false, active: true },
                { label: 'Calculating compound risk...', done: false },
              ].map((item) => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      border: item.done ? 'none' : item.active ? '2px solid #6366f1' : '1.5px solid #e4e4e7',
                      background: item.done ? '#6366f1' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      animation: item.active ? 'pulse-dot 1.5s ease-in-out infinite' : 'none',
                    }}
                  >
                    {item.done && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      color: item.done ? '#71717a' : item.active ? '#3730a3' : '#c4c4c4',
                      fontWeight: item.active ? 600 : 400,
                      textDecoration: item.done ? 'line-through' : 'none',
                      textDecorationColor: '#d4d4d8',
                    }}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: 20,
                padding: '16px',
                background: 'linear-gradient(135deg, rgba(239,68,68,0.06), rgba(239,68,68,0.02))',
                border: '1px solid rgba(239,68,68,0.15)',
                borderRadius: 12,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#ef4444', letterSpacing: '0.05em', marginBottom: 4 }}>
                    COMPOUND EXPLOSION RISK
                  </p>
                  <p style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', color: '#1e1b4b' }}>
                    94% Confidence
                  </p>
                  <p style={{ fontSize: 12, color: '#71717a', marginTop: 4 }}>
                    13 min before critical threshold
                  </p>
                </div>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    border: '3px solid rgba(239,68,68,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'pulse-dot 2s ease-in-out infinite',
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: 'rgba(239,68,68,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M7 3v4M7 10v.5" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(80px, 10vw, 128px) clamp(24px, 6vw, 80px)', textAlign: 'center' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2
            style={{
              fontSize: 'clamp(36px, 5vw, 64px)',
              fontWeight: 900,
              letterSpacing: '-0.04em',
              lineHeight: 1.08,
              marginBottom: 20,
            }}
          >
            Ready to see inside
            <br />
            <span
              style={{
                background: 'linear-gradient(135deg, #6366f1, #a5b4fc)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              your plant in real time?
            </span>
          </h2>
          <p style={{ fontSize: 17, color: '#71717a', lineHeight: 1.65, marginBottom: 40 }}>
            Get a personalized demo of the AI Command Center. We'll connect your plant's
            systems and show you exactly what SafetyIQ would have caught in your last 12 months.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              style={{
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                color: 'white',
                border: 'none',
                borderRadius: 12,
                padding: '16px 32px',
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '-0.01em',
                boxShadow: '0 4px 32px rgba(99,102,241,0.4)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 48px rgba(99,102,241,0.5)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = ''
                e.currentTarget.style.boxShadow = '0 4px 32px rgba(99,102,241,0.4)'
              }}
              onClick={onLaunch}
            >
              Launch AI Command Center →
            </button>
            <button
              style={{
                background: 'transparent',
                color: '#3730a3',
                border: '1.5px solid rgba(99,102,241,0.3)',
                borderRadius: 12,
                padding: '16px 32px',
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'border-color 0.2s, background 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#6366f1'
                e.currentTarget.style.background = 'rgba(99,102,241,0.04)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'
                e.currentTarget.style.background = 'transparent'
              }}
            >
              Schedule a demo
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────── */}
      <footer
        style={{
          borderTop: '1px solid rgba(0,0,0,0.07)',
          padding: '40px clamp(24px, 6vw, 80px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 7,
              background: 'linear-gradient(135deg, #6366f1, #818cf8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M8 2L14 6v8H2V6L8 2z" stroke="white" strokeWidth="1.4" fill="none"/>
              <circle cx="8" cy="9" r="2" fill="white" opacity="0.8"/>
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: '-0.02em' }}>SafetyIQ</span>
        </div>
        <p style={{ fontSize: 13, color: '#a1a1aa' }}>
          © 2025 SafetyIQ. AI-powered industrial safety intelligence.
        </p>
        <div style={{ display: 'flex', gap: 24 }}>
          {['Privacy', 'Terms', 'Contact'].map((l) => (
            <a
              key={l}
              href="#"
              style={{ fontSize: 13, color: '#a1a1aa', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#6366f1')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#a1a1aa')}
            >
              {l}
            </a>
          ))}
        </div>
      </footer>
    </div>
  )
}
