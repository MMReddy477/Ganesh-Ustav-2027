"use client";

import { Pause, Volume2 } from "lucide-react";
import { useRef, useState } from "react";

export function AudioToggle() {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  async function toggleAudio() {
    if (!audio.current) return;
    if (playing) {
      audio.current.pause();
      setPlaying(false);
      return;
    }
    try {
      await audio.current.play();
      setPlaying(true);
    } catch (error) {
      console.error("Festival audio could not be played:", error);
    }
  }

  return (
    <>
      <audio ref={audio} src="/media/ganesh-song.mpeg" loop preload="none" onPause={() => setPlaying(false)} onPlay={() => setPlaying(true)} />
      <button className={`audio-toggle${playing ? " audio-playing" : ""}`} type="button" onClick={toggleAudio} aria-pressed={playing} aria-label={playing ? "Pause devotional music" : "Play devotional music"}>
        {playing ? <Pause size={13} /> : <Volume2 size={14} />}
        <span>{playing ? "Pause music" : "Play music"}</span>
      </button>
    </>
  );
}
