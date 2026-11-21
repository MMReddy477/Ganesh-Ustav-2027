"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

type CanvasProps = {
  active: boolean;
  onReveal: () => void;
  onComplete: () => void;
};

function FloatingParticles({ active, onReveal, onComplete }: CanvasProps) {
  const viewport = useThree((state) => state.viewport);
  const invalidate = useThree((state) => state.invalidate);
  const material = useRef<THREE.PointsMaterial>(null);
  const revealed = useRef(false);
  const completed = useRef(false);
  const count = viewport.width < 7 ? 900 : 2200;
  const geometry = useMemo(() => {
    const shape = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const attribute = new THREE.BufferAttribute(positions, 3);
    attribute.setUsage(THREE.DynamicDrawUsage);
    shape.setAttribute("position", attribute);
    return shape;
  }, [count]);
  const particles = useMemo(() => {
    const start = new Float32Array(count * 3);
    const destination = new Float32Array(count * 3);
    const gathering = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    let seed = 1947;
    const random = () => {
      seed = (seed * 48271) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    for (let i = 0; i < count; i += 1) {
      start[i * 3] = (random() - 0.5) * 0.55;
      start[i * 3 + 1] = (random() - 0.5) * 0.55;
      start[i * 3 + 2] = (random() - 0.5) * 1.5;
      destination[i * 3] = (random() - 0.5) * viewport.width * 1.4;
      destination[i * 3 + 1] = (random() - 0.5) * viewport.height * 1.3;
      destination[i * 3 + 2] = (random() - 0.5) * 1.5;
      const angle = random() * Math.PI * 2;
      const radius = 0.16 + random() * 0.72;
      gathering[i * 3] = Math.cos(angle) * radius * Math.min(viewport.width, 8) * 0.58;
      gathering[i * 3 + 1] = Math.sin(angle) * radius * Math.min(viewport.height, 6) * 0.52 - 0.15;
      gathering[i * 3 + 2] = (random() - 0.5) * 0.8;
      phases[i] = random() * Math.PI * 2;
    }

    return { start, destination, gathering, phases };
  }, [count, viewport.height, viewport.width]);

  useEffect(() => {
    if (!active) invalidate();
  }, [active, invalidate]);

  useFrame(({ clock }) => {
    if (!active) {
      if (material.current) material.current.opacity = 0;
      return;
    }

    const time = clock.elapsedTime;
    const position = geometry.getAttribute("position") as THREE.BufferAttribute;
    const current = position.array as Float32Array;
    const spread = THREE.MathUtils.smoothstep(time, 0, 3);
    const gather = THREE.MathUtils.smoothstep(time, 7, 8);

    for (let i = 0; i < count; i += 1) {
      const offset = i * 3;
      const phase = particles.phases[i];
      const x = THREE.MathUtils.lerp(particles.start[offset], particles.destination[offset], spread);
      const y = THREE.MathUtils.lerp(particles.start[offset + 1], particles.destination[offset + 1], spread);
      current[offset] = THREE.MathUtils.lerp(x, particles.gathering[offset], gather) + Math.sin(time * 0.31 + phase) * 0.035;
      current[offset + 1] =
        THREE.MathUtils.lerp(y, particles.gathering[offset + 1], gather) +
        Math.cos(time * 0.24 + phase) * 0.04;
      current[offset + 2] = THREE.MathUtils.lerp(particles.destination[offset + 2], particles.gathering[offset + 2], gather);
    }
    position.needsUpdate = true;

    const fade = 1 - THREE.MathUtils.smoothstep(time, 9, 10);
    if (material.current) material.current.opacity = 0.36 * fade;

    if (time >= 7 && !revealed.current) {
      revealed.current = true;
      onReveal();
    }
    if (time >= 10 && !completed.current) {
      completed.current = true;
      onComplete();
    }
  });

  return (
    <points geometry={geometry}>
      <pointsMaterial
        ref={material}
        color="#ffd37e"
        size={viewport.width < 7 ? 0.035 : 0.03}
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}

export function CinematicIntroCanvas({ active, onReveal, onComplete }: CanvasProps) {
  return (
    <Canvas
      className="hero-intro-canvas"
      orthographic
      camera={{ position: [0, 0, 20], zoom: 100, near: 0.1, far: 100 }}
      dpr={[1, 1.3]}
      gl={{ alpha: true, antialias: false, powerPreference: "low-power" }}
      frameloop={active ? "always" : "demand"}
      aria-hidden="true"
    >
      <FloatingParticles active={active} onReveal={onReveal} onComplete={onComplete} />
    </Canvas>
  );
}
