"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowDown, ArrowRight, CalendarDays, ChartNoAxesColumnIncreasing, Download, House, Images, Pause, Play, UsersRound, Volume2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { FloatingPetals } from "@/components/floating-petals";

const IntroEffects = dynamic(
  () => import("@/components/cinematic-intro-effects").then((module) => module.CinematicIntroEffects),
  { ssr: false, loading: () => null },
);

const INTRO_KEY = "suryodaya-ganesh-intro-complete-v4";

type IntroFrame = { fileName: string; src: string };
type CinematicHeroProps = { introFrames: IntroFrame[] };

export function CinematicHero({ introFrames }: CinematicHeroProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [ready, setReady] = useState(false);
  const [introActive, setIntroActive] = useState(true);
  const [revealStarted, setRevealStarted] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);

  const finishIntro = useCallback(() => {
    try {
      window.localStorage.setItem(INTRO_KEY, "true");
    } catch (error) {
      console.error("Could not save the intro preference:", error);
    }
    audioRef.current?.pause();
    setIntroActive(false);
    setRevealStarted(true);
  }, []);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let introSeen = false;
    try {
      introSeen = window.localStorage.getItem(INTRO_KEY) === "true";
    } catch (error) {
      console.error("Could not read the intro preference:", error);
    }
    if (prefersReducedMotion || introSeen) {
      setIntroActive(false);
      setRevealStarted(true);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || !introActive) return;
    const previousOverflow = document.documentElement.style.overflow;
    const audio = audioRef.current;
    document.documentElement.style.overflow = "hidden";
    const revealTimeout = window.setTimeout(() => setRevealStarted(true), 7_000);
    const timeout = window.setTimeout(finishIntro, 10_000);
    return () => {
      document.documentElement.style.overflow = previousOverflow;
      window.clearTimeout(revealTimeout);
      window.clearTimeout(timeout);
      audio?.pause();
    };
  }, [finishIntro, introActive, ready]);

  async function toggleIntroSound() {
    const audio = audioRef.current;
    if (!audio) return;
    if (soundEnabled) {
      audio.pause();
      setSoundEnabled(false);
      return;
    }
    try {
      await audio.play();
      setSoundEnabled(true);
    } catch (error) {
      console.error("Devotional intro music could not be played:", error);
    }
  }

  return (
    <section className={`hero hero-cinematic${ready && introActive ? " hero-intro-open" : ""}`} id="home">
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
            {!introActive && (
              <>
                <button
                  type="button"
                  className="button button-outline"
                  onClick={() => {
                    setRevealStarted(false);
                    setIntroActive(true);
                  }}
                >
                  <Play size={15} /> Watch intro
                </button>
                <a
                  className="button button-outline"
                  href="/downloads/ganesh-utsav-intro-frames.zip"
                  download="ganesh-utsav-intro-frames.zip"
                  aria-label="Download the intro sequence images as a ZIP file"
                >
                  <Download size={15} /> Download intro
                </a>
              </>
            )}
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
          <div className="hero-image-frame" role="img" aria-label="A softly animated golden Ganesha-inspired sculpture" />
          <div className="hero-sparkle sparkle-a">✳</div>
          <div className="hero-sparkle sparkle-b">✴</div>
        </motion.div>
      </div>
      {!introActive && introFrames.length > 0 && (
        <div className="hero-sequence-strip" role="region" aria-label="Intro sequence images" tabIndex={0}>
          {introFrames.map((frame, index) => (
            <div className="hero-sequence-frame" key={frame.fileName}>
              <Image
                src={frame.src}
                alt={`Intro sequence frame ${index + 1} of ${introFrames.length}`}
                width={96}
                height={64}
                sizes="96px"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      )}
      <a className="scroll-cue" href="#overview"><span>SCROLL TO FEEL THE JOY</span><ArrowDown size={14} /></a>
      <div className="hero-bottom-line" aria-hidden="true" />

      {ready && introActive && (
        <div className="hero-intro-overlay" role="dialog" aria-modal="true" aria-label="From Bal Ganesh to Lord Ganesha">
          <div className="hero-intro-visuals" aria-hidden="true">
            <div className="intro-scene intro-sequence-image sequence-image-one">
              <span className="sequence-image-backdrop" /><span className="sequence-image-main" />
            </div>
            <div className="intro-scene intro-sequence-image sequence-image-two">
              <span className="sequence-image-backdrop" /><span className="sequence-image-main" />
            </div>
            <div className="intro-scene intro-sequence-image sequence-image-three">
              <span className="sequence-image-backdrop" /><span className="sequence-image-main" />
            </div>
            <div className="intro-scene intro-sequence-image sequence-image-four">
              <span className="sequence-image-backdrop" /><span className="sequence-image-main" />
            </div>
            <div className="intro-scene intro-sequence-image sequence-image-five">
              <span className="sequence-image-backdrop" /><span className="sequence-image-main" />
            </div>
            <div className="intro-scene intro-sequence-image sequence-image-six">
              <span className="sequence-image-backdrop" /><span className="sequence-image-main" />
            </div>
            <div className="intro-scene intro-sequence-image sequence-image-seven">
              <span className="sequence-image-backdrop" /><span className="sequence-image-main" />
            </div>
            <div className="intro-scene intro-sequence-image sequence-image-eight">
              <span className="sequence-image-backdrop" /><span className="sequence-image-main" />
            </div>
            <div className="intro-scene intro-scene-om">
              <div className="cosmic-universe">
                <span className="cosmic-galaxy galaxy-one" />
                <span className="cosmic-galaxy galaxy-two" />
                <span className="cosmic-nebula" />
              </div>
              <span className="opening-image" />
              <span className="opening-ui-cleanup" />
              <span className="intro-om">ॐ</span>
            </div>
            <div className="intro-scene intro-scene-kailasa">
              <span className="kailasa-reference-image" />
              <span className="kailasa-portal" />
              <span className="kailasa-sun" />
              <span className="kailasa-peak kailasa-peak-back" />
              <span className="kailasa-peak kailasa-peak-mid" />
              <span className="kailasa-peak kailasa-peak-front" />
              <span className="kailasa-cloud" />
              <span className="kailasa-cloud kailasa-cloud-two" />
              <div className="parvati-silhouette parvati-meditating">
                <i />
                <span className="parvati-lotus" />
                <span className="parvati-hands" />
                <span className="parvati-smile" />
              </div>
              <span className="kailasa-petals">✿　✿　✿</span>
              <span className="kailasa-diya" />
              <div className="sandalwood-vessel"><span /></div>
            </div>
            <div className="intro-scene intro-scene-creation">
              <span className="creation-reference-image" />
              <span className="sanctuary-arch" />
              <span className="creation-aura" />
              <div className="parvati-silhouette parvati-creating">
                <i />
                <span className="parvati-lotus" />
                <span className="parvati-hands creation-hands"><i /></span>
                <span className="parvati-smile" />
              </div>
              <span className="creation-energy energy-left" />
              <span className="creation-energy energy-right" />
              <span className="creation-lotus"><i /><i /><i /><i /><i /><i /></span>
              <div className="creation-child">
                <span className="creation-child-head"><i /></span>
                <span className="creation-child-body" />
              </div>
              <span className="creation-sparkles">✦　✧　✦　✧　✦</span>
              <span className="creation-lens-petal" />
            </div>
            <div className="intro-scene intro-scene-bal-ganesh">
              <span className="bal-sanctuary-glow" />
              <span className="bal-reference-image" />
              <span className="bal-reveal-petal" />
              <div className="parvati-silhouette parvati-bal">
                <i />
                <span className="parvati-lotus" />
                <span className="parvati-hand-on-shoulder" />
              </div>
              <div className="bal-ganesh">
                <span className="bal-halo" />
                <span className="bal-crown">✦</span>
                <span className="bal-ear ear-left" />
                <span className="bal-ear ear-right" />
                <span className="bal-head"><i /><b /></span>
                <span className="bal-body" />
                <span className="bal-blessing-hand" />
              </div>
              <span className="bal-petals">✿　✦　✿　✦　✿</span>
            </div>
            <div className="intro-scene intro-scene-garden">
              <span className="garden-reference-image" />
              <span className="garden-sky" />
              <span className="garden-trees" />
              <span className="garden-pond" />
              <span className="garden-lotus lotus-one" />
              <span className="garden-lotus lotus-two" />
              <span className="garden-lotus lotus-three" />
              <span className="garden-peacock peacock-left"><i /><b /></span>
              <span className="garden-peacock peacock-right"><i /><b /></span>
              <div className="heavenly-child">
                <span className="heavenly-child-head">
                  <i className="garden-ear" />
                  <i className="garden-eye" />
                  <b className="garden-trunk" />
                  <em className="garden-crown">✦</em>
                </span>
                <span className="heavenly-child-body" />
                <span className="heavenly-child-aura" />
              </div>
              <span className="golden-butterfly butterfly-left">✦</span>
              <span className="golden-butterfly butterfly-right">✦</span>
              <span className="garden-particles">✦　✧　✦　✧</span>
            </div>
            <div className="intro-scene intro-scene-transformation">
              <span className="transformation-om">ॐ</span>
              <span className="transformation-reference-image" />
              <span className="transformation-aura" />
              <span className="transformation-energy">✦　✧　✦　✧　✦</span>
              <span className="match-hand child-match-hand" />
              <span className="match-hand divine-match-hand" />
              <span className="transformation-idol" />
            </div>
            <div className="intro-scene intro-scene-throne">
              <span className="throne-veil" />
              <span className="temple-bell bell-left" />
              <span className="temple-bell bell-right" />
              <span className="intro-diya diya-left" />
              <span className="intro-diya diya-right" />
              <span className="intro-marigolds">✿　✿　✿　✿　✿</span>
              <span className="throne-petals">✿　✿　✿　✿　✿　✿</span>
            </div>
            <div className="intro-scene intro-scene-title">
              <span className="title-om">ॐ</span>
              <strong>SURYODAYA COLONY GANESH UTSAV</strong>
              <span>One Community • 4th Year Celebration</span>
              <small>Faith • Community • Transparency</small>
              <em>Ganapati Bappa Morya 🙏</em>
            </div>
          </div>
          <div className="hero-intro-layer">
            <IntroEffects />
          </div>
          <>
            <audio ref={audioRef} src="/media/ganesh-song.mpeg" preload="none" />
            <div className="hero-intro-controls">
              <button className="hero-intro-sound" type="button" onClick={toggleIntroSound} aria-pressed={soundEnabled}>
                {soundEnabled ? <Pause size={14} /> : <Volume2 size={14} />}
                {soundEnabled ? "Mute music" : "Play devotional music"}
              </button>
              <a
                className="hero-intro-download"
                href="/downloads/ganesh-utsav-intro-frames.zip"
                download="ganesh-utsav-intro-frames.zip"
                aria-label="Download the eight intro sequence images as a ZIP file"
              >
                <Download size={14} /> Download
              </a>
              <button className="hero-intro-skip" type="button" onClick={finishIntro} autoFocus>
                Skip intro <ArrowRight size={14} />
              </button>
            </div>
          </>
        </div>
      )}
      {!introActive && ready && revealStarted && (
        <div className="hero-intro-layer hero-intro-layer-complete" aria-hidden="true" />
      )}
    </section>
  );
}
