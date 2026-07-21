import React from "react";
import { PROCESS_FLOW, centerOf } from "../../utils/geometry.js";

export default function ProcessPiping({ activeCorrelation }) {
  return (
    <>
      {PROCESS_FLOW.map(([from, to], i) => {
        const a = centerOf(from), b = centerOf(to);
        const midX = to === "K" || from === "F" ? a.cx : (a.cx + b.cx) / 2;
        return (
          <path
            key={i}
            d={`M${a.cx},${a.cy} L${midX},${a.cy} L${midX},${b.cy} L${b.cx},${b.cy}`}
            fill="none" stroke="#C7CFDB" strokeWidth="3" markerEnd="url(#flow)"
          />
        );
      })}

      {activeCorrelation && (
        <path
          d={`M${centerOf("C").cx},${centerOf("C").cy} L${centerOf("D").cx},${centerOf("C").cy} L${centerOf("D").cx},${centerOf("D").cy} M${centerOf("A").cx},${centerOf("A").cy} L${centerOf("A").cx},${centerOf("K").cy} L${centerOf("K").cx},${centerOf("K").cy}`}
          fill="none" stroke="#DC3B33" strokeWidth="3" strokeDasharray="1 7" strokeLinecap="round"
          style={{ animation: "dash-flow 0.5s linear infinite" }}
        />
      )}
    </>
  );
}
