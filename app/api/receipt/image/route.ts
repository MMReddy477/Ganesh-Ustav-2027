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
    console.error("Could not load donation certificate image:", code);
    return NextResponse.json({ error: "Certificate service is temporarily unavailable." }, { status: 503 });
  }
  if (!receipt) return NextResponse.json({ error: "Receipt not found." }, { status: 404 });

  try {
    return await renderDonationCertificate(receipt, receiptToken, request.nextUrl.origin);
  } catch (error) {
    console.error("Could not render donation certificate image:", error instanceof Error ? error.message : "CERTIFICATE_RENDER_ERROR");
    return NextResponse.json({ error: "Certificate image could not be generated." }, { status: 503 });
  }
}
