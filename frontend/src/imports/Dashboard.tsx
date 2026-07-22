import { useState, useEffect, useRef } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────
interface Zone {
  id: string
  label: string
  x: number
  y: number
  w: number
  h: number
  status: 'healthy' | 'elevated' | 'critical'
  workers: number
  permits: number
  temp: string
  pressure: string
}

interface Message {
  role: 'ai' | 'user'
  text: string
}

// ── Constants ──────────────────────────────────────────────────────────────
const ZONES: Zone[] = [
  { id: 'A', label: 'Reactor', x: 60, y: 40, w: 80, h: 60, status: 'elevated', workers: 4, permits: 2, temp: '312°C', pressure: '18.2 bar' },
  { id: 'B', label: 'Chlor Alkali', x: 160, y: 40, w: 90, h: 60, status: 'healthy', workers: 3, permits: 1, temp: '78°C', pressure: '4.1 bar' },
  { id: 'C', label: 'Tank Farm', x: 60, y: 120, w: 80, h: 55, status: 'critical', workers: 6, permits: 3, temp: '42°C', pressure: '2.8 bar' },
  { id: 'D', label: 'Blending', x: 160, y: 120, w: 90, h: 55, status: 'critical', workers: 5, permits: 2, temp: '95°C', pressure: '6.4 bar' },
  { id: 'E', label: 'Resin', x: 270, y: 40, w: 70, h: 60, status: 'healthy', workers: 2, permits: 1, temp: '210°C', pressure: '9.7 bar' },
  { id: 'F', label: 'Utilities', x: 270, y: 120, w: 70, h: 55, status: 'healthy', workers: 3, permits: 0, temp: '65°C', pressure: '3.2 bar' },
  { id: 'G', label: 'Loading Bay', x: 60, y: 195, w: 100, h: 50, status: 'healthy', workers: 8, permits: 4, temp: '28°C', pressure: '1.0 bar' },
  { id: 'H', label: 'Maintenance', x: 170, y: 195, w: 80, h: 50, status: 'elevated', workers: 5, permits: 3, temp: '30°C', pressure: '1.1 bar' },
  { id: 'I', label: 'Control Room', x: 260, y: 195, w: 80, h: 50, status: 'healthy', workers: 6, permits: 0, temp: '22°C', pressure: '1.0 bar' },
  { id: 'J', label: 'Security Gate', x: 60, y: 265, w: 70, h: 40, status: 'healthy', workers: 2, permits: 0, temp: '27°C', pressure: '1.0 bar' },
  { id: 'K', label: 'Flare Stack', x: 140, y: 265, w: 60, h: 40, status: 'elevated', workers: 1, permits: 1, temp: '680°C', pressure: '12.3 bar' },
]

const STATUS_COLORS = {
  healthy: { bg: 'rgba(74,222,128,0.15)', border: 'rgba(74,222,128,0.5)', dot: '#22c55e', text: '#15803d' },
  elevated: { bg: 'rgba(251,146,60,0.15)', border: 'rgba(251,146,60,0.5)', dot: '#f97316', text: '#c2410c' },
  critical: { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.5)', dot: '#ef4444', text: '#b91c1c' },
}

const REASONING_STEPS = [
  'Reading SCADA data...',
  'Checking IoT sensors...',
  'Reading permit database...',
  'Checking worker locations...',
  'Retrieving historical incidents...',
  'Comparing DGMS rules...',
  'Calculating compound risk...',
  'Generating recommendations...',
]

const RECOMMENDATIONS = [
  { action: 'Evacuate Zone D', priority: 'critical', confidence: 97, icon: '🚨' },
  { action: 'Suspend work permit #2841', priority: 'critical', confidence: 94, icon: '🔒' },
  { action: 'Notify fire response team', priority: 'elevated', confidence: 89, icon: '📢' },
  { action: 'Isolate Reactor Zone A', priority: 'elevated', confidence: 82, icon: '⚠️' },
  { action: 'Dispatch maintenance to Tank Farm', priority: 'normal', confidence: 76, icon: '🔧' },
]

const TIMELINE_EVENTS = [
  { time: '09:14', label: 'Cooling tower degradation detected', type: 'elevated' },
  { time: '09:22', label: 'Pressure variance +12% in Zone A', type: 'elevated' },
  { time: '09:31', label: 'VOC threshold reached 87% in Zone D', type: 'critical' },
  { time: '09:38', label: 'Permit #2841 activated — Zone D', type: 'normal' },
  { time: '09:44', label: 'Workers entered Zone D (5 personnel)', type: 'normal' },
  { time: '09:51', label: 'AI compound risk warning issued', type: 'critical' },
  { time: '10:02', label: 'Emergency response protocol initiated', type: 'critical' },
]

const SENSOR_DATA = (() => {
  const pts = (base: number, variance: number) =>
    Array.from({ length: 20 }, (_, i) => base + Math.sin(i * 0.7) * variance + (Math.random() - 0.5) * variance * 0.4)
  return {
    Temperature: { color: '#ef4444', data: pts(310, 18) },
    Pressure: { color: '#f97316', data: pts(17, 3) },
    VOC: { color: '#a855f7', data: pts(75, 12) },
    'Flow Rate': { color: '#3b82f6', data: pts(42, 8) },
  }
})()

const INCIDENTS = [
  { similarity: 94, year: 2019, industry: 'Petrochemical', cause: 'Cooling system failure + VOC accumulation', location: 'Vizag, India' },
  { similarity: 87, year: 2021, industry: 'Chemical', cause: 'Pressure relief valve stuck + maintenance gap', location: 'Surat, India' },
  { similarity: 79, year: 2016, industry: 'Refinery', cause: 'Compound explosion — permit override', location: 'Texas City, USA' },
]

const NOTIFICATIONS = [
  { time: '10:03', text: 'AI recommendation: Evacuate Zone D', type: 'critical' },
  { time: '10:02', text: 'Emergency response protocol initiated', type: 'critical' },
  { time: '09:58', text: 'Maintenance overdue: Tank Farm T-12', type: 'elevated' },
  { time: '09:51', text: 'AI compound risk warning issued', type: 'critical' },
  { time: '09:44', text: '5 workers entered Zone D', type: 'normal' },
  { time: '09:38', text: 'Permit #2841 activated', type: 'normal' },
  { time: '09:31', text: 'Sensor exceeded: VOC 87% threshold', type: 'elevated' },
]

const COPILOT_SUGGESTIONS = [
  'Why is Zone D high risk?',
  'Explain AI decision',
  'Show similar incidents',
  'Generate safety report',
  "Summarize today's events",
]

const NAV_TABS = ['Overview', 'Digital Twin', 'AI Intelligence', 'Incidents', 'Compliance', 'Copilot', 'Replay Mode']

// ── Helpers ────────────────────────────────────────────────────────────────
function SensorChart({ data, color }: { data: number[]; color: string }) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const h = 52
  const w = 180
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={`0,${h} ${pts} ${w},${h}`}
        fill={`url(#grad-${color})`}
        stroke="none"
      />
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────
function DigitalTwin({ onZoneSelect }: { onZoneSelect: (z: Zone | null) => void }) {
  const [hovered, setHovered] = useState<Zone | null>(null)
  const [activeLayer, setActiveLayer] = useState('3D View')

  const layers = ['3D View', 'Heatmap', 'Sensor Layer', 'Worker Layer', 'Permit Layer']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      <div
        style={{
          background: 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(20px)',
          borderRadius: 24,
          border: '1px solid rgba(99,102,241,0.1)',
          boxShadow: '0 4px 40px rgba(99,102,241,0.07)',
          padding: 20,
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#6366f1', marginBottom: 2 }}>
              DIGITAL TWIN
            </p>
            <h3 style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em', color: '#1e1b4b' }}>
              Live Plant Map
            </h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#22c55e',
                display: 'inline-block',
                animation: 'pulse-dot 2s ease-in-out infinite',
              }}
            />
            <span style={{ fontSize: 11, fontWeight: 600, color: '#22c55e' }}>LIVE</span>
          </div>
        </div>

        {/* Plant map SVG */}
        <div
          style={{
            background: 'linear-gradient(135deg, #f0f4ff, #e8eeff)',
            borderRadius: 16,
            padding: '8px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Grid lines */}
          <svg
            width="100%"
            viewBox="0 0 360 320"
            style={{ display: 'block' }}
          >
            {/* Background grid */}
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(99,102,241,0.08)" strokeWidth="0.5" />
              </pattern>
              {/* Animated glow filter */}
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
            <rect width="360" height="320" fill="url(#grid)" />

            {/* Compound risk connection lines */}
            <g opacity="0.7">
              {/* Cooling → Reactor → Tank → Blending */}
              <line x1="100" y1="70" x2="100" y2="120" stroke="#ef4444" strokeWidth="2" strokeDasharray="6 3">
                <animate attributeName="stroke-dashoffset" from="0" to="-18" dur="1.2s" repeatCount="indefinite" />
              </line>
              <line x1="100" y1="148" x2="200" y2="148" stroke="#ef4444" strokeWidth="2" strokeDasharray="6 3">
                <animate attributeName="stroke-dashoffset" from="0" to="-18" dur="1.2s" repeatCount="indefinite" />
              </line>
              <line x1="200" y1="120" x2="200" y2="70" stroke="#ef4444" strokeWidth="2" strokeDasharray="6 3">
                <animate attributeName="stroke-dashoffset" from="0" to="-18" dur="1.2s" repeatCount="indefinite" />
              </line>
              {/* Glow circles at connection points */}
              <circle cx="100" cy="120" r="5" fill="#ef4444" opacity="0.4">
                <animate attributeName="r" values="4;7;4" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx="200" cy="148" r="5" fill="#ef4444" opacity="0.4">
                <animate attributeName="r" values="4;7;4" dur="2s" begin="0.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" begin="0.5s" repeatCount="indefinite" />
              </circle>
            </g>

            {/* Zones */}
            {ZONES.map((z) => {
              const sc = STATUS_COLORS[z.status]
              const isHov = hovered?.id === z.id
              return (
                <g
                  key={z.id}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => { setHovered(z); onZoneSelect(z) }}
                  onMouseLeave={() => { setHovered(null); onZoneSelect(null) }}
                >
                  {/* Glow for critical */}
                  {z.status === 'critical' && (
                    <rect
                      x={z.x - 4} y={z.y - 4}
                      width={z.w + 8} height={z.h + 8}
                      rx="14"
                      fill="rgba(239,68,68,0.12)"
                      filter="url(#glow)"
                    >
                      <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
                    </rect>
                  )}
                  <rect
                    x={z.x} y={z.y}
                    width={z.w} height={z.h}
                    rx="10"
                    fill={isHov ? sc.bg.replace('0.15', '0.28') : sc.bg}
                    stroke={isHov ? sc.dot : sc.border}
                    strokeWidth={isHov ? 2 : 1}
                  />
                  {/* Zone label */}
                  <text x={z.x + 8} y={z.y + 16} fontSize="9" fontWeight="700" fill={sc.text} opacity="0.7">
                    Zone {z.id}
                  </text>
                  <text x={z.x + 8} y={z.y + 28} fontSize="10" fontWeight="700" fill="#1e1b4b">
                    {z.label}
                  </text>
                  {/* Status dot */}
                  <circle cx={z.x + z.w - 10} cy={z.y + 10} r="4" fill={sc.dot}>
                    {z.status !== 'healthy' && (
                      <animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite" />
                    )}
                  </circle>
                  {/* Workers */}
                  <text x={z.x + 8} y={z.y + z.h - 8} fontSize="9" fill="#6366f1" fontWeight="600">
                    👷 {z.workers}
                  </text>
                  <text x={z.x + 30} y={z.y + z.h - 8} fontSize="9" fill="#818cf8" fontWeight="600">
                    📋 {z.permits}
                  </text>
                </g>
              )
            })}

            {/* Risk label */}
            <g>
              <rect x="220" y="255" width="128" height="52" rx="8" fill="rgba(239,68,68,0.08)" stroke="rgba(239,68,68,0.25)" strokeWidth="1" />
              <text x="230" y="271" fontSize="8" fontWeight="700" fill="#ef4444" letterSpacing="1">COMPOUND RISK</text>
              <text x="230" y="284" fontSize="9" fill="#1e1b4b" fontWeight="600">Zone C → A → D pathway</text>
              <text x="230" y="296" fontSize="8" fill="#71717a">AI Confidence: 94%</text>
              <text x="230" y="303" fontSize="8" fill="#ef4444">⚠ 13 min to threshold</text>
            </g>
          </svg>
        </div>

        {/* Layer tabs */}
        <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
          {layers.map((l) => (
            <button
              key={l}
              onClick={() => setActiveLayer(l)}
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: '5px 10px',
                borderRadius: 20,
                border: activeLayer === l ? '1px solid #6366f1' : '1px solid rgba(0,0,0,0.08)',
                background: activeLayer === l ? 'rgba(99,102,241,0.1)' : 'transparent',
                color: activeLayer === l ? '#6366f1' : '#71717a',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Zone tooltip */}
      {hovered && (
        <div
          style={{
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(20px)',
            borderRadius: 16,
            border: `1px solid ${STATUS_COLORS[hovered.status].border}`,
            padding: '14px 18px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            animation: 'slide-in 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontWeight: 800, fontSize: 14, color: '#1e1b4b' }}>Zone {hovered.id} — {hovered.label}</span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 20,
                background: STATUS_COLORS[hovered.status].bg,
                color: STATUS_COLORS[hovered.status].text,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {hovered.status}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 20px' }}>
            {[
              ['Workers', hovered.workers],
              ['Permits', hovered.permits],
              ['Temp', hovered.temp],
              ['Pressure', hovered.pressure],
            ].map(([k, v]) => (
              <div key={String(k)}>
                <span style={{ fontSize: 10, color: '#a1a1aa', fontWeight: 600 }}>{k}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1e1b4b', marginLeft: 8 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function AIIntelligence() {
  const [step, setStep] = useState(0)
  const [showResult, setShowResult] = useState(false)

  useEffect(() => {
    const id = setInterval(() => {
      setStep((s) => {
        if (s >= REASONING_STEPS.length - 1) {
          setShowResult(true)
          clearInterval(id)
          return s
        }
        return s + 1
      })
    }, 700)
    return () => clearInterval(id)
  }, [])

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(20px)',
        borderRadius: 24,
        border: '1px solid rgba(99,102,241,0.1)',
        boxShadow: '0 4px 40px rgba(99,102,241,0.07)',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        height: '100%',
        overflowY: 'auto',
      }}
    >
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#6366f1', marginBottom: 2 }}>
          AI INTELLIGENCE LAYER
        </p>
        <h3 style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em', color: '#1e1b4b' }}>
          Compound Risk Analysis
        </h3>
      </div>

      {/* Streaming reasoning */}
      <div
        style={{
          background: 'rgba(99,102,241,0.04)',
          borderRadius: 16,
          padding: '14px 16px',
          border: '1px solid rgba(99,102,241,0.08)',
        }}
      >
        {REASONING_STEPS.map((s, i) => (
          <div
            key={s}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '5px 0',
              opacity: i <= step ? 1 : 0.25,
              transition: 'opacity 0.4s',
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: i < step ? '#6366f1' : i === step ? 'transparent' : 'transparent',
                border: i < step ? 'none' : i === step ? '2px solid #6366f1' : '1.5px solid #e4e4e7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                animation: i === step ? 'pulse-dot 1.2s ease-in-out infinite' : 'none',
              }}
            >
              {i < step && (
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path d="M1.5 4l1.8 1.8L6.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <span style={{ fontSize: 12, fontWeight: i === step ? 600 : 400, color: i === step ? '#3730a3' : i < step ? '#71717a' : '#c4c4c4' }}>
              {s}
            </span>
          </div>
        ))}
      </div>

      {/* Risk result card */}
      {showResult && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(239,68,68,0.07), rgba(239,68,68,0.03))',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 20,
            padding: 18,
            animation: 'slide-in 0.4s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', letterSpacing: '0.08em', marginBottom: 4 }}>
                COMPOUND EXPLOSION RISK
              </p>
              <p style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.04em', color: '#1e1b4b', lineHeight: 1 }}>
                94% Confidence
              </p>
            </div>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                border: '3px solid rgba(239,68,68,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'pulse-dot 2s ease-in-out infinite',
              }}
            >
              <span style={{ fontSize: 18 }}>⚠️</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {['5 Systems Correlated', '13 min to threshold', 'Evidence: Very High'].map((t) => (
              <span key={t} style={{ fontSize: 11, fontWeight: 600, background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: 20, padding: '3px 10px' }}>
                {t}
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['View Reasoning', 'Explain Decision', 'Generate Report'].map((label, i) => (
              <button
                key={label}
                style={{
                  flex: 1,
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '7px 4px',
                  borderRadius: 10,
                  border: i === 0 ? 'none' : '1px solid rgba(99,102,241,0.2)',
                  background: i === 0 ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'transparent',
                  color: i === 0 ? 'white' : '#6366f1',
                  cursor: 'pointer',
                  transition: 'transform 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = '')}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {showResult && (
        <div style={{ animation: 'slide-in 0.5s ease' }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', color: '#71717a', marginBottom: 10 }}>
            RECOMMENDED ACTIONS
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {RECOMMENDATIONS.map((r) => (
              <div
                key={r.action}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  background: 'rgba(255,255,255,0.7)',
                  borderRadius: 12,
                  border: `1px solid ${r.priority === 'critical' ? 'rgba(239,68,68,0.2)' : r.priority === 'elevated' ? 'rgba(251,146,60,0.2)' : 'rgba(0,0,0,0.07)'}`,
                  cursor: 'pointer',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateX(4px)'
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = ''
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <span style={{ fontSize: 14 }}>{r.icon}</span>
                <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: '#1e1b4b' }}>{r.action}</span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: r.priority === 'critical' ? '#ef4444' : r.priority === 'elevated' ? '#f97316' : '#6366f1',
                    background: r.priority === 'critical' ? 'rgba(239,68,68,0.1)' : r.priority === 'elevated' ? 'rgba(251,146,60,0.1)' : 'rgba(99,102,241,0.1)',
                    padding: '2px 8px',
                    borderRadius: 20,
                  }}
                >
                  {r.confidence}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Copilot() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: "Hello! I'm your SafetyIQ Copilot. I've detected a compound risk event in progress. Zone D requires immediate attention. How can I help you respond?" },
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  const AI_RESPONSES: Record<string, string> = {
    default: "Based on my analysis of all 40+ connected systems, the compound risk in Zone D is driven by the convergence of cooling tower degradation, rising VOC levels (87%), and 5 active workers in the zone. Historical incident data shows 94% similarity to the 2019 Vizag incident. Immediate evacuation is strongly recommended.",
    "why is zone d high risk?": "Zone D (Blending) is elevated because: (1) VOC concentration is at 87% of threshold, (2) Permit #2841 is active with 5 workers present, (3) Pressure in adjacent Zone A has risen 12%, and (4) Cooling capacity has dropped 23%. The AI correlates all these factors into a compound risk score of 94%.",
    "explain ai decision": "The AI correlated data from SCADA, IoT sensors, the permit database, HR location tracking, and the DGMS rulebook. It matched the current pattern to 3 historical incidents with >79% similarity. The 94% confidence score reflects strong convergence across all 5 independent data sources.",
    "show similar incidents": "I found 3 highly similar incidents: (1) 2019 Vizag Petrochemical — 94% match, cooling failure + VOC. (2) 2021 Surat Chemical — 87% match, pressure relief + maintenance gap. (3) 2016 Texas City refinery — 79% match, compound explosion via permit override.",
    "generate safety report": "Generating a DGMS-compliant incident report for the current event... The report includes sensor readings, worker logs, permit status, AI reasoning chain, and recommended actions. It will be ready for download in approximately 30 seconds.",
    "summarize today's events": "Today's key events: 09:14 — Cooling tower degradation detected. 09:22 — Pressure +12% in Zone A. 09:31 — VOC at 87% in Zone D. 09:38 — Permit #2841 activated. 09:44 — 5 workers entered Zone D. 09:51 — AI issued compound risk warning. Emergency response initiated at 10:02.",
  }

  const send = (text: string) => {
    if (!text.trim()) return
    setMessages((m) => [...m, { role: 'user', text }])
    setInput('')
    setTyping(true)
    setTimeout(() => {
      const key = text.toLowerCase().trim()
      const reply = AI_RESPONSES[key] || AI_RESPONSES.default
      setTyping(false)
      setMessages((m) => [...m, { role: 'ai', text: reply }])
    }, 1200)
  }

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(20px)',
        borderRadius: 24,
        border: '1px solid rgba(99,102,241,0.1)',
        boxShadow: '0 4px 40px rgba(99,102,241,0.07)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '18px 18px 12px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#6366f1', marginBottom: 2 }}>AI COPILOT</p>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1e1b4b', letterSpacing: '-0.02em' }}>Ask anything</h3>
      </div>

      {/* Suggestions */}
      <div style={{ padding: '12px 14px 0', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {COPILOT_SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => send(s)}
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: '5px 10px',
              borderRadius: 20,
              border: '1px solid rgba(99,102,241,0.2)',
              background: 'rgba(99,102,241,0.05)',
              color: '#6366f1',
              cursor: 'pointer',
              transition: 'background 0.2s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(99,102,241,0.12)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(99,102,241,0.05)')}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: m.role === 'user' ? 'row-reverse' : 'row', gap: 8, alignItems: 'flex-end' }}>
            {m.role === 'ai' && (
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="2.5" fill="white" opacity="0.9"/>
                  <path d="M6 1v1.5M6 9.5V11M1 6h1.5M9.5 6H11" stroke="white" strokeWidth="1" strokeLinecap="round"/>
                </svg>
              </div>
            )}
            <div
              style={{
                maxWidth: '82%',
                padding: '10px 13px',
                borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: m.role === 'user' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'rgba(255,255,255,0.85)',
                color: m.role === 'user' ? 'white' : '#1e1b4b',
                fontSize: 12,
                lineHeight: 1.55,
                fontWeight: 400,
                border: m.role === 'ai' ? '1px solid rgba(0,0,0,0.07)' : 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}
            >
              {m.text}
            </div>
          </div>
        ))}
        {typing && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <div style={{ width: 26, height: 26, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="2.5" fill="white" opacity="0.9"/></svg>
            </div>
            <div style={{ padding: '10px 16px', borderRadius: '16px 16px 16px 4px', background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(0,0,0,0.07)' }}>
              <span style={{ display: 'flex', gap: 4 }}>
                {[0, 1, 2].map((i) => (
                  <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#a5b4fc', display: 'inline-block', animation: `pulse-dot 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                ))}
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '10px 14px 16px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        <div
          style={{
            display: 'flex',
            gap: 8,
            background: 'rgba(99,102,241,0.05)',
            border: '1px solid rgba(99,102,241,0.15)',
            borderRadius: 14,
            padding: '8px 8px 8px 14px',
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send(input)}
            placeholder="Ask the AI anything..."
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              fontSize: 12,
              color: '#1e1b4b',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          <button
            onClick={() => send(input)}
            style={{
              width: 30,
              height: 30,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6h8M7 3l3 3-3 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Dashboard ─────────────────────────────────────────────────────────
export default function Dashboard({ onExit }: { onExit: () => void }) {
  const [activeTab, setActiveTab] = useState('Overview')
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null)
  const [notifCount] = useState(3)
  const [activeSensor, setActiveSensor] = useState('Temperature')

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #f0f4ff 0%, #f7f5ff 40%, #f0f7ff 100%)',
        fontFamily: "'Inter', system-ui, sans-serif",
        overflowX: 'hidden',
      }}
    >
      <style>{`
        @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes slide-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slide-right { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
        @keyframes count-up { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.2); border-radius: 4px; }
      `}</style>

      {/* ── TOP NAV ── */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'rgba(240,244,255,0.85)',
          backdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(99,102,241,0.1)',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          height: 56,
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginRight: 32 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M8 2L14 6v8H2V6L8 2z" stroke="white" strokeWidth="1.4" fill="none"/>
              <circle cx="8" cy="9" r="2" fill="white" opacity="0.8"/>
            </svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: '-0.03em', color: '#1e1b4b' }}>SafetyIQ</span>
        </div>

        {/* Nav tabs */}
        <div style={{ display: 'flex', flex: 1, gap: 2 }}>
          {NAV_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: '6px 13px',
                borderRadius: 8,
                border: 'none',
                background: activeTab === tab ? 'rgba(99,102,241,0.1)' : 'transparent',
                color: activeTab === tab ? '#6366f1' : '#71717a',
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => { if (activeTab !== tab) e.currentTarget.style.background = 'rgba(0,0,0,0.04)' }}
              onMouseLeave={(e) => { if (activeTab !== tab) e.currentTarget.style.background = 'transparent' }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Right icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            style={{
              position: 'relative',
              width: 34,
              height: 34,
              borderRadius: 10,
              border: '1px solid rgba(0,0,0,0.08)',
              background: 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1.5C4.5 1.5 2.5 3.5 2.5 6c0 2 1 3 2 4H9.5c1-1 2-2 2-4 0-2.5-2-4.5-4.5-4.5z" stroke="#71717a" strokeWidth="1.2"/>
              <path d="M5.5 10v1a1.5 1.5 0 003 0v-1" stroke="#71717a" strokeWidth="1.2"/>
            </svg>
            {notifCount > 0 && (
              <span style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: '50%', background: '#ef4444', border: '1.5px solid white' }} />
            )}
          </button>
          <button style={{ width: 34, height: 34, borderRadius: 10, border: '1px solid rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="5.5" stroke="#71717a" strokeWidth="1.2"/>
              <circle cx="7" cy="7" r="2" stroke="#71717a" strokeWidth="1.2"/>
            </svg>
          </button>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #818cf8, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'white' }}>JS</span>
          </div>
          <button
            onClick={onExit}
            style={{ fontSize: 11, fontWeight: 700, padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(99,102,241,0.25)', background: 'rgba(99,102,241,0.06)', color: '#6366f1', cursor: 'pointer' }}
          >
            ← Landing
          </button>
        </div>
      </nav>

      {/* ── WELCOME HEADER ── */}
      <div style={{ padding: '20px 24px 0' }}>
        <div
          style={{
            background: 'rgba(255,255,255,0.65)',
            backdropFilter: 'blur(20px)',
            borderRadius: 20,
            border: '1px solid rgba(99,102,241,0.1)',
            padding: '18px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 32px rgba(99,102,241,0.06)',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#6366f1', marginBottom: 2 }}>AI COMMAND CENTER</p>
            <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.035em', color: '#1e1b4b', lineHeight: 1.1 }}>
              Real-Time Industrial Safety Intelligence
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {[
              { label: 'Plant Status', value: 'CRITICAL', color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' },
              { label: 'AI Confidence', value: '94%', color: '#6366f1', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.2)' },
              { label: 'Safety Score', value: '61 / 100', color: '#f97316', bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.2)' },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  padding: '10px 18px',
                  borderRadius: 14,
                  background: stat.bg,
                  border: `1px solid ${stat.border}`,
                  textAlign: 'center',
                  minWidth: 100,
                }}
              >
                <p style={{ fontSize: 10, fontWeight: 600, color: '#71717a', letterSpacing: '0.06em', marginBottom: 3 }}>{stat.label}</p>
                <p style={{ fontSize: 18, fontWeight: 900, color: stat.color, letterSpacing: '-0.03em', lineHeight: 1 }}>{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN 3-COLUMN GRID ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '45fr 30fr 25fr',
          gap: 16,
          padding: '16px 24px',
          minHeight: 0,
        }}
      >
        {/* LEFT — Digital Twin */}
        <div style={{ minHeight: 540, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <DigitalTwin onZoneSelect={setSelectedZone} />
        </div>

        {/* CENTER — AI Intelligence */}
        <div style={{ minHeight: 540, maxHeight: 640, overflowY: 'auto' }}>
          <AIIntelligence />
        </div>

        {/* RIGHT — Copilot */}
        <div style={{ height: 640 }}>
          <Copilot />
        </div>
      </div>

      {/* ── BOTTOM 4-CARD ROW ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          padding: '0 24px 32px',
        }}
      >
        {/* 1. Incident Timeline */}
        <div
          style={{
            background: 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(20px)',
            borderRadius: 20,
            border: '1px solid rgba(99,102,241,0.1)',
            boxShadow: '0 4px 24px rgba(99,102,241,0.06)',
            padding: '18px 18px',
            transition: 'transform 0.25s, box-shadow 0.25s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)'
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(99,102,241,0.12)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = ''
            e.currentTarget.style.boxShadow = '0 4px 24px rgba(99,102,241,0.06)'
          }}
        >
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#6366f1', marginBottom: 4 }}>INCIDENT TIMELINE</p>
          <h4 style={{ fontSize: 14, fontWeight: 800, color: '#1e1b4b', marginBottom: 14, letterSpacing: '-0.02em' }}>Today's Events</h4>
          <div style={{ position: 'relative', paddingLeft: 20 }}>
            <div style={{ position: 'absolute', left: 6, top: 4, bottom: 4, width: 1.5, background: 'rgba(99,102,241,0.15)', borderRadius: 2 }} />
            {TIMELINE_EVENTS.map((ev, i) => (
              <div key={i} style={{ position: 'relative', marginBottom: 12, animation: `slide-in 0.3s ease ${i * 0.07}s both` }}>
                <div
                  style={{
                    position: 'absolute',
                    left: -17,
                    top: 4,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: ev.type === 'critical' ? '#ef4444' : ev.type === 'elevated' ? '#f97316' : '#6366f1',
                    border: '2px solid white',
                  }}
                />
                <p style={{ fontSize: 9, fontWeight: 600, color: '#a1a1aa', marginBottom: 1 }}>{ev.time}</p>
                <p style={{ fontSize: 11, fontWeight: 500, color: ev.type === 'critical' ? '#ef4444' : ev.type === 'elevated' ? '#f97316' : '#3730a3', lineHeight: 1.35 }}>
                  {ev.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Sensor Trends */}
        <div
          style={{
            background: 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(20px)',
            borderRadius: 20,
            border: '1px solid rgba(99,102,241,0.1)',
            boxShadow: '0 4px 24px rgba(99,102,241,0.06)',
            padding: '18px',
            transition: 'transform 0.25s, box-shadow 0.25s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)'
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(99,102,241,0.12)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = ''
            e.currentTarget.style.boxShadow = '0 4px 24px rgba(99,102,241,0.06)'
          }}
        >
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#6366f1', marginBottom: 4 }}>SENSOR TRENDS</p>
          <h4 style={{ fontSize: 14, fontWeight: 800, color: '#1e1b4b', marginBottom: 12, letterSpacing: '-0.02em' }}>Live Readings</h4>
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
            {Object.entries(SENSOR_DATA).map(([name, { color }]) => (
              <button
                key={name}
                onClick={() => setActiveSensor(name)}
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: 20,
                  border: activeSensor === name ? `1.5px solid ${color}` : '1.5px solid transparent',
                  background: activeSensor === name ? `${color}18` : 'rgba(0,0,0,0.04)',
                  color: activeSensor === name ? color : '#71717a',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {name}
              </button>
            ))}
          </div>
          {Object.entries(SENSOR_DATA).map(([name, { data, color }]) =>
            activeSensor === name ? (
              <div key={name} style={{ animation: 'slide-in 0.3s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                  <span style={{ fontSize: 24, fontWeight: 900, color, letterSpacing: '-0.04em' }}>
                    {Math.round(data[data.length - 1])}
                    <span style={{ fontSize: 12, fontWeight: 600, marginLeft: 2 }}>
                      {name === 'Temperature' ? '°C' : name === 'Pressure' ? 'bar' : name === 'VOC' ? '%' : 'm³/h'}
                    </span>
                  </span>
                  <span style={{ fontSize: 10, color: '#ef4444', fontWeight: 700 }}>▲ +8.2%</span>
                </div>
                <SensorChart data={data} color={color} />
              </div>
            ) : null
          )}
        </div>

        {/* 3. Historical Incidents */}
        <div
          style={{
            background: 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(20px)',
            borderRadius: 20,
            border: '1px solid rgba(99,102,241,0.1)',
            boxShadow: '0 4px 24px rgba(99,102,241,0.06)',
            padding: '18px',
            transition: 'transform 0.25s, box-shadow 0.25s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)'
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(99,102,241,0.12)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = ''
            e.currentTarget.style.boxShadow = '0 4px 24px rgba(99,102,241,0.06)'
          }}
        >
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#6366f1', marginBottom: 4 }}>HISTORICAL INTELLIGENCE</p>
          <h4 style={{ fontSize: 14, fontWeight: 800, color: '#1e1b4b', marginBottom: 14, letterSpacing: '-0.02em' }}>Similar Incidents</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {INCIDENTS.map((inc, i) => (
              <div
                key={i}
                style={{
                  padding: '12px 14px',
                  borderRadius: 14,
                  background: 'rgba(99,102,241,0.04)',
                  border: '1px solid rgba(99,102,241,0.1)',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(99,102,241,0.08)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(99,102,241,0.04)')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 900,
                      color: inc.similarity > 90 ? '#ef4444' : inc.similarity > 80 ? '#f97316' : '#6366f1',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {inc.similarity}% match
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#a1a1aa' }}>{inc.year} · {inc.industry}</span>
                </div>
                <p style={{ fontSize: 11, color: '#3f3f46', fontWeight: 500, lineHeight: 1.4, marginBottom: 3 }}>{inc.cause}</p>
                <p style={{ fontSize: 10, color: '#a1a1aa', fontWeight: 500 }}>{inc.location}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Live Notifications */}
        <div
          style={{
            background: 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(20px)',
            borderRadius: 20,
            border: '1px solid rgba(99,102,241,0.1)',
            boxShadow: '0 4px 24px rgba(99,102,241,0.06)',
            padding: '18px',
            transition: 'transform 0.25s, box-shadow 0.25s',
            overflow: 'hidden',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)'
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(99,102,241,0.12)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = ''
            e.currentTarget.style.boxShadow = '0 4px 24px rgba(99,102,241,0.06)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#6366f1', marginBottom: 2 }}>LIVE NOTIFICATIONS</p>
              <h4 style={{ fontSize: 14, fontWeight: 800, color: '#1e1b4b', letterSpacing: '-0.02em' }}>Activity Feed</h4>
            </div>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'pulse-dot 2s ease-in-out infinite', display: 'inline-block' }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: '#22c55e' }}>LIVE</span>
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {NOTIFICATIONS.map((n, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 10,
                  padding: '9px 12px',
                  borderRadius: 12,
                  background: n.type === 'critical' ? 'rgba(239,68,68,0.05)' : n.type === 'elevated' ? 'rgba(251,146,60,0.05)' : 'rgba(0,0,0,0.03)',
                  borderLeft: `3px solid ${n.type === 'critical' ? '#ef4444' : n.type === 'elevated' ? '#f97316' : '#6366f1'}`,
                  animation: `slide-right 0.3s ease ${i * 0.06}s both`,
                }}
              >
                <span style={{ fontSize: 9, fontWeight: 600, color: '#a1a1aa', marginTop: 1, whiteSpace: 'nowrap' }}>{n.time}</span>
                <span style={{ fontSize: 11, fontWeight: 500, color: n.type === 'critical' ? '#b91c1c' : n.type === 'elevated' ? '#c2410c' : '#3730a3', lineHeight: 1.4 }}>
                  {n.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FLOATING REPLAY BUTTON ── */}
      <div
        style={{
          position: 'fixed',
          bottom: 32,
          right: 32,
          zIndex: 100,
        }}
      >
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
            color: 'white',
            border: 'none',
            borderRadius: 20,
            padding: '14px 22px',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 8px 32px rgba(30,27,75,0.35)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            letterSpacing: '-0.01em',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'
            e.currentTarget.style.boxShadow = '0 16px 48px rgba(30,27,75,0.45)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = ''
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(30,27,75,0.35)'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/>
            <path d="M6 5.5l5 2.5-5 2.5V5.5z" fill="white"/>
          </svg>
          Replay Scenario
          <span style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '2px 8px', fontSize: 11 }}>
            10 events
          </span>
        </button>
      </div>
    </div>
  )
}
