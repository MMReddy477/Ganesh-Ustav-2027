import type { Metadata } from "next";
import Image from "next/image";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getPublicDonationReceipt } from "@/lib/public-donation-receipt";
import { getReceiptImagePath, getReceiptPath, getReceiptPdfPath, getReceiptPublicUrl } from "@/lib/receipt-links";
import { formatReceiptAmount, formatReceiptDate } from "@/lib/receipt-format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Donation certificate verification",
  robots: { index: false, follow: false, noarchive: true },
};

function requestOrigin(host: string | null, protocol: string | null) {
  if (process.env.NODE_ENV === "production") return "";
  const safeHost = host?.replace(/[^a-zA-Z0-9.:-]/g, "") || "localhost:3000";
  return `${protocol === "https" ? "https" : "http"}://${safeHost}`;
}

export default async function DonationReceiptPage({
  params,
  searchParams,
}: {
  params: Promise<{ receipt_no: string[] }>;
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const [{ receipt_no: segments }, query, requestHeaders] = await Promise.all([params, searchParams, headers()]);
  const receiptNo = segments.join("/");
  const token = typeof query.token === "string" ? query.token : "";
  if (!receiptNo || !/^[a-f0-9]{64}$/i.test(token)) notFound();

  let receipt;
  try {
    receipt = await getPublicDonationReceipt(receiptNo, token);
  } catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error && typeof error.code === "string" ? error.code : "DATABASE_ERROR";
    console.error("Could not verify public donation certificate:", code);
    return (
      <main className="receipt-page">
        <section className="receipt-card" role="alert">
          <p className="receipt-eyebrow">GANESH UTSAV 2027</p>
          <h1>Certificate verification is temporarily unavailable</h1>
          <p>Please try again later or contact the committee.</p>
        </section>
      </main>
    );
  }
  if (!receipt) notFound();

  const origin = requestOrigin(requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host"), requestHeaders.get("x-forwarded-proto"));
  const canonicalUrl = getReceiptPublicUrl(receipt.receipt_no, token, origin) ?? getReceiptPath(receipt.receipt_no, token);
  const certificateUrl = getReceiptImagePath(receipt.receipt_no, token);
  const pdfUrl = getReceiptPdfPath(receipt.receipt_no, token);

  return (
    <main className="certificate-page">
      <div className="certificate-page-heading">
        <span className="receipt-eyebrow">SURYODAYA COLONY GANESH UTSAV</span>
        <h1>Donation certificate</h1>
        <p>Verified acknowledgement of a received community contribution.</p>
      </div>
      <figure className="certificate-preview">
        <Image
          src={certificateUrl}
          alt={`Certificate of gratitude for ${receipt.donor_name}, donation ${formatReceiptAmount(Number(receipt.amount))}`}
          width={1080}
          height={1350}
          unoptimized
          priority
        />
      </figure>
      <section className="certificate-verification" aria-label="Certificate verification details">
        <div className="certificate-verification-status"><span aria-hidden="true">✓</span><strong>Verified donation received</strong></div>
        <dl>
          <div><dt>Receipt number</dt><dd>{receipt.receipt_no}</dd></div>
          <div><dt>Name</dt><dd>{receipt.donor_name}</dd></div>
          <div><dt>Amount</dt><dd>{receipt.currency.trim()} {Number(receipt.amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</dd></div>
          <div><dt>Date</dt><dd>{formatReceiptDate(receipt.received_at)}</dd></div>
        </dl>
        <p className="certificate-privacy-note">Mobile number and transaction reference are kept private and are not printed on this shareable certificate.</p>
        <div className="certificate-download-actions">
          <a href={certificateUrl} download={`SGU-donation-certificate-${receipt.receipt_no.replace(/[^A-Za-z0-9-]+/g, "-")}.png`}>Download PNG</a>
          <a href={pdfUrl} download={`SGU-donation-certificate-${receipt.receipt_no.replace(/[^A-Za-z0-9-]+/g, "-")}.pdf`}>Download PDF</a>
          <a href={`https://wa.me/?text=${encodeURIComponent(`Suryodaya Colony Ganesh Utsav donation certificate: ${canonicalUrl}`)}`} target="_blank" rel="noreferrer">Share on WhatsApp</a>
        </div>
      </section>
    </main>
  );
}
