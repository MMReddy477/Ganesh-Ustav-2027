"use client";

import Image from "next/image";
import { Heart, MapPin, MessageCircle, Phone, X } from "lucide-react";
import { useEffect, useState } from "react";

const shareUrl = "https://wa.me/?text=Ganesh%20Utsav%202027%20%E2%80%94%20Suryodaya%20Colony%2C%20Hyderabad";
const mapUrl = "https://maps.google.com/?q=Suryodaya+Colony+Bandlaguda+Jagir+Hyderabad";

export function PublicActions({ upiId, phone }: { upiId?: string; phone?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [donateOpen, setDonateOpen] = useState(false);
  const upiUrl = upiId
    ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent("Suryodaya Colony Ganesh Utsav")}&cu=INR`
    : null;

  useEffect(() => {
    if (!donateOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDonateOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [donateOpen]);

  return (
    <>
      <div className="public-actions">
        {menuOpen && (
          <div className="public-actions-menu" aria-label="Quick actions">
            <button type="button" onClick={() => { setDonateOpen(true); setMenuOpen(false); }}><Heart size={17} /> Donate</button>
            <a href={shareUrl} target="_blank" rel="noreferrer"><MessageCircle size={17} /> WhatsApp</a>
            {phone ? <a href={`tel:${phone}`}><Phone size={17} /> Call</a> : <button type="button" disabled title="Set NEXT_PUBLIC_COMMITTEE_PHONE to enable calls"><Phone size={17} /> Call <small>not configured</small></button>}
            <a href={mapUrl} target="_blank" rel="noreferrer"><MapPin size={17} /> Maps</a>
          </div>
        )}
        <button className="public-actions-toggle" type="button" aria-expanded={menuOpen} aria-label={menuOpen ? "Close quick actions" : "Open quick actions"} onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={21} /> : <Heart size={20} />}
        </button>
      </div>
      {donateOpen && (
        <div className="donate-modal" role="dialog" aria-modal="true" aria-labelledby="donate-modal-title" onClick={() => setDonateOpen(false)}>
          <div className="donate-modal-card" onClick={(event) => event.stopPropagation()}>
            <button className="donate-modal-close" type="button" aria-label="Close donation details" onClick={() => setDonateOpen(false)}><X size={20} /></button>
            <p className="eyebrow"><span className="eyebrow-line" /> OFFER A SEVA</p>
            <h2 id="donate-modal-title">Make a contribution</h2>
            <div className="public-donation-qr"><Image src="/images/phonepe-qr.jpeg" alt="PhonePe QR code for Ganesh Utsav contributions" width={220} height={417} sizes="220px" /></div>
            <p>Scan with PhonePe or another UPI app to contribute.</p>
            {upiUrl && <a className="button button-primary" href={upiUrl}>Continue with UPI</a>}
          </div>
        </div>
      )}
    </>
  );
}
