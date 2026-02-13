import { useRef, useState, Suspense, useEffect } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

function ModelViewer({ modelUrl, onMeshClick }) {
  const gltf = useLoader(GLTFLoader, modelUrl);
  const groupRef = useRef();

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.02;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive 
        object={gltf.scene} 
        scale={[1.5, 1.5, 1.5]} // Duck-friendly scale
        position={[0, -0.5, 0]}
        onClick={(e) => {
          e.stopPropagation();
          // We pass a default ID of 1 if the model doesn't have internal mesh IDs
          onMeshClick({ name: "Structural Component", id: 1 });
        }}
      />
      <gridHelper args={[15, 15, "#444", "#222"]} />
    </group>
  );
}

export default function BIMViewer({ modelUrl, onSelect, editMode, onEdit, setRiskData }) {
  const [selectedMesh, setSelectedMesh] = useState(null);
  const [currentModelUrl, setCurrentModelUrl] = useState(modelUrl);
  const [displayScore, setDisplayScore] = useState(0);

  // Sync internal URL when the global model changes
  useEffect(() => {
    setCurrentModelUrl(modelUrl);
  }, [modelUrl]);

  const handleMeshClick = (data) => {
    setSelectedMesh(data);
    onSelect(data);
  };

  const handleAnalyze = async () => {
    if (!selectedMesh) return;

    // 1. Call the backend via the onEdit prop
    // Ensure your parent 'onEdit' returns the JSON response!
    const result = await onEdit(selectedMesh.id || 1, { 
      type: selectedMesh.name, 
      mitigation: true,
      span_length: 12, 
      cost_impact: 65000,
      delay_days: 7
    });

    console.log("Analysis Result:", result);

    if (result && result.risk_score !== undefined) {
      const newScore = parseFloat(result.risk_score);
      
      // 2. Update Local Display State (Fixes NaN)
      setDisplayScore(newScore);
      
      // 3. Update the 3D Model (Changes Duck color)
      if (result.new_url || result.storage_url) {
        setCurrentModelUrl(result.new_url || result.storage_url);
      }

      // 4. Update the Global Graph (Push to the chart)
      if (setRiskData) {
        setRiskData(prev => [
          ...prev, 
          { name: `Rev ${prev.length + 1}`, riskScore: newScore }
        ]);
      }

      // 5. Keep the selection active with the new score
      setSelectedMesh(prev => ({ ...prev, riskScore: newScore }));
    }
  };

  if (!currentModelUrl) {
    return <div className="loading-placeholder">Loading Model DBMS...</div>;
  }

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <Canvas camera={{ position: [5, 5, 5] }} style={{ background: "#0A0F1E" }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[10, 10, 5]} intensity={1.2} />
          <ModelViewer 
            modelUrl={currentModelUrl} 
            onMeshClick={handleMeshClick} 
          />
          <OrbitControls enableDamping />
        </Suspense>
      </Canvas>

      {/* Dynamic Header */}
      <div style={{
        position: "absolute", top: 15, left: 15, right: 15,
        display: "flex", justifyContent: "space-between",
        background: "rgba(15, 23, 42, 0.9)", padding: "12px",
        borderRadius: "8px", color: "white", border: "1px solid #334155"
      }}>
        <div>
          <span style={{ color: "#94A3B8" }}>Active Component:</span> 
          <span style={{ marginLeft: "8px", fontWeight: "bold" }}>
            {selectedMesh ? selectedMesh.name : "None Selected"}
          </span>
        </div>
        <div style={{ color: displayScore > 5 ? "#ef4444" : "#10b981", fontWeight: "bold" }}>
          Current Risk: {displayScore > 0 ? displayScore.toFixed(2) : "0.00"}
        </div>
      </div>

      {/* Analyze Button */}
      {editMode && selectedMesh && (
        <button 
          onClick={handleAnalyze}
          style={{
            position: "absolute", bottom: 30, right: 30,
            padding: "16px 32px", background: "#10b981",
            color: "white", border: "none", borderRadius: "50px",
            fontWeight: "bold", cursor: "pointer", fontSize: "15px",
            boxShadow: "0 10px 20px rgba(16, 185, 129, 0.3)"
          }}
        >
          🚀 RUN RISK ANALYSIS
        </button>
      )}
    </div>
  );
}