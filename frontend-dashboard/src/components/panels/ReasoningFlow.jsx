import React from "react";
import { FileText, ArrowDown } from "lucide-react";
import Card from "../common/Card.jsx";
import { useFacility } from "../../hooks/useFacilityState.js";

export default function ReasoningFlow() {
  const { flowSteps, evidence } = useFacility();

  return (
    <Card title="AI Reasoning Flow" icon={FileText}>
      {flowSteps.length === 0 ? (
        <div style={{ fontSize: 11, color: "var(--ink-sub)", padding: "8px 0" }}>
          Run a scenario to see the AI's reasoning chain build up.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 4 }}>
          {flowSteps.map((f, i) => {
            const isLast = i === flowSteps.length - 1;
            return (
              <React.Fragment key={i}>
                <div
                  className="panel-shift"
                  style={{
                    fontSize: 10.5, fontWeight: 500, textAlign: "center", width: "100%",
                    padding: "6px 12px", borderRadius: 8,
                    background: isLast ? "var(--tier-critical-bg)" : "var(--bg-app)",
                    color: isLast ? "var(--tier-critical)" : "#374151",
                  }}
                >
                  {f}
                </div>
                {!isLast && <ArrowDown size={13} style={{ margin: "4px 0", color: "#C4C9D2" }} />}
              </React.Fragment>
            );
          })}
        </div>
      )}
      {evidence && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border-soft)" }}>
          <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 4, color: "var(--accent)" }}>MATCHED PATTERN</div>
          <div style={{ fontSize: 10.5, color: "#374151" }}>{evidence.matched}</div>
        </div>
      )}
    </Card>
  );
}
