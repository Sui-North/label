"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Environment } from "@react-three/drei";
import { DataCore } from "./data-core";

export function DataCoreCanvas() {
  return (
    <div className="relative h-[400px] lg:h-[600px] w-full flex items-center justify-center">
      <Canvas
        className="w-full h-full"
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 2]}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={45} />
        
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#3b82f6" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b5cf6" />
        <spotLight position={[0, 10, 0]} intensity={0.8} angle={0.5} penumbra={1} />
        
        <DataCore />
        
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={1}
          maxPolarAngle={Math.PI / 1.5}
          minPolarAngle={Math.PI / 3}
        />
        
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
