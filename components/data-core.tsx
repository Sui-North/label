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

function SuiSymbol3D({ scale = 1 }: { scale?: number }) {
  const geometry = useMemo(() => {
    // Create the outer droplet shape - more accurate to Sui logo
    const outerShape = new THREE.Shape();
    
    // Start at the top point of the droplet
    outerShape.moveTo(0, 1.0);
    
    // Right side of droplet (smoother curve)
    outerShape.bezierCurveTo(
      0.35, 0.95,  // control point 1 - gentle top curve
      0.65, 0.6,   // control point 2
      0.7, 0.2     // end point
    );
    outerShape.bezierCurveTo(
      0.75, -0.2,  // control point 1
      0.6, -0.65,  // control point 2
      0.35, -0.85  // end point
    );
    outerShape.bezierCurveTo(
      0.15, -0.95, // control point 1
      0, -1.0,     // control point 2
      0, -1.0      // bottom point
    );
    
    // Left side of droplet (mirror of right)
    outerShape.bezierCurveTo(
      0, -1.0,     // control point 1
      -0.15, -0.95,// control point 2
      -0.35, -0.85 // end point
    );
    outerShape.bezierCurveTo(
      -0.6, -0.65, // control point 1
      -0.75, -0.2, // control point 2
      -0.7, 0.2    // end point
    );
    outerShape.bezierCurveTo(
      -0.65, 0.6,  // control point 1
      -0.35, 0.95, // control point 2
      0, 1.0       // back to top
    );

    // Create the inner "S" curve - more flowing and accurate
    const innerCurve = new THREE.Shape();
    
    // Start from bottom left of S
    innerCurve.moveTo(-0.25, -0.7);
    
    // Bottom curve of S (left side)
    innerCurve.bezierCurveTo(
      -0.4, -0.7,   // control point 1
      -0.45, -0.55, // control point 2
      -0.45, -0.4   // end point
    );
    innerCurve.bezierCurveTo(
      -0.45, -0.2,  // control point 1
      -0.3, -0.05,  // control point 2
      -0.1, 0.05    // end point - middle of S
    );
    
    // Top curve of S (right side)
    innerCurve.bezierCurveTo(
      0.1, 0.15,    // control point 1
      0.25, 0.3,    // control point 2
      0.25, 0.5     // end point
    );
    innerCurve.bezierCurveTo(
      0.25, 0.65,   // control point 1
      0.15, 0.75,   // control point 2
      0, 0.75       // end point - top right
    );
    
    // Top outer edge
    innerCurve.lineTo(-0.05, 0.75);
    innerCurve.bezierCurveTo(
      0.05, 0.7,    // control point 1
      0.15, 0.62,   // control point 2
      0.15, 0.48    // end point
    );
    innerCurve.bezierCurveTo(
      0.15, 0.35,   // control point 1
      0.05, 0.22,   // control point 2
      -0.08, 0.12   // end point - middle return
    );
    
    // Bottom return curve
    innerCurve.bezierCurveTo(
      -0.22, 0.02,  // control point 1
      -0.35, -0.15, // control point 2
      -0.35, -0.38  // end point
    );
    innerCurve.bezierCurveTo(
      -0.35, -0.52, // control point 1
      -0.28, -0.62, // control point 2
      -0.15, -0.65  // end point
    );
    
    // Bottom outer edge - close the shape
    innerCurve.lineTo(-0.25, -0.7);

    // Add the inner curve as a hole
    outerShape.holes.push(innerCurve);

    const extrudeSettings = {
      depth: 0.12,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.02,
      bevelSegments: 5
    };

    return new THREE.ExtrudeGeometry(outerShape, extrudeSettings);
  }, []);

  return (
    <mesh geometry={geometry} scale={scale}>
      <meshStandardMaterial
        color="#4FA9FF"
        emissive="#2563eb"
        emissiveIntensity={0.4}
        metalness={0.6}
        roughness={0.3}
      />
    </mesh>
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

  useFrame((state) => {
    if (ref.current) {
      const time = state.clock.getElapsedTime();
      const angle = time * speed + offset;
      
      // Orbit logic
      ref.current.position.x = Math.cos(angle) * radius;
      ref.current.position.z = Math.sin(angle) * radius;
      ref.current.position.y = Math.sin(angle * 2) * (radius * 0.3);
      
      // Rotate the symbol to always face outward
      ref.current.rotation.y = -angle;
    }
  });

  return (
    <group ref={ref}>
      <Trail
        width={size * 3}
        length={10}
        color={new THREE.Color("#3b82f6")}
        attenuation={(t) => t * t}
      >
        <SuiSymbol3D scale={size} />
        {/* Glow effect */}
        <pointLight position={[0, 0, 0]} intensity={0.5} color="#3b82f6" distance={2} />
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
      
      {/* Sui Logo Satellites */}
      <SuiLogoSatellite radius={2.2} speed={1} offset={0} size={0.4} />
      <SuiLogoSatellite radius={2.8} speed={0.8} offset={2} size={0.35} />
      <SuiLogoSatellite radius={3.5} speed={0.6} offset={4} size={0.45} />
      
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
