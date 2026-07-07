import { createAdminClient } from "@/lib/supabase/admin";
import { ChatWindow } from "@/components/chat/ChatWindow";

// Must render per-request: welcome_message is admin-editable and this page
// has no cookies()/auth call to implicitly force dynamic rendering, so without
// this it would statically prerender at build time (stale config, and a hard
// build-time dependency on Supabase env vars being present at build time).
export const dynamic = "force-dynamic";

export default async function WidgetPage() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("widget_config")
    .select("welcome_message")
    .limit(1)
    .maybeSingle();

  return (
    <div className="flex h-dvh flex-col rounded-2xl border border-border bg-background shadow-2xl">
      <div className="brand-gradient flex items-center gap-2 rounded-t-2xl px-4 py-3 text-white">
        <span className="text-sm font-semibold">دستیار هوش مصنوعی امیراحسان نوری</span>
      </div>
      <div className="flex-1 overflow-hidden">
        <ChatWindow
          channel="widget"
          welcomeMessage={data?.welcome_message ?? "سلام! چطور می‌تونم کمکتون کنم؟"}
          compact
        />
      </div>
    </div>
  );
}
