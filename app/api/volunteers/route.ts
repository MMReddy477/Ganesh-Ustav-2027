import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const volunteerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(7).max(20).regex(/^[+\d()\s-]+$/, "Enter a valid phone number."),
  email: z.union([z.string().trim().email().max(254), z.literal("")]).optional(),
  skills: z.string().trim().max(120).optional(),
  availability: z.string().trim().max(120).optional(),
  website: z.string().max(0).optional(),
});

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Please submit a valid registration form." }, { status: 400 });
  }

  const parsed = volunteerSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please check the information and try again." }, { status: 400 });
  }
  if (parsed.data.website) return NextResponse.json({ success: true });

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("volunteers").insert({
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      skills: parsed.data.skills || null,
      availability: parsed.data.availability || null,
      status: "pending",
    });
    if (error) {
      console.error("Volunteer registration failed:", error.message);
      return NextResponse.json({ error: "We couldn't save your registration right now. Please try again later." }, { status: 503 });
    }
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Volunteer registration could not reach Supabase:", error);
    return NextResponse.json({ error: "Volunteer registration is temporarily unavailable. Please contact the committee." }, { status: 503 });
  }
}
