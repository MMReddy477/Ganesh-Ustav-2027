"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Search, Share2, X } from "lucide-react";
import { useEffect, useState } from "react";

const sections = [
  { title: "Programme", text: "Aarti, bhajans and cultural events", href: "#schedule" },
  { title: "Festival dashboard", text: "Community and finance overview", href: "#overview" },
  { title: "Supporters", text: "Sponsors and community partners", href: "#sponsors" },
  { title: "2026 auction archive", text: "Laddu and kalasam winners", href: "#auction-last" },
  { title: "Donations", text: "Public contribution records", href: "#donations" },
  { title: "Expenses", text: "Published expenses and accounts", href: "#expenses" },
];

export function FestivalTools() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const results = sections.filter((section) => `${section.title} ${section.text}`.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((error: unknown) => console.error("Service worker registration failed:", error));
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  async function share() {
    const data = { title: "Ganesh Utsav 2027 · Suryodaya Colony", text: "Celebrating faith, culture and community in Suryodaya Colony, Hyderabad.", url: window.location.href };
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(data.url);
        setMessage("Link copied");
        window.setTimeout(() => setMessage(""), 2200);
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        console.error("Festival link could not be shared:", error);
        setMessage("Sharing isn’t available in this browser.");
        window.setTimeout(() => setMessage(""), 2500);
      }
    }
  }

  return (
    <>
      <div className="festival-tools" aria-label="Festival tools">
        <button type="button" onClick={() => setOpen(true)} aria-label="Search the festival website"><Search size={18} /></button>
        <button type="button" onClick={share} aria-label="Share Ganesh Utsav 2027"><Share2 size={17} /></button>
        {message && <span role="status">{message}</span>}
      </div>
      <AnimatePresence>
        {open && (
          <motion.div className="search-overlay" role="dialog" aria-modal="true" aria-label="Search this website" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)}>
            <motion.div className="search-panel" initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 8, opacity: 0 }} onClick={(event) => event.stopPropagation()}>
              <div className="search-panel-head"><span>FIND YOUR WAY TO THE FESTIVAL</span><button type="button" onClick={() => setOpen(false)} aria-label="Close search"><X size={19} /></button></div>
              <label className="search-input-wrap"><Search size={18} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search events, seva, memories…" /></label>
              <div className="search-results">
                {results.map((result) => <a key={result.href} href={result.href} onClick={() => setOpen(false)}><span><strong>{result.title}</strong><small>{result.text}</small></span><ArrowRight size={15} /></a>)}
                {!results.length && <p>No matches yet. Try “aarti”, “volunteer” or “donate”.</p>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
