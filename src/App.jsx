import { useState } from "react";
import ExecutiveSummary from "./components/ExecutiveSummary.jsx";
import PhysicalDashboard from "./components/PhysicalDashboard.jsx";
import TMHIDashboard from "./components/TMHIDashboard.jsx";
import UCLADashboard from "./components/UCLADashboard.jsx";
import EnvDashboard from "./components/EnvDashboard.jsx";

const TABS = [
  { id: "executive", label: "Executive Summary", icon: "📊", component: ExecutiveSummary },
  { id: "physical",  label: "กาย (Physical)",    icon: "🏃", component: PhysicalDashboard },
  { id: "mental",    label: "ใจ (TMHI-15)",       icon: "🧠", component: TMHIDashboard },
  { id: "social",    label: "สังคม (UCLA)",        icon: "👥", component: UCLADashboard },
  { id: "environ",   label: "แวดล้อม",             icon: "🌿", component: EnvDashboard },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("executive");
  const ActiveComponent = TABS.find(t => t.id === activeTab)?.component;

  return (
    <div style={{ minHeight: "100vh", background: "#F3F4F6", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{
        background: "linear-gradient(135deg, #1e3a5f 0%, #2563EB 100%)",
        color: "#fff",
        padding: "0 24px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          {/* Title row */}
          <div style={{ padding: "12px 0 0", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 26 }}>🏛️</span>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.2 }}>
                NIDA Well-being Survey Dashboard
              </div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>
                สถาบันบัณฑิตพัฒนบริหารศาสตร์ · ผลสำรวจสุขภาวะบุคลากร
              </div>
            </div>
          </div>

          {/* Tab bar */}
          <nav style={{ display: "flex", gap: 2, marginTop: 10, overflowX: "auto" }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "8px 16px",
                  background: activeTab === tab.id ? "rgba(255,255,255,0.18)" : "transparent",
                  color: "#fff",
                  border: "none",
                  borderBottom: activeTab === tab.id ? "3px solid #FCD34D" : "3px solid transparent",
                  cursor: "pointer",
                  fontSize: 13,
                  fontFamily: "inherit",
                  fontWeight: activeTab === tab.id ? 700 : 400,
                  whiteSpace: "nowrap",
                  borderRadius: "6px 6px 0 0",
                  transition: "all 0.15s",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main style={{ flex: 1, padding: "20px 16px", maxWidth: 1400, margin: "0 auto", width: "100%" }}>
        {ActiveComponent && <ActiveComponent />}
      </main>

      {/* Footer */}
      <footer style={{
        background: "#1F2937",
        color: "#9CA3AF",
        textAlign: "center",
        padding: "10px",
        fontSize: 12,
      }}>
        NIDA Well-being Survey · {new Date().getFullYear()} · ข้อมูลแสดงเป็น Mock Data
      </footer>
    </div>
  );
}
