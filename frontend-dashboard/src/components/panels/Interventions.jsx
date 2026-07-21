import React from "react";
import { CheckCircle2, Clock, Circle } from "lucide-react";
import Card from "../common/Card.jsx";
import { useFacility } from "../../hooks/useFacilityState.js";

const STATUS_ICON = {
  done: { Icon: CheckCircle2, color: "var(--tier-normal)" },
  progress: { Icon: Clock, color: "var(--tier-warning)" },
  pending: { Icon: Circle, color: "#C4C9D2" },
};

export default function Interventions() {
  const { interventions } = useFacility();

  return (
    <Card title="Recommended Interventions" icon={CheckCircle2}>
      <div className="panel-shift" style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
        {interventions.map((iv, i) => {
          const { Icon, color } = STATUS_ICON[iv.status];
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, padding: "4px 0" }}>
              <Icon size={14} style={{ color, flexShrink: 0 }} />
              <span style={{ flex: 1, color: iv.status === "pending" ? "var(--ink-sub)" : "var(--ink)" }}>{iv.text}</span>
              <span style={{ fontSize: 9, color: "var(--ink-sub)" }}>{iv.owner}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
