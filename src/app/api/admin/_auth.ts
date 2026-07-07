import { getAdminUser, type AdminUser } from "@/lib/admin/guard";

// =============================================================================
// Shared guard for admin route handlers. Returns the admin user, or a 401/403
// Response to return directly from the handler.
// =============================================================================

export async function requireAdmin(): Promise<
  { admin: AdminUser } | { response: Response }
> {
  const admin = await getAdminUser();
  if (!admin) {
    return {
      response: Response.json(
        { error: "unauthorized" },
        { status: 401 }
      ),
    };
  }
  return { admin };
}
