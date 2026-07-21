import React, { useEffect, useRef, useState } from "react";
import { MessageSquare, Send, Sparkles } from "lucide-react";
import Card from "../common/Card.jsx";
import { useFacility } from "../../hooks/useFacilityState.jsx";
import { COPILOT_SUGGESTIONS } from "../../services/copilotService.js";

/**
 * Height is intentionally NOT fixed to a hardcoded px value (an earlier
 * version was — Card's own bottom padding plus a mismatched fixed inner
 * height silently clipped the input box once suggestion chips wrapped to a
 * second line, caught during Track 4 visual QA). Only the message log is
 * height-bounded (with its own scroll); everything else sizes to content,
 * so the card's total height adapts instead of clipping.
 */
export default function SafetyCopilot() {
  const { chatLog, sendChat, selectedZone } = useFacility();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chatLog]);

  const submit = async (text) => {
    if (!text.trim() || sending) return;
    setInput("");
    setSending(true);
    await sendChat(text);
    setSending(false);
  };

  return (
    <Card title="Safety Copilot" icon={MessageSquare} pad={false}>
      <div style={{ display: "flex", flexDirection: "column", padding: "0 var(--space-5) var(--space-4)", minWidth: 0 }}>
        <div style={{ fontSize: "var(--text-2xs)", color: "var(--ink-sub)", marginBottom: 6 }}>
          Context: Zone {selectedZone}
        </div>

        <div
          ref={scrollRef}
          style={{
            display: "flex", flexDirection: "column", gap: 8, minWidth: 0,
            minHeight: 130, maxHeight: 230, overflowY: "auto", paddingRight: 2,
          }}
        >
          {chatLog.map((m, i) => (
            <div
              key={i}
              className="panel-shift"
              style={{
                fontSize: "var(--text-xs)", padding: "9px 13px", borderRadius: 13, maxWidth: "88%", lineHeight: 1.45,
                whiteSpace: "pre-line", wordBreak: "break-word",
                alignSelf: m.from === "ai" ? "flex-start" : "flex-end",
                background: m.from === "ai" ? "var(--bg-card-sunken)" : "var(--accent-soft)",
                color: m.from === "ai" ? "#374151" : "var(--accent)",
              }}
            >
              {m.text}
            </div>
          ))}
          {sending && (
            <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-sub)", display: "flex", alignItems: "center", gap: 5, alignSelf: "flex-start" }}>
              <Sparkles size={12} className="pulse" /> Thinking…
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, padding: "8px 0 6px", minWidth: 0 }}>
          {COPILOT_SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => submit(s)}
              style={{ fontSize: "var(--text-2xs)", padding: "4px 9px", borderRadius: 999, background: "var(--bg-card-sunken)", color: "var(--ink-sub)", border: "1px solid var(--border-soft)", flexShrink: 0 }}
            >
              {s}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit(input)}
            placeholder="Ask anything about safety…"
            style={{ flex: "1 1 auto", minWidth: 0, fontSize: "var(--text-xs)", padding: "9px 13px", borderRadius: 12, background: "var(--bg-card-sunken)", border: "1px solid var(--border-soft)", outline: "none", color: "var(--ink)" }}
          />
          <button
            onClick={() => submit(input)}
            disabled={sending}
            style={{
              width: 34, height: 34, borderRadius: 12, border: "none", display: "flex", alignItems: "center", justifyContent: "center",
              backgroundImage: "var(--accent-grad)", boxShadow: "var(--shadow-accent)", flexShrink: 0, opacity: sending ? 0.6 : 1,
            }}
          >
            <Send size={14} color="#fff" />
          </button>
        </div>
      </div>
    </Card>
  );
}
