"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sparkles } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

function IdolSculpture() {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock, pointer }) => {
    if (!group.current) return;
    group.current.rotation.y = Math.sin(clock.elapsedTime * 0.28) * 0.13 + pointer.x * 0.09;
    group.current.rotation.x = pointer.y * 0.035;
  });

  return (
    <Float speed={1.05} rotationIntensity={0.05} floatIntensity={0.15}>
      <group ref={group} position={[0, -0.3, 0]} scale={1.22}>
        <mesh position={[0, -0.9, 0]} scale={[1.1, 0.23, 0.6]} castShadow>
          <sphereGeometry args={[1, 48, 32]} />
          <meshStandardMaterial color="#a95d26" metalness={0.72} roughness={0.32} />
        </mesh>
        <mesh position={[0, -0.29, 0]} scale={[0.72, 0.78, 0.55]} castShadow>
          <sphereGeometry args={[1, 48, 40]} />
          <meshStandardMaterial color="#dfa94e" metalness={0.58} roughness={0.36} />
        </mesh>
        <mesh position={[0, 0.55, 0]} scale={[0.61, 0.69, 0.48]} castShadow>
          <sphereGeometry args={[1, 48, 40]} />
          <meshStandardMaterial color="#f0c77b" metalness={0.42} roughness={0.33} />
        </mesh>
        <mesh position={[-0.59, 0.55, 0]} rotation={[0, 0, 0.13]} scale={[0.45, 0.63, 0.19]} castShadow>
          <sphereGeometry args={[1, 40, 32]} />
          <meshStandardMaterial color="#b76e36" metalness={0.55} roughness={0.4} />
        </mesh>
        <mesh position={[0.59, 0.55, 0]} rotation={[0, 0, -0.13]} scale={[0.45, 0.63, 0.19]} castShadow>
          <sphereGeometry args={[1, 40, 32]} />
          <meshStandardMaterial color="#b76e36" metalness={0.55} roughness={0.4} />
        </mesh>
        <mesh position={[0, 1.28, 0]} scale={[0.53, 0.27, 0.43]} castShadow>
          <sphereGeometry args={[1, 40, 28]} />
          <meshStandardMaterial color="#b68a3a" metalness={0.75} roughness={0.26} />
        </mesh>
        <mesh position={[0, 0.32, 0.43]} rotation={[0.3, 0, 0.18]} scale={[0.19, 0.54, 0.16]} castShadow>
          <capsuleGeometry args={[0.52, 0.5, 6, 18]} />
          <meshStandardMaterial color="#f5d697" metalness={0.38} roughness={0.3} />
        </mesh>
        <mesh position={[0.03, -0.12, 0.57]} rotation={[0, 0, -0.2]} scale={[0.14, 0.22, 0.11]} castShadow>
          <sphereGeometry args={[1, 32, 24]} />
          <meshStandardMaterial color="#f3d99d" metalness={0.35} roughness={0.3} />
        </mesh>
        {[-0.23, 0.23].map((x) => (
          <mesh key={x} position={[x, 0.58, 0.42]} scale={[0.048, 0.048, 0.025]}>
            <sphereGeometry args={[1, 20, 20]} />
            <meshStandardMaterial color="#741f1d" emissive="#a22f20" emissiveIntensity={0.4} />
          </mesh>
        ))}
        <mesh position={[0, 0.02, 0.47]} scale={[0.1, 0.1, 0.04]}>
          <sphereGeometry args={[1, 24, 24]} />
          <meshStandardMaterial color="#9b3326" metalness={0.3} roughness={0.3} />
        </mesh>
        <mesh position={[0, 1.52, 0]} scale={[0.18, 0.3, 0.15]} castShadow>
          <coneGeometry args={[0.5, 1, 8]} />
          <meshStandardMaterial color="#dcb45e" metalness={0.78} roughness={0.22} />
        </mesh>
        <mesh position={[0, -0.85, 0.56]} rotation={[Math.PI / 2, 0, 0]} scale={[0.31, 0.31, 0.07]}>
          <torusGeometry args={[1, 0.07, 12, 48]} />
          <meshStandardMaterial color="#e5be68" metalness={0.84} roughness={0.2} />
        </mesh>
      </group>
    </Float>
  );
}

export function GaneshScene() {
  return (
    <Canvas className="scene-canvas" dpr={[1, 1.5]} camera={{ position: [0, 0.4, 5.1], fov: 36 }} gl={{ alpha: true, antialias: true }} aria-label="Slowly rotating golden Ganesha-inspired sculpture">
      <ambientLight intensity={1.15} />
      <directionalLight position={[2, 4, 4]} intensity={3.1} color="#ffe0a2" />
      <pointLight position={[-3, 0, 2]} intensity={18} color="#ef8e47" />
      <pointLight position={[0, -2, -2]} intensity={12} color="#c97732" />
      <Sparkles count={42} scale={5} size={2.2} speed={0.25} color="#ffdb8d" />
      <IdolSculpture />
    </Canvas>
  );
}
