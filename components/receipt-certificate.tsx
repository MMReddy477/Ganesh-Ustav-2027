import { donationAmountInWords, formatReceiptAmount, formatReceiptDate } from "@/lib/receipt-format";
import type { PublicDonationReceipt } from "@/lib/public-donation-receipt";

export function ReceiptCertificate({ receipt, qrDataUrl }: { receipt: PublicDonationReceipt; qrDataUrl: string }) {
  const amount = Number(receipt.amount);
  const details = [
    { label: "RECEIPT NO.", value: receipt.receipt_no },
    { label: "DATE", value: formatReceiptDate(receipt.received_at) },
    { label: "FLAT / PLOT", value: receipt.plot_flat || "Community supporter" },
    { label: "PAYMENT MODE", value: receipt.payment_method || "Recorded" },
  ];

  return (
    <div style={{
      width: 1080,
      height: 1350,
      display: "flex",
      flexDirection: "column",
      position: "relative",
      overflow: "hidden",
      padding: 38,
      color: "#fff9e9",
      background: "radial-gradient(ellipse at 50% 30%, #851d2e 0%, #5b0d1b 48%, #29050d 100%)",
      fontFamily: "NotoLatin, NotoTelugu, NotoDevanagari, NotoGujarati",
    }}>
      <div style={{ position: "absolute", inset: 18, border: "3px solid #d5ad42", borderRadius: 28, boxShadow: "0 0 24px rgba(255,215,0,.24)" }} />
      <div style={{ position: "absolute", inset: 29, border: "1px solid rgba(255,215,0,.65)", borderRadius: 21 }} />
      <div style={{ position: "absolute", top: 410, left: 165, color: "rgba(255,215,0,.055)", fontSize: 540, lineHeight: 1, fontFamily: "NotoDevanagari" }}>ॐ</div>
      <svg width="360" height="360" viewBox="0 0 360 360" style={{ position: "absolute", top: 430, left: 360, opacity: 0.1 }}>
        <circle cx="180" cy="180" r="151" fill="none" stroke="#ffd700" strokeWidth="2" />
        <circle cx="180" cy="180" r="130" fill="none" stroke="#ffd700" strokeWidth="1.5" strokeDasharray="3 8" />
        <circle cx="180" cy="180" r="96" fill="none" stroke="#ffd700" strokeWidth="1.5" />
        <path d="M180 18 201 78 258 48 239 111 307 113 261 158 320 190 255 208 284 270 222 246 196 318 169 250 111 282 126 216 55 206 108 166 53 121 120 119 103 55 160 83Z" fill="none" stroke="#ffd700" strokeWidth="2" />
      </svg>

      <header style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", paddingTop: 27 }}>
        <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 78, height: 78, border: "2px solid #ffd700", borderRadius: "50%", color: "#ffd700", fontSize: 48, lineHeight: 1, fontFamily: "NotoDevanagari", boxShadow: "0 0 24px rgba(255,215,0,.25)" }}>ॐ</span>
        <div style={{ marginTop: 13, color: "#ffe7a0", fontSize: 22, fontWeight: 700, letterSpacing: 5 }}>SURYODAYA COLONY</div>
        <div style={{ marginTop: 3, color: "#ffd700", fontSize: 39, fontWeight: 700, letterSpacing: 3 }}>GANESH UTSAV</div>
        <div style={{ marginTop: 8, color: "#fff4d7", fontSize: 16, letterSpacing: 1 }}>One Community • 4th Year Celebration</div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 15, color: "#f5c557", fontSize: 13, letterSpacing: 2 }}>FAITH <span style={{ color: "#ff6b00" }}>•</span> COMMUNITY <span style={{ color: "#ff6b00" }}>•</span> TRANSPARENCY</div>
      </header>

      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 18, marginTop: 25 }}>
        <span style={{ width: 110, height: 1, background: "linear-gradient(90deg, transparent, #ffd700)" }} />
        <span style={{ width: 12, height: 12, border: "1px solid #ffb23f", transform: "rotate(45deg)" }} />
        <span style={{ width: 110, height: 1, background: "linear-gradient(90deg, #ffd700, transparent)" }} />
      </div>

      <main style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", position: "relative" }}>
        <div style={{ marginTop: 13, color: "#ffd700", fontSize: 31, fontWeight: 700, letterSpacing: 4 }}>CERTIFICATE OF GRATITUDE</div>
        <div style={{ marginTop: 14, color: "#f9e9c2", fontSize: 16, letterSpacing: 2 }}>PRESENTED TO</div>
        <div style={{ width: 850, marginTop: 7, color: "#fff2c2", fontSize: 43, fontWeight: 700, lineHeight: 1.18, textShadow: "0 2px 12px rgba(255,215,0,.25)" }}>{receipt.donor_name}</div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 11, color: "#f5d992", fontSize: 17, lineHeight: 1.55 }}>
          <span>With heartfelt gratitude for supporting</span>
          <span>Suryodaya Colony Ganesh Utsav</span>
          <span>and helping preserve our community traditions.</span>
        </div>
        <div style={{ marginTop: 14, color: "#fff6df", fontSize: 16 }}>In appreciation of the generous contribution of</div>

        <section style={{
          width: 700,
          minHeight: 156,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 14,
          border: "2px solid #ffe27a",
          borderRadius: 18,
          background: "linear-gradient(135deg, rgba(255,215,0,.20), rgba(255,107,0,.09), rgba(255,215,0,.16))",
          boxShadow: "0 0 38px rgba(255,193,7,.20), inset 0 0 28px rgba(255,215,0,.08)",
        }}>
          <div style={{ color: "#fff0a8", fontSize: 56, fontWeight: 700, lineHeight: 1.1 }}>{formatReceiptAmount(amount)}</div>
          <div style={{ marginTop: 5, color: "#ffd700", fontSize: 16, fontWeight: 700, letterSpacing: 4 }}>DONATION RECEIVED</div>
          <div style={{ marginTop: 7, color: "#f9e9c2", fontSize: 13, textTransform: "capitalize" }}>{`(${donationAmountInWords(amount)})`}</div>
        </section>

        <div style={{ marginTop: 13, color: "#ffcb62", fontSize: 14, letterSpacing: 1 }}>TOWARDS · SURYODAYA COLONY GANESH UTSAV</div>
        <div style={{ maxWidth: 850, marginTop: 5, color: "#f9e9c2", fontSize: 13, lineHeight: 1.45 }}>Your contribution helps strengthen our celebration, cultural programs, prasadam distribution and community activities.</div>

        <section style={{ width: 860, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 9, marginTop: 17 }}>
          {details.map((detail) => (
            <div key={detail.label} style={{ width: 414, minHeight: 57, display: "flex", flexDirection: "column", justifyContent: "center", padding: "8px 13px", border: "1px solid rgba(255,215,0,.48)", borderRadius: 8, background: "rgba(35,5,12,.42)", textAlign: "left" }}>
              <span style={{ color: "#e5bd60", fontSize: 10, fontWeight: 700, letterSpacing: 2 }}>{detail.label}</span>
              <span style={{ marginTop: 3, color: "#fff8e6", fontSize: detail.label === "RECEIPT NO." ? 13 : 14, fontWeight: 600 }}>{detail.value}</span>
            </div>
          ))}
        </section>

        <section style={{ width: 900, display: "flex", justifyContent: "center", gap: 10, marginTop: 17 }}>
          {["Contribution Recorded", "Community Managed", "Public Accountability", "Financial Transparency"].map((badge) => (
            <div key={badge} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", border: "1px solid rgba(255,215,0,.5)", borderRadius: 20, color: "#ffedbb", background: "rgba(255,215,0,.08)", fontSize: 11, fontWeight: 600 }}>
              <svg width="12" height="12" viewBox="0 0 12 12"><path d="m2 6 2.5 2.5L10 3" fill="none" stroke="#ffd700" strokeWidth="1.5" /></svg>
              <span>{badge}</span>
            </div>
          ))}
        </section>
      </main>

      <section style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", margin: "22px 74px 0" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 230, color: "#f5dfad", textAlign: "center" }}>
          <div style={{ width: 210, borderTop: "1px solid #d4ae55", marginBottom: 8 }} />
          <span style={{ fontSize: 13, fontWeight: 700 }}>Committee President</span>
          <span style={{ marginTop: 3, color: "#caaa6d", fontSize: 10 }}>Suryodaya Colony Ganesh Utsav</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: 8, border: "1px solid rgba(255,215,0,.55)", borderRadius: 10, background: "#fff9e9" }}>
          {/* Satori requires an img element for embedded QR data URLs. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="" width="100" height="100" />
          <span style={{ color: "#5b0d1b", fontSize: 9, fontWeight: 700, letterSpacing: 1 }}>SCAN TO VERIFY</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 230, color: "#f5dfad", textAlign: "center" }}>
          <div style={{ width: 210, borderTop: "1px solid #d4ae55", marginBottom: 8 }} />
          <span style={{ fontSize: 13, fontWeight: 700 }}>Treasurer</span>
          <span style={{ marginTop: 3, color: "#caaa6d", fontSize: 10 }}>Suryodaya Colony Ganesh Utsav</span>
        </div>
        <div style={{ position: "absolute", right: -48, top: -19, width: 108, height: 108, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "3px solid #ffd700", borderRadius: "50%", color: "#ffd700", background: "#4b0b16", textAlign: "center", transform: "rotate(10deg)" }}>
          <span style={{ fontSize: 27, fontFamily: "NotoDevanagari" }}>ॐ</span>
          <span style={{ maxWidth: 83, fontSize: 8, fontWeight: 700, letterSpacing: 1 }}>OFFICIAL COMMITTEE SEAL</span>
        </div>
      </section>

      <footer style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "auto", paddingBottom: 18, textAlign: "center" }}>
        <div style={{ color: "#ffd700", fontSize: 19, fontWeight: 700 }}>🙏 Ganapati Bappa Morya 🙏</div>
        <div style={{ marginTop: 5, color: "#f8e9c7", fontSize: 12 }}>Thank you for supporting our community celebration.</div>
        <div style={{ marginTop: 3, color: "#d8bc82", fontSize: 10 }}>Every donation is acknowledged and recorded with complete transparency.</div>
        <div style={{ marginTop: 7, color: "#e9c66e", fontSize: 11, fontWeight: 700, letterSpacing: 2 }}>SURYODAYA COLONY GANESH UTSAV</div>
      </footer>
    </div>
  );
}
