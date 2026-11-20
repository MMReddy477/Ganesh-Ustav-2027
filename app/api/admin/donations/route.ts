import { NextResponse, type NextRequest } from "next/server";
import { deliverDonationReceipt } from "@/lib/donation-receipt-delivery-server";
import { donationApiErrorMessage, donationInputSchema, getReceiptPath, normalizeDonationPhone } from "@/lib/donation-receipts";
import { requireAdminApi } from "@/lib/supabase/require-admin-api";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
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

  const initialStatus = parsed.data.payment_status === "received" ? "not_configured" : "skipped";
  const { data, error } = await auth.supabase
    .from("donations")
    .insert({
      ...parsed.data,
      donor_phone: donorPhone,
      recorded_by: auth.user.id,
      receipt_url: null,
      whatsapp_status: initialStatus,
      sms_status: initialStatus,
    })
    .select("*")
    .single();
  if (error) {
    console.error("Could not save donation:", error.code ?? "DATABASE_ERROR");
    return NextResponse.json({ error: donationApiErrorMessage(error, "The donation could not be saved.") }, { status: 500 });
  }

  let donation = data;
  let warning: string | null = null;
  if (data.payment_status === "received") {
    try {
      const delivery = await deliverDonationReceipt(auth.supabase, data, request.nextUrl.origin);
      donation = delivery.donation;
    } catch (deliveryError) {
      console.error("Donation was saved, but receipt delivery status could not be recorded:", deliveryError);
      warning = "The donation was saved, but receipt delivery status could not be recorded. Reload the record before retrying.";
    }
  } else {
    const receiptUrl = getReceiptPath(data.receipt_no, data.receipt_token);
    const { data: updated, error: receiptUrlError } = await auth.supabase
      .from("donations")
      .update({ receipt_url: receiptUrl })
      .eq("id", data.id)
      .select("*")
      .single();
    if (receiptUrlError) {
      console.error("Donation was saved, but its receipt URL could not be recorded:", receiptUrlError.code ?? "DATABASE_ERROR");
      warning = "The donation was saved, but its receipt link could not be recorded.";
    } else {
      donation = updated;
    }
  }

  return NextResponse.json({
    donation,
    message: warning ?? (data.payment_status === "received"
      ? "Donation saved; receipt created and delivery statuses updated."
      : "Donation saved; receipt messages will be sent when it is marked Received."),
    warning,
  }, { status: 201 });
}
