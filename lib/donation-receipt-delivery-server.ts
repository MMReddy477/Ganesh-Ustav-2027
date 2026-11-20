import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getReceiptImageUrl, getReceiptPath, getReceiptPublicUrl } from "@/lib/receipt-links";
import { sendDonationReceiptMessages } from "@/lib/donation-receipts";

type DonationDeliveryRecord = {
  id: string;
  receipt_no: string;
  receipt_token: string;
  receipt_url: string | null;
  donor_name: string | null;
  donor_phone: string | null;
  amount: number;
  received_at: string;
  payment_status: string;
  whatsapp_sent: boolean;
  sms_sent: boolean;
  whatsapp_status: string;
  sms_status: string;
  sent_at: string | null;
};

export async function deliverDonationReceipt(
  supabase: SupabaseClient,
  donation: DonationDeliveryRecord,
  requestOrigin: string,
  { force = false }: { force?: boolean } = {},
) {
  if (donation.payment_status !== "received") return { donation, attempted: false };

  const sendWhatsApp = force || !donation.whatsapp_sent || donation.whatsapp_status === "failed";
  const sendSms = force || !donation.sms_sent || donation.sms_status === "failed";
  if (!sendWhatsApp && !sendSms) return { donation, attempted: false };

  const publicUrl = getReceiptPublicUrl(donation.receipt_no, donation.receipt_token, requestOrigin);
  const pngUrl = getReceiptImageUrl(donation.receipt_no, donation.receipt_token, requestOrigin);
  const receiptUrl = publicUrl ?? getReceiptPath(donation.receipt_no, donation.receipt_token);
  const results = await sendDonationReceiptMessages({
    donorName: donation.donor_name || "Community supporter",
    phone: donation.donor_phone || "",
    amount: Number(donation.amount),
    receivedAt: donation.received_at,
    receiptNo: donation.receipt_no,
    receiptUrl: publicUrl,
    receiptPngUrl: pngUrl,
  }, { whatsapp: sendWhatsApp, sms: sendSms });

  const updates: Record<string, string | boolean | null> = { receipt_url: receiptUrl };
  if (results.whatsapp) {
    updates.whatsapp_status = results.whatsapp.status;
    updates.whatsapp_sent = donation.whatsapp_sent || results.whatsapp.sent;
    updates.whatsapp_message_sid = results.whatsapp.messageSid;
    updates.whatsapp_error_code = results.whatsapp.errorCode;
  }
  if (results.sms) {
    updates.sms_status = results.sms.status;
    updates.sms_sent = donation.sms_sent || results.sms.sent;
    updates.sms_message_sid = results.sms.messageSid;
    updates.sms_error_code = results.sms.errorCode;
  }
  if ((results.whatsapp?.sent || results.sms?.sent) && !donation.sent_at) {
    updates.sent_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("donations")
    .update(updates)
    .eq("id", donation.id)
    .select("*")
    .single();
  if (error) throw error;

  return { donation: data as DonationDeliveryRecord & Record<string, unknown>, attempted: true, results };
}
