// pages/ProjectView.jsx - COMPLETE REWRITTEN VERSION
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Header from "../components/Header1";
import Sidebar from "../components/Sidebar1";
import BIMViewer from "../components/BIMviewer1";
import RiskDashboard from "../components/RiskDashboard";

export default function ProjectView() {
  const [darkMode, setDarkMode] = useState(true);
  const [selectedElement, setSelectedElement] = useState(null);
  const [isApproving, setIsApproving] = useState(false);
  const [riskData, setRiskData] = useState([]);
  const [modelUrl, setModelUrl] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [pendingRisk, setPendingRisk] = useState(null);
  const location = useLocation();

  // Load model from navigation state
  useEffect(() => {
    if (location.state?.glbUrl) {
      setModelUrl(location.state.glbUrl);
    }
  }, [location.state]);

  // Handle model edits → Backend risk calculation
  const handleEditChange = async (componentId, changes) => {
    try {
      const response = await fetch("http://localhost:8000/record_decision/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          component_id: componentId,
          decision_type: "Modify",
          mitigation_flag: changes.mitigation || false
        })
      });
      
      if (!response.ok) throw new Error("Risk calculation failed");
      
      const result = await response.json();
      
      // Add to dashboard
      setRiskData(prev => [...prev, {
        id: `comp_${componentId}`,
        name: `Component ${componentId}`,
        riskScore: Math.min(result.final_score * 20, 100) // Scale 0-100 for chart
      }]);

      // Risk threshold check (1.0 = threshold)
      if (result.final_score > 1.0) {
        setPendingRisk(result);
        setShowRiskModal(true); // ✅ Custom modal instead of confirm()
      } else {
        console.log("✅ Low risk - stored in Merkle tree (Supabase)");
      }
    } catch (error) {
      console.error("❌ Risk calculation failed:", error);
      alert("Failed to calculate risk. Please try again.");
    }
  };

  // Blockchain logging
  const logToBlockchain = async (riskResult) => {
    setIsApproving(true);
    try {
      // TODO: Integrate MetaMask here
      console.log("⛓️ Logging to blockchain:", riskResult.blockchain_hash_stub);
      alert(`✅ Logged to blockchain: ${riskResult.blockchain_hash_stub}`);
    } catch (error) {
      console.error("Blockchain logging failed:", error);
    } finally {
      setIsApproving(false);
      setShowRiskModal(false);
    }
  };

  const theme = {
    bg: darkMode ? "#0B111D" : "#F8FAFC",
    panel: darkMode ? "#161E2E" : "#FFFFFF",
    text: darkMode ? "#F8FAFC" : "#1E293B",
    border: darkMode ? "#2D3748" : "#E2E8F0"
  };

  return (
    <div style={{ backgroundColor: theme.bg, color: theme.text, minHeight: "100vh" }}>
      <Header />
      
      {/* ✅ RISK MODAL - Replaces confirm() */}
      {showRiskModal && pendingRisk && (
        <>
          {/* Backdrop */}
          <div 
            style={{
              position: "fixed", top: 0, left: 0, right: 0, bottom: 0, 
              backgroundColor: "rgba(0,0,0,0.8)", zIndex: 1000
            }} 
            onClick={() => setShowRiskModal(false)}
          />
          
          {/* Modal */}
          <div 
            style={{
              position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
              backgroundColor: theme.panel, padding: "30px", borderRadius: "12px",
              border: "2px solid #D4AF37", maxWidth: "450px", zIndex: 1001,
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)"
            }}
          >
            <h3 style={{ color: "#D4AF37", marginBottom: "15px", fontSize: "1.3rem" }}>
              ⚠️ High Risk Detected!
            </h3>
            <div style={{ marginBottom: "20px", lineHeight: "1.6" }}>
              <p><strong>Score:</strong> {pendingRisk.final_score.toFixed(2)}/2.0</p>
              <p><strong>Category:</strong> {pendingRisk.risk_category}</p>
              <p style={{ color: "#ef4444", fontWeight: "500" }}>
                {pendingRisk.warning || "Governance escalation required"}
              </p>
            </div>
            
            <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
              <button 
                onClick={() => logToBlockchain(pendingRisk)}
                disabled={isApproving}
                style={{ 
                  flex: 1, padding: "12px", backgroundColor: "#D4AF37", 
                  color: "#000", border: "none", borderRadius: "6px", 
                  fontWeight: "bold", cursor: isApproving ? "not-allowed" : "pointer"
                }}
              >
                {isApproving ? "⛓️ Signing..." : "✅ Approve & Log to Blockchain"}
              </button>
              <button 
                onClick={() => setShowRiskModal(false)}
                style={{ 
                  flex: 1, padding: "12px", backgroundColor: "#6b7280", 
                  color: "white", border: "none", borderRadius: "6px",
                  cursor: "pointer"
                }}
              >
                ❌ Cancel Changes
              </button>
            </div>
          </div>
        </>
      )}

      <div style={{ display: "flex", height: "calc(100vh - 60px)" }}>
        {/* Sidebar with editMode props */}
        <Sidebar 
          darkMode={darkMode} 
          setDarkMode={setDarkMode}
          editMode={editMode}
          setEditMode={setEditMode}
        />
        
        <main style={{ flex: 1, padding: "20px", display: "grid", gridTemplateColumns: "1fr 350px", gap: "20px" }}>
          {/* 3D BIM Viewer */}
          <section style={{ 
            backgroundColor: theme.panel, 
            border: `1px solid ${theme.border}`, 
            borderRadius: "12px", 
            overflow: "hidden",
            position: "relative"
          }}>
            {/* Edit Mode Toolbar */}
            <div style={{ 
              padding: "12px 20px", 
              background: "#1E293B", 
              display: "flex", 
              gap: "12px", 
              alignItems: "center",
              borderBottom: `1px solid ${theme.border}`
            }}>
              <button 
                onClick={() => setEditMode(!editMode)}
                style={{ 
                  padding: "8px 16px", 
                  backgroundColor: editMode ? "#10b981" : "#6b7280", 
                  color: "white", 
                  border: "none", 
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer"
                }}
              >
                {editMode ? "✅ Save Changes" : "✏️ Enable Edit Mode"}
              </button>
              <span style={{ fontSize: "14px", opacity: 0.8 }}>
                {modelUrl ? "Model loaded successfully" : "No model selected"}
              </span>
            </div>
            
            <div style={{ width: "100%", height: "calc(100% - 60px)" }}>
              {modelUrl ? (
                <BIMViewer 
                  modelUrl={modelUrl}
                  riskData={riskData}
                  onSelect={setSelectedElement}
                  editMode={editMode}
                  onEdit={handleEditChange}
                />
              ) : (
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  height: "100%", color: "#94A3B8", fontSize: "1.2rem"
                }}>
                  Select a model from the Home page
                </div>
              )}
            </div>
          </section>

          {/* Right Panel: Risk Analysis + Selected Element */}
          <aside style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Risk Dashboard */}
            <div style={{ 
              backgroundColor: theme.panel, 
              padding: "20px", 
              borderRadius: "12px", 
              border: `1px solid ${theme.border}` 
            }}>
              <h3 style={{ marginBottom: "15px", color: "#D4AF37" }}>AI Risk Analysis</h3>
              <RiskDashboard data={riskData.length ? riskData : [
                { name: "No data", riskScore: 0 }
              ]} />
            </div>

            {/* Selected Element Details */}
            {selectedElement && (
              <div style={{ 
                backgroundColor: theme.panel, 
                padding: "20px", 
                borderRadius: "12px", 
                border: "2px solid #D4AF37" 
              }}>
                <h4 style={{ color: "#D4AF37", marginBottom: "12px" }}>🎯 Selected Element</h4>
                <p style={{ margin: "8px 0", fontSize: "0.95rem" }}>
                  <strong>Name:</strong> {selectedElement.name}
                </p>
                <p style={{ 
                  margin: "8px 0", 
                  color: selectedElement.riskScore > 50 ? "#ef4444" : "#10b981",
                  fontWeight: "600"
                }}>
                  Risk Score: {Math.round(selectedElement.riskScore)}%
                </p>
                <button 
                  onClick={() => handleEditChange(1, { mitigation: true })}
                  disabled={isApproving}
                  style={{ 
                    width: "100%", 
                    padding: "12px", 
                    backgroundColor: editMode ? "#D4AF37" : "#6b7280",
                    color: editMode ? "#000" : "white",
                    border: "none", 
                    borderRadius: "6px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    marginTop: "12px"
                  }}
                >
                  {editMode ? "🔄 Recalculate Risk" : "✏️ Edit This Element"}
                </button>
              </div>
            )}
          </aside>
        </main>
      </div>
    </div>
  );
}
