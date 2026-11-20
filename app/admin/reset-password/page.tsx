import type { Metadata } from "next";
import { AdminResetPassword } from "@/components/admin-reset-password";
import "../admin.css";

export const metadata: Metadata = { title: "Reset Password | Committee Portal", robots: { index: false, follow: false } };

export default function AdminResetPasswordPage() {
  return <AdminResetPassword />;
}
