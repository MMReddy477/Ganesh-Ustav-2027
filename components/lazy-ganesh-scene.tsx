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

  useEffect(() => {
    const element = container.current;
    if (!visible || !element) return;

    let resizeTimeout: number | undefined;
    const resize = () => {
      if (resizeTimeout !== undefined) return;
      resizeTimeout = window.setTimeout(() => window.dispatchEvent(new Event("resize")), 500);
    };
    const observer = new MutationObserver(() => {
      if (element.querySelector(".scene-canvas canvas")) {
        observer.disconnect();
        resize();
      }
    });

    observer.observe(element, { childList: true, subtree: true });
    if (element.querySelector(".scene-canvas canvas")) {
      observer.disconnect();
      resize();
    }

    return () => {
      observer.disconnect();
      if (resizeTimeout !== undefined) window.clearTimeout(resizeTimeout);
    };
  }, [visible]);

  return (
    <div ref={container} className="scene-loader" aria-label="Animated golden Ganesha-inspired sculpture">
      <Image src="/images/Ganesha%20beneath%20golden%20temple%20bells.png" alt="" fill sizes="(max-width: 760px) 90vw, 65vw" className="scene-fallback" />
      {visible && <GaneshScene />}
    </div>
  );
}
