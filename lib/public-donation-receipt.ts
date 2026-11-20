import "server-only";

import { createClient } from "@/lib/supabase/server";

export type PublicDonationReceipt = {
  receipt_no: string;
  donor_name: string;
  amount: number;
  currency: string;
  received_at: string;
  plot_flat: string | null;
  payment_method: string;
};

export async function getPublicDonationReceipt(receiptNo: string, receiptToken: string): Promise<PublicDonationReceipt | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("public_donation_receipt", {
    p_receipt_no: receiptNo,
    p_receipt_token: receiptToken,
  });
  if (error) throw error;

  const result = Array.isArray(data) ? data[0] : data;
  if (!result || typeof result !== "object") return null;
  return result as PublicDonationReceipt;
}
