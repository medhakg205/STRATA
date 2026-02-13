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
  // ProjectView.jsx - useEffect
useEffect(() => {
  console.log("📦 Model state:", location.state); // Debug
  if (location.state?.glbUrl) {
    setModelUrl(location.state.glbUrl);  // Supabase URL
  }
}, [location.state]);

  // ✅ UPDATED: Full edit workflow with GLB + XGBoost + Supabase
  const handleEditChange = async (componentId, changes) => {
    try {
      console.log("🔄 Processing edit:", changes);
      
      const response = await fetch("http://localhost:8000/edit_component/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          component_id: componentId,
          model_url: modelUrl,  // Current loaded GLB
          edit_type: changes.type || "Structural Edit",
          edit_params: {
            span_length: changes.span_length || 12.5,
            cost_impact: changes.cost_impact || 75000,
            delay_days: changes.delay_days || 7,
            mitigation: changes.mitigation || false
          }
        })
      });
      
      if (!response.ok) throw new Error("Risk calculation failed");
      const result = await response.json();
      
      console.log("✅ Edit result:", result);
      
      // Update risk dashboard
      setRiskData(prev => [...prev, {
        id: `edit_${result.decision_id}`,
        name: `${changes.type || 'Component'} Edit #${result.decision_id}`,
        riskScore: Math.min(result.risk_score * 10, 100)  // Scale for chart
      }]);

      // Handle risk threshold
      if (result.threshold_action === "blockchain") {
        setPendingRisk(result);
        setShowRiskModal(true);
      } else {
        // Low risk: Auto-reload updated GLB from Supabase
        if (result.storage_url && result.storage_url !== modelUrl) {
          setModelUrl(result.storage_url);
          console.log("✅ Low risk - Reloaded edited GLB:", result.storage_url);
        }
        console.log("✅ Low risk - Stored in Merkle tree (Supabase)");
      }
      
    } catch (error) {
      console.error("❌ Edit failed:", error);
      alert("Failed to process edit. Check backend logs.");
    }
  };

  // Blockchain approval (placeholder)
  const logToBlockchain = async (riskResult) => {
    setIsApproving(true);
    try {
      // TODO: MetaMask/Ethers integration later
      console.log("⛓️ High risk logged to blockchain:", riskResult);
      setTimeout(() => {
        setIsApproving(false);
        setShowRiskModal(false);
        alert(`✅ Approved & Logged: ${riskResult.blockchain_hash_stub || riskResult.decision_id}`);
      }, 2000);
    } catch (error) {
      console.error("Blockchain logging failed:", error);
      setIsApproving(false);
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
      
      {/* ✅ RISK APPROVAL MODAL */}
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
              <p><strong>Score:</strong> {pendingRisk.risk_score?.toFixed(2)}/10.0</p>
              <p><strong>Category:</strong> {pendingRisk.category}</p>
              <p><strong>Action:</strong> {pendingRisk.threshold_action}</p>
              <p style={{ color: "#ef4444", fontWeight: "500" }}>
                {pendingRisk.warning || "Governance escalation required"}
              </p>
              {pendingRisk.storage_url && (
                <p style={{ fontSize: "0.85rem", color: "#94A3B8" }}>
                  Edited GLB: {pendingRisk.storage_url.slice(-40)}
                </p>
              )}
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
                ❌ Cancel Edit
              </button>
            </div>
          </div>
        </>
      )}

      <div style={{ display: "flex", height: "calc(100vh - 60px)" }}>
        {/* Sidebar */}
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
                {modelUrl ? `Model: ${modelUrl.split('/').pop() || 'Loaded'}` : "No model selected"}
              </span>
              {editMode && <span style={{ color: "#10b981", fontSize: "12px" }}>✨ Edit Ready</span>}
            </div>
            
            <div style={{ width: "100%", height: "calc(100% - 60px)" }}>
              {modelUrl ? (
                <BIMViewer 
                  modelUrl={modelUrl}
                  riskData={riskData}
                  onSelect={setSelectedElement}
                  editMode={editMode}
                  onEdit={handleEditChange}  // ✅ Pass edit handler
                />
              ) : (
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  height: "100%", color: "#94A3B8", fontSize: "1.2rem"
                }}>
                  Select a public GLB model from Home page
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
              <h3 style={{ marginBottom: "15px", color: "#D4AF37" }}>
                AI Risk Analysis (XGBoost)
              </h3>
              <RiskDashboard data={riskData.length ? riskData : [
                { name: "No edits yet", riskScore: 0 }
              ]} />
              {riskData.length > 0 && (
                <p style={{ color: "#94A3B8", fontSize: "0.8rem", marginTop: "10px" }}>
                  {riskData.length} edits analyzed • High-risk = Blockchain • Low-risk = Merkle Tree
                </p>
              )}
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
                <div style={{ marginBottom: "15px" }}>
                  <p style={{ margin: "8px 0", fontSize: "0.95rem" }}>
                    <strong>Name:</strong> {selectedElement.name}
                  </p>
                  <p style={{ 
                    margin: "8px 0", 
                    color: selectedElement.riskScore > 50 ? "#ef4444" : "#10b981",
                    fontWeight: "600"
                  }}>
                    Risk: {Math.round(selectedElement.riskScore)}%
                  </p>
                </div>
                
                {/* ✅ Edit Controls - Connected to full workflow */}
                {editMode ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <button 
                      onClick={() => handleEditChange(1, { 
                        type: "Load Bearing Wall", 
                        span_length: 15, 
                        cost_impact: 85000, 
                        delay_days: 10,
                        mitigation: true 
                      })}
                      style={{ 
                        padding: "10px", backgroundColor: "#10b981", 
                        color: "white", border: "none", 
                        borderRadius: "6px", cursor: "pointer",
                        fontSize: "14px"
                      }}
                    >
                      ✅ Apply Mitigation (Green)
                    </button>
                    <button 
                      onClick={() => handleEditChange(1, { 
                        type: "Steel Beam", 
                        span_length: 20, 
                        cost_impact: 120000, 
                        delay_days: 14,
                        mitigation: false 
                      })}
                      style={{ 
                        padding: "10px", backgroundColor: "#ef4444", 
                        color: "white", border: "none", 
                        borderRadius: "6px", cursor: "pointer",
                        fontSize: "14px"
                      }}
                    >
                      ⚠️ High Risk Edit (Red)
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setEditMode(true)}
                    style={{ 
                      width: "100%", 
                      padding: "12px", 
                      backgroundColor: "#D4AF37",
                      color: "#000",
                      border: "none", 
                      borderRadius: "6px",
                      fontWeight: "bold",
                      cursor: "pointer"
                    }}
                  >
                    ✏️ Enable Edit Mode
                  </button>
                )}
              </div>
            )}
            
            {!selectedElement && (
              <div style={{ 
                backgroundColor: theme.panel, 
                padding: "20px", 
                borderRadius: "12px", 
                border: `1px solid ${theme.border}`,
                textAlign: "center",
                color: "#94A3B8"
              }}>
                <p>👆 Click an element in the 3D viewer</p>
                <p style={{ fontSize: "0.85rem", marginTop: "5px" }}>
                  Edit → XGBoost → Supabase Storage → Blockchain/Merkle
                </p>
              </div>
            )}
          </aside>
        </main>
      </div>
    </div>
  );
}
