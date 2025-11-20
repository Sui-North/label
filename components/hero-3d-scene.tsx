"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Sphere,
  MeshDistortMaterial,
  Float,
} from "@react-three/drei";
import * as THREE from "three";

function AnimatedSphere({
  position,
  color,
  speed,
}: {
  position: [number, number, number];
  color: string;
  speed: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * speed * 0.2;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * speed * 0.3;
    }
  });

  return (
    <Float speed={speed} rotationIntensity={0.5} floatIntensity={0.5}>
      <Sphere ref={meshRef} args={[1, 32, 32]} position={position} scale={0.8}>
        <MeshDistortMaterial
          color={color}
          attach="material"
          distort={0.3}
          speed={2}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
    </Float>
  );
}

function DataCubes() {
  const count = 50;
  const cubesRef = useRef<THREE.InstancedMesh>(null);

  const positions = useMemo(() => {
    const pos = [];
    for (let i = 0; i < count; i++) {
      pos.push({
        x: (Math.random() - 0.5) * 20,
        y: (Math.random() - 0.5) * 20,
        z: (Math.random() - 0.5) * 20,
        rotationSpeed: Math.random() * 0.01 + 0.001,
      });
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (cubesRef.current) {
      positions.forEach((pos, i) => {
        const matrix = new THREE.Matrix4();
        const rotation = state.clock.getElapsedTime() * pos.rotationSpeed;
        matrix.makeRotationFromEuler(
          new THREE.Euler(rotation, rotation * 0.5, 0)
        );
        matrix.setPosition(pos.x, pos.y, pos.z);
        cubesRef.current!.setMatrixAt(i, matrix);
      });
      cubesRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={cubesRef} args={[undefined, undefined, count]}>
      <boxGeometry args={[0.15, 0.15, 0.15]} />
      <meshStandardMaterial color="#3b82f6" transparent opacity={0.3} />
    </instancedMesh>
  );
}

function Particles() {
  const count = 300;
  const particlesRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      pos[i] = (Math.random() - 0.5) * 25;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.getElapsedTime() * 0.05;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#8b5cf6" transparent opacity={0.6} />
    </points>
  );
}

export function Hero3DScene() {
  return (
    <div className="absolute inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 45 }}
        className="bg-transparent"
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} color="#8b5cf6" />
        <pointLight position={[10, 10, 10]} intensity={0.5} color="#3b82f6" />

        {/* Animated Spheres */}
        <AnimatedSphere position={[-3, 2, 0]} color="#3b82f6" speed={0.5} />
        <AnimatedSphere position={[3, -2, -2]} color="#8b5cf6" speed={0.7} />
        <AnimatedSphere position={[0, 3, -3]} color="#ec4899" speed={0.6} />

        {/* Data Cubes */}
        <DataCubes />

        {/* Particles */}
        <Particles />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.5}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 2}
        />
      </Canvas>
    </div>
  );
}
