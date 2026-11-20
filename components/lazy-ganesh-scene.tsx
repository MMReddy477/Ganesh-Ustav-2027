"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const GaneshScene = dynamic(() => import("@/components/ganesh-scene").then((module) => module.GaneshScene), {
  ssr: false,
  loading: () => null,
});

export function LazyGaneshScene() {
  const container = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!container.current || !("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: "140px" });
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={container} className="scene-loader" aria-label="Animated golden Ganesha-inspired sculpture">
      <Image src="/images/ganesh-art.jpg" alt="" fill sizes="(max-width: 760px) 90vw, 65vw" className="scene-fallback" />
      {visible && <GaneshScene />}
    </div>
  );
}
