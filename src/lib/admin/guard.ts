import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// =============================================================================
// Admin gate. The chatbot admin panel is protected by membership in
// public.admin_users. We read the logged-in user from the Supabase session
// (anon client) and check membership using the service-role client, since the
// admin_users table is locked by RLS.
// =============================================================================

export type AdminRole = "owner" | "admin" | "editor" | "operator" | "viewer";

export interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
  userId: string;
}

/** Returns the admin record for the current session, or null if not an admin. */
export async function getAdminUser(): Promise<AdminUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("admin_users")
    .select("id, email, role")
    .eq("email", user.email.toLowerCase())
    .maybeSingle();

  if (error || !data) return null;
  return {
    id: data.id,
    email: data.email,
    role: data.role as AdminRole,
    userId: user.id,
  };
}

/** Record an admin action in the audit log (best-effort). */
export async function logAudit(
  admin: AdminUser,
  action: string,
  target?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const client = createAdminClient();
  await client.from("audit_log").insert({
    admin_user_id: admin.id,
    admin_email: admin.email,
    action,
    target: target ?? null,
    metadata: metadata ?? {},
  });
}
