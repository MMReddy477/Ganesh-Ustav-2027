import { z } from "zod";

export { getReceiptImageUrl, getReceiptPath, getReceiptPdfUrl, getReceiptPublicUrl } from "@/lib/receipt-links";

export const donationInputSchema = z.object({
  donor_name: z.string().trim().min(1).max(100),
  donor_phone: z.string().trim().min(7).max(20).regex(/^[+\d()\s-]+$/),
  plot_flat: z.string().trim().max(80).optional(),
  transaction_reference: z.string().trim().max(200).optional(),
  amount: z.number().positive().max(1000000000),
  payment_status: z.enum(["received", "pending"]).default("received"),
  payment_method: z.enum(["UPI", "Cash", "Bank transfer", "Other"]).default("UPI"),
  received_at: z.string().datetime({ offset: true }).optional(),
  show_on_wall: z.boolean().default(false),
  notes: z.string().trim().max(2000).optional(),
});

export type DonationReceiptInput = z.infer<typeof donationInputSchema>;
export type ReceiptChannel = "whatsapp" | "sms";
export type ReceiptChannelResult = {
  sent: boolean;
  status: "sent" | "failed" | "not_configured" | "skipped";
  messageSid: string | null;
  errorCode: string | null;
};

export function normalizeDonationPhone(phone: string) {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (/^[6-9]\d{9}$/.test(digits)) return `+91${digits}`;
  if (/^91[6-9]\d{9}$/.test(digits)) return `+${digits}`;
  if (/^\+[1-9]\d{7,14}$/.test(trimmed)) return trimmed;
  throw new Error("Enter a valid mobile number with country code, or a 10-digit Indian mobile number.");
}

function isChannelConfigured(channel: ReceiptChannel) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  if (!accountSid || !authToken || !getTwilioStatusCallbackUrl(channel)) return false;
  if (channel === "whatsapp") {
    return Boolean(process.env.TWILIO_WHATSAPP_FROM?.trim() && process.env.TWILIO_WHATSAPP_CONTENT_SID?.trim());
  }
  return Boolean(process.env.TWILIO_SMS_FROM?.trim() || process.env.TWILIO_MESSAGING_SERVICE_SID?.trim());
}

function getTwilioStatusCallbackUrl(channel: ReceiptChannel) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!siteUrl || !process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) return null;
  try {
    const url = new URL("/api/webhooks/twilio/messages", siteUrl);
    if (url.protocol !== "https:" && process.env.NODE_ENV === "production") return null;
    url.searchParams.set("channel", channel);
    return url.toString();
  } catch {
    return null;
  }
}

async function sendTwilioMessage(
  channel: ReceiptChannel,
  input: {
    donorName: string;
    phone: string;
    amount: number;
    receiptNo: string;
    receiptUrl: string;
    receiptPngUrl: string | null;
  },
): Promise<ReceiptChannelResult> {
  if (!isChannelConfigured(channel)) {
    return { sent: false, status: "not_configured", messageSid: null, errorCode: null };
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  if (!accountSid || !authToken) {
    return { sent: false, status: "not_configured", messageSid: null, errorCode: null };
  }

  try {
    const phone = normalizeDonationPhone(input.phone);
    const message = new URLSearchParams();
    if (channel === "whatsapp") {
      const sender = process.env.TWILIO_WHATSAPP_FROM?.trim();
      const contentSid = process.env.TWILIO_WHATSAPP_CONTENT_SID?.trim();
      if (!sender || !contentSid || !input.receiptPngUrl) {
        return { sent: false, status: "not_configured", messageSid: null, errorCode: null };
      }
      message.set("From", sender.startsWith("whatsapp:") ? sender : `whatsapp:${sender}`);
      message.set("To", `whatsapp:${phone}`);
      message.set("ContentSid", contentSid);
      message.set("ContentVariables", JSON.stringify({
        "1": input.receiptPngUrl,
        "2": input.donorName,
        "3": input.receiptNo,
        "4": input.receiptUrl,
      }));
    } else {
      const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID?.trim();
      const sender = process.env.TWILIO_SMS_FROM?.trim();
      if (messagingServiceSid) {
        message.set("MessagingServiceSid", messagingServiceSid);
      } else if (sender) {
        message.set("From", sender);
      } else {
        return { sent: false, status: "not_configured", messageSid: null, errorCode: null };
      }
      message.set("To", phone);
      message.set(
        "Body",
        `Thank you! INR ${input.amount.toLocaleString("en-IN")} received. Receipt ${input.receiptNo}: ${input.receiptUrl}`,
      );
    }
    const statusCallbackUrl = getTwilioStatusCallbackUrl(channel);
    if (statusCallbackUrl) message.set("StatusCallback", statusCallbackUrl);

    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: message.toString(),
      signal: AbortSignal.timeout(7000),
      cache: "no-store",
    });
    const result = await response.json().catch(() => null) as { sid?: unknown; code?: unknown } | null;
    if (!response.ok) {
      return {
        sent: false,
        status: "failed",
        messageSid: null,
        errorCode: String(result?.code ?? `HTTP_${response.status}`).slice(0, 40),
      };
    }
    if (typeof result?.sid !== "string") {
      return { sent: false, status: "failed", messageSid: null, errorCode: "PROVIDER_INVALID_RESPONSE" };
    }
    return {
      sent: true,
      status: "sent",
      messageSid: result.sid,
      errorCode: null,
    };
  } catch {
    return { sent: false, status: "failed", messageSid: null, errorCode: "PROVIDER_UNAVAILABLE" };
  }
}

export function donationApiErrorMessage(error: unknown, fallback: string) {
  const code = typeof error === "object" && error !== null && "code" in error && typeof error.code === "string" ? error.code : "";
  if (code === "42501") return "Supabase denied this change. Confirm the signed-in account has an admin role.";
  if (["PGRST202", "PGRST204", "PGRST205", "42P01", "42703"].includes(code)) {
    return "The donation receipt schema is incomplete. Apply database/migrations/20261119_add_donation_payment_status.sql and database/migrations/20261120_add_donation_receipts.sql. For a missing donations table, run database/schema.sql first.";
  }
  return fallback;
}

export async function sendDonationReceiptMessages(input: {
  donorName: string;
  phone: string;
  amount: number;
  receiptNo: string;
  receiptUrl: string | null;
  receiptPngUrl: string | null;
}, channels = { whatsapp: true, sms: true }) {
  const unavailable: ReceiptChannelResult = {
    sent: false,
    status: "not_configured",
    messageSid: null,
    errorCode: "SITE_URL_NOT_CONFIGURED",
  };
  if (!input.receiptUrl) {
    return {
      whatsapp: channels.whatsapp ? { ...unavailable, errorCode: "SITE_URL_NOT_CONFIGURED" } : null,
      sms: channels.sms ? unavailable : null,
    };
  }

  const messageInput = { ...input, receiptUrl: input.receiptUrl };
  const [whatsapp, sms] = await Promise.all([
    channels.whatsapp
      ? input.receiptPngUrl ? sendTwilioMessage("whatsapp", messageInput) : Promise.resolve({ ...unavailable, errorCode: "CERTIFICATE_URL_NOT_CONFIGURED" })
      : Promise.resolve(null),
    channels.sms ? sendTwilioMessage("sms", messageInput) : Promise.resolve(null),
  ]);
  return { whatsapp, sms };
}
