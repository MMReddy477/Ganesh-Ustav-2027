"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

type CanvasProps = {
  active: boolean;
  onReveal: () => void;
  onComplete: () => void;
};

function drawGaneshOutline(context: CanvasRenderingContext2D) {
  context.strokeStyle = "#fff";
  context.lineWidth = 9;
  context.lineCap = "round";
  context.lineJoin = "round";

  context.beginPath();
  context.moveTo(198, 155);
  context.bezierCurveTo(199, 101, 225, 70, 256, 65);
  context.bezierCurveTo(287, 70, 313, 101, 314, 155);
  context.stroke();

  context.beginPath();
  context.moveTo(190, 145);
  context.bezierCurveTo(145, 110, 93, 132, 83, 184);
  context.bezierCurveTo(79, 223, 112, 256, 166, 265);
  context.moveTo(322, 145);
  context.bezierCurveTo(367, 110, 419, 132, 429, 184);
  context.bezierCurveTo(433, 223, 400, 256, 346, 265);
  context.stroke();

  context.beginPath();
  context.moveTo(187, 153);
  context.bezierCurveTo(188, 236, 214, 261, 237, 276);
  context.bezierCurveTo(247, 284, 252, 301, 249, 328);
  context.bezierCurveTo(244, 370, 268, 391, 299, 376);
  context.bezierCurveTo(328, 362, 318, 336, 300, 327);
  context.moveTo(325, 153);
  context.bezierCurveTo(324, 236, 298, 261, 275, 276);
  context.stroke();

  context.beginPath();
  context.moveTo(214, 256);
  context.bezierCurveTo(199, 282, 200, 307, 218, 321);
  context.moveTo(298, 256);
  context.bezierCurveTo(313, 282, 312, 307, 294, 321);
  context.moveTo(215, 374);
  context.bezierCurveTo(223, 431, 289, 454, 338, 418);
  context.bezierCurveTo(360, 401, 364, 380, 354, 360);
  context.moveTo(207, 393);
  context.bezierCurveTo(159, 407, 143, 449, 172, 474);
  context.bezierCurveTo(213, 509, 299, 510, 340, 474);
  context.stroke();

  context.beginPath();
  context.moveTo(211, 235);
  context.lineTo(232, 241);
  context.moveTo(301, 241);
  context.lineTo(322, 235);
  context.moveTo(255, 171);
  context.bezierCurveTo(248, 211, 259, 231, 278, 235);
  context.moveTo(255, 233);
  context.bezierCurveTo(235, 239, 230, 256, 242, 267);
  context.stroke();
}

function getShapePoints(
  kind: "om" | "ganesh",
  count: number,
  viewport: { width: number; height: number },
) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Could not create the intro particle canvas.");

  if (kind === "om") {
    context.fillStyle = "#fff";
    context.font = "bold 280px serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("ॐ", 256, 256);
  } else {
    drawGaneshOutline(context);
  }

  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const samples: Array<[number, number]> = [];
  for (let y = 0; y < canvas.height; y += 2) {
    for (let x = 0; x < canvas.width; x += 2) {
      if (pixels[(y * canvas.width + x) * 4 + 3] > 80) samples.push([x, y]);
    }
  }
  if (!samples.length) throw new Error(`Could not create the ${kind} particle shape.`);

  let seed = kind === "om" ? 731 : 1289;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const shapeWidth = Math.min(viewport.width * 0.7, viewport.height * 0.52, 4.8);
  const centerX = viewport.width > 8 ? viewport.width * 0.23 : 0;
  const centerY = viewport.width < 5 ? -viewport.height * 0.19 : 0;
  const result = new Float32Array(count * 3);

  for (let i = 0; i < count; i += 1) {
    const [x, y] = samples[Math.floor(random() * samples.length)];
    result[i * 3] = ((x - 256) / 512) * shapeWidth + centerX;
    result[i * 3 + 1] = ((256 - y) / 512) * shapeWidth + centerY;
    result[i * 3 + 2] = 0;
  }
  return result;
}

function GaneshIdol({ active }: { active: boolean }) {
  const group = useRef<THREE.Group>(null);
  const viewport = useThree((state) => state.viewport);
  const width = Math.min(viewport.width * 0.7, viewport.height * 0.52, 4.8);
  const scale = width / 3.8;
  const centerX = viewport.width > 8 ? viewport.width * 0.23 : 0;
  const centerY = viewport.width < 5 ? -viewport.height * 0.19 : 0;

  useEffect(() => {
    group.current?.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        if (!(material instanceof THREE.MeshStandardMaterial)) continue;
        material.transparent = true;
        material.opacity = 0;
        material.depthWrite = false;
      }
    });
  }, []);

  useFrame(({ clock }) => {
    const progress = active ? THREE.MathUtils.clamp((clock.elapsedTime - 6) / 2, 0, 1) : 1;
    const eased = progress * progress * (3 - 2 * progress);
    const idol = group.current;
    if (!idol) return;
    idol.visible = eased > 0;
    idol.position.set(centerX, centerY, 0);
    idol.scale.setScalar(scale * (0.84 + eased * 0.16));
    idol.rotation.y = active ? Math.sin(clock.elapsedTime * 0.35) * 0.09 : 0;
    idol.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        if (material instanceof THREE.MeshStandardMaterial) material.opacity = eased;
      }
    });
  });

  return (
    <group ref={group} visible={false}>
      <mesh position={[0, -0.92, -0.15]} scale={[1.38, 0.27, 0.66]}>
        <sphereGeometry args={[1, 32, 24]} />
        <meshStandardMaterial color="#8f431d" metalness={0.78} roughness={0.28} transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh position={[0, -0.46, 0]} scale={[0.91, 0.91, 0.58]}>
        <sphereGeometry args={[1, 40, 32]} />
        <meshStandardMaterial color="#dca64b" metalness={0.64} roughness={0.31} transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.51, 0]} scale={[0.67, 0.77, 0.55]}>
        <sphereGeometry args={[1, 40, 32]} />
        <meshStandardMaterial color="#f0c979" metalness={0.52} roughness={0.3} transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh position={[-0.79, 0.49, 0.2]} scale={[0.25, 0.48, 0.08]}>
        <sphereGeometry args={[1, 28, 20]} />
        <meshStandardMaterial color="#ed8950" metalness={0.32} roughness={0.4} transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh position={[0.79, 0.49, 0.2]} scale={[0.25, 0.48, 0.08]}>
        <sphereGeometry args={[1, 28, 20]} />
        <meshStandardMaterial color="#ed8950" metalness={0.32} roughness={0.4} transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh position={[-0.79, 0.48, -0.04]} rotation={[0, 0, 0.12]} scale={[0.48, 0.7, 0.25]}>
        <sphereGeometry args={[1, 32, 24]} />
        <meshStandardMaterial color="#b76a3d" metalness={0.55} roughness={0.35} transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh position={[0.79, 0.48, -0.04]} rotation={[0, 0, -0.12]} scale={[0.48, 0.7, 0.25]}>
        <sphereGeometry args={[1, 32, 24]} />
        <meshStandardMaterial color="#b76a3d" metalness={0.55} roughness={0.35} transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh position={[0, 1.31, -0.04]} scale={[0.55, 0.25, 0.42]}>
        <sphereGeometry args={[1, 32, 24]} />
        <meshStandardMaterial color="#d7a844" metalness={0.78} roughness={0.23} transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.03, 0.52]} rotation={[0.25, 0, -0.12]} scale={[0.18, 0.6, 0.16]}>
        <capsuleGeometry args={[0.44, 0.55, 6, 16]} />
        <meshStandardMaterial color="#f4d18c" metalness={0.42} roughness={0.28} transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh position={[0.06, -0.54, 0.55]} rotation={[0, 0, -0.42]} scale={[0.15, 0.24, 0.12]}>
        <sphereGeometry args={[1, 24, 20]} />
        <meshStandardMaterial color="#f4d18c" metalness={0.42} roughness={0.28} transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh position={[-0.86, -0.36, 0.2]} rotation={[0, 0, 0.44]} scale={[0.25, 0.62, 0.2]}>
        <capsuleGeometry args={[0.38, 0.5, 6, 14]} />
        <meshStandardMaterial color="#cf9840" metalness={0.62} roughness={0.31} transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh position={[0.86, -0.36, 0.2]} rotation={[0, 0, -0.44]} scale={[0.25, 0.62, 0.2]}>
        <capsuleGeometry args={[0.38, 0.5, 6, 14]} />
        <meshStandardMaterial color="#cf9840" metalness={0.62} roughness={0.31} transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh position={[-1.02, -0.77, 0.27]} scale={[0.23, 0.28, 0.11]}>
        <sphereGeometry args={[1, 24, 18]} />
        <meshStandardMaterial color="#f0c979" metalness={0.5} roughness={0.3} transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh position={[1.02, -0.77, 0.27]} scale={[0.23, 0.28, 0.11]}>
        <sphereGeometry args={[1, 24, 18]} />
        <meshStandardMaterial color="#f0c979" metalness={0.5} roughness={0.3} transparent opacity={0} depthWrite={false} />
      </mesh>
      {[-0.34, 0.34].map((x) => (
        <mesh key={`eye-${x}`} position={[x, 0.58, 0.48]} scale={[0.07, 0.055, 0.04]}>
          <sphereGeometry args={[1, 20, 16]} />
          <meshStandardMaterial color="#772a20" emissive="#a22f20" emissiveIntensity={0.45} transparent opacity={0} depthWrite={false} />
        </mesh>
      ))}
      {[-0.41, 0.41].map((x) => (
        <mesh key={`tusk-${x}`} position={[x, 0.09, 0.47]} rotation={[0, 0, x < 0 ? 0.32 : -0.32]} scale={[0.11, 0.32, 0.11]}>
          <coneGeometry args={[0.5, 1, 16]} />
          <meshStandardMaterial color="#fff0cb" metalness={0.18} roughness={0.32} transparent opacity={0} depthWrite={false} />
        </mesh>
      ))}
      <mesh position={[0, 1.68, -0.08]} scale={[0.22, 0.3, 0.18]}>
        <coneGeometry args={[0.5, 1, 8]} />
        <meshStandardMaterial color="#dcb45e" metalness={0.8} roughness={0.2} transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh position={[0, 1.35, -0.05]}>
        <cylinderGeometry args={[0.34, 0.48, 0.24, 16]} />
        <meshStandardMaterial color="#c9953d" metalness={0.82} roughness={0.22} transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh position={[0, 1.69, -0.05]} scale={[0.39, 0.55, 0.33]}>
        <coneGeometry args={[0.5, 1, 12]} />
        <meshStandardMaterial color="#e2b953" metalness={0.82} roughness={0.2} transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh position={[0, 1.63, 0.33]} scale={[0.09, 0.12, 0.05]}>
        <sphereGeometry args={[1, 24, 20]} />
        <meshStandardMaterial color="#a92824" emissive="#6d1610" emissiveIntensity={0.35} metalness={0.35} roughness={0.2} transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh position={[0, 1.46, 0.02]} rotation={[Math.PI / 2, 0, 0]} scale={[0.43, 0.43, 0.08]}>
        <torusGeometry args={[1, 0.07, 10, 40]} />
        <meshStandardMaterial color="#e5be68" metalness={0.85} roughness={0.18} transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh position={[0, -0.83, 0.52]} rotation={[Math.PI / 2, 0, 0]} scale={[0.34, 0.34, 0.08]}>
        <torusGeometry args={[1, 0.07, 10, 36]} />
        <meshStandardMaterial color="#e5be68" metalness={0.85} roughness={0.18} transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh position={[0, -0.15, 0.5]} rotation={[Math.PI / 2, 0, 0]} scale={[0.55, 0.42, 0.07]}>
        <torusGeometry args={[1, 0.055, 8, 40]} />
        <meshStandardMaterial color="#e8c06a" metalness={0.86} roughness={0.2} transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh position={[0, -0.3, 0.49]} rotation={[Math.PI / 2, 0, 0]} scale={[0.63, 0.46, 0.07]}>
        <torusGeometry args={[1, 0.035, 8, 40]} />
        <meshStandardMaterial color="#c98f35" metalness={0.82} roughness={0.23} transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.12, -0.55]} rotation={[0, 0, 0]}>
        <torusGeometry args={[1.65, 0.025, 6, 64]} />
        <meshStandardMaterial color="#f6ce73" emissive="#b97820" emissiveIntensity={0.7} transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

function ParticleSequence({ active, onReveal, onComplete }: CanvasProps) {
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
  const targets = useMemo(() => {
    const om = getShapePoints("om", count, viewport);
    const ganesh = getShapePoints("ganesh", count, viewport);
    const start = new Float32Array(count * 3);
    const scatter = new Float32Array(count * 3);
    let seed = 1947;
    const random = () => {
      seed = (seed * 48271) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    for (let i = 0; i < count; i += 1) {
      start[i * 3] = (random() - 0.5) * viewport.width * 1.3;
      start[i * 3 + 1] = (random() - 0.5) * viewport.height * 1.1;
      start[i * 3 + 2] = (random() - 0.5) * 2;
      scatter[i * 3] = (random() - 0.5) * viewport.width * 1.4;
      scatter[i * 3 + 1] = (random() - 0.5) * viewport.height * 1.2;
      scatter[i * 3 + 2] = (random() - 0.5) * 2;
    }

    return { start, om, ganesh, scatter };
  }, [count, viewport]);

  useEffect(() => {
    if (!active) invalidate();
  }, [active, invalidate]);

  useFrame(({ clock }) => {
    if (!active) {
      if (material.current) material.current.opacity = 0;
      return;
    }

    const time = clock.elapsedTime;
    const positions = geometry.getAttribute("position") as THREE.BufferAttribute;
    const current = positions.array as Float32Array;
    let from = targets.start;
    let to = targets.start;
    let progress = 1;
    let opacity = Math.min(1, time / 0.7);

    if (time >= 2 && time < 4) {
      from = targets.start;
      to = targets.om;
      progress = (time - 2) / 2;
    } else if (time >= 4 && time < 6) {
      from = targets.om;
      to = targets.ganesh;
      progress = (time - 4) / 2;
    } else if (time >= 6 && time < 8) {
      from = targets.ganesh;
      to = targets.scatter;
      progress = (time - 6) / 2;
      opacity = 1 - progress;
    } else if (time >= 8) {
      from = targets.ganesh;
      to = targets.ganesh;
      progress = 1;
      opacity = 0;
    }

    const eased = progress * progress * (3 - 2 * progress);
    for (let i = 0; i < current.length; i += 1) {
      current[i] = THREE.MathUtils.lerp(from[i], to[i], eased);
    }
    positions.needsUpdate = true;
    if (material.current) material.current.opacity = opacity;

    if (time >= 8 && !revealed.current) {
      revealed.current = true;
      onReveal();
    }
    if (time >= 10.5 && !completed.current) {
      completed.current = true;
      onComplete();
    }
  });

  return (
    <>
      <ambientLight intensity={1.4} />
      <pointLight position={[0, 1.8, 4]} intensity={32} color="#ffcc6d" />
      <pointLight position={[-3, -1, 2]} intensity={14} color="#e97133" />
      <GaneshIdol active={active} />
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
    </>
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
      <ParticleSequence active={active} onReveal={onReveal} onComplete={onComplete} />
    </Canvas>
  );
}
