import React from "react";
import { PROCESS_FLOW, centerOf } from "../../utils/geometry.js";

/**
 * Base piping (always drawn) + correlation lines. Correlation lines are NOT
 * a fixed pair — they highlight any PROCESS_FLOW edge where BOTH connected
 * zones currently have a non-normal tier, i.e. the twin shows the real
 * cascade path for whatever is actually happening this tick, not a
 * scripted "C to D" line baked in for one scenario.
 */
export default function ProcessPiping({ tiers }) {
  return (
    <>
      {PROCESS_FLOW.map(([from, to], i) => {
        const a = centerOf(from), b = centerOf(to);
        const midY = (a.cy + b.cy) / 2;
        const correlated = tiers?.[from] !== "normal" && tiers?.[to] !== "normal";
        return (
          <g key={i}>
            <path
              d={`M${a.cx},${a.cy} L${a.cx},${midY} L${b.cx},${midY} L${b.cx},${b.cy}`}
              fill="none" stroke="#C7CFDB" strokeWidth="3" markerEnd="url(#flow)"
            />
            {correlated && (
              <path
                d={`M${a.cx},${a.cy} L${a.cx},${midY} L${b.cx},${midY} L${b.cx},${b.cy}`}
                fill="none" stroke="#E11D48" strokeWidth="3" strokeDasharray="1 7" strokeLinecap="round"
                style={{ animation: "dash-flow 0.6s linear infinite" }}
              />
            )}
          </g>
        );
      })}
    </>
  );
}
