import React from "react";

/**
 * Every panel in the app renders through this component. Centralizing it
 * means "consistent corner radius / shadow / spacing" is enforced by
 * construction, not by convention — nobody can accidentally ship a panel
 * with a different radius.
 */
export default function Card({ title, icon: Icon, children, className = "", right = null, pad = true, accent = false }) {
  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-card)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-card)",
        border: accent ? "1px solid transparent" : "1px solid var(--border-soft)",
        backgroundImage: accent ? "linear-gradient(var(--bg-card), var(--bg-card)), var(--accent-grad)" : "none",
        backgroundOrigin: accent ? "border-box" : undefined,
        backgroundClip: accent ? "padding-box, border-box" : undefined,
      }}
    >
      {title && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {Icon && <Icon size={15} style={{ color: "var(--accent)" }} />}
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.02em", color: "var(--ink)" }}>
              {title}
            </span>
          </div>
          {right}
        </div>
      )}
      <div style={{ flex: 1, padding: pad ? "0 20px 16px" : 0 }}>{children}</div>
    </div>
  );
}
