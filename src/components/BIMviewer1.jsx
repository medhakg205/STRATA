// components/BIMviewer1.jsx
import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import * as THREE from "three";

export default function BIMViewer({ modelUrl, riskData, onSelect, editMode = false }) {
  const gltf = useLoader(GLTFLoader, modelUrl);
  const meshRef = useRef();
  const [selectedMesh, setSelectedMesh] = useState(null);

  useFrame((state) => {
    if (meshRef.current) {
      // Highlight selected elements
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime) * 0.1;
    }
  });

  const handleMeshClick = (name, riskScore) => {
  setSelectedMesh({ name, riskScore });
  onSelect({ name, riskScore });
};


  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[5, 5, 5]} />
        <OrbitControls enableDamping={true} dampingFactor={0.05} minDistance={2} maxDistance={20} />
        
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />

        {/* Load GLB Model */}
        <primitive object={gltf.scene} ref={meshRef} scale={[0.01, 0.01, 0.01]} />

        {/* Edit Mode Controls */}
        {editMode && (
          <group>
            {/* Add your editable meshes here */}
            <mesh 
              position={[0, 1, 0]} 
              // ✅ CORRECT
onClick={() => handleMeshClick("Wall A", 85)}

            >
              <boxGeometry args={[1, 2, 0.2]} />
              <meshStandardMaterial color={selectedMesh?.name === "Wall A" ? "#D4AF37" : "#ff6b6b"} />
            </mesh>
          </group>
        )}

        <gridHelper args={[10, 10, "#2D3748", "#2D3748"]} />
      </Canvas>

      {/* Edit Mode Toggle */}
      {editMode && (
        <div style={{
          position: "absolute",
          top: 10,
          right: 10,
          background: "rgba(0,0,0,0.8)",
          color: "white",
          padding: "10px",
          borderRadius: "6px",
          fontSize: "12px"
        }}>
          📝 Edit Mode Active - Click elements to modify
        </div>
      )}
    </div>
  );
}
