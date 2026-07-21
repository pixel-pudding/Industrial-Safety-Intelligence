import React from "react";

/**
 * Every panel renders through this component — consistent radius/shadow/
 * spacing is enforced by construction, not convention. `accent` draws a
 * soft gradient border; `glow` adds a colored ambient shadow for critical-
 * state emphasis; `subheader` is a full-width row below the title, for
 * toolbars that need their own line rather than fighting the title for
 * horizontal space (see DigitalTwin.jsx).
 *
 * Overflow discipline (the root cause of the Track 4 toolbar bug): every
 * flex row in this component pairs `minWidth: 0` with `flexWrap: "wrap"`
 * on anything that isn't pinned to a fixed, small size. A child's content
 * NEVER gets to dictate this component's width.
 */
export default function Card({
  title, icon: Icon, children, className = "", right = null, subheader = null,
  pad = true, accent = false, glowColor = null, muted = false,
}) {
  return (
    <div
      className={`panel-shift no-overflow-x ${className}`}
      style={{
        display: "flex",
        flexDirection: "column",
        background: muted ? "var(--bg-card-sunken)" : "var(--bg-card)",
        borderRadius: "var(--radius-lg)",
        boxShadow: glowColor ? `var(--shadow-card), 0 0 0 1px ${glowColor}22, 0 14px 30px -10px ${glowColor}38` : "var(--shadow-card)",
        border: accent ? "1px solid transparent" : "1px solid var(--border-soft)",
        backgroundImage: accent ? "linear-gradient(var(--bg-card), var(--bg-card)), var(--accent-grad)" : "none",
        backgroundOrigin: accent ? "border-box" : undefined,
        backgroundClip: accent ? "padding-box, border-box" : undefined,
        transition: "box-shadow 0.3s ease",
        overflow: "hidden", // belt-and-suspenders: nothing inside can ever visually escape the rounded card
      }}
    >
      {title && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: `var(--space-4) var(--space-5) ${subheader ? "var(--space-3)" : "var(--space-2)"}`,
          gap: "var(--space-3)", minWidth: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", minWidth: 0, flex: "1 1 auto" }}>
            {Icon && (
              <span style={{
                display: "flex", alignItems: "center", justifyContent: "center", width: 26, height: 26,
                borderRadius: "var(--radius-sm)", backgroundImage: "var(--accent-grad-soft)", flexShrink: 0,
              }}>
                <Icon size={14} style={{ color: "var(--accent)" }} />
              </span>
            )}
            <span style={{
              fontSize: "var(--text-xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em",
              color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              minWidth: 0, flex: "1 1 auto",
            }}>
              {title}
            </span>
          </div>
          {right && (
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexShrink: 1, minWidth: 0, justifyContent: "flex-end" }}>
              {right}
            </div>
          )}
        </div>
      )}

      {subheader && (
        <div style={{ padding: "0 var(--space-5) var(--space-3)", minWidth: 0 }}>
          {subheader}
        </div>
      )}

      <div style={{ flex: 1, padding: pad ? "0 var(--space-5) var(--space-5)" : 0, minHeight: 0, minWidth: 0 }}>
        {children}
      </div>
    </div>
  );
}
