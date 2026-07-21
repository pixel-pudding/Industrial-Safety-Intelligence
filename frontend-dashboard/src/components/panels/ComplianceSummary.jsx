import React, { useState } from "react";
import { ClipboardCheck, RefreshCw } from "lucide-react";
import Card from "../common/Card.jsx";
import { useFacility } from "../../hooks/useFacilityState.jsx";

/**
 * Quality & Compliance Audit Agent's output. Deliberately muted/secondary
 * styling — Part II: "kept off the primary safety-critical view... since
 * it's a slower-cadence background function, not a real-time safety
 * concern." Still fully accessible, just not competing for attention with
 * the live risk surfaces.
 */
export default function ComplianceSummary() {
  const { complianceAudits, runComplianceAudit } = useFacility();
  const [running, setRunning] = useState(false);
  const latest = complianceAudits?.[0];

  const trigger = async () => {
    setRunning(true);
    await runComplianceAudit();
    setRunning(false);
  };

  return (
    <Card title="Compliance Audit" icon={ClipboardCheck} muted right={
      <button
        onClick={trigger}
        disabled={running}
        style={{
          display: "flex", alignItems: "center", gap: 4, fontSize: "var(--text-2xs)", fontWeight: 700,
          padding: "4px 9px", borderRadius: 999, border: "1px solid var(--border-strong)", background: "var(--bg-card)",
          color: "var(--ink-sub)", flexShrink: 0,
        }}
      >
        <RefreshCw size={10} className={running ? "pulse" : ""} /> {running ? "Running…" : "Run Audit"}
      </button>
    }>
      {!latest ? (
        <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-sub)" }}>
          No audit run yet — scheduled or manually triggered, per Part II (not continuous).
        </div>
      ) : (
        <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-sub)", lineHeight: 1.5 }}>
          <div style={{ fontWeight: 700, color: latest.gap_count > 0 ? "var(--tier-warning)" : "var(--tier-normal)", fontSize: "var(--text-sm)" }}>
            {latest.gap_count} gap{latest.gap_count === 1 ? "" : "s"} found
          </div>
          <div style={{ marginTop: 3 }}>{latest.summary}</div>
          <div style={{ marginTop: 4, fontSize: "var(--text-2xs)", color: "var(--ink-faint)" }}>
            Last run: {new Date(latest.run_at).toLocaleTimeString("en-IN", { hour12: false })} ({latest.triggered_by})
          </div>
        </div>
      )}
    </Card>
  );
}
