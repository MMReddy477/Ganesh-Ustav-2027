"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowDown, ArrowRight, CalendarDays, ChartNoAxesColumnIncreasing, House, Images, UsersRound } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { FloatingPetals } from "@/components/floating-petals";

const IntroCanvas = dynamic(
  () => import("@/components/cinematic-intro-canvas").then((module) => module.CinematicIntroCanvas),
  { ssr: false, loading: () => null },
);

const INTRO_KEY = "suryodaya-ganesh-intro-complete";

export function CinematicHero() {
  const heroRef = useRef<HTMLElement>(null);
  const [introActive, setIntroActive] = useState(true);
  const [revealStarted, setRevealStarted] = useState(false);

  const finishIntro = useCallback(() => {
    window.sessionStorage.setItem(INTRO_KEY, "true");
    setIntroActive(false);
    setRevealStarted(true);
  }, []);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion || window.sessionStorage.getItem(INTRO_KEY) === "true") {
      setIntroActive(false);
      setRevealStarted(true);
    }
  }, []);

  useEffect(() => {
    const element = heroRef.current;
    if (!element) return;

    let resizeTimeout: number | undefined;
    const syncCanvasSize = () => {
      if (resizeTimeout !== undefined) return;
      resizeTimeout = window.setTimeout(() => window.dispatchEvent(new Event("resize")), 500);
    };
    const observer = new MutationObserver(() => {
      if (element.querySelector(".hero-intro-canvas canvas")) {
        observer.disconnect();
        syncCanvasSize();
      }
    });

    observer.observe(element, { childList: true, subtree: true });
    if (element.querySelector(".hero-intro-canvas canvas")) {
      observer.disconnect();
      syncCanvasSize();
    }

    return () => {
      observer.disconnect();
      if (resizeTimeout !== undefined) window.clearTimeout(resizeTimeout);
    };
  }, []);

  return (
    <section ref={heroRef} className="hero hero-cinematic" id="home">
      <div className="hero-grain" aria-hidden="true" />
      <div className="hero-halo" aria-hidden="true" />
      <motion.div
        className="hero-temple-light"
        aria-hidden="true"
        initial={false}
        animate={{ opacity: revealStarted ? 1 : 0 }}
        transition={{ duration: 1.4, ease: "easeOut" }}
      />
      {(revealStarted || !introActive) && <FloatingPetals />}
      <div className="hero-wrap">
        <div className="hero-copy">
          <p className="eyebrow hero-eyebrow"><span className="live-dot" /> II GANAPATI BAPPA MORYA II</p>
          <h1 className="hero-title">
            <span>SURYODAYA COLONY</span>
            <em>GANESH UTSAV</em>
            <small>2027</small>
          </h1>
          <p className="hero-subtitle">One Community <span aria-hidden="true">•</span> 4th Year Celebration</p>
          <p className="hero-tagline">Faith <span aria-hidden="true">•</span> Community <span aria-hidden="true">•</span> Transparency</p>
          <div className="hero-actions hero-cta-row">
            <button type="button" className="button button-light" onClick={() => window.dispatchEvent(new Event("utsav:open-donation"))}>
              Donate Now <ArrowRight size={17} />
            </button>
            <a className="button button-outline" href="#schedule"><CalendarDays size={15} /> Events</a>
            <a className="button button-outline" href="#gallery"><Images size={15} /> Gallery</a>
          </div>
          <div className="hero-identity" aria-label="Suryodaya Colony community facts">
            <div className="hero-identity-stats">
              <span><UsersRound size={17} aria-hidden="true" /><strong>34</strong><small>Families</small></span>
              <span><CalendarDays size={17} aria-hidden="true" /><strong>4th Year</strong><small>Celebration</small></span>
              <span><House size={17} aria-hidden="true" /><strong>Every Home</strong><small>Involved</small></span>
              <span><ChartNoAxesColumnIncreasing size={17} aria-hidden="true" /><strong>Live</strong><small>Transparency</small></span>
            </div>
          </div>
        </div>
        <motion.div
          className="hero-art"
          initial={false}
          animate={{ opacity: revealStarted || !introActive ? 1 : 0, scale: revealStarted || !introActive ? 1 : 0.97 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          aria-hidden={!(revealStarted || !introActive)}
        >
          <div className="hero-art-orbit orbit-one" />
          <div className="hero-art-orbit orbit-two" />
          <div className="hero-image-frame" role="img" aria-label="Lord Ganesha seated on an ornate golden altar">
            {revealStarted && (
              <Image
                src="/images/Ganesha%20beneath%20golden%20temple%20bells.png"
                alt=""
                fill
                sizes="(max-width: 760px) 94vw, (max-width: 1280px) 48vw, 660px"
                priority
                className={`hero-image${introActive ? "" : " hero-image-visible"}`}
              />
            )}
          </div>
          <div className="hero-sparkle sparkle-a">✳</div>
          <div className="hero-sparkle sparkle-b">✴</div>
        </motion.div>
      </div>
      <a className="scroll-cue" href="#overview"><span>SCROLL TO FEEL THE JOY</span><ArrowDown size={14} /></a>
      <div className="hero-bottom-line" aria-hidden="true" />

      <div className={`hero-intro-layer${introActive ? "" : " hero-intro-layer-complete"}`}>
        <IntroCanvas active={introActive} onReveal={() => setRevealStarted(true)} onComplete={finishIntro} />
      </div>
      {introActive && (
          <>
            <motion.div
              className="hero-intro-scrim"
              initial={{ opacity: 1 }}
              animate={{ opacity: revealStarted ? 0 : 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: revealStarted ? 1.25 : 0.25, ease: "easeOut" }}
              aria-hidden="true"
            />
            <button className="hero-intro-skip" type="button" onClick={finishIntro}>
              Skip intro <ArrowRight size={14} />
            </button>
          </>
      )}
    </section>
  );
}
