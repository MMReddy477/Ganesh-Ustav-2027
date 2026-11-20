"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { logAdminAuthEvent } from "@/lib/supabase/audit";
import { createClient } from "@/lib/supabase/client";

type AdminIdentity = {
  id: string;
  email: string | null;
  role: string;
};

type AdminAuthContextValue = {
  identity: AdminIdentity | null;
  signOut: () => Promise<void>;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

function toIdentity(user: User, role: string): AdminIdentity {
  return { id: user.id, email: user.email ?? null, role };
}

export function AdminAuthProvider({
  children,
  initialIdentity,
}: {
  children: ReactNode;
  initialIdentity: AdminIdentity;
}) {
  const router = useRouter();
  const [identity, setIdentity] = useState<AdminIdentity | null>(initialIdentity);

  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setIdentity(null);
        router.replace("/admin/login");
      } else if (session?.user) {
        setIdentity((current) => toIdentity(session.user, current?.role ?? initialIdentity.role));
      }
    });

    return () => subscription.unsubscribe();
  }, [initialIdentity.role, router]);

  const value = useMemo<AdminAuthContextValue>(() => ({
    identity,
    async signOut() {
      const supabase = createClient();
      await logAdminAuthEvent(supabase, "LOGOUT");
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
  }), [identity]);

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error("useAdminAuth must be used within AdminAuthProvider.");
  return context;
}
