"use client";

import { ArrowRight, LoaderCircle } from "lucide-react";
import { useState, type FormEvent } from "react";

type FormStatus = { kind: "success" | "error"; message: string } | null;

export function VolunteerForm() {
  const [status, setStatus] = useState<FormStatus>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    setSubmitting(true);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const values = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/volunteers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "We couldn't send your registration. Please try again.");
      form.reset();
      setStatus({ kind: "success", message: "Thank you for offering your seva. Our volunteer team will be in touch soon." });
    } catch (error) {
      setStatus({ kind: "error", message: error instanceof Error ? error.message : "Something went wrong. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="volunteer-form" onSubmit={submit}>
      <div className="form-field"><label htmlFor="vol-name">YOUR NAME *</label><input id="vol-name" name="name" autoComplete="name" placeholder="How should we call you?" required maxLength={100} /></div>
      <div className="form-field"><label htmlFor="vol-phone">MOBILE NUMBER *</label><input id="vol-phone" name="phone" type="tel" autoComplete="tel" placeholder="+91" required maxLength={20} /></div>
      <div className="form-field"><label htmlFor="vol-email">EMAIL ADDRESS</label><input id="vol-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" maxLength={254} /></div>
      <div className="form-field"><label htmlFor="vol-skill">I’D LOVE TO HELP WITH</label><select id="vol-skill" name="skills" defaultValue=""><option value="" disabled>Choose your seva</option><option>Decor & mandapam</option><option>Prasad & hospitality</option><option>Events & performances</option><option>Photography & media</option><option>Setup & logistics</option><option>Wherever needed</option></select></div>
      <div className="form-field form-field-wide"><label htmlFor="vol-availability">WHEN ARE YOU AVAILABLE?</label><input id="vol-availability" name="availability" placeholder="For example, evenings or weekends" maxLength={120} /></div>
      <div className="form-honeypot" aria-hidden="true"><label htmlFor="vol-website">Leave this blank</label><input id="vol-website" name="website" tabIndex={-1} autoComplete="off" /></div>
      <button className="button button-primary form-submit" type="submit" disabled={submitting}>{submitting ? <><LoaderCircle size={15} className="animate-spin" /> Sending</> : <>Offer your seva <ArrowRight size={15} /></>}</button>
      {status && <p className={`form-message ${status.kind}`} role="status">{status.message}</p>}
    </form>
  );
}
