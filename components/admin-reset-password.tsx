"use client";

import Image from "next/image";
import { ArrowLeft, Eye, EyeOff, LoaderCircle, LockKeyhole, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export function AdminResetPassword() {
  const router = useRouter();
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [checkingLink, setCheckingLink] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setErrorMessage("Supabase is not configured. Please contact the administrator.");
      setCheckingLink(false);
      return;
    }

    const supabase = createClient();
    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (active && event === "PASSWORD_RECOVERY" && session) setRecoveryReady(true);
    });

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        setErrorMessage("This password reset link is invalid or has expired. Request a new one.");
      } else if (data.session) {
        setRecoveryReady(true);
      } else {
        setErrorMessage("This password reset link is invalid or has expired. Request a new one.");
      }
      setCheckingLink(false);
    }).catch((error: unknown) => {
      if (!active) return;
      console.error("Could not validate the committee password reset link:", error);
      setErrorMessage("Unable to verify this reset link. Please request a new one.");
      setCheckingLink(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    if (busy) return;
    if (password.length < 8) {
      setErrorMessage("Use a password with at least 8 characters.");
      return;
    }
    if (password !== confirmation) {
      setErrorMessage("The passwords do not match.");
      return;
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setErrorMessage("Supabase is not configured. Please contact the administrator.");
      return;
    }

    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccessMessage("Your password has been updated. Redirecting to the Committee Portal…");
      window.setTimeout(() => router.replace("/admin"), 900);
    } catch (error) {
      console.error("Could not update the committee password:", error);
      setErrorMessage(error instanceof Error && /password/i.test(error.message)
        ? "Use a stronger password and try again."
        : "Unable to update your password. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="admin-login-page">
      <div className="admin-login-glow admin-login-glow-one" aria-hidden="true" />
      <div className="admin-login-glow admin-login-glow-two" aria-hidden="true" />
      <section className="admin-login-card" aria-labelledby="admin-reset-title">
        <div className="admin-login-brand">
          <Image src="/images/ganesh-logo.png" alt="" width={58} height={58} priority />
          <span><strong>SURYODAYA COLONY</strong><small>GANESH UTSAV · 2027</small></span>
        </div>
        <div className="admin-login-rule"><span /></div>
        <p className="admin-login-kicker"><ShieldCheck size={14} /> SECURE COMMITTEE ACCESS</p>
        <h1 id="admin-reset-title">Reset <em>Password</em></h1>
        <p className="admin-login-intro">Choose a new password for your Committee Portal account.</p>

        {checkingLink ? (
          <p className="admin-login-status" role="status"><LoaderCircle size={16} className="admin-login-spinner" /> Verifying your secure reset link…</p>
        ) : recoveryReady ? (
          <form className="admin-login-form" onSubmit={updatePassword} noValidate>
            <div className="admin-login-field">
              <label htmlFor="admin-new-password">New password</label>
              <div className="admin-login-input-wrap">
                <LockKeyhole size={17} aria-hidden="true" />
                <input
                  id="admin-new-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  className="admin-login-password-toggle"
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
            <div className="admin-login-field">
              <label htmlFor="admin-confirm-password">Confirm new password</label>
              <div className="admin-login-input-wrap">
                <LockKeyhole size={17} aria-hidden="true" />
                <input
                  id="admin-confirm-password"
                  name="confirmation"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Enter your new password again"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  required
                />
              </div>
            </div>
            {errorMessage && <p className="admin-login-error" role="alert">{errorMessage}</p>}
            {successMessage && <p className="admin-login-success" role="status">{successMessage}</p>}
            <button className="admin-login-submit" type="submit" disabled={busy} aria-busy={busy}>
              {busy ? <LoaderCircle size={17} className="admin-login-spinner" /> : <LockKeyhole size={16} />}
              {busy ? "Updating securely..." : "Update Password"}
            </button>
          </form>
        ) : (
          <p className="admin-login-error" role="alert">{errorMessage}</p>
        )}

        <Link href="/admin/login" className="admin-back-link"><ArrowLeft size={15} /> Return to sign in</Link>
      </section>
    </main>
  );
}
