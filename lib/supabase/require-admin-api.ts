import "server-only";

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function requireAdminApi(request: NextRequest) {
  const requestOrigin = request.headers.get("origin");
  let allowedOrigin = false;
  try {
    const expectedOrigin = new URL(process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin).origin;
    allowedOrigin = Boolean(requestOrigin && new URL(requestOrigin).origin === expectedOrigin);
  } catch {
    allowedOrigin = false;
  }
  if (!allowedOrigin) {
    return { response: NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 }) };
  }

  let supabase: Awaited<ReturnType<typeof createClient>>;
  try {
    supabase = await createClient();
  } catch (error) {
    console.error("Could not initialize the donation API Supabase client:", error instanceof Error ? error.message : "SUPABASE_CONFIGURATION_ERROR");
    return { response: NextResponse.json({ error: "Donation services are not configured. Contact the administrator." }, { status: 503 }) };
  }
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) {
    console.error("Could not verify the donation API session:", userError.message);
    return { response: NextResponse.json({ error: "The session could not be verified." }, { status: 401 }) };
  }
  if (!user) return { response: NextResponse.json({ error: "Sign in to manage donations." }, { status: 401 }) };

  const { data: profile, error: roleError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (roleError) {
    console.error("Could not verify the donation API role:", roleError.message);
    return { response: NextResponse.json({ error: "The committee role could not be verified." }, { status: 503 }) };
  }
  if (!profile || !["admin", "super_admin"].includes(profile.role)) {
    return { response: NextResponse.json({ error: "Administrator access is required." }, { status: 403 }) };
  }

  return { supabase, user };
}
