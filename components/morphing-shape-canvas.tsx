"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { MorphingShape } from "./morphing-shape";

export function MorphingShapeCanvas() {
  return (
    <div className="relative h-[400px] lg:h-[500px] w-full rounded-2xl overflow-hidden">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        className="w-full h-full"
        gl={{ alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} color="#8b5cf6" intensity={0.5} />
        <pointLight position={[10, 10, 10]} color="#3b82f6" intensity={0.5} />
        <MorphingShape />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate={false}
          maxPolarAngle={Math.PI / 1.5}
          minPolarAngle={Math.PI / 3}
        />
      </Canvas>
    </div>
  );
}
