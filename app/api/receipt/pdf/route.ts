import { PDFDocument } from "pdf-lib";
import { NextResponse, type NextRequest } from "next/server";
import { getPublicDonationReceipt } from "@/lib/public-donation-receipt";
import { renderDonationCertificate } from "@/lib/receipt-certificate-renderer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const receiptNo = request.nextUrl.searchParams.get("receiptNo")?.trim() ?? "";
  const receiptToken = request.nextUrl.searchParams.get("token")?.trim() ?? "";
  if (!receiptNo || !/^[a-f0-9]{64}$/i.test(receiptToken)) {
    return NextResponse.json({ error: "Receipt not found." }, { status: 404 });
  }

  let receipt;
  try {
    receipt = await getPublicDonationReceipt(receiptNo, receiptToken);
  } catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error && typeof error.code === "string" ? error.code : "DATABASE_ERROR";
    console.error("Could not load donation certificate PDF:", code);
    return NextResponse.json({ error: "Certificate service is temporarily unavailable." }, { status: 503 });
  }
  if (!receipt) return NextResponse.json({ error: "Receipt not found." }, { status: 404 });

  try {
    const png = await renderDonationCertificate(receipt, receiptToken, request.nextUrl.origin);
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([612, 765]);
    const certificate = await pdf.embedPng(new Uint8Array(await png.arrayBuffer()));
    page.drawImage(certificate, { x: 0, y: 0, width: 612, height: 765 });
    pdf.setTitle(`Donation certificate ${receipt.receipt_no}`);
    pdf.setAuthor("Suryodaya Colony Ganesh Utsav Committee");
    const bytes = await pdf.save();
    const body = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(body).set(bytes);
    const fileReceiptNo = receipt.receipt_no.replace(/[^A-Za-z0-9-]+/g, "-");
    return new NextResponse(body, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="SGU-donation-certificate-${fileReceiptNo}.pdf"`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Could not render donation certificate PDF:", error instanceof Error ? error.message : "CERTIFICATE_PDF_ERROR");
    return NextResponse.json({ error: "Certificate PDF could not be generated." }, { status: 503 });
  }
}
