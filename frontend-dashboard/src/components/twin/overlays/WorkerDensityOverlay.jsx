import React from "react";
import { centerOf } from "../../../utils/geometry.js";
import { WORKER_DENSITY } from "../../../utils/overlayData.js";

/**
 * Renders a small cluster of dots per zone, sized by worker count, each with
 * a gentle CSS drift (see .worker-drift) to feel "alive" without any real
 * movement simulation or pathfinding.
 */
export default function WorkerDensityOverlay() {
  return (
    <g className="overlay-fade">
      {Object.entries(WORKER_DENSITY).map(([id, count]) => {
        if (count === 0) return null;
        const { cx, cy } = centerOf(id);
        const dots = Array.from({ length: Math.min(count, 6) });
        return (
          <g key={id}>
            {dots.map((_, i) => {
              const angle = (i / dots.length) * Math.PI * 2;
              const r = 14 + (i % 2) * 6;
              return (
                <circle
                  key={i}
                  className="worker-drift"
                  cx={cx + r * Math.cos(angle)}
                  cy={cy + r * Math.sin(angle)}
                  r="3"
                  fill="#4F46E5"
                  opacity="0.85"
                  style={{ animationDelay: `${i * 0.3}s` }}
                />
              );
            })}
          </g>
        );
      })}
    </g>
  );
}
