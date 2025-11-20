"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function MorphingShape() {
  const meshRef = useRef<THREE.Mesh>(null);
  const [currentShape, setCurrentShape] = useState(0);

  // Easing function for smooth transitions
  const easeInOutCubic = (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  useFrame((state) => {
    if (!meshRef.current) return;

    const time = state.clock.getElapsedTime();
    const geometry = meshRef.current.geometry as THREE.BufferGeometry;
    const positions = geometry.attributes.position;

    // Store original sphere positions if not already stored
    if (!geometry.userData.originalPositions) {
      geometry.userData.originalPositions = new Float32Array(positions.array);
    }
    const original = geometry.userData.originalPositions;

    // Cycle through shapes every 3 seconds
    const cycle = (time % 9) / 3;
    const shapeIndex = Math.floor(cycle);

    // Get interpolation factor within current transition
    const t = easeInOutCubic(cycle - shapeIndex);

    // Update shape based on cycle
    if (shapeIndex !== currentShape) {
      setCurrentShape(shapeIndex);
    }

    // Apply morphing effect
    for (let i = 0; i < positions.count; i++) {
      const i3 = i * 3;
      const sphereX = original[i3];
      const sphereY = original[i3 + 1];
      const sphereZ = original[i3 + 2];

      // Calculate box shape coordinates
      const absX = Math.abs(sphereX);
      const absY = Math.abs(sphereY);
      const absZ = Math.abs(sphereZ);
      const maxCoord = Math.max(absX, absY, absZ);

      // Avoid division by zero
      const boxScale = maxCoord > 0.001 ? 1.4 / maxCoord : 1.4;
      const boxX = sphereX * boxScale;
      const boxY = sphereY * boxScale;
      const boxZ = sphereZ * boxScale;

      // Calculate tetrahedron (triangular pyramid) shape coordinates
      // Tetrahedron has 4 vertices forming a triangular pyramid
      // We'll project sphere points to the nearest tetrahedron face
      const angle = Math.atan2(sphereZ, sphereX);
      const normalizedY = (sphereY + 1.4) / 2.8; // 0 at bottom, 1 at top

      // Create triangular base (3 sides) by dividing horizontally into 3 sections
      const section = Math.floor(((angle + Math.PI) / (Math.PI * 2)) * 3);
      const baseRadius = 1.4 * (1 - normalizedY * 0.95); // Taper to point at top

      // Rotate the triangular profile based on which section
      const sectionAngle = (section * Math.PI * 2) / 3 + Math.PI / 6;
      const toVertexAngle = angle - sectionAngle;
      const distanceToEdge =
        Math.cos(Math.PI / 3) /
        Math.cos((toVertexAngle % ((Math.PI * 2) / 3)) - Math.PI / 3);

      const tetraRadius =
        baseRadius * Math.max(0.1, Math.min(1.5, distanceToEdge));
      const tetraX = Math.cos(angle) * tetraRadius;
      const tetraY = sphereY; // Keep Y position
      const tetraZ = Math.sin(angle) * tetraRadius;

      let newX, newY, newZ;

      if (shapeIndex === 0) {
        // Sphere to Box transition
        newX = sphereX * (1 - t) + boxX * t;
        newY = sphereY * (1 - t) + boxY * t;
        newZ = sphereZ * (1 - t) + boxZ * t;
      } else if (shapeIndex === 1) {
        // Box to Tetrahedron transition
        newX = boxX * (1 - t) + tetraX * t;
        newY = boxY * (1 - t) + tetraY * t;
        newZ = boxZ * (1 - t) + tetraZ * t;
      } else {
        // Tetrahedron back to Sphere transition
        newX = tetraX * (1 - t) + sphereX * t;
        newY = tetraY * (1 - t) + sphereY * t;
        newZ = tetraZ * (1 - t) + sphereZ * t;
      }

      positions.setXYZ(i, newX, newY, newZ);
    }

    positions.needsUpdate = true;
    geometry.computeVertexNormals();

    // Rotate the shape
    meshRef.current.rotation.x = time * 0.2;
    meshRef.current.rotation.y = time * 0.3;
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <sphereGeometry args={[1.4, 64, 64]} />
      <meshStandardMaterial
        color="#3b82f6"
        metalness={0.7}
        roughness={0.2}
        emissive="#1e40af"
        emissiveIntensity={0.2}
      />
    </mesh>
  );
}
