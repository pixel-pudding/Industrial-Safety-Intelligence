import React, { useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import Card from "../common/Card.jsx";
import { useFacility } from "../../hooks/useFacilityState.js";
import { COPILOT_SUGGESTIONS } from "../../services/copilotService.js";

export default function SafetyCopilot() {
  const { chatLog, sendChat, selectedZone } = useFacility();
  const [input, setInput] = useState("");

  const submit = (text) => {
    if (!text.trim()) return;
    sendChat(text);
    setInput("");
  };

  return (
    <Card title="Safety Copilot" icon={MessageSquare} className="h-72" pad={false}>
      <div style={{ display: "flex", flexDirection: "column", height: 280, padding: "0 20px 16px" }}>
        <div style={{ fontSize: 9, color: "var(--ink-sub)", marginBottom: 6 }}>
          Context: Zone {selectedZone}
        </div>
        <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
          {chatLog.map((m, i) => (
            <div
              key={i}
              className="panel-shift"
              style={{
                fontSize: 11, padding: "8px 12px", borderRadius: 12, maxWidth: "88%",
                alignSelf: m.from === "ai" ? "flex-start" : "flex-end",
                background: m.from === "ai" ? "var(--bg-app)" : "var(--accent-soft)",
                color: m.from === "ai" ? "#374151" : "var(--accent)",
              }}
            >
              {m.text}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, padding: "6px 0" }}>
          {COPILOT_SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => submit(s)}
              style={{ fontSize: 9, padding: "4px 8px", borderRadius: 999, background: "var(--bg-app)", color: "var(--ink-sub)", border: "none" }}
            >
              {s}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit(input)}
            placeholder="Ask anything about safety…"
            style={{ flex: 1, fontSize: 11, padding: "8px 12px", borderRadius: 12, background: "var(--bg-app)", border: "none", outline: "none", color: "var(--ink)" }}
          />
          <button
            onClick={() => submit(input)}
            style={{ width: 32, height: 32, borderRadius: 12, border: "none", display: "flex", alignItems: "center", justifyContent: "center", backgroundImage: "var(--accent-grad)" }}
          >
            <Send size={14} color="#fff" />
          </button>
        </div>
      </div>
    </Card>
  );
}
