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

function SuiCoin3D({ scale = 1 }: { scale?: number }) {
  const coinGeometry = useMemo(() => {
    return new THREE.CylinderGeometry(1, 1, 0.15, 32);
  }, []);

  const logoGeometry = useMemo(() => {
    // Create simplified Sui logo for embossing
    const logoShape = new THREE.Shape();
    
    // Outer droplet shape (smaller for coin)
    logoShape.moveTo(0, 0.6);
    logoShape.bezierCurveTo(0.2, 0.57, 0.4, 0.36, 0.42, 0.12);
    logoShape.bezierCurveTo(0.45, -0.12, 0.36, -0.39, 0.21, -0.51);
    logoShape.bezierCurveTo(0.09, -0.57, 0, -0.6, 0, -0.6);
    logoShape.bezierCurveTo(0, -0.6, -0.09, -0.57, -0.21, -0.51);
    logoShape.bezierCurveTo(-0.36, -0.39, -0.45, -0.12, -0.42, 0.12);
    logoShape.bezierCurveTo(-0.4, 0.36, -0.2, 0.57, 0, 0.6);

    // Inner S curve
    const innerCurve = new THREE.Shape();
    innerCurve.moveTo(-0.15, -0.42);
    innerCurve.bezierCurveTo(-0.24, -0.42, -0.27, -0.33, -0.27, -0.24);
    innerCurve.bezierCurveTo(-0.27, -0.12, -0.18, -0.03, -0.06, 0.03);
    innerCurve.bezierCurveTo(0.06, 0.09, 0.15, 0.18, 0.15, 0.3);
    innerCurve.bezierCurveTo(0.15, 0.39, 0.09, 0.45, 0, 0.45);
    innerCurve.lineTo(-0.03, 0.45);
    innerCurve.bezierCurveTo(0.03, 0.42, 0.09, 0.37, 0.09, 0.29);
    innerCurve.bezierCurveTo(0.09, 0.21, 0.03, 0.13, -0.05, 0.07);
    innerCurve.bezierCurveTo(-0.13, 0.01, -0.21, -0.09, -0.21, -0.23);
    innerCurve.bezierCurveTo(-0.21, -0.31, -0.17, -0.37, -0.09, -0.39);
    innerCurve.lineTo(-0.15, -0.42);

    logoShape.holes.push(innerCurve);

    const extrudeSettings = {
      depth: 0.04,
      bevelEnabled: false
    };

    return new THREE.ExtrudeGeometry(logoShape, extrudeSettings);
  }, []);

  return (
    <group scale={scale}>
      {/* Main coin body */}
      <mesh geometry={coinGeometry} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial
          color="#6FBCF0"
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      
      {/* Coin edge (rim) */}
      <mesh geometry={coinGeometry} rotation={[Math.PI / 2, 0, 0]} scale={[1.02, 1, 1.02]}>
        <meshStandardMaterial
          color="#4A90C8"
          metalness={0.95}
          roughness={0.05}
        />
      </mesh>

      {/* Logo on front side */}
      <mesh geometry={logoGeometry} position={[0, 0, 0.08]} rotation={[0, 0, 0]}>
        <meshStandardMaterial
          color="#FFFFFF"
          metalness={0.7}
          roughness={0.3}
          emissive="#6FBCF0"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Logo on back side */}
      <mesh geometry={logoGeometry} position={[0, 0, -0.08]} rotation={[0, Math.PI, 0]}>
        <meshStandardMaterial
          color="#FFFFFF"
          metalness={0.7}
          roughness={0.3}
          emissive="#6FBCF0"
          emissiveIntensity={0.2}
        />
      </mesh>
    </group>
  );
}

function SuiLogoSatellite({ 
  radius, 
  speed, 
  offset, 
  size 
}: { 
  radius: number; 
  speed: number; 
  offset: number; 
  size: number;
}) {
  const ref = useRef<THREE.Group>(null);
  const coinRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (ref.current) {
      const time = state.clock.getElapsedTime();
      const angle = time * speed + offset;
      
      // Orbit logic
      ref.current.position.x = Math.cos(angle) * radius;
      ref.current.position.z = Math.sin(angle) * radius;
      ref.current.position.y = Math.sin(angle * 2) * (radius * 0.3);
      
      // Rotate the coin to face outward
      ref.current.rotation.y = -angle;
    }
    
    // Spin the coin
    if (coinRef.current) {
      coinRef.current.rotation.y += 0.02;
    }
  });

  return (
    <group ref={ref}>
      <Trail
        width={size * 2}
        length={8}
        color={new THREE.Color("#6FBCF0")}
        attenuation={(t) => t * t}
      >
        <group ref={coinRef}>
          <SuiCoin3D scale={size} />
        </group>
        {/* Glow effect */}
        <pointLight position={[0, 0, 0]} intensity={0.3} color="#6FBCF0" distance={1.5} />
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
      
      {/* Sui Coin Satellites */}
      <SuiLogoSatellite radius={2.2} speed={1} offset={0} size={0.3} />
      <SuiLogoSatellite radius={2.8} speed={0.8} offset={2} size={0.25} />
      <SuiLogoSatellite radius={3.5} speed={0.6} offset={4} size={0.32} />
      
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
