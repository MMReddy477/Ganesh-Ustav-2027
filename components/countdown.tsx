"use client";

import { useEffect, useState } from "react";

type TimeLeft = { days: number; hours: number; minutes: number; seconds: number };

function getTimeLeft(): TimeLeft {
  const difference = Math.max(0, new Date("2027-09-14T07:00:00+05:30").getTime() - Date.now());
  return {
    days: Math.floor(difference / 86_400_000),
    hours: Math.floor((difference / 3_600_000) % 24),
    minutes: Math.floor((difference / 60_000) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

export function Countdown() {
  const [time, setTime] = useState<TimeLeft | null>(null);

  useEffect(() => {
    const update = () => setTime(getTimeLeft());
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="countdown" aria-label="Countdown to Ganesh Utsav">
      {(["days", "hours", "minutes", "seconds"] as const).map((unit) => (
        <div className="countdown-unit" key={unit}>
          <strong>{time ? String(time[unit]).padStart(2, "0") : "--"}</strong>
          <span>{unit.toUpperCase()}</span>
        </div>
      ))}
    </div>
  );
}
