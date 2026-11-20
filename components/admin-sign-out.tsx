"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/components/admin-auth-provider";

export function AdminSignOut() {
  const router = useRouter();
  const { signOut } = useAdminAuth();
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSignOut() {
    if (busy) return;
    setBusy(true);
    setErrorMessage("");
    try {
      await signOut();
      router.replace("/admin/login");
      router.refresh();
    } catch (error) {
      console.error("Could not sign out of the Committee Portal:", error);
      setErrorMessage("Unable to sign out. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="admin-signout-wrap">
      <button className="admin-signout" type="button" onClick={handleSignOut} disabled={busy}>
        ↪ <span>{busy ? "Signing out…" : "Logout"}</span>
      </button>
      {errorMessage && <span className="admin-signout-error" role="alert">{errorMessage}</span>}
    </div>
  );
}
