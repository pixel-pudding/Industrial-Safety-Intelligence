import React from "react";

const STROKE = "#AEB8C4";
const STROKE_ACTIVE = "#8A93A6";

/** Small top-down equipment icon per zone type — keeps the twin visually distinct per zone without needing full 3D models. */
export default function ZoneGlyph({ id, s, tier }) {
  const cx = s.x + s.w / 2, cy = s.y + s.h / 2;
  const stroke = tier === "normal" ? STROKE : STROKE_ACTIVE;

  switch (id) {
    case "A": // Reactor Block — vessel with agitator cross
      return (
        <g>
          <circle cx={cx} cy={cy - 4} r="22" fill="none" stroke={stroke} strokeWidth="2" />
          <circle cx={cx} cy={cy - 4} r="4" fill={stroke} />
          {[0, 90, 180, 270].map((deg) => (
            <line
              key={deg}
              x1={cx + 22 * Math.cos((deg * Math.PI) / 180)} y1={cy - 4 + 22 * Math.sin((deg * Math.PI) / 180)}
              x2={cx + 28 * Math.cos((deg * Math.PI) / 180)} y2={cy - 4 + 28 * Math.sin((deg * Math.PI) / 180)}
              stroke={stroke} strokeWidth="2"
            />
          ))}
        </g>
      );

    case "B": // Chlor-Alkali — electrolysis cell grid
      return (
        <g transform={`translate(${cx - 45},${cy - 22})`}>
          {[0, 1, 2].flatMap((col) => [0, 1].map((row) => (
            <rect key={`${col}-${row}`} x={col * 32} y={row * 24} width="24" height="18" rx="2" fill="none" stroke={stroke} strokeWidth="1.5" />
          )))}
        </g>
      );

    case "C": // Tank Farm — three storage tanks
      return (
        <>
          {[-90, 0, 90].map((dx, i) => (
            <g key={i}>
              <circle cx={cx + dx} cy={cy} r="24" fill="none" stroke={stroke} strokeWidth="2" />
              <circle cx={cx + dx} cy={cy} r="16" fill="none" stroke={stroke} strokeWidth="1" opacity="0.5" />
            </g>
          ))}
        </>
      );

    case "D": // Blending & Packaging — conveyor lines
      return (
        <g>
          {[0, 1, 2, 3].map((i) => (
            <line key={i} x1={s.x + 20} y1={cy - 18 + i * 12} x2={s.x + s.w - 20} y2={cy - 18 + i * 12} stroke={stroke} strokeWidth="1.5" />
          ))}
        </g>
      );

    case "E": // Surfactant/Resin — dryer drum
      return (
        <g transform={`translate(${cx},${cy})`}>
          <rect x="-24" y="-16" width="48" height="32" rx="16" fill="none" stroke={stroke} strokeWidth="2" />
          <circle cx="0" cy="0" r="7" fill="none" stroke={stroke} strokeWidth="1.5" />
        </g>
      );

    case "F": // Utilities — cooling tower + boiler
      return (
        <g transform={`translate(${cx - 40},${cy - 20})`}>
          <path d="M0,40 L10,8 L30,8 L40,40 Z" fill="none" stroke={stroke} strokeWidth="2" />
          <rect x="52" y="14" width="26" height="28" rx="3" fill="none" stroke={stroke} strokeWidth="2" />
          <line x1="59" y1="14" x2="59" y2="4" stroke={stroke} strokeWidth="2" />
          <line x1="71" y1="14" x2="71" y2="4" stroke={stroke} strokeWidth="2" />
        </g>
      );

    case "G": // Loading Bay — tanker + arm
      return (
        <g transform={`translate(${cx - 30},${cy - 12})`}>
          <rect x="-20" y="-6" width="34" height="18" rx="3" fill="none" stroke={stroke} strokeWidth="2" />
          <rect x="18" y="-10" width="14" height="12" rx="1.5" fill="none" stroke={stroke} strokeWidth="2" />
          <circle cx="-12" cy="14" r="3.5" fill="none" stroke={stroke} strokeWidth="1.5" />
          <circle cx="12" cy="14" r="3.5" fill="none" stroke={stroke} strokeWidth="1.5" />
        </g>
      );

    case "H": // Maintenance Workshop — wrench box
      return (
        <g transform={`translate(${cx},${cy})`}>
          <rect x="-18" y="-13" width="36" height="26" rx="3" fill="none" stroke={stroke} strokeWidth="2" />
          <path d="M-8,-3 l4,-4 a5,5 0 1 1 5,5 l-4,4 z" fill="none" stroke={stroke} strokeWidth="1.4" />
        </g>
      );

    case "I": // Control Room — monitor
      return (
        <g transform={`translate(${cx},${cy})`}>
          <rect x="-20" y="-13" width="40" height="24" rx="2" fill="none" stroke={stroke} strokeWidth="2" />
          <line x1="-13" y1="-6" x2="3" y2="-6" stroke={stroke} strokeWidth="1.3" />
          <line x1="-13" y1="0" x2="11" y2="0" stroke={stroke} strokeWidth="1.3" />
          <line x1="-13" y1="6" x2="7" y2="6" stroke={stroke} strokeWidth="1.3" />
        </g>
      );

    case "J": // Main Gate — barrier
      return (
        <g transform={`translate(${cx},${cy})`}>
          <rect x="-22" y="-3" width="44" height="6" rx="3" fill="none" stroke={stroke} strokeWidth="2" />
          <circle cx="-22" cy="0" r="4" fill={stroke} />
          <circle cx="22" cy="0" r="4" fill="none" stroke={stroke} strokeWidth="1.5" />
        </g>
      );

    case "K": // Flare Stack — stack with flame if elevated
      return (
        <g>
          <line x1={cx} y1={cy + 22} x2={cx} y2={cy - 20} stroke={stroke} strokeWidth="2.5" />
          {tier === "warning" || tier === "critical" ? (
            <path d={`M${cx - 6},${cy - 20} q6,-13 0,-20 q-6,7 0,20 q6,-7 0,-15 q-7,10 0,15`} fill="#F59E0B" opacity="0.9" />
          ) : (
            <circle cx={cx} cy={cy - 22} r="4" fill="none" stroke={stroke} strokeWidth="2" />
          )}
        </g>
      );

    default:
      return null;
  }
}
