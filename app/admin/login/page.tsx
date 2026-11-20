import type { Metadata } from "next";
import { AdminLogin } from "@/components/admin-login";
import "../admin.css";

export const metadata: Metadata = { title: "Committee Portal", robots: { index: false, follow: false } };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;
  const nextPath = next && (next === "/admin" || next.startsWith("/admin/"))
    && next !== "/admin/login" && next !== "/admin/reset-password"
    ? next
    : "/admin";
  return (
    <AdminLogin
      accessDenied={error === "unauthorized"}
      roleCheckFailed={error === "role_check"}
      nextPath={nextPath}
    />
  );
}
