import { useState, useEffect } from "react";
import Header from "../components/Header1";
import Sidebar from "../components/Sidebar1";
import BIMViewer from "../components/BIMviewer1";
import RiskDashboard from "../components/RiskDashboard";

export default function ProjectView() {
  const [darkMode, setDarkMode] = useState(true);
  const [selectedElement, setSelectedElement] = useState(null);
  const [isApproving, setIsApproving] = useState(false);

  // Example data coming from your XGBoost backend
  const riskData = [
    { id: "wall_1", name: "Structural Wall A", riskScore: 85, recommendation: "Reinforce Base" },
    { id: "beam_2", name: "Support Beam B", riskScore: 12, recommendation: "Optimal" }
  ];

  const theme = {
    bg: darkMode ? "#0B111D" : "#F8FAFC",
    panel: darkMode ? "#161E2E" : "#FFFFFF",
    text: darkMode ? "#F8FAFC" : "#1E293B",
    border: darkMode ? "#2D3748" : "#E2E8F0"
  };

  return (
    <div style={{ backgroundColor: theme.bg, color: theme.text, minHeight: "100vh" }}>
      <Header />
      <div style={{ display: "flex", height: "calc(100vh - 60px)" }}>
        <Sidebar darkMode={darkMode} setDarkMode={setDarkMode} />
        
        <main style={{ flex: 1, padding: "20px", display: "grid", gridTemplateColumns: "1fr 350px", gap: "20px" }}>
          
          {/* Left Column: 3D View */}
          <section style={{ backgroundColor: theme.panel, border: `1px solid ${theme.border}`, borderRadius: "12px", overflow: "hidden" }}>
            <BIMViewer riskData={riskData} onSelect={setSelectedElement} />
          </section>

          {/* Right Column: AI & Blockchain Actions */}
          <aside style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ backgroundColor: theme.panel, padding: "20px", borderRadius: "12px", border: `1px solid ${theme.border}` }}>
              <h3>AI Risk Analysis</h3>
              <RiskDashboard data={riskData} />
            </div>

            {selectedElement && (
              <div style={{ backgroundColor: theme.panel, padding: "20px", borderRadius: "12px", border: "#D4AF37 2px solid" }}>
                <h4>Approvals (Blockchain)</h4>
                <p>Element: {selectedElement.name}</p>
                <p style={{ color: selectedElement.riskScore > 50 ? "#ef4444" : "#10b981" }}>
                  XGBoost Score: {selectedElement.riskScore}%
                </p>
                <button 
                  onClick={() => alert("Triggering MetaMask Signature...")}
                  style={{ backgroundColor: "#D4AF37", width: "100%", padding: "10px", fontWeight: "bold", cursor: "pointer" }}
                >
                  Log Approval to Chain
                </button>
              </div>
            )}
          </aside>
        </main>
      </div>
    </div>
  );
}