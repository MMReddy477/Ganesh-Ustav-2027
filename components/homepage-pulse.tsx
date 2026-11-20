"use client";

import {
  ArrowRight,
  Heart,
  IndianRupee,
  Landmark,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatFestivalDate, formatFestivalDateTime, formatFestivalTime } from "@/lib/festival-date-time";

export type HomepageDonation = {
  plot_flat: string | null;
  donor_name: string | null;
  amount: number;
  received_at: string;
};

export type MetricIconKey = "donations" | "auction" | "expenses" | "balance";

export type MetricDetail = {
  title: string;
  description?: string;
  amount?: number;
  dateTime?: string;
  date?: string;
  time?: string | null;
};

export type Metric = {
  label: string;
  value: number | null;
  note: string;
  icon: MetricIconKey;
  format?: "currency";
  details?: MetricDetail[];
  detailsNote?: string;
};

const metricIcons: Record<MetricIconKey, LucideIcon> = {
  donations: IndianRupee,
  auction: Trophy,
  expenses: Landmark,
  balance: Sparkles,
};

function formatMetric(value: number, format?: Metric["format"]) {
  const formatted = value.toLocaleString("en-IN");
  return format === "currency" ? `₹${formatted}` : formatted;
}

function formatDetailDateTime(detail: MetricDetail) {
  if (detail.dateTime) return formatFestivalDateTime(detail.dateTime);
  if (detail.date) return `${formatFestivalDate(detail.date)} ${formatFestivalTime(detail.time)}`;
  if (detail.time) return formatFestivalTime(detail.time);
  return null;
}

function AnimatedMetric({ metric }: { metric: Metric }) {
  const [count, setCount] = useState(metric.value ?? 0);
  const node = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (metric.value === null || !node.current) return;
    const element = node.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const target = metric.value ?? 0;
      const start = performance.now();
      const duration = 1100;
      setCount(0);

      const tick = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - (1 - progress) ** 4;
        setCount(Math.round(target * eased));
        if (progress < 1) window.requestAnimationFrame(tick);
      };

      window.requestAnimationFrame(tick);
    }, { threshold: 0.35 });

    observer.observe(element);
    return () => observer.disconnect();
  }, [metric.value]);

  return (
    <span ref={node} className="pulse-metric-value">
      {metric.value === null ? "Not tracked" : formatMetric(count, metric.format)}
    </span>
  );
}

function donationAddress(donation: HomepageDonation) {
  if (donation.plot_flat) {
    return /^(villa|plot)/i.test(donation.plot_flat) ? donation.plot_flat : `Flat ${donation.plot_flat}`;
  }
  return donation.donor_name || "Community devotee";
}

export function HomepagePulse({
  donations,
  metrics,
  title = "Dashboard.",
  viewAllHref = "#donations",
  emptyMessage = "Donor details appear here only after they agree to public recognition.",
  variant = "public",
}: {
  donations: HomepageDonation[];
  metrics: Metric[];
  title?: string;
  viewAllHref?: string;
  emptyMessage?: string;
  variant?: "public" | "admin";
}) {
  const seenRecentDonationKeys = new Set<string>();
  const recentDonations = donations.filter((donation) => {
    const location = donation.plot_flat?.trim().toLowerCase() || donation.donor_name?.trim().toLowerCase();
    if (!location) return true;

    const key = `${location}\u0000${Number(donation.amount)}\u0000${formatFestivalDate(donation.received_at)}`;
    if (seenRecentDonationKeys.has(key)) return false;
    seenRecentDonationKeys.add(key);
    return true;
  }).slice(0, 8);
  const recentFeedWindow = useRef<HTMLDivElement>(null);
  const [selectedMetric, setSelectedMetric] = useState<Metric | null>(null);
  const detailsDialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const viewport = recentFeedWindow.current;
    if (!viewport || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let previousTime = 0;
    let direction = 1;
    let position = 0;
    const track = viewport.firstElementChild as HTMLElement | null;
    const scrollSlowly = (time: number) => {
      if (previousTime && track && !viewport.matches(":hover, :active") && !viewport.contains(document.activeElement)) {
        const elapsed = Math.min(time - previousTime, 50);
        const maxScroll = viewport.scrollWidth - viewport.clientWidth;
        if (maxScroll > 0) {
          track.style.transform = "";
          const nextScroll = viewport.scrollLeft + elapsed * 0.008 * direction;
          if (nextScroll >= maxScroll) {
            viewport.scrollLeft = maxScroll;
            direction = -1;
          } else if (nextScroll <= 0) {
            viewport.scrollLeft = 0;
            direction = 1;
          } else {
            viewport.scrollLeft = nextScroll;
          }
        } else {
          const maxTravel = Math.max(0, viewport.clientWidth - track.scrollWidth);
          const nextPosition = position + elapsed * 0.008 * direction;
          if (nextPosition >= maxTravel) {
            position = maxTravel;
            direction = -1;
          } else if (nextPosition <= 0) {
            position = 0;
            direction = 1;
          } else {
            position = nextPosition;
          }
          track.style.transform = `translateX(${position}px)`;
        }
      }

      previousTime = time;
      frame = window.requestAnimationFrame(scrollSlowly);
    };

    frame = window.requestAnimationFrame(scrollSlowly);
    return () => {
      window.cancelAnimationFrame(frame);
      if (track) track.style.transform = "";
    };
  }, [recentDonations.length]);

  useEffect(() => {
    const dialog = detailsDialog.current;
    if (!dialog) return;
    if (selectedMetric && !dialog.open) dialog.showModal();
    else if (!selectedMetric && dialog.open) dialog.close();
  }, [selectedMetric]);

  return (
    <section className={`overview-stats${variant === "admin" ? " overview-stats-admin" : ""}`} id="overview" aria-label="Festival overview">
      <div className="overview-heading">
        <p className="eyebrow"><span className="eyebrow-line" /> A CLEAR VIEW OF OUR COMMUNITY</p>
        <h2><em>{title}</em></h2>
      </div>
      <div className="overview-metrics">
        {metrics.map((metric) => {
          const Icon = metricIcons[metric.icon];
          return (
            <button type="button" className={`pulse-card${metric.icon === "donations" ? " pulse-card-collection" : ""}${metric.icon === "auction" ? " pulse-card-archive" : ""}`} key={metric.label} onClick={() => setSelectedMetric(metric)} aria-label={`View details for ${metric.label}`} aria-haspopup="dialog">
              <span className="pulse-card-icon"><Icon size={17} strokeWidth={1.6} /></span>
              <span className="pulse-card-label">{metric.label}</span>
              <strong><AnimatedMetric metric={metric} /></strong>
              <small>{metric.note}</small>
            </button>
          );
        })}
      </div>
      <dialog
        ref={detailsDialog}
        className="metric-details-dialog"
        aria-labelledby="metric-details-title"
        onClose={() => setSelectedMetric(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) detailsDialog.current?.close();
        }}
      >
        {selectedMetric && (
          <div className="metric-details-content">
            <header className="metric-details-heading">
              <div><p className="eyebrow"><span className="eyebrow-line" /> COMMUNITY ACCOUNTS</p><h2 id="metric-details-title">{selectedMetric.label}</h2><p>{selectedMetric.detailsNote ?? selectedMetric.note}</p></div>
              <button type="button" onClick={() => detailsDialog.current?.close()} aria-label="Close details"><X size={18} /></button>
            </header>
            <div className="metric-details-summary"><span>Current total</span><strong>{selectedMetric.value === null ? "Not tracked" : formatMetric(selectedMetric.value, selectedMetric.format)}</strong></div>
            <div className="metric-details-list">
              {selectedMetric.details?.length ? selectedMetric.details.map((detail, index) => (
                <article className="metric-detail-row" key={`${detail.title}-${index}`}>
                  <div><strong>{detail.title}</strong>{detail.description && <p>{detail.description}</p>}{formatDetailDateTime(detail) && <time>{formatDetailDateTime(detail)}</time>}</div>
                  {detail.amount !== undefined && <b>{formatMetric(Number(detail.amount), "currency")}</b>}
                </article>
              )) : <p className="metric-details-empty">No supporting records are available yet.</p>}
            </div>
          </div>
        )}
      </dialog>
      <div className="recent-donation-feed" aria-label={variant === "admin" ? "Recent admin donations" : "Recent public donations"}>
        <div className="recent-feed-heading">
          <span className="recent-feed-live"><i /> RECENT DONATIONS</span>
          <a href={viewAllHref}>View all <ArrowRight size={14} /></a>
        </div>
        {recentDonations.length ? (
          <div ref={recentFeedWindow} className="recent-feed-window" tabIndex={0} aria-label="Scrollable recent donations">
            <div className="recent-feed-track">
              {recentDonations.map((donation, index) => (
                <span className="recent-feed-item" key={`${donation.received_at}-${donation.plot_flat ?? donation.donor_name ?? index}-${index}`}>
                  <Heart size={13} />
                  <span>{donationAddress(donation)}</span>
                  <strong>{formatMetric(Number(donation.amount), "currency")}</strong>
                </span>
              ))}
            </div>
          </div>
        ) : (
          <p className="recent-feed-empty">{emptyMessage}</p>
        )}
      </div>
    </section>
  );
}
