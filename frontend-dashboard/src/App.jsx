import React from "react";
import { FacilityProvider } from "./hooks/useFacilityState.jsx";
import Sidebar from "./components/layout/Sidebar.jsx";
import Header from "./components/layout/Header.jsx";
import FactoryOverview from "./components/panels/FactoryOverview.jsx";
import Notifications from "./components/panels/Notifications.jsx";
import PermitFlags from "./components/panels/PermitFlags.jsx";
import ComplianceSummary from "./components/panels/ComplianceSummary.jsx";
import RiskPanel from "./components/panels/RiskPanel.jsx";
import ReasoningFlow from "./components/panels/ReasoningFlow.jsx";
import Interventions from "./components/panels/Interventions.jsx";
import SafetyCopilot from "./components/panels/SafetyCopilot.jsx";
import IncidentTimeline from "./components/timeline/IncidentTimeline.jsx";
import DigitalTwin from "./components/digital-twin/DigitalTwin.jsx";

function Dashboard() {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <div style={{ flex: "1 1 auto", minWidth: 0, display: "flex", flexDirection: "column" }}>
        <Header />
        <div
          style={{
            display: "grid",
            // Center column intentionally dominant (the Digital Twin is the
            // product's centerpiece) — side columns are fixed-but-narrow so
            // they never compete with it for visual weight, at either
            // 1920x1080 or a 1440x900 laptop viewport.
            gridTemplateColumns: "280px minmax(0, 1fr) 300px",
            gap: "var(--space-5)",
            padding: "var(--space-5) var(--space-6) 32px",
            alignItems: "start",
            minWidth: 0,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)", minWidth: 0 }}>
            <FactoryOverview />
            <Notifications />
            <PermitFlags />
            <ComplianceSummary />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)", minWidth: 0 }}>
            <DigitalTwin />
            <IncidentTimeline />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)", minWidth: 0 }}>
            <RiskPanel />
            <ReasoningFlow />
            <Interventions />
            <SafetyCopilot />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <FacilityProvider>
      <Dashboard />
    </FacilityProvider>
  );
}
