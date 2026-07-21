import React from "react";
import { ClipboardList } from "lucide-react";
import Card from "../common/Card.jsx";
import Pill from "../common/Pill.jsx";
import { useFacility } from "../../hooks/useFacilityState.jsx";

// Digital Permit Intelligence's own tier vocabulary (approve/flag/block_recommend)
// isn't the same as the sensor risk tier system, but maps cleanly onto the
// same visual language: flag -> warning treatment, block_recommend -> critical.
const FLAG_TIER = { flag: "warning", block_recommend: "critical" };
const FLAG_LABEL = { flag: "Flagged", block_recommend: "Block Recommended" };

/**
 * Digital Permit Intelligence Agent's actual output — not just the sidebar
 * badge count. Every row here is a live permit currently flagged or
 * recommended for block, with the agent's own stated reason(s).
 */
export default function PermitFlags() {
  const { permitFlags, setSelectedZone } = useFacility();

  return (
    <Card title="Permit Intelligence" icon={ClipboardList} right={permitFlags.length > 0 && (
      <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--accent)" }}>{permitFlags.length} active</span>
    )}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", marginTop: 4, maxHeight: 200, overflowY: "auto", minWidth: 0 }}>
        {permitFlags.length === 0 && (
          <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-sub)", padding: 4 }}>
            No permits currently flagged — all active permits check out clean.
          </div>
        )}
        {permitFlags.map((f) => (
          <button
            key={f.permit_id}
            onClick={() => setSelectedZone(f.zone_id)}
            className="panel-shift"
            style={{
              display: "flex", flexDirection: "column", gap: 4, padding: "var(--space-2) var(--space-3)",
              borderRadius: "var(--radius-sm)", background: "var(--bg-card-sunken)", border: "1px solid var(--border-soft)",
              textAlign: "left", cursor: "pointer", minWidth: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, minWidth: 0 }}>
              <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {f.permit_type_id.replace(/_/g, " ")} · Zone {f.zone_id}
              </span>
              <Pill tier={FLAG_TIER[f.flag]} label={FLAG_LABEL[f.flag]} size="sm" />
            </div>
            {f.reasons?.[0] && (
              <div style={{ fontSize: "var(--text-2xs)", color: "var(--ink-sub)", lineHeight: 1.4 }}>{f.reasons[0]}</div>
            )}
          </button>
        ))}
      </div>
    </Card>
  );
}
