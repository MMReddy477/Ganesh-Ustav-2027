import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { deliverDonationReceipt } from "@/lib/donation-receipt-delivery-server";
import { requireAdminApi } from "@/lib/supabase/require-admin-api";

export const runtime = "nodejs";
const deliveryRequestSchema = z.object({ force: z.boolean().default(false) });

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi(request);
  if ("response" in auth) return auth.response;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Submit a valid receipt delivery request." }, { status: 400 });
  }
  const parsed = deliveryRequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Submit a valid receipt delivery request." }, { status: 400 });

  const { id } = await params;
  const { data, error } = await auth.supabase.from("donations").select("*").eq("id", id).single();
  if (error) {
    console.error("Could not load donation for receipt delivery:", error.code ?? "DATABASE_ERROR");
    return NextResponse.json({ error: "The donation could not be loaded." }, { status: 404 });
  }
  if (data.payment_status !== "received") {
    return NextResponse.json({ error: "Receipt messages can only be sent for donations marked Received." }, { status: 409 });
  }
  if (!parsed.data.force && data.whatsapp_sent && data.sms_sent && data.whatsapp_status !== "failed" && data.sms_status !== "failed") {
    return NextResponse.json({ error: "Both receipt messages have already been sent." }, { status: 409 });
  }

  try {
    const delivery = await deliverDonationReceipt(auth.supabase, data, request.nextUrl.origin, { force: parsed.data.force });
    return NextResponse.json({
      donation: delivery.donation,
      message: delivery.attempted ? "Receipt messages resent; check each channel status." : "No receipt messages needed sending.",
    });
  } catch (deliveryError) {
    console.error("Could not retry donation receipt delivery:", deliveryError);
    return NextResponse.json({ error: "Receipt delivery could not be completed. Check the saved status and try again." }, { status: 503 });
  }
}
