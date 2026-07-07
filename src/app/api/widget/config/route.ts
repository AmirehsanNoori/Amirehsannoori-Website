import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// GET /api/widget/config — public widget appearance (no auth; read-only).
export async function GET() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("widget_config")
    .select("primary_color, position, welcome_message, is_enabled")
    .limit(1)
    .maybeSingle();

  return Response.json(
    data ?? {
      primary_color: "#2563eb",
      position: "bottom-right",
      welcome_message: "سلام! چطور می‌تونم کمکتون کنم؟",
      is_enabled: true,
    }
  );
}
