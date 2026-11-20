import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminAuthProvider } from "@/components/admin-auth-provider";
import { AdminSignOut } from "@/components/admin-sign-out";
import "../admin.css";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: profile, error } = await supabase.from("users").select("role,display_name").eq("id", user.id).single();
  if (error) {
    console.error("Could not verify the Committee Portal role:", error);
    redirect("/admin/login?error=role_check");
  }
  if (!profile || !["admin", "super_admin"].includes(profile.role)) {
    redirect("/admin/login?error=unauthorized");
  }

  return (
    <AdminAuthProvider initialIdentity={{ id: user.id, email: user.email ?? null, role: profile.role }}>
      <div className="admin-shell">
        <aside className="admin-sidebar">
          <Link href="/admin" className="admin-brand"><span className="admin-brand-mark">🪔</span><span><strong>Suryodaya Utsav Admin</strong><small>Signed in as {profile.display_name || user.email}</small></span></Link>
          <div className="admin-header-actions"><Link href="/" target="_blank" rel="noreferrer">Public page ↗</Link><AdminSignOut /></div>
        </aside>
        <div className="admin-content">{children}</div>
      </div>
    </AdminAuthProvider>
  );
}
