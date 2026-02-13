import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Stage } from "@react-three/drei";

export default function BIMViewer() {
  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <Canvas shadows>
        {/* 1. Add a Camera with a set position */}
        <PerspectiveCamera makeDefault position={[5, 5, 5]} />
        
        {/* 2. Add OrbitControls - this enables mouse interaction */}
        <OrbitControls 
          enableDamping={true} // Adds that smooth "weight" to the rotation
          dampingFactor={0.05}
          minDistance={2}      // Prevents zooming inside the model
          maxDistance={20}     // Prevents zooming too far away
        />

        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />

        {/* The Model */}
        <mesh position={[0,0,0]}>
          <boxGeometry args={[2,2,2]} />
          <meshStandardMaterial color="#D4AF37" /> {/* Using your Gold color! */}
        </mesh>

        {/* Optional: Add a grid to help with spatial orientation */}
        <gridHelper args={[10, 10, "#2D3748", "#2D3748"]} />
      </Canvas>
    </div>
  );
}