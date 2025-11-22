"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

interface RainParticlesProps {
  count: number;
  progress: number;
}

function RainParticles({ count, progress }: RainParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const velocitiesRef = useRef<Float32Array>(null);

  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Random position in cylinder above glass
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 0.8;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.random() * 3 + 2; // Start above glass
      positions[i * 3 + 2] = Math.sin(angle) * radius;
      
      velocities[i] = 0.02 + Math.random() * 0.03; // Fall speed
    }

    velocitiesRef.current = velocities;
    return positions;
  }, [count]);

  useFrame(() => {
    if (!pointsRef.current || !velocitiesRef.current) return;

    const positions = pointsRef.current.geometry.attributes.position
      .array as Float32Array;
    const waterLevel = (progress / 100) * 2 - 1; // -1 to 1

    for (let i = 0; i < count; i++) {
      // Move particle down
      positions[i * 3 + 1] -= velocitiesRef.current[i];

      // Reset if below water level or bottom
      if (positions[i * 3 + 1] < waterLevel || positions[i * 3 + 1] < -1) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 0.8;
        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = Math.random() * 2 + 3;
        positions[i * 3 + 2] = Math.sin(angle) * radius;
      }
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry attach="geometry">
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particles}
          itemSize={3}
          args={[particles, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#60a5fa"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

interface WaterFillProps {
  progress: number;
}

function WaterFill({ progress }: WaterFillProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const targetScale = useRef(0);

  useEffect(() => {
    targetScale.current = progress / 100;
  }, [progress]);

  useFrame(() => {
    if (!meshRef.current) return;
    
    // Smooth interpolation
    const currentScale = meshRef.current.scale.y;
    const newScale = currentScale + (targetScale.current - currentScale) * 0.1;
    meshRef.current.scale.y = newScale;
    meshRef.current.position.y = -1 + newScale;
  });

  return (
    <mesh ref={meshRef} position={[0, -1, 0]} scale={[1, 0, 1]}>
      <cylinderGeometry args={[0.85, 0.85, 2, 32]} />
      <meshPhysicalMaterial
        color="#3b82f6"
        transparent
        opacity={0.6}
        roughness={0.1}
        metalness={0.1}
        clearcoat={1}
        clearcoatRoughness={0.1}
      />
    </mesh>
  );
}

function Glass() {
  return (
    <mesh>
      <cylinderGeometry args={[1, 1, 2, 32, 1, true]} />
      <meshPhysicalMaterial
        color="#ffffff"
        transparent
        opacity={0.15}
        roughness={0.05}
        metalness={0.1}
        clearcoat={1}
        clearcoatRoughness={0.05}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function GlassRim() {
  return (
    <mesh position={[0, 1, 0]}>
      <torusGeometry args={[1, 0.05, 16, 32]} />
      <meshPhysicalMaterial
        color="#ffffff"
        transparent
        opacity={0.3}
        roughness={0.05}
        metalness={0.2}
        clearcoat={1}
      />
    </mesh>
  );
}

function Scene({ progress }: { progress: number }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />
      <spotLight
        position={[0, 5, 0]}
        angle={0.3}
        penumbra={1}
        intensity={1}
        castShadow
      />
      
      <Glass />
      <GlassRim />
      <WaterFill progress={progress} />
      <RainParticles count={150} progress={progress} />
      
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.5}
      />
    </>
  );
}

interface GlassLoaderProps {
  progress: number;
  isLoading: boolean;
}

export default function GlassLoader({ progress, isLoading }: GlassLoaderProps) {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="relative w-full max-w-md aspect-square">
        <Canvas
          camera={{ position: [0, 0, 5], fov: 50 }}
          gl={{ alpha: true, antialias: true }}
        >
          <Scene progress={progress} />
        </Canvas>
        
        <div className="absolute bottom-8 left-0 right-0 text-center space-y-2">
          <p className="text-2xl font-bold text-primary">
            {Math.round(progress)}%
          </p>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    </div>
  );
}
