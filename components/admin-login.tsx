"use client";

import Image from "next/image";
import { ArrowLeft, Eye, EyeOff, KeyRound, LoaderCircle, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { logAdminAuthEvent } from "@/lib/supabase/audit";
import { createClient } from "@/lib/supabase/client";

const rememberedEmailKey = "utsav-admin-remembered-email";
const invalidEmailMessage = "Please enter a valid email address.";

function getAuthErrorMessage(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  const name = error instanceof Error ? error.name.toLowerCase() : "";
  const status = typeof error === "object" && error !== null && "status" in error && typeof error.status === "number"
    ? error.status
    : undefined;
  const code = typeof error === "object" && error !== null && "code" in error && typeof error.code === "string"
    ? error.code.toLowerCase()
    : "";

  if (/supabase is not configured|supabase configuration missing/.test(message)) {
    return "Supabase is not configured. Please contact the administrator.";
  }
  if (status === 429 || /rate.?limit|too many|over_request_rate_limit|locked/.test(`${message} ${code}`)) {
    return "Too many failed attempts. Please try again later.";
  }
  if (/invalid login credentials|invalid credentials|invalid_credentials/.test(`${message} ${code}`)) {
    return "Invalid email or password.";
  }
  if (error instanceof TypeError || /network|fetch|timeout|connection/.test(`${message} ${name}`)) {
    return fallback;
  }
  return fallback;
}

export function AdminLogin({
  accessDenied = false,
  roleCheckFailed = false,
  nextPath = "/admin",
}: {
  accessDenied?: boolean;
  roleCheckFailed?: boolean;
  nextPath?: string;
}) {
  const router = useRouter();
  const isSupabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [errorMessage, setErrorMessage] = useState(
    accessDenied
      ? "You do not have permission to access the Committee Portal."
      : roleCheckFailed
        ? "Unable to verify your Committee Portal access. Please contact the administrator."
        : "",
  );
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [existingSession, setExistingSession] = useState(false);
  const [signOutLoading, setSignOutLoading] = useState(false);

  useEffect(() => {
    try {
      const rememberedEmail = window.localStorage.getItem(rememberedEmailKey);
      if (rememberedEmail) {
        setEmail(rememberedEmail);
        setRememberMe(true);
      }
    } catch (error) {
      console.error("Could not load remembered committee email:", error);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || (!accessDenied && !roleCheckFailed)) return;
    let active = true;
    const supabase = createClient();
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) console.error("Could not check the existing committee session:", error);
      else setExistingSession(Boolean(data.session));
    }).catch((error: unknown) => {
      if (active) console.error("Could not check the existing committee session:", error);
    });
    return () => {
      active = false;
    };
  }, [accessDenied, isSupabaseConfigured, roleCheckFailed]);

  function rememberEmail(value: string) {
    try {
      if (rememberMe) window.localStorage.setItem(rememberedEmailKey, value);
      else window.localStorage.removeItem(rememberedEmailKey);
    } catch (error) {
      console.error("Could not update remembered committee email:", error);
    }
  }

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    if (loading) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const trimmedEmail = email.trim();
    const password = String(formData.get("password") || "");
    const nextFieldErrors: { email?: string; password?: string } = {};

    if (!trimmedEmail) nextFieldErrors.email = "Please enter your email address.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) nextFieldErrors.email = invalidEmailMessage;
    if (!password) nextFieldErrors.password = "Please enter your password.";
    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length) {
      if (nextFieldErrors.email) emailInputRef.current?.focus();
      else passwordInputRef.current?.focus();
      return;
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setErrorMessage("Supabase is not configured. Please contact the administrator.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email: trimmedEmail, password });
      if (error) {
        await logAdminAuthEvent(supabase, "FAILED_LOGIN");
        throw error;
      }

      await logAdminAuthEvent(supabase, "LOGIN");
      rememberEmail(trimmedEmail);
      router.replace(nextPath);
      router.refresh();
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error, "Unable to sign in. Please try again."));
      if (passwordInputRef.current) passwordInputRef.current.value = "";
    } finally {
      setLoading(false);
    }
  }

  async function signOutExistingSession() {
    if (signOutLoading) return;
    setSignOutLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const supabase = createClient();
      await logAdminAuthEvent(supabase, "LOGOUT");
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setExistingSession(false);
      setSuccessMessage("You have been signed out.");
    } catch (error) {
      console.error("Could not sign out the existing committee session:", error);
      setErrorMessage("Unable to sign out. Please try again.");
    } finally {
      setSignOutLoading(false);
    }
  }

  async function sendPasswordReset() {
    setErrorMessage("");
    setSuccessMessage("");
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setFieldErrors((current) => ({ ...current, email: "Please enter your email address." }));
      emailInputRef.current?.focus();
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setFieldErrors((current) => ({ ...current, email: invalidEmailMessage }));
      emailInputRef.current?.focus();
      return;
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setErrorMessage("Supabase is not configured. Please contact the administrator.");
      return;
    }

    setResetLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: `${window.location.origin}/admin/reset-password`,
      });
      if (error) throw error;
      setSuccessMessage("If an account exists for this email, password reset instructions have been sent.");
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error, "Unable to send a password reset email. Please try again."));
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <main className="admin-login-page">
      <div className="admin-login-glow admin-login-glow-one" aria-hidden="true" />
      <div className="admin-login-glow admin-login-glow-two" aria-hidden="true" />
      <section className="admin-login-card" aria-labelledby="admin-login-title">
        <div className="admin-login-brand">
          <Image src="/images/ganesh-logo.png" alt="" width={58} height={58} priority />
          <span><strong>SURYODAYA COLONY</strong><small>GANESH UTSAV · 2027</small></span>
        </div>
        <div className="admin-login-rule"><span /></div>
        <p className="admin-login-kicker"><ShieldCheck size={14} /> SECURE COMMITTEE ACCESS</p>
        <h1 id="admin-login-title">Committee <em>Portal</em></h1>
        <p className="admin-login-intro">A private space for the people bringing our community celebration to life.</p>

        <form className="admin-login-form" onSubmit={signIn} noValidate>
          <div className="admin-login-field">
            <label htmlFor="admin-email">Email</label>
            <div className={`admin-login-input-wrap${fieldErrors.email ? " has-error" : ""}`}>
              <Mail size={17} aria-hidden="true" />
              <input
                ref={emailInputRef}
                id="admin-email"
                name="email"
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="Enter your committee email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setFieldErrors((current) => ({ ...current, email: undefined }));
                  setErrorMessage("");
                  setSuccessMessage("");
                }}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? "admin-email-error" : undefined}
                required
              />
            </div>
            {fieldErrors.email && <p className="admin-login-field-error" id="admin-email-error">{fieldErrors.email}</p>}
          </div>

          <div className="admin-login-field">
            <label htmlFor="admin-password">Password</label>
            <div className={`admin-login-input-wrap${fieldErrors.password ? " has-error" : ""}`}>
              <LockKeyhole size={17} aria-hidden="true" />
              <input
                ref={passwordInputRef}
                id="admin-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                onChange={() => {
                  setFieldErrors((current) => ({ ...current, password: undefined }));
                  setErrorMessage("");
                }}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? "admin-password-error" : undefined}
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
            {fieldErrors.password && <p className="admin-login-field-error" id="admin-password-error">{fieldErrors.password}</p>}
          </div>

          <div className="admin-login-form-utilities">
            <label className="admin-login-remember">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => {
                  setRememberMe(event.target.checked);
                  if (!event.target.checked) {
                    try {
                      window.localStorage.removeItem(rememberedEmailKey);
                    } catch (error) {
                      console.error("Could not clear remembered committee email:", error);
                    }
                  }
                }}
              />
              <span className="admin-login-checkmark" aria-hidden="true" />
              <span>Remember Me <small>email only</small></span>
            </label>
            <button className="admin-login-forgot" type="button" onClick={sendPasswordReset} disabled={resetLoading || loading || !isSupabaseConfigured}>
              {resetLoading ? "Sending..." : "Forgot Password?"}
            </button>
          </div>

          {!isSupabaseConfigured && (
            <p className="admin-login-error" role="alert">Supabase is not configured. Please contact the administrator.</p>
          )}
          {errorMessage && <p className="admin-login-error" role="alert">{errorMessage}</p>}
          {successMessage && <p className="admin-login-success" role="status">{successMessage}</p>}
          {existingSession && (
            <button
              className="admin-login-forgot admin-login-session-signout"
              type="button"
              onClick={signOutExistingSession}
              disabled={signOutLoading || loading || resetLoading}
            >
              {signOutLoading ? "Signing out..." : "Sign out of the existing session"}
            </button>
          )}
          <button className="admin-login-submit" type="submit" disabled={loading || resetLoading || !isSupabaseConfigured} aria-busy={loading}>
            {loading ? <LoaderCircle size={17} className="admin-login-spinner" /> : <KeyRound size={16} />}
            {loading ? "Signing in securely..." : "Secure Login"}
          </button>
        </form>

        <p className="admin-login-authorization">Authorized committee members only</p>
        <Link href="/" className="admin-back-link"><ArrowLeft size={15} /> Return to the celebration</Link>
      </section>
    </main>
  );
}
