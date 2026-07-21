import React from "react";
import { centerOf } from "../../../utils/geometry.js";

/**
 * Cluster of dots per zone, count from the live heatmap's worker_count
 * (real WorkerLocation data, Geospatial Safety Heatmap agent) — a gentle
 * CSS drift (.worker-drift) makes it feel alive, no movement simulation.
 */
export default function WorkerDensityOverlay({ heatmap }) {
  if (!heatmap) return null;
  return (
    <g className="overlay-fade">
      {heatmap.zones.map((z) => {
        if (!z.worker_count) return null;
        const { cx, cy } = centerOf(z.zone_id);
        const dots = Array.from({ length: Math.min(z.worker_count, 8) });
        return (
          <g key={z.zone_id}>
            {dots.map((_, i) => {
              const angle = (i / dots.length) * Math.PI * 2;
              const r = 16 + (i % 2) * 7;
              return (
                <circle
                  key={i} className="worker-drift"
                  cx={cx + r * Math.cos(angle)} cy={cy + r * Math.sin(angle)} r="3.2"
                  fill="#4F46E5" opacity="0.85" style={{ animationDelay: `${i * 0.25}s` }}
                />
              );
            })}
            {z.worker_count > 8 && (
              <text x={cx} y={cy + 32} textAnchor="middle" fontSize="8" fontWeight="700" fill="#4F46E5">+{z.worker_count - 8}</text>
            )}
          </g>
        );
      })}
    </g>
  );
}
