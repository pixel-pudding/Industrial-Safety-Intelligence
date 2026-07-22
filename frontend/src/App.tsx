import { useState, useEffect, useRef } from 'react'
import { useFacilityState, type LiveRiskEvent } from './hooks/useFacilityState'
import type { Tier, ZoneHeatmapEntry, SensorReadingTick, PermitFlag, EmergencyResponseResult } from './services/api'

// ── Color tokens ────────────────────────────────────────────────────────────
// Primary: warm amber/butter yellow replacing generic indigo
const C = {
  amber: '#f59e0b',
  amberDark: '#d97706',
  amberLight: '#fbbf24',
  amberBg: 'rgba(245,158,11,0.1)',
  amberBgMed: 'rgba(245,158,11,0.15)',
  amberBorder: 'rgba(245,158,11,0.25)',
  pageBg: '#faf8f4',
  pageBgAlt: '#f5f0e8',
  dashBg: 'linear-gradient(160deg, #fefce8 0%, #fffbeb 40%, #fef3c7 60%, #fff7ed 100%)',
  cream: '#fffbeb',
  textDark: '#1c1814',
  textMid: '#57534e',
  textMuted: '#a8a29e',
  critical: '#ef4444',
  elevated: '#f97316',
  healthy: '#22c55e',
  cardBg: 'rgba(255,255,255,0.72)',
  cardBorder: 'rgba(0,0,0,0.07)',
}

// ── Hero image ───────────────────────────────────────────────────────────────
const HERO_IMAGE =
  'https://images.unsplash.com/photo-1652734849437-c5101767f9b3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw0fHxpbmR1c3RyaWFsJTIwcGxhbnQlMjB3YXJtJTIwc3Vuc2V0JTIwZ29sZGVuJTIwZm9nJTIwZnV0dXJpc3RpY3xlbnwxfHx8fDE3ODQ3MDU5OTh8MA&ixlib=rb-4.1.0&q=80&w=1080'

// ── Constants ────────────────────────────────────────────────────────────────
// Real, functional in-page anchors — not decorative href="#" links to pages
// that don't exist (no pricing/contact/blog page is part of this build).
const NAV_LINKS = [
  { label: 'Why Safe Grid', href: '#why' },
  { label: 'How It Works', href: '#how-it-works' },
]

const INDUSTRY_TAGS = ['Chemical Manufacturing', 'Oil & Gas', 'Petrochemicals', 'Mining & Metals', 'Power Generation', 'Pharmaceuticals']

const FEATURES = [
  {
    num: '01',
    title: 'Sees what humans miss',
    card: {
      label: 'AI detected',
      items: ['Cooling tower degrading', 'Pressure variance +12%', 'VOC threshold 87%'],
    },
    desc: 'The Compound Risk Detection Engine scores seven independent evidence categories every two seconds — sensor drift, overdue maintenance, permit conditions, worker presence — and flags the combinations no single reading would catch alone.',
  },
  {
    num: '02',
    title: 'Explains every decision',
    card: {
      label: 'AI reasoning',
      items: ['Checked 5 signal categories', 'Matched incident via RAG retrieval', 'Confidence scored, not asserted'],
    },
    desc: "Every Warning or Critical event triggers a retrieval-augmented reasoning pass — matched historical incidents, cited DGMS/OISD clauses, and a confidence score. Nothing is asserted without a source.",
  },
  {
    num: '03',
    title: 'Guides the right action',
    card: {
      label: 'Recommended',
      items: ['Evacuate Zone D', 'Suspend work permit', 'Notify fire team'],
    },
    desc: "Recommended interventions come from the same reasoning pass that scored the risk — tied to the regulation that justifies them, not a generic checklist.",
  },
  {
    num: '04',
    title: 'Grounded in real precedent',
    card: {
      label: 'Knowledge base',
      items: ['10 documented incident case studies', 'DGMS & OISD clauses indexed', 'ChromaDB retrieval, not guesswork'],
    },
    desc: 'The reasoning layer is grounded in a corpus of real historical incident narratives and regulatory text — retrieved and cited on every call, never fabricated.',
  },
]

const STATS = [
  { value: '6', label: 'independent AI agents' },
  { value: '10', label: 'scripted incident scenarios' },
  { value: '11', label: 'plant zones modeled live' },
  { value: '2s', label: 'sensor tick interval' },
]

const STEPS = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="3" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M6 7h8M6 10h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Run a real scenario',
    desc: 'Pick from ten scripted incident scenarios — a skipped nitrogen purge, a compound cascade across three zones — replayed against a live simulated plant, not a static slideshow.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Watch the AI reason live',
    desc: 'The digital twin updates every two seconds. The moment a zone crosses into Warning or Critical, the reasoning engine runs — retrieving precedent, checking regulation, scoring confidence.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M3 10l4 4 10-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Get evidence, not just an alert',
    desc: 'Every recommendation shows its work: which signals triggered it, which incident it matches, which regulation applies — so you can verify it before acting on it.',
  },
]

// ── Zones (dashboard) ────────────────────────────────────────────────────────
// Layout-only — x/y/w/h/label/id are frontend canvas geometry with no backend
// equivalent (kept verbatim, zero visual change). `id` matches real backend
// zone ids (A-K) exactly, so it's also the join key into live data.
interface ZoneLayout {
  id: string
  label: string
  x: number
  y: number
  w: number
  h: number
}

const ZONE_LAYOUT: ZoneLayout[] = [
  { id: 'A', label: 'Reactor', x: 60, y: 40, w: 80, h: 60 },
  { id: 'B', label: 'Chlor Alkali', x: 160, y: 40, w: 90, h: 60 },
  { id: 'C', label: 'Tank Farm', x: 60, y: 120, w: 80, h: 55 },
  { id: 'D', label: 'Blending', x: 160, y: 120, w: 90, h: 55 },
  { id: 'E', label: 'Resin', x: 270, y: 40, w: 70, h: 60 },
  { id: 'F', label: 'Utilities', x: 270, y: 120, w: 70, h: 55 },
  { id: 'G', label: 'Loading Bay', x: 60, y: 195, w: 100, h: 50 },
  { id: 'H', label: 'Maintenance', x: 170, y: 195, w: 80, h: 50 },
  { id: 'I', label: 'Control Room', x: 260, y: 195, w: 80, h: 50 },
  // J/K widened vs. their siblings — "Security Gate" / "Flare Stack" are
  // longer labels than the 60-70 unit boxes upstream rows use, and this row
  // has unused canvas out to x=340 (rows above run A-B-E and G-H-I that far)
  // that a narrower box was leaving empty instead of using.
  { id: 'J', label: 'Security Gate', x: 60, y: 265, w: 130, h: 45 },
  { id: 'K', label: 'Flare Stack', x: 205, y: 265, w: 130, h: 45 },
]

// Real status + workers + permits + a DYNAMIC per-zone tag list (not a fixed
// temp/pressure pair — zones like K have neither tag, others have several).
interface LiveZone extends ZoneLayout {
  status: 'healthy' | 'elevated' | 'critical'
  workers: number
  permits: number
  riskScore: number
  flaggedPermits: number
  tags: { tag: string; value: number | string; tier: Tier }[]
}

function tierToStatus(tier: Tier): 'healthy' | 'elevated' | 'critical' {
  return tier === 'critical' ? 'critical' : tier === 'warning' ? 'elevated' : 'healthy'
}

// Real risk_score-driven gradient for the Heatmap layer (independent of the
// 3-tier status coloring used elsewhere) — four real backend-derived bands,
// not a decorative fixed palette.
function heatColor(score: number) {
  if (score >= 80) return { bg: 'rgba(239,68,68,0.3)', border: 'rgba(239,68,68,0.65)', text: '#b91c1c' }
  if (score >= 60) return { bg: 'rgba(249,115,22,0.26)', border: 'rgba(249,115,22,0.6)', text: '#c2410c' }
  if (score >= 30) return { bg: 'rgba(245,158,11,0.22)', border: 'rgba(245,158,11,0.55)', text: '#92400e' }
  return { bg: 'rgba(74,222,128,0.16)', border: 'rgba(74,222,128,0.5)', text: '#15803d' }
}

function buildLiveZones(
  heatmapZones: ZoneHeatmapEntry[] | undefined,
  readings: Record<string, SensorReadingTick>,
  permitFlags: PermitFlag[] = [],
): LiveZone[] {
  const byZone = new Map((heatmapZones || []).map((z) => [z.zone_id, z]))
  return ZONE_LAYOUT.map((layout) => {
    const hz = byZone.get(layout.id)
    const tags = Object.entries(readings)
      .filter(([, r]) => r.zone === layout.id)
      .map(([tag, r]) => ({ tag, value: r.value, tier: r.tier }))
    return {
      ...layout,
      status: tierToStatus(hz?.risk_tier ?? 'normal'),
      workers: hz?.worker_count ?? 0,
      permits: hz?.active_permits.length ?? 0,
      riskScore: hz?.risk_score ?? 0,
      flaggedPermits: permitFlags.filter((f) => f.zone_id === layout.id).length,
      tags,
    }
  })
}

const STATUS_COLORS = {
  healthy: { bg: 'rgba(74,222,128,0.12)', border: 'rgba(74,222,128,0.45)', dot: '#22c55e', text: '#15803d' },
  elevated: { bg: 'rgba(251,146,60,0.12)', border: 'rgba(251,146,60,0.45)', dot: '#f97316', text: '#c2410c' },
  critical: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.45)', dot: '#ef4444', text: '#b91c1c' },
}

// Generic phase labels for the reveal animation — a reasonable narrative of
// the REAL backend pipeline (rule scoring -> permit/worker checks -> RAG
// incident+regulation lookup -> LLM reasoning -> interventions), not
// per-step real telemetry (the backend doesn't expose granular sub-step
// progress). The animation is now triggered by a real WS risk event arriving
// and ends by showing that event's real evidence — it no longer runs
// unconditionally on mount with a hardcoded fake result.
const REASONING_STEPS = [
  'Reading SCADA data...', 'Checking IoT sensors...', 'Reading permit database...',
  'Checking worker locations...', 'Retrieving historical incidents...',
  'Comparing DGMS rules...', 'Calculating compound risk...', 'Generating recommendations...',
]

interface Message {
  role: 'ai' | 'user'
  text: string
}

const DASH_NAV = ['Overview', 'Digital Twin', 'AI Intelligence', 'Copilot', 'Replay', 'More']
const MORE_ITEMS = ['Historical Incidents', 'Compliance', 'Reports', 'Analytics', 'Settings']

// ── Shared helpers ───────────────────────────────────────────────────────────
function FeatureCard({ items, label }: { items: string[]; label: string }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.8)',
      backdropFilter: 'blur(20px)',
      border: `1px solid ${C.amberBorder}`,
      borderRadius: 16,
      padding: '18px 20px',
      boxShadow: '0 4px 32px rgba(245,158,11,0.08)',
      minWidth: 210,
    }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: C.amberBg, borderRadius: 20, padding: '3px 10px', marginBottom: 12 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.amber, display: 'inline-block', animation: 'pulse-dot 2s ease-in-out infinite' }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: C.amberDark, letterSpacing: '0.04em' }}>{label}</span>
      </div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
        {items.map((item) => (
          <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.amber, flexShrink: 0, opacity: 0.6 }} />
            <span style={{ fontSize: 13, color: '#78350f', fontWeight: 500 }}>{item}</span>
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
    const observer = new IntersectionObserver(([entry]) => {
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
    }, { threshold: 0.5 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [target])

  return <span ref={ref}>{value}{suffix}</span>
}

// ── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState<'landing' | 'dashboard'>('landing')
  if (view === 'dashboard') return <Dashboard onExit={() => setView('landing')} />
  return <LandingPage onLaunch={() => setView('dashboard')} />
}

// ════════════════════════════════════════════════════════════════════════════
// LANDING PAGE
// ════════════════════════════════════════════════════════════════════════════
function LandingPage({ onLaunch }: { onLaunch: () => void }) {
  const [scrolled, setScrolled] = useState(false)
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
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: C.pageBg, color: C.textDark, overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes float-card { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes slide-in { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slide-right { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
        html { scroll-behavior: smooth; }
        ::selection { background: rgba(245,158,11,0.2); }
      `}</style>

      {/* ── NAV ── */}
      <header style={{
        position: 'fixed',
        top: scrolled ? 12 : 20,
        left: '50%',
        transform: 'translateX(-50%)',
        width: scrolled ? 'calc(100% - 48px)' : 'calc(100% - 64px)',
        maxWidth: 1120,
        zIndex: 100,
        transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
        borderRadius: 16,
        background: scrolled ? 'rgba(250,248,244,0.9)' : 'transparent',
        backdropFilter: scrolled ? 'blur(24px)' : 'none',
        border: scrolled ? '1px solid rgba(0,0,0,0.07)' : '1px solid transparent',
        boxShadow: scrolled ? '0 4px 40px rgba(0,0,0,0.08)' : 'none',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: `linear-gradient(135deg, ${C.amber}, ${C.amberDark})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2L14 6v8H2V6L8 2z" stroke="white" strokeWidth="1.4" fill="none"/>
              <circle cx="8" cy="9" r="2" fill="white" opacity="0.8"/>
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em', color: scrolled ? C.textDark : 'white' }}>Safe Grid</span>
        </div>

        <nav style={{ display: 'flex', gap: 2 }}>
          {NAV_LINKS.map((l) => (
            <a key={l.label} href={l.href} style={{
              fontSize: 14, fontWeight: 500,
              color: scrolled ? C.textMid : 'rgba(255,255,255,0.82)',
              textDecoration: 'none', padding: '6px 14px', borderRadius: 8, transition: 'color 0.2s, background 0.2s',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.background = scrolled ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = scrolled ? C.textDark : 'white' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = scrolled ? C.textMid : 'rgba(255,255,255,0.82)' }}
            >{l.label}</a>
          ))}
        </nav>

        <button style={{
          background: `linear-gradient(135deg, ${C.amber}, ${C.amberDark})`,
          color: 'white', border: 'none', borderRadius: 10, padding: '9px 18px',
          fontSize: 13, fontWeight: 600, cursor: 'pointer', letterSpacing: '-0.01em',
          boxShadow: '0 2px 12px rgba(245,158,11,0.4)', transition: 'transform 0.15s, box-shadow 0.15s',
        }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(245,158,11,0.5)' }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 12px rgba(245,158,11,0.4)' }}
          onClick={onLaunch}
        >Launch Command Center</button>
      </header>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', paddingTop: 80 }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${HERO_IMAGE})`, backgroundSize: 'cover', backgroundPosition: 'center 35%', filter: 'brightness(0.6) saturate(0.9)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(28,18,10,0.3) 0%, rgba(28,18,10,0.15) 45%, rgba(250,248,244,1) 100%)' }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 820, padding: '0 24px', animation: 'slide-in 0.9s ease both' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 24, padding: '6px 14px', marginBottom: 28 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', animation: 'pulse-dot 2s ease-in-out infinite' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.06em' }}>ET AI HACKATHON 2026 — PROBLEM STATEMENT #1</span>
          </div>

          <h1 style={{ fontSize: 'clamp(44px, 7vw, 78px)', fontWeight: 900, lineHeight: 1.06, letterSpacing: '-0.04em', color: 'white', marginBottom: 20 }}>
            The AI that works <em style={{ fontStyle: 'italic', color: '#fcd34d' }}>with</em> your safety team,
            <br />not instead of it.
          </h1>

          <p style={{ fontSize: 'clamp(16px, 2vw, 19px)', lineHeight: 1.6, color: 'rgba(255,255,255,0.72)', maxWidth: 540, margin: '0 auto 36px', fontWeight: 400 }}>
            Six purpose-built AI agents reasoning over a live simulated petrochemical plant — correlating sensor drift, permit conditions, maintenance backlogs, and worker location to catch compound risks a single reading would miss, then explaining every call with the regulation and precedent behind it.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button style={{
              background: `linear-gradient(135deg, ${C.amber}, ${C.amberDark})`,
              color: 'white', border: 'none', borderRadius: 12, padding: '14px 28px',
              fontSize: 15, fontWeight: 700, cursor: 'pointer', letterSpacing: '-0.01em',
              boxShadow: '0 4px 32px rgba(245,158,11,0.5)', transition: 'transform 0.15s, box-shadow 0.15s',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 40px rgba(245,158,11,0.6)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 32px rgba(245,158,11,0.5)' }}
              onClick={onLaunch}
            >Launch AI Command Center →</button>
            <a href="#how-it-works" style={{
              background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', textDecoration: 'none',
              color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12,
              padding: '14px 28px', fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s',
              display: 'inline-block',
            }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.18)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
            >See how it reasons</a>
          </div>
        </div>
      </section>

      {/* ── INDUSTRY FOCUS ── */}
      <section style={{ background: C.pageBg, padding: '40px 24px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', color: C.textMuted, marginBottom: 24 }}>
          BUILT FOR HIGH-HAZARD INDUSTRIAL ENVIRONMENTS
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {INDUSTRY_TAGS.map((tag) => (
            <span key={tag} style={{
              fontSize: 13, fontWeight: 600, color: C.amberDark, letterSpacing: '-0.01em',
              background: C.amberBg, border: `1px solid ${C.amberBorder}`, borderRadius: 20, padding: '6px 14px',
            }}>{tag}</span>
          ))}
        </div>
      </section>

      {/* ── WHY SECTION ── */}
      <section id="why" style={{ padding: 'clamp(60px, 8vw, 96px) clamp(24px, 6vw, 80px)', maxWidth: 1200, margin: '0 auto', scrollMarginTop: 88 }}>
        <div style={{ marginBottom: 56 }}>
          <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', color: C.amber, marginBottom: 14 }}>WHY SAFE GRID</p>
          <h2 style={{ fontSize: 'clamp(30px, 4.5vw, 52px)', fontWeight: 900, letterSpacing: '-0.035em', lineHeight: 1.1, maxWidth: 540 }}>
            A real intelligence layer,<br />not another alert system.
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {FEATURES.map((f, i) => (
            <div key={f.num} style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 40,
              padding: '40px 0', borderTop: '1px solid rgba(0,0,0,0.07)',
              alignItems: 'center', transition: 'opacity 0.3s',
            }} onMouseEnter={() => setActiveFeature(i)}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <span style={{ fontSize: 48, fontWeight: 900, letterSpacing: '-0.04em', color: activeFeature === i ? C.amber : '#e7e5e4', lineHeight: 1, transition: 'color 0.4s' }}>{f.num}</span>
                <h3 style={{ fontSize: 'clamp(18px, 2vw, 24px)', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.25, color: C.textDark }}>{f.title}</h3>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', animation: activeFeature === i ? 'float-card 4s ease-in-out infinite' : 'none' }}>
                <FeatureCard label={f.card.label} items={f.card.items} />
              </div>
              <p style={{ fontSize: 15, lineHeight: 1.7, color: C.textMid, fontWeight: 400 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ background: 'linear-gradient(135deg, #1c1208 0%, #292010 50%, #1c1208 100%)', padding: 'clamp(48px, 6vw, 72px) clamp(24px, 6vw, 80px)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 40, textAlign: 'center' }}>
          {STATS.map((s) => {
            const numMatch = s.value.match(/[\d.]+/)
            const num = numMatch ? parseFloat(numMatch[0]) : 0
            const suffix = s.value.replace(/[\d.]+/, '')
            return (
              <div key={s.label}>
                <div style={{ fontSize: 'clamp(34px, 4vw, 50px)', fontWeight: 900, letterSpacing: '-0.04em', color: 'white', lineHeight: 1, marginBottom: 8 }}>
                  {Number.isInteger(num) && num > 0 ? <CountUp target={num} suffix={suffix} /> : s.value}
                </div>
                <p style={{ fontSize: 13, color: 'rgba(253,230,138,0.75)', fontWeight: 500, lineHeight: 1.5 }}>{s.label}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── HOW IT WORKS + AI PREVIEW (merged, 2-col) ── */}
      <section id="how-it-works" style={{ padding: 'clamp(60px, 8vw, 96px) clamp(24px, 6vw, 80px)', maxWidth: 1200, margin: '0 auto', scrollMarginTop: 88 }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', color: C.amber, marginBottom: 14 }}>HOW IT WORKS</p>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, letterSpacing: '-0.035em', lineHeight: 1.1 }}>Three steps, no black box.</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start' }}>
          {/* Steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {STEPS.map((step, i) => (
              <div key={step.title} style={{
                background: C.cardBg, backdropFilter: 'blur(20px)',
                border: `1px solid ${C.cardBorder}`, borderRadius: 20, padding: '28px 28px',
                boxShadow: '0 4px 32px rgba(0,0,0,0.04)', transition: 'transform 0.25s, box-shadow 0.25s', cursor: 'default',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 12px 40px ${C.amberBg}` }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 32px rgba(0,0,0,0.04)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: C.amberBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.amber }}>
                    {step.icon}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, background: `linear-gradient(135deg, ${C.amber}, ${C.amberDark})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    STEP {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8, color: C.textDark }}>{step.title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.65, color: C.textMid }}>{step.desc}</p>
              </div>
            ))}
          </div>

          {/* AI reasoning preview card */}
          <div style={{ position: 'sticky', top: 100 }}>
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', color: C.amber, marginBottom: 12 }}>AI INTELLIGENCE LAYER</p>
              <h2 style={{ fontSize: 'clamp(26px, 3vw, 40px)', fontWeight: 900, letterSpacing: '-0.035em', lineHeight: 1.15, marginBottom: 16, color: C.textDark }}>
                Ask why.<br />Get a real answer.
              </h2>
              <p style={{ fontSize: 15, lineHeight: 1.7, color: C.textMid, marginBottom: 24 }}>
                Every Warning or Critical alert includes full reasoning — which signals triggered it, which historical incident it matches, which DGMS or OISD clause applies.
              </p>
              <button style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: `linear-gradient(135deg, ${C.amber}, ${C.amberDark})`,
                color: 'white', border: 'none', borderRadius: 10, padding: '12px 22px',
                fontSize: 14, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(245,158,11,0.4)', transition: 'transform 0.15s',
              }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = '')}
                onClick={onLaunch}
              >See the AI in action →</button>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(24px)',
              border: `1px solid ${C.amberBorder}`, borderRadius: 24,
              padding: '24px', boxShadow: '0 8px 48px rgba(245,158,11,0.1)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: `linear-gradient(135deg, ${C.amber}, ${C.amberDark})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="3" fill="white" opacity="0.9"/>
                    <path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                </div>
                <span style={{ fontWeight: 700, fontSize: 14, color: C.textDark }}>AI Reasoning</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: '#4ade80', background: 'rgba(74,222,128,0.12)', padding: '3px 8px', borderRadius: 20 }}>LIVE</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {[
                  { label: 'Reading SCADA data...', done: true },
                  { label: 'Checking IoT sensors...', done: true },
                  { label: 'Reading permit database...', done: true },
                  { label: 'Checking worker locations...', done: true },
                  { label: 'Comparing DGMS rules...', done: false, active: true },
                  { label: 'Calculating compound risk...', done: false },
                ].map((item) => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%',
                      border: item.done ? 'none' : item.active ? `2px solid ${C.amber}` : '1.5px solid #e7e5e4',
                      background: item.done ? C.amber : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      animation: item.active ? 'pulse-dot 1.5s ease-in-out infinite' : 'none',
                    }}>
                      {item.done && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    <span style={{ fontSize: 13, color: item.done ? C.textMuted : item.active ? '#92400e' : '#d6d3d1', fontWeight: item.active ? 600 : 400, textDecoration: item.done ? 'line-through' : 'none', textDecorationColor: '#d6d3d1' }}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 18, padding: '14px', background: 'linear-gradient(135deg, rgba(239,68,68,0.06), rgba(239,68,68,0.02))', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', letterSpacing: '0.05em', marginBottom: 4 }}>COMPOUND EXPLOSION RISK</p>
                    <p style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.03em', color: C.textDark }}>94% Confidence</p>
                    <p style={{ fontSize: 11, color: C.textMuted, marginTop: 3 }}>13 min before critical threshold</p>
                  </div>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulse-dot 2s ease-in-out infinite' }}>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 3v4M7 10v.5" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/></svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: 'clamp(60px, 8vw, 96px) clamp(24px, 6vw, 80px)', textAlign: 'center', background: C.pageBgAlt }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(32px, 5vw, 58px)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.08, marginBottom: 18, color: C.textDark }}>
            Ready to watch it<br />
            <span style={{ background: `linear-gradient(135deg, ${C.amber}, ${C.amberLight})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>reason through an incident?</span>
          </h2>
          <p style={{ fontSize: 16, color: C.textMid, lineHeight: 1.65, marginBottom: 36 }}>
            Launch the AI Command Center and run any of the ten scripted scenarios yourself — watch the detection engine correlate signals, retrieve precedent, and explain its own call in real time.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button style={{
              background: `linear-gradient(135deg, ${C.amber}, ${C.amberDark})`,
              color: 'white', border: 'none', borderRadius: 12, padding: '15px 30px',
              fontSize: 15, fontWeight: 700, cursor: 'pointer', letterSpacing: '-0.01em',
              boxShadow: '0 4px 32px rgba(245,158,11,0.45)', transition: 'transform 0.15s, box-shadow 0.15s',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 48px rgba(245,158,11,0.55)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 32px rgba(245,158,11,0.45)' }}
              onClick={onLaunch}
            >Launch AI Command Center →</button>
            <a href="https://github.com/pixel-pudding/Industrial-Safety-Intelligence" target="_blank" rel="noopener noreferrer" style={{
              background: 'transparent', color: C.amberDark, textDecoration: 'none', display: 'inline-block',
              border: `1.5px solid ${C.amberBorder}`, borderRadius: 12, padding: '15px 30px',
              fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'border-color 0.2s, background 0.2s',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.amber; e.currentTarget.style.background = C.amberBg }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.amberBorder; e.currentTarget.style.background = 'transparent' }}
            >View source on GitHub</a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid rgba(0,0,0,0.07)', padding: '32px clamp(24px, 6vw, 80px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: `linear-gradient(135deg, ${C.amber}, ${C.amberDark})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 2L14 6v8H2V6L8 2z" stroke="white" strokeWidth="1.4" fill="none"/><circle cx="8" cy="9" r="2" fill="white" opacity="0.8"/></svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: '-0.02em', color: C.textDark }}>Safe Grid</span>
        </div>
        <p style={{ fontSize: 13, color: C.textMuted }}>© 2025 Safe Grid. AI-powered industrial safety intelligence.</p>
        <div style={{ display: 'flex', gap: 24 }}>
          {['Privacy', 'Terms', 'Contact'].map((l) => (
            <a key={l} href="#" style={{ fontSize: 13, color: C.textMuted, textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = C.amber)}
              onMouseLeave={(e) => (e.currentTarget.style.color = C.textMuted)}
            >{l}</a>
          ))}
        </div>
      </footer>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// DASHBOARD SUB-COMPONENTS
// ════════════════════════════════════════════════════════════════════════════
function DigitalTwin({ zones, worstActiveEvent, onZoneSelect }: { zones: LiveZone[]; worstActiveEvent: LiveRiskEvent | null; onZoneSelect: (z: LiveZone | null) => void }) {
  // Store only the id, not the zone object — the object is a snapshot from
  // whichever render the mouseenter fired in, and would freeze the tooltip
  // (workers/permits/tags) at that instant instead of tracking live WS ticks.
  // Looking the id up in the current `zones` prop every render keeps it live.
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const hovered = hoveredId ? zones.find((z) => z.id === hoveredId) ?? null : null
  const [activeLayer, setActiveLayer] = useState('3D View')
  const layers = ['3D View', 'Heatmap', 'Sensor Layer', 'Worker Layer', 'Permit Layer']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      <div style={{
        background: C.cardBg, backdropFilter: 'blur(20px)', borderRadius: 24,
        border: `1px solid ${C.amberBorder}`, boxShadow: '0 4px 40px rgba(245,158,11,0.06)',
        padding: 20, flex: 1, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: C.amber, marginBottom: 2 }}>DIGITAL TWIN</p>
            <h3 style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em', color: C.textDark }}>Live Plant Map</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'pulse-dot 2s ease-in-out infinite' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: '#22c55e' }}>LIVE</span>
          </div>
        </div>

        <div style={{ background: 'linear-gradient(135deg, #fefce8, #fef3c7)', borderRadius: 16, padding: '8px', position: 'relative', overflow: 'hidden' }}>
          {/* Capped at 560px so this doesn't blow up to fill a wide grid
              column — at full column width (often 1000px+) the viewBox scale
              factor got large enough that the per-zone worker/permit icon row
              overflowed narrow zone boxes (J, K) and bled into the neighbor. */}
          <svg width="100%" viewBox="0 0 360 350" style={{ display: 'block', maxWidth: 560, margin: '0 auto' }}>
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(245,158,11,0.08)" strokeWidth="0.5" />
              </pattern>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
            <rect width="360" height="320" fill="url(#grid)" />

            {/* Was unconditional (always implied a Zone A-C-D compound pathway
                even when nothing was actually elevated) — now only shown
                alongside a real active event, same gate as the annotation box. */}
            {worstActiveEvent && (
              <g opacity="0.7">
                <line x1="100" y1="70" x2="100" y2="120" stroke="#ef4444" strokeWidth="2" strokeDasharray="6 3">
                  <animate attributeName="stroke-dashoffset" from="0" to="-18" dur="1.2s" repeatCount="indefinite" />
                </line>
                <line x1="100" y1="148" x2="200" y2="148" stroke="#ef4444" strokeWidth="2" strokeDasharray="6 3">
                  <animate attributeName="stroke-dashoffset" from="0" to="-18" dur="1.2s" repeatCount="indefinite" />
                </line>
                <line x1="200" y1="120" x2="200" y2="70" stroke="#ef4444" strokeWidth="2" strokeDasharray="6 3">
                  <animate attributeName="stroke-dashoffset" from="0" to="-18" dur="1.2s" repeatCount="indefinite" />
                </line>
                <circle cx="100" cy="120" r="5" fill="#ef4444" opacity="0.4">
                  <animate attributeName="r" values="4;7;4" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle cx="200" cy="148" r="5" fill="#ef4444" opacity="0.4">
                  <animate attributeName="r" values="4;7;4" dur="2s" begin="0.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" begin="0.5s" repeatCount="indefinite" />
                </circle>
              </g>
            )}

            {zones.map((z) => {
              const sc = STATUS_COLORS[z.status]
              const isHov = hoveredId === z.id
              const heat = heatColor(z.riskScore)
              const onHeatmap = activeLayer === 'Heatmap'
              const fill = onHeatmap ? heat.bg : isHov ? sc.bg.replace('0.12', '0.25') : sc.bg
              const stroke = onHeatmap ? heat.border : isHov ? sc.dot : sc.border
              return (
                <g key={z.id} style={{ cursor: 'pointer' }}
                  onMouseEnter={() => { setHoveredId(z.id); onZoneSelect(z) }}
                  onClick={() => { setHoveredId(z.id); onZoneSelect(z) }}
                >
                  {z.status === 'critical' && (
                    <rect x={z.x - 4} y={z.y - 4} width={z.w + 8} height={z.h + 8} rx="14" fill="rgba(239,68,68,0.1)" filter="url(#glow)">
                      <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
                    </rect>
                  )}
                  <rect x={z.x} y={z.y} width={z.w} height={z.h} rx="10"
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={isHov ? 2 : 1}
                    style={{ transition: 'fill 0.15s ease, stroke 0.15s ease, stroke-width 0.15s ease' }}
                  />
                  <text x={z.x + 8} y={z.y + 16} fontSize="9" fontWeight="700" fill={sc.text} opacity="0.7">Zone {z.id}</text>
                  <text x={z.x + 8} y={z.y + 28} fontSize="10" fontWeight="700" fill={C.textDark}>{z.label}</text>
                  <circle cx={z.x + z.w - 10} cy={z.y + 10} r="4" fill={sc.dot}>
                    {z.status !== 'healthy' && <animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite" />}
                  </circle>

                  {/* Bottom info row — what it shows depends on the active
                      layer button, so each layer is a genuinely different
                      view of real per-zone data, not just a relabeled button. */}
                  {activeLayer === 'Heatmap' && (
                    <text x={z.x + 8} y={z.y + z.h - 8} fontSize="9" fontWeight="700" fill={heat.text}>Risk {Math.round(z.riskScore)}</text>
                  )}
                  {activeLayer === 'Sensor Layer' && (
                    <text x={z.x + 8} y={z.y + z.h - 8} fontSize="9" fontWeight="600" fill={C.amberDark}>📡 {z.tags.length} tag{z.tags.length === 1 ? '' : 's'}</text>
                  )}
                  {activeLayer === 'Worker Layer' && (
                    <text x={z.x + 8} y={z.y + z.h - 8} fontSize="10" fontWeight="700" fill={C.amber}>👷 {z.workers} on site</text>
                  )}
                  {activeLayer === 'Permit Layer' && (
                    <text x={z.x + 8} y={z.y + z.h - 8} fontSize="9" fontWeight="600" fill={z.flaggedPermits > 0 ? '#ef4444' : C.amberDark}>
                      📋 {z.permits}{z.flaggedPermits > 0 ? ` · 🚩 ${z.flaggedPermits}` : ''}
                    </text>
                  )}
                  {activeLayer === '3D View' && (
                    <>
                      <text x={z.x + 8} y={z.y + z.h - 8} fontSize="9" fill={C.amber} fontWeight="600">👷 {z.workers}</text>
                      <text x={z.x + 30} y={z.y + z.h - 8} fontSize="9" fill={C.amberDark} fontWeight="600">📋 {z.permits}</text>
                    </>
                  )}
                </g>
              )
            })}

            {/* Decision 3: no fabricated "13 min to threshold" or fixed 94% —
                only rendered when a real event exists, with its real zone/tier/
                confidence. No backend model produces a lead-time estimate. */}
            {/* Full-width banner below the zone grid (rather than a floating
                box) — the zone grid now uses the full canvas width (J/K were
                widened to stop their labels overflowing into each other),
                so there's no free pocket of space left to float this in. */}
            {worstActiveEvent && (
              <g>
                <rect x="10" y="316" width="340" height="30" rx="8" fill="rgba(239,68,68,0.07)" stroke="rgba(239,68,68,0.2)" strokeWidth="1" />
                <text x="20" y="329" fontSize="8" fontWeight="700" fill="#ef4444" letterSpacing="0.5">
                  {worstActiveEvent.tier.toUpperCase()} RISK — ZONE {worstActiveEvent.zone} — {worstActiveEvent.contributing_signals.length} signal(s) — AI confidence {worstActiveEvent.evidence?.confidence ?? '—'}%
                </text>
                <text x="20" y="340" fontSize="7.5" fill={C.textMid}>
                  {worstActiveEvent.evidence?.matched_incident_confidence ? `⚠ ${worstActiveEvent.evidence.matched_incident_confidence} precedent match` : '⚠ live compound risk'}
                </text>
              </g>
            )}
          </svg>
        </div>

        <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          {layers.map((l) => (
            <button key={l} onClick={() => setActiveLayer(l)} style={{
              fontSize: 11, fontWeight: 600, padding: '5px 10px', borderRadius: 20,
              border: activeLayer === l ? `1px solid ${C.amber}` : '1px solid rgba(0,0,0,0.08)',
              background: activeLayer === l ? C.amberBg : 'transparent',
              color: activeLayer === l ? C.amberDark : C.textMid, cursor: 'pointer', transition: 'all 0.2s',
            }}
              onMouseEnter={(e) => { if (activeLayer !== l) e.currentTarget.style.background = 'rgba(0,0,0,0.04)' }}
              onMouseLeave={(e) => { if (activeLayer !== l) e.currentTarget.style.background = 'transparent' }}
            >{l}</button>
          ))}
          {activeLayer === 'Heatmap' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 6 }}>
              {(['0-30', '30-60', '60-80', '80+'] as const).map((label, i) => (
                <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: C.textMuted }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: heatColor([10, 40, 70, 90][i]).border, display: 'inline-block' }} />
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Bug fix: this used to be a flex SIBLING of this card, inside a
            fixed-height parent — appearing pushed the card's own flex:1
            box shorter (this card has overflow:hidden), clipping the
            bottom zone row underneath it. Absolutely positioning it here,
            scoped to this card (which is position:relative), makes it a
            true overlay: it floats over the map instead of compressing it,
            and the card's rendered size never changes when it appears. */}
        {hovered && (
          <div style={{
            position: 'absolute', left: 20, right: 20, bottom: 20, zIndex: 20,
            background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)', borderRadius: 16,
            border: `1px solid ${STATUS_COLORS[hovered.status].border}`,
            padding: '14px 18px', boxShadow: '0 12px 40px rgba(0,0,0,0.18)', animation: 'slide-in 0.2s ease',
            maxHeight: 'calc(100% - 40px)', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontWeight: 800, fontSize: 14, color: C.textDark }}>Zone {hovered.id} — {hovered.label}</span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: STATUS_COLORS[hovered.status].bg, color: STATUS_COLORS[hovered.status].text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {hovered.status}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 20px' }}>
              {[['Workers', hovered.workers], ['Permits', hovered.permits]].map(([k, v]) => (
                <div key={String(k)}>
                  <span style={{ fontSize: 10, color: C.textMuted, fontWeight: 600 }}>{k}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.textDark, marginLeft: 8 }}>{v}</span>
                </div>
              ))}
            </div>
            {/* Dynamic per-zone sensor tag list — real tags, not a fixed temp/pressure
                pair. Zones with no live readings yet (e.g. right after a reset) show none. */}
            {hovered.tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                {hovered.tags.map((t) => (
                  <div key={t.tag}>
                    <span style={{ fontSize: 10, color: C.textMuted, fontWeight: 600 }}>{t.tag}</span>
                    <span style={{
                      fontSize: 13, fontWeight: 700, marginLeft: 8,
                      color: t.tier === 'critical' ? STATUS_COLORS.critical.text : t.tier === 'warning' ? STATUS_COLORS.elevated.text : C.textDark,
                    }}>{t.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function ZonePicker({ zones, selectedZoneId, onSelectZone }: { zones: LiveZone[]; selectedZoneId: string | null; onSelectZone: (id: string) => void }) {
  if (zones.length === 0) return null
  return (
    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
      {zones.map((z) => {
        const sc = STATUS_COLORS[z.status]
        const isSel = selectedZoneId === z.id
        return (
          <button key={z.id} onClick={() => onSelectZone(z.id)} title={z.label} style={{
            fontSize: 11, fontWeight: 700, padding: '5px 9px', borderRadius: 10,
            border: isSel ? `1.5px solid ${sc.dot}` : '1px solid rgba(0,0,0,0.08)',
            background: isSel ? sc.bg : 'rgba(255,255,255,0.6)',
            color: isSel ? sc.text : C.textMid, cursor: 'pointer', transition: 'all 0.15s',
            display: 'flex', alignItems: 'center', gap: 5,
          }}
            onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.background = 'rgba(0,0,0,0.05)' }}
            onMouseLeave={(e) => { if (!isSel) e.currentTarget.style.background = 'rgba(255,255,255,0.6)' }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot, flexShrink: 0 }} />
            {z.id}
          </button>
        )
      })}
    </div>
  )
}

// Compact horizontal strip of real accumulated risk events — same data as
// the Overview tab's Incident Timeline, reused here so the AI Intelligence
// tab has something concrete to show even when the selected zone (or no
// zone) currently has no active event, instead of just empty space below
// the idle message.
function RecentEventsStrip({ riskEvents, zoneFilter }: { riskEvents: LiveRiskEvent[]; zoneFilter: string | null }) {
  const events = (zoneFilter ? riskEvents.filter((e) => e.zone === zoneFilter) : riskEvents).slice(0, 8)
  if (events.length === 0) return null
  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', color: C.textMuted, marginBottom: 10 }}>
        RECENT ACTIVITY{zoneFilter ? ` — ZONE ${zoneFilter}` : ''}
      </p>
      <div style={{ display: 'flex', gap: 0, overflowX: 'auto', paddingBottom: 6 }}>
        {events.map((ev, i) => (
          <div key={ev.id} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            {i > 0 && <div style={{ width: 20, height: 1, background: C.amberBorder, flexShrink: 0 }} />}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 92, flexShrink: 0 }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: ev.tier === 'critical' ? 'rgba(239,68,68,0.12)' : ev.tier === 'warning' ? 'rgba(251,146,60,0.12)' : 'rgba(74,222,128,0.12)',
                border: `2px solid ${ev.tier === 'critical' ? '#ef4444' : ev.tier === 'warning' ? '#f97316' : '#22c55e'}`,
                fontSize: 12,
              }}>{ev.tier === 'critical' ? '🚨' : ev.tier === 'warning' ? '⚠️' : '✓'}</div>
              <span style={{ fontSize: 9, fontWeight: 600, color: C.textMuted, marginTop: 4 }}>{formatEventTime(ev.timestamp)}</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: C.textDark, textAlign: 'center', lineHeight: 1.3, marginTop: 2 }}>
                {zoneFilter ? (ev.tier === 'normal' ? 'Resolved' : ev.tier) : `Zone ${ev.zone}`}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Fills the previously-empty second column on the AI Intelligence and
// Copilot tabs with real data that already exists in state but was never
// rendered anywhere: every past Warning/Critical event's full evidence
// bundle (confidence, matched incident, regulatory citation, interventions).
// Not a decorative placeholder — every field here is the same `evidence`
// object the main panel renders, just kept visible after the event scrolls
// out of "latest per zone."
function ReasoningHistory({ riskEvents }: { riskEvents: LiveRiskEvent[] }) {
  const withEvidence = riskEvents.filter((e) => e.evidence !== null).slice(0, 12)
  return (
    <div style={{
      background: C.cardBg, backdropFilter: 'blur(20px)', borderRadius: 24,
      border: `1px solid ${C.amberBorder}`, boxShadow: '0 4px 40px rgba(245,158,11,0.06)',
      padding: 20, display: 'flex', flexDirection: 'column', gap: 12, height: '100%', overflowY: 'auto',
    }}>
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: C.amber, marginBottom: 2 }}>SESSION LOG</p>
        <h3 style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em', color: C.textDark }}>Reasoning History</h3>
      </div>
      {withEvidence.length === 0 ? (
        <p style={{ fontSize: 12, color: C.textMuted }}>No AI reasoning has run yet this session — this populates the moment any zone crosses into Warning or Critical, and stays here after the event resolves.</p>
      ) : (
        withEvidence.map((ev) => {
          const ev2 = ev.evidence!
          const tierColor = ev.tier === 'critical' ? '#ef4444' : '#f97316'
          return (
            <div key={ev.id} style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.7)', border: `1px solid ${ev.tier === 'critical' ? 'rgba(239,68,68,0.18)' : 'rgba(251,146,60,0.18)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.textDark }}>Zone {ev.zone} · {ev.tier}</span>
                <span style={{ fontSize: 10, color: C.textMuted }}>{formatEventTime(ev.timestamp)}</span>
              </div>
              <p style={{ fontSize: 20, fontWeight: 900, color: tierColor, lineHeight: 1, marginBottom: 6 }}>{ev2.confidence}%</p>
              {ev2.matched_incident_summary && (
                <p style={{ fontSize: 11, color: C.textMid, marginBottom: 3 }}><b>Precedent:</b> {ev2.matched_incident_summary}</p>
              )}
              {ev2.regulatory_citation && (
                <p style={{ fontSize: 10, color: C.textMuted, marginBottom: 3 }}>{ev2.regulatory_citation}</p>
              )}
              {ev2.recommended_interventions.length > 0 && (
                <p style={{ fontSize: 11, color: C.textMid, marginTop: 6 }}>→ {ev2.recommended_interventions[0]}</p>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}

// Emergency Response Orchestrator output — captured into state from WS
// ticks but, before this fix, never rendered anywhere beyond a bare count
// on the Reports tab. Real evacuation zones, alert recipients, and the
// preliminary report text, not a summary of a summary.
function EmergencyResponsePanel({ emergencyResponses }: { emergencyResponses: EmergencyResponseResult[] }) {
  return (
    <div style={{
      background: C.cardBg, backdropFilter: 'blur(20px)', borderRadius: 24,
      border: `1px solid ${C.amberBorder}`, boxShadow: '0 4px 40px rgba(245,158,11,0.06)',
      padding: 20, display: 'flex', flexDirection: 'column', gap: 12, height: '100%', overflowY: 'auto',
    }}>
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: C.amber, marginBottom: 2 }}>EMERGENCY RESPONSE ORCHESTRATOR</p>
        <h3 style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em', color: C.textDark }}>Interventions</h3>
      </div>
      {emergencyResponses.length === 0 ? (
        <p style={{ fontSize: 12, color: C.textMuted }}>No emergency response has been dispatched this session — this only triggers at Critical tier.</p>
      ) : (
        emergencyResponses.slice(0, 6).map((er, i) => (
          <div key={i} style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.18)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#b91c1c' }}>Zone {er.zone} — {er.status}</span>
              <span style={{ fontSize: 10, color: C.textMuted }}>{formatEventTime(er.triggered_at)}</span>
            </div>
            <p style={{ fontSize: 11, color: C.textMid, marginBottom: 4 }}><b>Evacuate:</b> {er.evacuation_zones.join(', ') || 'none'}</p>
            <p style={{ fontSize: 11, color: C.textMid, marginBottom: 4 }}><b>Alerted:</b> {[...new Set(er.alert_recipients.map((r) => r.role))].join(', ')}</p>
            <p style={{ fontSize: 10, color: C.textMuted, whiteSpace: 'pre-wrap', marginTop: 6 }}>{er.preliminary_report.slice(0, 180)}…</p>
          </div>
        ))
      )}
    </div>
  )
}

// Digital Permit Intelligence Agent output — permitFlags was already fetched
// into state and used to compute a per-zone COUNT for the twin's Permit
// Layer, but the actual reasons behind each flag were never rendered
// anywhere. Real data (permit_id, type, zone, flag severity, reasons),
// no aggregation.
function PermitIntelligencePanel({ permitFlags }: { permitFlags: PermitFlag[] }) {
  return (
    <div style={{
      background: C.cardBg, backdropFilter: 'blur(20px)', borderRadius: 24,
      border: `1px solid ${C.amberBorder}`, boxShadow: '0 4px 40px rgba(245,158,11,0.06)',
      padding: 24, display: 'flex', flexDirection: 'column', gap: 12, height: '100%', overflowY: 'auto', maxWidth: 480, width: '100%',
    }}>
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: C.amber, marginBottom: 2 }}>DIGITAL PERMIT INTELLIGENCE</p>
        <h3 style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', color: C.textDark }}>Flagged Permits</h3>
      </div>
      {permitFlags.length === 0 ? (
        <p style={{ fontSize: 12, color: C.textMuted }}>No active permit is currently flagged — every issued permit's conditions still match live plant state.</p>
      ) : (
        permitFlags.map((f) => (
          <div key={f.permit_id} style={{
            padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.7)',
            border: `1px solid ${f.flag === 'block_recommend' ? 'rgba(239,68,68,0.2)' : 'rgba(251,146,60,0.2)'}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.textDark }}>Zone {f.zone_id} · {f.permit_type_id.replace(/_/g, ' ')}</span>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.05em',
                color: f.flag === 'block_recommend' ? '#b91c1c' : '#c2410c',
                background: f.flag === 'block_recommend' ? 'rgba(239,68,68,0.1)' : 'rgba(251,146,60,0.1)',
              }}>{f.flag === 'block_recommend' ? 'Block' : 'Flag'}</span>
            </div>
            {f.reasons.map((r, i) => (
              <p key={i} style={{ fontSize: 11, color: C.textMid, marginTop: 3 }}>• {r}</p>
            ))}
            <p style={{ fontSize: 9, color: C.textMuted, marginTop: 6 }}>Checked {formatEventTime(f.checked_at)}</p>
          </div>
        ))
      )}
    </div>
  )
}

function AIIntelligence({ selectedZoneId, latestEventByZone, zones, onSelectZone, riskEvents }: { selectedZoneId: string | null; latestEventByZone: Record<string, LiveRiskEvent>; zones: LiveZone[]; onSelectZone: (id: string) => void; riskEvents: LiveRiskEvent[] }) {
  const event = selectedZoneId ? latestEventByZone[selectedZoneId] : null
  const isActive = !!event && event.tier !== 'normal'
  const evidence = isActive ? event!.evidence : null

  const [step, setStep] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [showReasoning, setShowReasoning] = useState(false)
  const lastEventIdRef = useRef<string | null>(null)

  // Reveal animation now plays once per REAL new event (not once on mount
  // with a hardcoded fake result) — triggered when the selected zone's
  // latest event id actually changes.
  useEffect(() => {
    if (!isActive || event!.id === lastEventIdRef.current) return
    lastEventIdRef.current = event!.id
    setShowResult(false)
    setStep(0)
    const id = setInterval(() => {
      setStep((s) => {
        if (s >= REASONING_STEPS.length - 1) { setShowResult(true); clearInterval(id); return s }
        return s + 1
      })
    }, 350)
    return () => clearInterval(id)
  }, [isActive, event])

  if (!isActive || !evidence) {
    return (
      <div style={{
        background: C.cardBg, backdropFilter: 'blur(20px)', borderRadius: 24,
        border: `1px solid ${C.amberBorder}`, boxShadow: '0 4px 40px rgba(245,158,11,0.06)',
        padding: 20, display: 'flex', flexDirection: 'column', gap: 16, height: '100%', overflowY: 'auto',
      }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: C.amber, marginBottom: 2 }}>AI INTELLIGENCE LAYER</p>
          <h3 style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em', color: C.textDark }}>Compound Risk Analysis</h3>
        </div>
        <ZonePicker zones={zones} selectedZoneId={selectedZoneId} onSelectZone={onSelectZone} />
        <div style={{ background: C.amberBg, borderRadius: 16, padding: '16px 14px', border: `1px solid ${C.amberBorder}`, textAlign: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#92400e' }}>
            {selectedZoneId ? `Zone ${selectedZoneId} nominal — no active risk event.` : 'Pick a zone above, hover it on the twin, or wait for a live event.'}
          </span>
        </div>
        <RecentEventsStrip riskEvents={riskEvents} zoneFilter={selectedZoneId} />
      </div>
    )
  }

  const priorityLabel = event!.tier === 'critical' ? 'critical' : 'elevated'
  const riskTitle = event!.tier === 'critical' ? 'Compound Critical Risk' : 'Compound Elevated Risk'
  const evidenceTags = [
    `${event!.contributing_signals.length} signal${event!.contributing_signals.length === 1 ? '' : 's'} correlated`,
    ...(evidence.matched_incident_confidence ? [`Precedent: ${evidence.matched_incident_confidence} confidence`] : []),
    ...(evidence.regulatory_citation ? [evidence.regulatory_citation] : []),
  ]
  // evidence.matched_incident_summary was sent by the backend on every
  // Warning/Critical event but never rendered anywhere in the UI — the
  // confidence *band* showed as a tag above, but not which incident it
  // actually matched.
  const hasMatchedIncident = !!evidence.matched_incident_summary

  return (
    <div style={{
      background: C.cardBg, backdropFilter: 'blur(20px)', borderRadius: 24,
      border: `1px solid ${C.amberBorder}`, boxShadow: '0 4px 40px rgba(245,158,11,0.06)',
      padding: 20, display: 'flex', flexDirection: 'column', gap: 16, height: '100%', overflowY: 'auto',
    }}>
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: C.amber, marginBottom: 2 }}>AI INTELLIGENCE LAYER</p>
        <h3 style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em', color: C.textDark, marginBottom: 10 }}>Compound Risk Analysis</h3>
        <ZonePicker zones={zones} selectedZoneId={selectedZoneId} onSelectZone={onSelectZone} />
      </div>

      <div style={{ background: C.amberBg, borderRadius: 16, padding: '12px 14px', border: `1px solid ${C.amberBorder}` }}>
        {REASONING_STEPS.map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0', opacity: i <= step ? 1 : 0.25, transition: 'opacity 0.4s' }}>
            <div style={{
              width: 16, height: 16, borderRadius: '50%',
              background: i < step ? C.amber : 'transparent',
              border: i < step ? 'none' : i === step ? `2px solid ${C.amber}` : '1.5px solid #e7e5e4',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              animation: i === step ? 'pulse-dot 1.2s ease-in-out infinite' : 'none',
            }}>
              {i < step && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4l1.8 1.8L6.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </div>
            <span style={{ fontSize: 12, fontWeight: i === step ? 600 : 400, color: i === step ? '#92400e' : i < step ? C.textMuted : '#d6d3d1' }}>{s}</span>
          </div>
        ))}
      </div>

      {showResult && (
        <div style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.06), rgba(239,68,68,0.02))', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 20, padding: 16, animation: 'slide-in 0.4s ease' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', letterSpacing: '0.08em', marginBottom: 4 }}>{riskTitle.toUpperCase()} — ZONE {event!.zone}</p>
              <p style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.04em', color: C.textDark, lineHeight: 1 }}>{evidence.confidence}% Confidence</p>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulse-dot 2s ease-in-out infinite' }}>
              <span style={{ fontSize: 16 }}>⚠️</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {evidenceTags.map((t) => (
              <span key={t} style={{ fontSize: 11, fontWeight: 600, background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: 20, padding: '3px 9px' }}>{t}</span>
            ))}
          </div>
          {hasMatchedIncident && (
            <p style={{ fontSize: 12, lineHeight: 1.5, color: C.textDark, background: 'rgba(255,255,255,0.55)', borderRadius: 12, padding: '9px 12px', marginBottom: 12 }}>
              <span style={{ fontWeight: 700, color: '#b91c1c' }}>Matched precedent: </span>
              {evidence.matched_incident_summary}
            </p>
          )}
          {showReasoning && evidence.reasoning && (
            <p style={{ fontSize: 12, lineHeight: 1.6, color: C.textMid, background: 'rgba(255,255,255,0.6)', borderRadius: 12, padding: '10px 12px', marginBottom: 12 }}>
              {evidence.reasoning}
              {!evidence.llm_backed && (
                <span style={{ display: 'block', marginTop: 6, fontSize: 10, fontStyle: 'italic', color: C.textMuted }}>
                  Rule-based fallback — LLM call unavailable this time.
                </span>
              )}
            </p>
          )}
          <div style={{ display: 'flex', gap: 6 }}>
            {['View Reasoning', 'Explain', 'Report'].map((label, i) => (
              <button key={label}
                onClick={i === 0 ? () => setShowReasoning((v) => !v) : undefined}
                style={{
                  flex: 1, fontSize: 11, fontWeight: 600, padding: '7px 4px', borderRadius: 10,
                  border: i === 0 ? 'none' : `1px solid ${C.amberBorder}`,
                  background: i === 0 ? `linear-gradient(135deg, ${C.amber}, ${C.amberDark})` : 'transparent',
                  color: i === 0 ? 'white' : C.amberDark, cursor: 'pointer', transition: 'transform 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = '')}
              >{i === 0 && showReasoning ? 'Hide Reasoning' : label}</button>
            ))}
          </div>
        </div>
      )}

      {showResult && (
        <div style={{ animation: 'slide-in 0.5s ease' }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', color: C.textMuted, marginBottom: 8 }}>RECOMMENDED ACTIONS</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {evidence.recommended_interventions.length === 0 && (
              <span style={{ fontSize: 12, color: C.textMuted }}>No standard intervention template matched this signal combination.</span>
            )}
            {evidence.recommended_interventions.map((action) => (
              <div key={action} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
                background: 'rgba(255,255,255,0.7)', borderRadius: 12,
                border: `1px solid ${priorityLabel === 'critical' ? 'rgba(239,68,68,0.18)' : 'rgba(251,146,60,0.18)'}`,
                cursor: 'default', transition: 'transform 0.15s, box-shadow 0.15s',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateX(3px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)' }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'none' }}
              >
                <span style={{ fontSize: 13 }}>{priorityLabel === 'critical' ? '🚨' : '⚠️'}</span>
                <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: C.textDark }}>{action}</span>
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  color: priorityLabel === 'critical' ? '#ef4444' : '#f97316',
                  background: priorityLabel === 'critical' ? 'rgba(239,68,68,0.1)' : 'rgba(251,146,60,0.1)',
                  padding: '2px 7px', borderRadius: 20,
                }}>
                  {evidence.confidence}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <RecentEventsStrip riskEvents={riskEvents} zoneFilter={selectedZoneId} />
    </div>
  )
}

function Copilot({ selectedZoneId, sendCopilotMessage, zones, onSelectZone }: { selectedZoneId: string | null; sendCopilotMessage: (message: string, zoneId: string | null) => Promise<string>; zones: LiveZone[]; onSelectZone: (id: string) => void }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: 'Safety Copilot ready. Ask about any zone, permit, or historical pattern — I answer from live backend data.' },
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Suggestions were a fixed 'Zone D' reference regardless of context — the
  // backend answers using whichever zone_id is actually passed, so a stale
  // hardcoded zone in the suggestion button was misleading once a different
  // zone was selected. Zone D stays as the fallback wording only when
  // nothing is selected yet.
  const suggestions = [
    `Why is Zone ${selectedZoneId ?? 'D'} high risk?`,
    'Explain AI decision',
    'Show similar incidents',
    "Summarize today's events",
  ]

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, typing])

  const send = async (text: string) => {
    if (!text.trim() || typing) return
    setMessages((m) => [...m, { role: 'user', text }])
    setInput('')
    setTyping(true)
    try {
      const reply = await sendCopilotMessage(text, selectedZoneId)
      setMessages((m) => [...m, { role: 'ai', text: reply }])
    } catch {
      setMessages((m) => [...m, { role: 'ai', text: "Couldn't reach the backend just now — please try again in a moment." }])
    } finally {
      setTyping(false)
    }
  }

  return (
    <div style={{
      background: C.cardBg, backdropFilter: 'blur(20px)', borderRadius: 24,
      border: `1px solid ${C.amberBorder}`, boxShadow: '0 4px 40px rgba(245,158,11,0.06)',
      display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden',
    }}>
      <div style={{ padding: '16px 18px 10px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: C.amber, marginBottom: 2 }}>AI COPILOT</p>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: C.textDark, letterSpacing: '-0.02em', marginBottom: 10 }}>Ask anything</h3>
        <ZonePicker zones={zones} selectedZoneId={selectedZoneId} onSelectZone={onSelectZone} />
        <p style={{ fontSize: 10, color: C.textMuted, marginTop: 6 }}>
          {selectedZoneId ? `Answers will be scoped to Zone ${selectedZoneId} where relevant.` : 'No zone selected — pick one above for zone-specific answers.'}
        </p>
      </div>

      <div style={{ padding: '10px 12px 0', display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {suggestions.map((s) => (
          <button key={s} onClick={() => send(s)} style={{
            fontSize: 11, fontWeight: 600, padding: '4px 9px', borderRadius: 20,
            border: `1px solid ${C.amberBorder}`, background: C.amberBg, color: C.amberDark,
            cursor: 'pointer', transition: 'background 0.2s', whiteSpace: 'nowrap',
          }}
            onMouseEnter={(e) => (e.currentTarget.style.background = C.amberBgMed)}
            onMouseLeave={(e) => (e.currentTarget.style.background = C.amberBg)}
          >{s}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: m.role === 'user' ? 'row-reverse' : 'row', gap: 7, alignItems: 'flex-end' }}>
            {m.role === 'ai' && (
              <div style={{ width: 26, height: 26, borderRadius: 8, background: `linear-gradient(135deg, ${C.amber}, ${C.amberDark})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="2.5" fill="white" opacity="0.9"/><path d="M6 1v1.5M6 9.5V11M1 6h1.5M9.5 6H11" stroke="white" strokeWidth="1" strokeLinecap="round"/></svg>
              </div>
            )}
            <div style={{
              maxWidth: '82%', padding: '9px 12px',
              borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: m.role === 'user' ? `linear-gradient(135deg, ${C.amber}, ${C.amberDark})` : 'rgba(255,255,255,0.88)',
              color: m.role === 'user' ? 'white' : C.textDark,
              fontSize: 12, lineHeight: 1.55, fontWeight: 400,
              border: m.role === 'ai' ? '1px solid rgba(0,0,0,0.07)' : 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            }}>{m.text}</div>
          </div>
        ))}
        {typing && (
          <div style={{ display: 'flex', gap: 7, alignItems: 'flex-end' }}>
            <div style={{ width: 26, height: 26, borderRadius: 8, background: `linear-gradient(135deg, ${C.amber}, ${C.amberDark})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="2.5" fill="white" opacity="0.9"/></svg>
            </div>
            <div style={{ padding: '9px 14px', borderRadius: '16px 16px 16px 4px', background: 'rgba(255,255,255,0.88)', border: '1px solid rgba(0,0,0,0.07)' }}>
              <span style={{ display: 'flex', gap: 4 }}>
                {[0, 1, 2].map((i) => (
                  <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: C.amberLight, display: 'inline-block', animation: `pulse-dot 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                ))}
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: '8px 12px 14px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', gap: 7, background: C.amberBg, border: `1px solid ${C.amberBorder}`, borderRadius: 14, padding: '7px 7px 7px 12px' }}>
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send(input)}
            placeholder="Ask the AI anything..."
            style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 12, color: C.textDark, outline: 'none', fontFamily: 'inherit' }}
          />
          <button onClick={() => send(input)} style={{ width: 30, height: 30, borderRadius: 10, background: `linear-gradient(135deg, ${C.amber}, ${C.amberDark})`, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6h8M7 3l3 3-3 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════════════════════════════════════
// Real accumulated risk events -> display strings. Backend timestamps are
// naive UTC (no "Z" suffix) — must be appended before `Date` parses them,
// otherwise duration/clock display silently shifts by the local UTC offset.
function formatEventTime(iso: string): string {
  const d = new Date(iso.endsWith('Z') ? iso : `${iso}Z`)
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
}
function eventLabel(e: LiveRiskEvent): string {
  const topSignal = e.contributing_signals[0]?.description
  if (e.tier === 'normal') return `Zone ${e.zone} returned to normal`
  return topSignal ? `Zone ${e.zone}: ${topSignal}` : `Zone ${e.zone} reached ${e.tier} tier`
}

function Dashboard({ onExit }: { onExit: () => void }) {
  const facility = useFacilityState()
  const [activeTab, setActiveTab] = useState('Overview')
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null)
  const [moreOpen, setMoreOpen] = useState(false)
  const [pickedScenario, setPickedScenario] = useState('')
  const [scenarioBusy, setScenarioBusy] = useState(false)

  useEffect(() => {
    if (!pickedScenario && facility.scenarios.length) setPickedScenario(facility.scenarios[0].id)
  }, [facility.scenarios, pickedScenario])

  const liveZones = buildLiveZones(facility.heatmap?.zones, facility.readings, facility.permitFlags)
  const isMoreView = MORE_ITEMS.includes(activeTab)
  const runningScenario = facility.scenarios.find((s) => s.id === facility.activeScenarioId)
  const activeScenarioName = runningScenario?.name ?? null
  const activeScenarioDesc = runningScenario?.description ?? null

  const goToTab = (tab: string) => { setActiveTab(tab); setMoreOpen(false) }

  const runPickedScenario = async () => {
    if (!pickedScenario || scenarioBusy) return
    setScenarioBusy(true)
    try { await facility.triggerScenario(pickedScenario, 1.0) } finally { setScenarioBusy(false) }
  }
  const doReset = async () => {
    if (scenarioBusy) return
    setScenarioBusy(true)
    try { await facility.reset() } finally { setScenarioBusy(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: C.dashBg, fontFamily: "'Inter', system-ui, sans-serif", overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes slide-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slide-right { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(245,158,11,0.2); border-radius: 4px; }
      `}</style>

      {/* ── TOP NAV ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(254,252,232,0.88)', backdropFilter: 'blur(24px)',
        borderBottom: `1px solid ${C.amberBorder}`, padding: '0 24px',
        display: 'flex', alignItems: 'center', gap: 0, height: 56,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginRight: 32 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg, ${C.amber}, ${C.amberDark})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 2L14 6v8H2V6L8 2z" stroke="white" strokeWidth="1.4" fill="none"/><circle cx="8" cy="9" r="2" fill="white" opacity="0.8"/></svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: '-0.03em', color: C.textDark }}>Safe Grid</span>
        </div>

        <div style={{ display: 'flex', flex: 1, gap: 2 }}>
          {DASH_NAV.map((tab) => (
            tab === 'More' ? (
              <div key="More" style={{ position: 'relative' }}>
                <button onClick={() => setMoreOpen((o) => !o)} style={{
                  fontSize: 12, fontWeight: 600, padding: '6px 13px', borderRadius: 8, border: 'none',
                  background: moreOpen || isMoreView ? C.amberBg : 'transparent',
                  color: moreOpen || isMoreView ? C.amberDark : C.textMid, cursor: 'pointer', transition: 'all 0.2s',
                }}
                  onMouseEnter={(e) => { if (!moreOpen && !isMoreView) e.currentTarget.style.background = 'rgba(0,0,0,0.04)' }}
                  onMouseLeave={(e) => { if (!moreOpen && !isMoreView) e.currentTarget.style.background = 'transparent' }}
                >More ▾</button>
                {moreOpen && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, marginTop: 6,
                    background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(20px)',
                    border: `1px solid ${C.amberBorder}`, borderRadius: 14,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)', padding: '6px',
                    minWidth: 180, zIndex: 200,
                  }}>
                    {MORE_ITEMS.map((item) => (
                      <button key={item} onClick={() => goToTab(item)} style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        fontSize: 13, fontWeight: 500, padding: '8px 12px', borderRadius: 8,
                        border: 'none', background: activeTab === item ? C.amberBg : 'transparent', color: C.textDark,
                        cursor: 'pointer', transition: 'background 0.15s',
                      }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = C.amberBg)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = activeTab === item ? C.amberBg : 'transparent')}
                      >{item}</button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <button key={tab} onClick={() => goToTab(tab)} style={{
                fontSize: 12, fontWeight: 600, padding: '6px 13px', borderRadius: 8, border: 'none',
                background: activeTab === tab ? C.amberBg : 'transparent',
                color: activeTab === tab ? C.amberDark : C.textMid, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
              }}
                onMouseEnter={(e) => { if (activeTab !== tab) e.currentTarget.style.background = 'rgba(0,0,0,0.04)' }}
                onMouseLeave={(e) => { if (activeTab !== tab) e.currentTarget.style.background = 'transparent' }}
              >{tab}</button>
            )
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            title={facility.connected ? 'Live backend connection' : 'Backend unreachable — reconnecting…'}
            style={{
              display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700,
              padding: '4px 9px', borderRadius: 999,
              color: facility.connected ? '#15803d' : '#b91c1c',
              background: facility.connected ? 'rgba(74,222,128,0.12)' : 'rgba(239,68,68,0.1)',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: facility.connected ? '#22c55e' : '#ef4444' }} />
            {facility.connected ? 'Live' : 'Offline'}
          </span>
          <button style={{ position: 'relative', width: 34, height: 34, borderRadius: 10, border: '1px solid rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.5C4.5 1.5 2.5 3.5 2.5 6c0 2 1 3 2 4H9.5c1-1 2-2 2-4 0-2.5-2-4.5-4.5-4.5z" stroke={C.textMid} strokeWidth="1.2"/><path d="M5.5 10v1a1.5 1.5 0 003 0v-1" stroke={C.textMid} strokeWidth="1.2"/></svg>
            <span style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: '50%', background: '#ef4444', border: '1.5px solid white' }} />
          </button>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: `linear-gradient(135deg, ${C.amberLight}, ${C.amber})`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'white' }}>JS</span>
          </div>
          <button onClick={onExit} style={{ fontSize: 11, fontWeight: 700, padding: '6px 12px', borderRadius: 8, border: `1px solid ${C.amberBorder}`, background: C.amberBg, color: C.amberDark, cursor: 'pointer' }}>← Landing</button>
        </div>
      </nav>

      {/* ── PLANT STATUS HEADER ── */}
      <div style={{ padding: '20px 24px 0' }}>
        <div style={{
          background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(20px)', borderRadius: 20,
          border: `1px solid ${C.amberBorder}`, padding: '18px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 4px 32px rgba(245,158,11,0.06)', flexWrap: 'wrap', gap: 12,
        }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: C.amber, marginBottom: 2 }}>AI COMMAND CENTER</p>
            <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.035em', color: C.textDark, lineHeight: 1.1 }}>Real-Time Industrial Safety Intelligence</h1>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[
              {
                label: 'Plant Status',
                value: facility.plantWorstTier === 'critical' ? 'CRITICAL' : facility.plantWorstTier === 'warning' ? 'ELEVATED' : 'NOMINAL',
                color: facility.plantWorstTier === 'critical' ? '#ef4444' : facility.plantWorstTier === 'warning' ? '#f97316' : '#22c55e',
                bg: facility.plantWorstTier === 'critical' ? 'rgba(239,68,68,0.07)' : facility.plantWorstTier === 'warning' ? 'rgba(251,146,60,0.07)' : 'rgba(74,222,128,0.08)',
                border: facility.plantWorstTier === 'critical' ? 'rgba(239,68,68,0.18)' : facility.plantWorstTier === 'warning' ? 'rgba(251,146,60,0.18)' : 'rgba(74,222,128,0.25)',
              },
              // Decision 2: NOT a fixed number — the confidence of the most severe
              // currently-active event, clearly labeled with its zone. "All zones
              // nominal" (not a % at all) when nothing is elevated.
              {
                label: 'AI Confidence',
                value: facility.worstActiveEvent ? `${facility.worstActiveEvent.evidence?.confidence ?? '—'}% (Zone ${facility.worstActiveEvent.zone})` : 'All zones nominal',
                color: C.amberDark, bg: C.amberBg, border: C.amberBorder,
              },
              // Decision 3: Safety Score removed entirely (no backend field
              // supports it) — replaced with a real value, active scenario status.
              {
                label: 'Active Scenario',
                value: facility.scenarioRunning ? (activeScenarioName ?? facility.activeScenarioId ?? 'Running') : 'None',
                color: '#2563eb', bg: 'rgba(37,99,235,0.07)', border: 'rgba(37,99,235,0.18)',
              },
            ].map((stat) => (
              <div key={stat.label} style={{ padding: '10px 18px', borderRadius: 14, background: stat.bg, border: `1px solid ${stat.border}`, textAlign: 'center', minWidth: 100 }}>
                <p style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, letterSpacing: '0.06em', marginBottom: 3 }}>{stat.label}</p>
                <p style={{ fontSize: 18, fontWeight: 900, color: stat.color, letterSpacing: '-0.03em', lineHeight: 1 }}>{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Always-visible scenario banner (every tab, not just Replay) — so
            it's never ambiguous what's driving the twin/heatmap right now. */}
        {facility.scenarioRunning && (
          <div style={{
            marginTop: 10, background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.2)',
            borderRadius: 14, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2563eb', animation: 'pulse-dot 1.5s ease-in-out infinite', flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#1d4ed8' }}>Scenario running: {activeScenarioName ?? facility.activeScenarioId}</span>
            {activeScenarioDesc && <span style={{ fontSize: 12, color: C.textMid }}>— {activeScenarioDesc}</span>}
          </div>
        )}
      </div>

      {activeTab === 'Overview' && (
        <>
          {/* ── MAIN 3-COLUMN GRID ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '46fr 30fr 24fr', gap: 16, padding: '16px 24px', minHeight: 0, animation: 'slide-in 0.25s ease' }}>
            <div style={{ minHeight: 560, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <DigitalTwin zones={liveZones} worstActiveEvent={facility.worstActiveEvent} onZoneSelect={(z) => setSelectedZoneId(z?.id ?? null)} />
            </div>
            <div style={{ minHeight: 560, maxHeight: 660, overflowY: 'auto' }}>
              <AIIntelligence selectedZoneId={selectedZoneId} latestEventByZone={facility.latestEventByZone} zones={liveZones} onSelectZone={setSelectedZoneId} riskEvents={facility.riskEvents} />
            </div>
            <div style={{ height: 660 }}>
              <Copilot selectedZoneId={selectedZoneId} sendCopilotMessage={facility.sendCopilotMessage} zones={liveZones} onSelectZone={setSelectedZoneId} />
            </div>
          </div>

          {/* ── BOTTOM: INCIDENT TIMELINE + ACTIVE ALERTS (both real, same accumulated risk_events) ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: '0 24px 32px' }}>
            {/* Incident Timeline */}
            <div style={{
              background: C.cardBg, backdropFilter: 'blur(20px)', borderRadius: 20,
              border: `1px solid ${C.amberBorder}`, boxShadow: '0 4px 24px rgba(245,158,11,0.05)',
              padding: '20px 22px',
            }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: C.amber, marginBottom: 4 }}>INCIDENT TIMELINE</p>
              <h4 style={{ fontSize: 15, fontWeight: 800, color: C.textDark, marginBottom: 18, letterSpacing: '-0.02em' }}>Live Events</h4>
              {facility.riskEvents.length === 0 ? (
                <p style={{ fontSize: 12, color: C.textMuted }}>No events yet — run a scenario to populate this timeline.</p>
              ) : (
                <div style={{ position: 'relative', paddingLeft: 20 }}>
                  <div style={{ position: 'absolute', left: 6, top: 4, bottom: 4, width: 1.5, background: C.amberBorder, borderRadius: 2 }} />
                  {facility.riskEvents.slice(0, 7).map((ev, i) => (
                    <div key={ev.id} style={{ position: 'relative', marginBottom: 14, animation: `slide-in 0.3s ease ${i * 0.07}s both` }}>
                      <div style={{
                        position: 'absolute', left: -17, top: 5, width: 8, height: 8, borderRadius: '50%',
                        background: ev.tier === 'critical' ? '#ef4444' : ev.tier === 'warning' ? '#f97316' : C.amber,
                        border: '2px solid white',
                      }} />
                      <p style={{ fontSize: 9, fontWeight: 600, color: C.textMuted, marginBottom: 2 }}>{formatEventTime(ev.timestamp)}</p>
                      <p style={{ fontSize: 12, fontWeight: 500, color: ev.tier === 'critical' ? '#ef4444' : ev.tier === 'warning' ? '#f97316' : '#92400e', lineHeight: 1.4 }}>{eventLabel(ev)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active Alerts */}
            <div style={{
              background: C.cardBg, backdropFilter: 'blur(20px)', borderRadius: 20,
              border: `1px solid ${C.amberBorder}`, boxShadow: '0 4px 24px rgba(245,158,11,0.05)',
              padding: '20px 22px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: C.amber, marginBottom: 4 }}>ACTIVE ALERTS</p>
                  <h4 style={{ fontSize: 15, fontWeight: 800, color: C.textDark, letterSpacing: '-0.02em' }}>Requires Attention</h4>
                </div>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'pulse-dot 2s ease-in-out infinite', display: 'inline-block' }} />
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#22c55e' }}>LIVE</span>
                </span>
              </div>
              {facility.riskEvents.filter((e) => e.tier !== 'normal').length === 0 ? (
                <p style={{ fontSize: 12, color: C.textMuted }}>No active alerts.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {facility.riskEvents.filter((e) => e.tier !== 'normal').slice(0, 7).map((ev, i) => (
                    <div key={ev.id} style={{
                      display: 'flex', gap: 10, padding: '9px 12px', borderRadius: 12,
                      background: ev.tier === 'critical' ? 'rgba(239,68,68,0.04)' : 'rgba(251,146,60,0.04)',
                      borderLeft: `3px solid ${ev.tier === 'critical' ? '#ef4444' : '#f97316'}`,
                      animation: `slide-right 0.3s ease ${i * 0.06}s both`,
                    }}>
                      <span style={{ fontSize: 9, fontWeight: 600, color: C.textMuted, marginTop: 1, whiteSpace: 'nowrap' }}>{formatEventTime(ev.timestamp)}</span>
                      <span style={{ fontSize: 11, fontWeight: 500, color: ev.tier === 'critical' ? '#b91c1c' : '#c2410c', lineHeight: 1.4 }}>{eventLabel(ev)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === 'Digital Twin' && (
        <div style={{ padding: '16px 24px 32px', height: 640, animation: 'slide-in 0.25s ease' }}>
          <DigitalTwin zones={liveZones} worstActiveEvent={facility.worstActiveEvent} onZoneSelect={(z) => setSelectedZoneId(z?.id ?? null)} />
        </div>
      )}

      {activeTab === 'AI Intelligence' && (
        <div style={{ padding: '16px 24px 32px', display: 'flex', gap: 16, height: 640, animation: 'slide-in 0.25s ease' }}>
          <div style={{ maxWidth: 640, width: '100%', height: '100%' }}>
            <AIIntelligence selectedZoneId={selectedZoneId} latestEventByZone={facility.latestEventByZone} zones={liveZones} onSelectZone={setSelectedZoneId} riskEvents={facility.riskEvents} />
          </div>
          <div style={{ flex: 1, height: '100%', minWidth: 280 }}>
            <ReasoningHistory riskEvents={facility.riskEvents} />
          </div>
        </div>
      )}

      {activeTab === 'Copilot' && (
        <div style={{ padding: '16px 24px 32px', display: 'flex', gap: 16, height: 640, animation: 'slide-in 0.25s ease' }}>
          <div style={{ maxWidth: 480, width: '100%', height: '100%' }}>
            <Copilot selectedZoneId={selectedZoneId} sendCopilotMessage={facility.sendCopilotMessage} zones={liveZones} onSelectZone={setSelectedZoneId} />
          </div>
          <div style={{ flex: 1, height: '100%', minWidth: 280 }}>
            <EmergencyResponsePanel emergencyResponses={facility.emergencyResponses} />
          </div>
        </div>
      )}

      {activeTab === 'Replay' && (
        <div style={{ padding: '16px 24px 32px', animation: 'slide-in 0.25s ease' }}>
          <div style={{
            background: C.cardBg, backdropFilter: 'blur(20px)', borderRadius: 24,
            border: `1px solid ${C.amberBorder}`, boxShadow: '0 4px 40px rgba(245,158,11,0.06)',
            padding: 24, maxWidth: 560,
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: C.amber, marginBottom: 2 }}>REPLAY</p>
            <h3 style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', color: C.textDark, marginBottom: 6 }}>Run a Scenario</h3>
            <p style={{ fontSize: 13, color: C.textMid, lineHeight: 1.6, marginBottom: 18 }}>
              Runs against the real backend simulator — {facility.scenarios.length || 10} scenarios available. The dashboard reflects live WebSocket ticks once started, not local mock state.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              <select
                value={pickedScenario}
                onChange={(e) => setPickedScenario(e.target.value)}
                disabled={facility.scenarioRunning || scenarioBusy}
                style={{
                  flex: 1, minWidth: 220, fontSize: 13, fontWeight: 600, padding: '10px 12px', borderRadius: 12,
                  border: `1px solid ${C.amberBorder}`, background: 'rgba(255,255,255,0.8)', color: C.textDark,
                }}
              >
                {(facility.scenarios.length ? facility.scenarios : [{ id: '', name: 'Loading scenarios…' } as never]).map((sc) => (
                  <option key={sc.id} value={sc.id}>{sc.name}</option>
                ))}
              </select>
              <button
                onClick={runPickedScenario}
                disabled={!pickedScenario || facility.scenarioRunning || scenarioBusy}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: !pickedScenario || facility.scenarioRunning || scenarioBusy ? '#e7e5e4' : `linear-gradient(135deg, ${C.amber}, ${C.amberDark})`,
                  color: 'white', border: 'none', borderRadius: 12, padding: '10px 18px',
                  fontSize: 13, fontWeight: 700, cursor: !pickedScenario || facility.scenarioRunning || scenarioBusy ? 'default' : 'pointer',
                }}
              >{facility.scenarioRunning ? 'Running…' : 'Run Scenario'}</button>
              <button
                onClick={doReset}
                disabled={scenarioBusy}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'transparent', color: C.amberDark, border: `1.5px solid ${C.amberBorder}`,
                  borderRadius: 12, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >Reset</button>
            </div>
            <p style={{ fontSize: 11, color: C.textMuted }}>
              Sim time: {Math.round(facility.simTime)}s · {facility.scenarioRunning ? `Active: ${facility.activeScenarioId}` : 'No scenario running'}
            </p>
          </div>
        </div>
      )}

      {activeTab === 'Historical Incidents' && (
        <div style={{ padding: '16px 24px 32px', animation: 'slide-in 0.25s ease' }}>
          <div style={{
            background: C.cardBg, backdropFilter: 'blur(20px)', borderRadius: 24,
            border: `1px solid ${C.amberBorder}`, boxShadow: '0 4px 40px rgba(245,158,11,0.06)', padding: 24,
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: C.amber, marginBottom: 2 }}>INCIDENT PATTERN INTELLIGENCE</p>
            <h3 style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', color: C.textDark, marginBottom: 16 }}>Historical Incident Library</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {facility.incidents.map((inc) => (
                <div key={inc.incident_number} style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.06)' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.textDark }}>#{inc.incident_number} {inc.title}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: C.amberDark, background: C.amberBg, borderRadius: 20, padding: '2px 8px', textTransform: 'uppercase' }}>{inc.severity.replace('_', ' ')}</span>
                    <span style={{ fontSize: 10, color: C.textMuted }}>Zones: {inc.zones_involved.join(', ')}</span>
                  </div>
                  <p style={{ fontSize: 12, color: C.textMid, lineHeight: 1.5 }}>{inc.narrative_summary}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Compliance' && (
        <div style={{ padding: '16px 24px 32px', display: 'flex', gap: 16, animation: 'slide-in 0.25s ease' }}>
          <div style={{
            background: C.cardBg, backdropFilter: 'blur(20px)', borderRadius: 24,
            border: `1px solid ${C.amberBorder}`, boxShadow: '0 4px 40px rgba(245,158,11,0.06)', padding: 24, maxWidth: 720, width: '100%',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: C.amber, marginBottom: 2 }}>QUALITY & COMPLIANCE AUDIT</p>
                <h3 style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', color: C.textDark }}>Regulatory Gap Report</h3>
              </div>
              <button
                onClick={facility.triggerComplianceAudit}
                style={{ background: `linear-gradient(135deg, ${C.amber}, ${C.amberDark})`, color: 'white', border: 'none', borderRadius: 10, padding: '9px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >Run Audit</button>
            </div>
            {facility.complianceAudits.length === 0 ? (
              <p style={{ fontSize: 12, color: C.textMuted }}>No audits run yet — scheduled/anomaly-triggered per design, not continuous.</p>
            ) : (
              <>
                <p style={{ fontSize: 13, color: C.textMid, marginBottom: 14 }}>{facility.complianceAudits[0].summary}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {facility.complianceAudits[0].gaps.map((g, i) => (
                    <div key={i} style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(239,68,68,0.15)' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#ef4444' }}>Zone {g.zone_id} · {g.category.replace(/_/g, ' ')}</span>
                      <p style={{ fontSize: 12, color: C.textMid, marginTop: 2 }}>{g.description}</p>
                      {g.regulatory_match && <p style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>{g.regulatory_match.citation}</p>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <PermitIntelligencePanel permitFlags={facility.permitFlags} />
        </div>
      )}

      {activeTab === 'Reports' && (
        <div style={{ padding: '16px 24px 32px', animation: 'slide-in 0.25s ease' }}>
          <div style={{
            background: C.cardBg, backdropFilter: 'blur(20px)', borderRadius: 24,
            border: `1px solid ${C.amberBorder}`, boxShadow: '0 4px 40px rgba(245,158,11,0.06)', padding: 24, maxWidth: 720,
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: C.amber, marginBottom: 2 }}>PLANT REPORT</p>
            <h3 style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', color: C.textDark, marginBottom: 16 }}>Aggregated Safety Summary</h3>
            {!facility.reportsSummary ? (
              <p style={{ fontSize: 12, color: C.textMuted }}>Loading report from the backend…</p>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
                  {[
                    { label: 'Total Risk Events', value: facility.reportsSummary.total_risk_events },
                    { label: 'Critical', value: facility.reportsSummary.events_by_tier.critical ?? 0, color: '#ef4444' },
                    { label: 'Warning', value: facility.reportsSummary.events_by_tier.warning ?? 0, color: '#f97316' },
                    { label: 'Emergency Responses', value: facility.reportsSummary.emergency_responses_count },
                  ].map((s) => (
                    <div key={s.label} style={{ padding: '10px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.06)', minWidth: 110, textAlign: 'center' }}>
                      <p style={{ fontSize: 10, color: C.textMuted, fontWeight: 600, marginBottom: 3 }}>{s.label}</p>
                      <p style={{ fontSize: 20, fontWeight: 900, color: s.color ?? C.textDark }}>{s.value}</p>
                    </div>
                  ))}
                </div>

                <p style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: '0.06em', marginBottom: 6 }}>EVENTS BY ZONE</p>
                {Object.keys(facility.reportsSummary.events_by_zone).length === 0 ? (
                  <p style={{ fontSize: 12, color: C.textMuted, marginBottom: 16 }}>No risk events recorded yet.</p>
                ) : (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                    {Object.entries(facility.reportsSummary.events_by_zone).map(([zone, count]) => (
                      <span key={zone} style={{ fontSize: 11, fontWeight: 600, background: C.amberBg, color: C.amberDark, borderRadius: 20, padding: '4px 10px' }}>Zone {zone}: {count}</span>
                    ))}
                  </div>
                )}

                <p style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: '0.06em', marginBottom: 6 }}>LATEST EMERGENCY RESPONSE</p>
                {facility.reportsSummary.latest_emergency_response ? (
                  <div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', marginBottom: 16 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#b91c1c' }}>Zone {facility.reportsSummary.latest_emergency_response.zone} — {facility.reportsSummary.latest_emergency_response.status}</p>
                    <p style={{ fontSize: 11, color: C.textMid, marginTop: 4, whiteSpace: 'pre-wrap' }}>{facility.reportsSummary.latest_emergency_response.preliminary_report.slice(0, 220)}…</p>
                  </div>
                ) : (
                  <p style={{ fontSize: 12, color: C.textMuted, marginBottom: 16 }}>No emergency responses dispatched yet.</p>
                )}

                <p style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: '0.06em', marginBottom: 6 }}>LATEST COMPLIANCE AUDIT</p>
                {facility.reportsSummary.latest_compliance_audit ? (
                  <p style={{ fontSize: 12, color: C.textMid }}>{facility.reportsSummary.latest_compliance_audit.gap_count} gap(s) — {facility.reportsSummary.latest_compliance_audit.summary}</p>
                ) : (
                  <p style={{ fontSize: 12, color: C.textMuted }}>No audit run yet — trigger one from the Compliance tab.</p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {(activeTab === 'Analytics' || activeTab === 'Settings') && (
        <div style={{ padding: '16px 24px 32px', animation: 'slide-in 0.25s ease' }}>
          <div style={{
            background: C.cardBg, backdropFilter: 'blur(20px)', borderRadius: 24,
            border: `1px solid ${C.amberBorder}`, boxShadow: '0 4px 40px rgba(245,158,11,0.06)', padding: 24, maxWidth: 480, textAlign: 'center',
          }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: C.textMid }}>No backend endpoint exists for {activeTab} yet.</p>
          </div>
        </div>
      )}

      {/* ── FLOATING REPLAY ── */}
      <div style={{ position: 'fixed', bottom: 32, right: 32, zIndex: 100 }}>
        <button onClick={() => goToTab('Replay')} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: `linear-gradient(135deg, ${C.textDark}, #292010)`,
          color: 'white', border: 'none', borderRadius: 20, padding: '14px 22px',
          fontSize: 13, fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 8px 32px rgba(28,18,10,0.4)', transition: 'transform 0.2s, box-shadow 0.2s', letterSpacing: '-0.01em',
        }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(28,18,10,0.5)' }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 8px 32px rgba(28,18,10,0.4)' }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6.5" stroke="rgba(255,255,255,0.35)" strokeWidth="1"/>
            <path d="M6 5.5l5 2.5-5 2.5V5.5z" fill="white"/>
          </svg>
          Replay Scenario
          <span style={{ background: 'rgba(255,255,255,0.14)', borderRadius: 8, padding: '2px 8px', fontSize: 11 }}>{facility.scenarios.length || 10} scenarios</span>
        </button>
      </div>
    </div>
  )
}
