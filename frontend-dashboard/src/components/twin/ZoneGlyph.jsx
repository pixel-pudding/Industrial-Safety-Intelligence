import React from "react";

const STROKE = "#AEB8C4";

/** Small top-down equipment icon per zone type — keeps the twin visually distinct per zone without needing full 3D models. */
export default function ZoneGlyph({ id, s, tier }) {
  const cx = s.x + s.w / 2, cy = s.y + s.h / 2;

  switch (id) {
    case "A":
      return (
        <g>
          <circle cx={cx} cy={s.y + 44} r="22" fill="none" stroke={STROKE} strokeWidth="2" />
          <circle cx={cx} cy={s.y + 44} r="4" fill={STROKE} />
          {[0, 90, 180, 270].map((deg) => (
            <line
              key={deg}
              x1={cx + 22 * Math.cos((deg * Math.PI) / 180)} y1={s.y + 44 + 22 * Math.sin((deg * Math.PI) / 180)}
              x2={cx + 28 * Math.cos((deg * Math.PI) / 180)} y2={s.y + 44 + 28 * Math.sin((deg * Math.PI) / 180)}
              stroke={STROKE} strokeWidth="2"
            />
          ))}
        </g>
      );
    case "C":
      return (
        <>
          {[-38, 0, 38].map((dx, i) => (
            <circle key={i} cx={cx + dx} cy={s.y + s.h - 30} r="17" fill="none" stroke={STROKE} strokeWidth="2" />
          ))}
        </>
      );
    case "B":
      return (
        <>
          {[0, 1, 2].flatMap((col) => [0, 1].map((row) => (
            <rect key={`${col}-${row}`} x={s.x + 16 + col * 30} y={s.y + 34 + row * 22} width="22" height="16" rx="2" fill="none" stroke={STROKE} strokeWidth="1.5" />
          )))}
        </>
      );
    case "F":
      return (
        <>
          <path d={`M${s.x + 20},${s.y + 54} L${s.x + 28},${s.y + 26} L${s.x + 44},${s.y + 26} L${s.x + 52},${s.y + 54} Z`} fill="none" stroke={STROKE} strokeWidth="2" />
          <rect x={s.x + 66} y={s.y + 30} width="24" height="26" rx="3" fill="none" stroke={STROKE} strokeWidth="2" />
          <line x1={s.x + 72} y1={s.y + 30} x2={s.x + 72} y2={s.y + 22} stroke={STROKE} strokeWidth="2" />
          <line x1={s.x + 84} y1={s.y + 30} x2={s.x + 84} y2={s.y + 22} stroke={STROKE} strokeWidth="2" />
        </>
      );
    case "D":
      return (
        <>
          {[0, 1, 2, 3].map((i) => (
            <line key={i} x1={s.x + 18} y1={s.y + 30 + i * 8} x2={s.x + s.w - 18} y2={s.y + 30 + i * 8} stroke={STROKE} strokeWidth="1.5" />
          ))}
        </>
      );
    case "K":
      return (
        <>
          <line x1={cx} y1={s.y + s.h - 8} x2={cx} y2={s.y + 14} stroke={STROKE} strokeWidth="2.5" />
          {tier === "warning" || tier === "critical" ? (
            <path d={`M${cx - 6},${s.y + 14} q6,-12 0,-19 q-6,7 0,19 q6,-7 0,-14 q-7,9 0,14`} fill="#F59E0B" opacity="0.85" />
          ) : (
            <circle cx={cx} cy={s.y + 12} r="4" fill="none" stroke={STROKE} strokeWidth="2" />
          )}
        </>
      );
    case "H":
      return (
        <g transform={`translate(${cx},${s.y + 40})`}>
          <rect x="-16" y="-4" width="32" height="18" rx="3" fill="none" stroke={STROKE} strokeWidth="2" />
          <line x1="-16" y1="4" x2="16" y2="4" stroke={STROKE} strokeWidth="1.5" />
        </g>
      );
    case "I":
      return (
        <g transform={`translate(${cx},${s.y + 40})`}>
          <rect x="-18" y="-11" width="36" height="22" rx="2" fill="none" stroke={STROKE} strokeWidth="2" />
          <line x1="-12" y1="-5" x2="4" y2="-5" stroke={STROKE} strokeWidth="1.3" />
          <line x1="-12" y1="1" x2="10" y2="1" stroke={STROKE} strokeWidth="1.3" />
        </g>
      );
    case "G":
      return (
        <g transform={`translate(${cx},${s.y + s.h / 2 + 4})`}>
          <rect x="-20" y="-8" width="30" height="16" rx="2" fill="none" stroke={STROKE} strokeWidth="2" />
          <rect x="10" y="-10" width="12" height="10" rx="1.5" fill="none" stroke={STROKE} strokeWidth="2" />
          <circle cx="-13" cy="9" r="3" fill="none" stroke={STROKE} strokeWidth="1.5" />
          <circle cx="10" cy="9" r="3" fill="none" stroke={STROKE} strokeWidth="1.5" />
        </g>
      );
    default:
      return null;
  }
}
