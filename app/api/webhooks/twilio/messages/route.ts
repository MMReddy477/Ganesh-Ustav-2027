import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidTwilioSignature(callbackUrl: string, form: URLSearchParams, signature: string, authToken: string) {
  const payload = [...new Set(form.keys())]
    .sort()
    .map((key) => `${key}${form.getAll(key).sort().join("")}`)
    .join("");
  const expected = createHmac("sha1", authToken).update(callbackUrl + payload).digest("base64");
  const actualBytes = Buffer.from(signature);
  const expectedBytes = Buffer.from(expected);
  return actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes);
}

function normalizeTwilioStatus(status: string) {
  if (["failed", "undelivered"].includes(status)) return "failed";
  if (["delivered", "read"].includes(status)) return "delivered";
  if (status === "sent") return "sent";
  if (["accepted", "queued", "sending"].includes(status)) return "queued";
  return null;
}

export async function POST(request: NextRequest) {
  const channel = request.nextUrl.searchParams.get("channel");
  if (channel !== "whatsapp" && channel !== "sms") {
    return NextResponse.json({ error: "Unknown message channel." }, { status: 400 });
  }

  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const signature = request.headers.get("x-twilio-signature");
  if (!authToken || !siteUrl || !serviceRoleKey || !supabaseUrl || !signature) {
    console.error("Twilio callback is missing required server configuration.");
    return NextResponse.json({ error: "Callback verification is not configured." }, { status: 503 });
  }

  let form: URLSearchParams;
  try {
    form = new URLSearchParams(await request.text());
  } catch {
    return NextResponse.json({ error: "Invalid Twilio callback body." }, { status: 400 });
  }

  let callbackUrl: string;
  try {
    const url = new URL(request.nextUrl.pathname + request.nextUrl.search, siteUrl);
    callbackUrl = url.toString();
  } catch {
    console.error("Twilio callback URL configuration is invalid.");
    return NextResponse.json({ error: "Callback verification is not configured." }, { status: 503 });
  }
  if (!isValidTwilioSignature(callbackUrl, form, signature, authToken)) {
    return NextResponse.json({ error: "Invalid Twilio signature." }, { status: 403 });
  }

  const messageSid = form.get("MessageSid") || form.get("SmsSid");
  const providerStatus = form.get("MessageStatus") || form.get("SmsStatus") || "";
  const status = normalizeTwilioStatus(providerStatus);
  if (!messageSid || !status) return new NextResponse(null, { status: 204 });

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const sidColumn = channel === "whatsapp" ? "whatsapp_message_sid" : "sms_message_sid";
  const statusColumn = channel === "whatsapp" ? "whatsapp_status" : "sms_status";
  const errorColumn = channel === "whatsapp" ? "whatsapp_error_code" : "sms_error_code";
  const sentColumn = channel === "whatsapp" ? "whatsapp_sent" : "sms_sent";
  const errorCode = form.get("ErrorCode");
  const { data, error } = await supabase
    .from("donations")
    .update({
      [statusColumn]: status,
      [errorColumn]: status === "failed" ? errorCode?.slice(0, 40) || "DELIVERY_FAILED" : null,
      [sentColumn]: true,
    })
    .eq(sidColumn, messageSid)
    .select("id")
    .maybeSingle();
  if (error) {
    console.error("Could not save Twilio delivery status:", error.code ?? "DATABASE_ERROR");
    return NextResponse.json({ error: "Delivery status could not be saved." }, { status: 503 });
  }
  if (!data) return NextResponse.json({ error: "The message is not linked to a donation yet." }, { status: 503 });
  return new NextResponse(null, { status: 204 });
}
