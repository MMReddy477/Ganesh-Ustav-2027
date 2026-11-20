import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminAuthAuditAction = "LOGIN" | "LOGOUT" | "FAILED_LOGIN";

export async function logAdminAuthEvent(
  supabase: SupabaseClient,
  action: AdminAuthAuditAction,
): Promise<void> {
  try {
    const { error } = await supabase.rpc("log_admin_auth_event", { p_action: action });
    if (error) console.error(`Could not record admin auth event (${action}):`, error.message);
  } catch (error) {
    console.error(`Could not record admin auth event (${action}):`, error);
  }
}
