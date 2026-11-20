"use client";

const petals = [
  { left: "7%", delay: "-5s", duration: "17s", size: "12px" },
  { left: "19%", delay: "-13s", duration: "21s", size: "8px" },
  { left: "38%", delay: "-2s", duration: "19s", size: "11px" },
  { left: "57%", delay: "-10s", duration: "24s", size: "9px" },
  { left: "74%", delay: "-7s", duration: "20s", size: "13px" },
  { left: "92%", delay: "-16s", duration: "23s", size: "8px" },
];

const particles = [
  { left: "9%", top: "26%", delay: "-1s", duration: "11s", size: "2px" },
  { left: "23%", top: "68%", delay: "-8s", duration: "14s", size: "3px" },
  { left: "35%", top: "18%", delay: "-4s", duration: "12s", size: "2px" },
  { left: "48%", top: "74%", delay: "-10s", duration: "15s", size: "2px" },
  { left: "62%", top: "23%", delay: "-6s", duration: "13s", size: "3px" },
  { left: "73%", top: "64%", delay: "-2s", duration: "16s", size: "2px" },
  { left: "84%", top: "32%", delay: "-12s", duration: "12s", size: "2px" },
  { left: "94%", top: "77%", delay: "-5s", duration: "14s", size: "3px" },
];

export function FloatingPetals() {
  return (
    <div className="petal-layer" aria-hidden="true">
      {petals.map((petal) => (
        <span
          className="petal"
          key={petal.left}
          style={{ left: petal.left, animationDelay: petal.delay, animationDuration: petal.duration, fontSize: petal.size }}
        >
          ✿
        </span>
      ))}
      {particles.map((particle) => (
        <span
          className="hero-particle"
          key={particle.left}
          style={{
            left: particle.left,
            top: particle.top,
            animationDelay: particle.delay,
            animationDuration: particle.duration,
            width: particle.size,
            height: particle.size,
          }}
        />
      ))}
    </div>
  );
}
