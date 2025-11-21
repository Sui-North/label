"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, PerspectiveCamera, Text, Trail } from "@react-three/drei";
import * as THREE from "three";

function Core() {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current && glowRef.current) {
      const time = state.clock.getElapsedTime();
      
      // Rotate core
      meshRef.current.rotation.x = time * 0.2;
      meshRef.current.rotation.y = time * 0.3;
      
      // Pulse effect
      const scale = 1 + Math.sin(time * 2) * 0.05;
      meshRef.current.scale.set(scale, scale, scale);
      
      // Rotate glow
      glowRef.current.rotation.x = time * 0.1;
      glowRef.current.rotation.z = time * 0.15;
      const glowScale = 1.2 + Math.sin(time * 1.5) * 0.1;
      glowRef.current.scale.set(glowScale, glowScale, glowScale);
    }
  });

  return (
    <group>
      {/* Inner Core */}
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.2, 0]} />
        <meshStandardMaterial
          color="#3b82f6"
          emissive="#1d4ed8"
          emissiveIntensity={0.8}
          roughness={0.1}
          metalness={0.9}
          wireframe
        />
      </mesh>
      
      {/* Inner Solid Core */}
      <mesh scale={[0.9, 0.9, 0.9]}>
        <icosahedronGeometry args={[1.2, 0]} />
        <meshStandardMaterial
          color="#000000"
          roughness={0.1}
          metalness={1}
        />
      </mesh>

      {/* Outer Glow Shell */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1.4, 32, 32]} />
        <meshBasicMaterial
          color="#60a5fa"
          transparent
          opacity={0.1}
          wireframe
        />
      </mesh>
    </group>
  );
}

function Satellite({ 
  radius, 
  speed, 
  offset, 
  color, 
  size 
}: { 
  radius: number; 
  speed: number; 
  offset: number; 
  color: string; 
  size: number;
}) {
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (ref.current) {
      const time = state.clock.getElapsedTime();
      const angle = time * speed + offset;
      
      // Orbit logic
      ref.current.position.x = Math.cos(angle) * radius;
      ref.current.position.z = Math.sin(angle) * radius;
      ref.current.position.y = Math.sin(angle * 2) * (radius * 0.3);
      
      // Rotate satellite itself
      ref.current.rotation.x += 0.02;
      ref.current.rotation.y += 0.03;
    }
  });

  return (
    <group ref={ref}>
      <Trail
        width={size * 5}
        length={8}
        color={new THREE.Color(color)}
        attenuation={(t) => t * t}
      >
        <mesh>
          <octahedronGeometry args={[size, 0]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={1}
            toneMapped={false}
          />
        </mesh>
      </Trail>
    </group>
  );
}

function DataRing({ radius, speed, rotation }: { radius: number; speed: number; rotation: [number, number, number] }) {
  const ref = useRef<THREE.Line>(null);
  
  const points = useMemo(() => {
    const pts = [];
    const segments = 64;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(theta) * radius, Math.sin(theta) * radius, 0));
    }
    return pts;
  }, [radius]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    return geo;
  }, [points]);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.z += speed * 0.01;
    }
  });

  return (
    <group rotation={rotation}>
      {/* @ts-ignore */}
      <line ref={ref as any} geometry={geometry}>
        <lineBasicMaterial color="#4b5563" transparent opacity={0.3} />
      </line>
    </group>
  );
}

export function DataCore() {
  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <Core />
      
      {/* Satellites */}
      <Satellite radius={2.2} speed={1} offset={0} color="#3b82f6" size={0.15} />
      <Satellite radius={2.8} speed={0.8} offset={2} color="#8b5cf6" size={0.12} />
      <Satellite radius={3.5} speed={0.6} offset={4} color="#06b6d4" size={0.18} />
      
      {/* Data Rings */}
      <DataRing radius={2.5} speed={1} rotation={[Math.PI / 3, 0, 0]} />
      <DataRing radius={3.2} speed={-0.8} rotation={[-Math.PI / 4, 0, 0]} />
      
      {/* Floating Particles around core */}
      <points>
        <sphereGeometry args={[4, 64, 64]} />
        <pointsMaterial
          size={0.02}
          color="#3b82f6"
          transparent
          opacity={0.4}
          sizeAttenuation
        />
      </points>
    </Float>
  );
}
