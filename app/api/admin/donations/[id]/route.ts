import { NextResponse, type NextRequest } from "next/server";
import { deliverDonationReceipt } from "@/lib/donation-receipt-delivery-server";
import { donationApiErrorMessage, donationInputSchema, normalizeDonationPhone } from "@/lib/donation-receipts";
import { requireAdminApi } from "@/lib/supabase/require-admin-api";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi(request);
  if ("response" in auth) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Submit a valid donation record." }, { status: 400 });
  }

  const parsed = donationInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the donation details and try again." }, { status: 400 });
  }

  let donorPhone: string;
  try {
    donorPhone = normalizeDonationPhone(parsed.data.donor_phone);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Enter a valid mobile number." }, { status: 400 });
  }

  const { id } = await params;
  const { data, error } = await auth.supabase
    .from("donations")
    .update({ ...parsed.data, donor_phone: donorPhone })
    .eq("id", id)
    .select("*")
    .single();
  if (error) {
    console.error("Could not update donation:", error.code ?? "DATABASE_ERROR");
    return NextResponse.json({ error: donationApiErrorMessage(error, "The donation could not be updated.") }, { status: 500 });
  }

  let donation = data;
  let warning: string | null = null;
  if (data.payment_status === "received" && (
    !data.whatsapp_sent || !data.sms_sent || data.whatsapp_status === "failed" || data.sms_status === "failed"
  )) {
    try {
      const delivery = await deliverDonationReceipt(auth.supabase, data, request.nextUrl.origin);
      donation = delivery.donation;
    } catch (deliveryError) {
      console.error("Donation was updated, but receipt delivery status could not be recorded:", deliveryError);
      warning = "The donation was updated, but receipt delivery status could not be recorded. Reload the record before retrying.";
    }
  }

  return NextResponse.json({
    donation,
    message: warning ?? "Donation updated.",
    warning,
  });
}
