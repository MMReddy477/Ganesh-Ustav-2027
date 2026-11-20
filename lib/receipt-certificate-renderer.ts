import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import QRCode from "qrcode";
import { createElement } from "react";
import { ReceiptCertificate } from "@/components/receipt-certificate";
import type { PublicDonationReceipt } from "@/lib/public-donation-receipt";
import { getReceiptPublicUrl } from "@/lib/receipt-links";

const fontPaths = [
  ["NotoLatin", "noto-sans-latin-400.woff"],
  ["NotoTelugu", "noto-sans-telugu-400.woff"],
  ["NotoDevanagari", "noto-sans-devanagari-400.woff"],
  ["NotoGujarati", "noto-sans-gujarati-400.woff"],
] as const;

let receiptFontsPromise: Promise<Array<{ name: string; data: ArrayBuffer; weight: 400 }>> | null = null;

function getReceiptFonts() {
  if (!receiptFontsPromise) {
    receiptFontsPromise = Promise.all(fontPaths.map(async ([name, file]) => {
      const buffer = await readFile(join(process.cwd(), "public", "fonts", file));
      const data = new ArrayBuffer(buffer.byteLength);
      new Uint8Array(data).set(buffer);
      return { name, data, weight: 400 as const };
    }));
  }
  return receiptFontsPromise;
}

export async function renderDonationCertificate(
  receipt: PublicDonationReceipt,
  receiptToken: string,
  requestOrigin: string,
) {
  const verificationUrl = getReceiptPublicUrl(receipt.receipt_no, receiptToken, requestOrigin);
  if (!verificationUrl) throw new Error("The canonical HTTPS site URL is required for certificate verification.");

  const [fonts, qrDataUrl] = await Promise.all([
    getReceiptFonts(),
    QRCode.toDataURL(verificationUrl, { width: 240, margin: 1, errorCorrectionLevel: "H" }),
  ]);
  return new ImageResponse(
    createElement(ReceiptCertificate, { receipt, qrDataUrl }),
    {
      width: 1080,
      height: 1350,
      fonts,
      headers: { "Cache-Control": "private, no-store, max-age=0" },
    },
  );
}
