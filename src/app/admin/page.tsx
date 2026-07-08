import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { estimateCostUsd } from "@/lib/brain/pricing";

export const dynamic = "force-dynamic";

async function count(table: string): Promise<number> {
  const supabase = createAdminClient();
  const { count } = await supabase.from(table).select("id", { count: "exact", head: true });
  return count ?? 0;
}

export default async function AdminHome() {
  const supabase = createAdminClient();

  const [docs, chunks, conversations, leads] = await Promise.all([
    count("documents"),
    count("chunks"),
    count("conversations"),
    count("leads"),
  ]);

  // Channel breakdown
  const { data: convByChannel } = await supabase.from("conversations").select("channel");
  const channelCounts: Record<string, number> = {};
  for (const c of convByChannel ?? []) {
    channelCounts[c.channel] = (channelCounts[c.channel] ?? 0) + 1;
  }

  // Token usage + cost, grouped by model
  const { data: assistantMsgs } = await supabase
    .from("messages")
    .select("model_used, tokens_in, tokens_out")
    .eq("role", "assistant")
    .not("model_used", "is", null);

  const usageByModel: Record<string, { tokensIn: number; tokensOut: number }> = {};
  let totalTokensIn = 0;
  let totalTokensOut = 0;
  for (const m of assistantMsgs ?? []) {
    const model = m.model_used as string;
    const entry = (usageByModel[model] ??= { tokensIn: 0, tokensOut: 0 });
    entry.tokensIn += m.tokens_in ?? 0;
    entry.tokensOut += m.tokens_out ?? 0;
    totalTokensIn += m.tokens_in ?? 0;
    totalTokensOut += m.tokens_out ?? 0;
  }
  const { totalUsd, byModel } = await estimateCostUsd(usageByModel);

  // Satisfaction
  const { data: feedbackRows } = await supabase.from("feedback").select("rating");
  const positive = (feedbackRows ?? []).filter((f) => f.rating === 1).length;
  const negative = (feedbackRows ?? []).filter((f) => f.rating === -1).length;
  const satisfactionPct =
    positive + negative > 0 ? Math.round((positive / (positive + negative)) * 100) : null;

  // Conversion: chatbot-sourced leads / conversations
  const { count: chatbotLeads } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .like("source", "chatbot_%");
  const conversionPct =
    conversations > 0 ? Math.round(((chatbotLeads ?? 0) / conversations) * 100) : 0;

  const stats = [
    { label: "اسناد دانش", value: docs, href: "/admin/knowledge" },
    { label: "قطعه‌ها (chunks)", value: chunks, href: "/admin/knowledge" },
    { label: "گفتگوها", value: conversations, href: "/admin/conversations" },
    { label: "لیدها", value: leads, href: "/admin/leads" },
  ];

  const channelLabel: Record<string, string> = {
    web: "صفحهٔ کامل",
    widget: "ویجت",
    telegram: "تلگرام",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">داشبورد</h1>
      <p className="mt-1 text-sm text-muted">نمای کلی دستیار هوش مصنوعی</p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-xl border border-border bg-surface p-5 transition-colors hover:border-brand-blue"
          >
            <div className="text-3xl font-bold">{s.value.toLocaleString("fa-IR")}</div>
            <div className="mt-1 text-sm text-muted">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {/* Channel breakdown */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold text-muted">گفتگو به تفکیک کانال</h2>
          <div className="mt-3 space-y-2">
            {Object.entries(channelCounts).length === 0 && (
              <p className="text-sm text-muted">هنوز گفتگویی نیست.</p>
            )}
            {Object.entries(channelCounts).map(([ch, n]) => (
              <div key={ch} className="flex items-center justify-between text-sm">
                <span>{channelLabel[ch] ?? ch}</span>
                <span className="font-medium">{n.toLocaleString("fa-IR")}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Conversion + satisfaction */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold text-muted">نرخ تبدیل و رضایت</h2>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>نرخ تبدیل به لید</span>
              <span className="font-medium">{conversionPct}٪</span>
            </div>
            <div className="flex items-center justify-between">
              <span>رضایت (👍 از کل بازخورد)</span>
              <span className="font-medium">
                {satisfactionPct == null ? "—" : `${satisfactionPct}٪`}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>بازخورد ثبت‌شده</span>
              <span className="font-medium">{(positive + negative).toLocaleString("fa-IR")}</span>
            </div>
          </div>
        </div>

        {/* Token cost */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold text-muted">مصرف توکن و هزینه (تخمینی)</h2>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>ورودی / خروجی</span>
              <span className="font-medium" dir="ltr">
                {totalTokensIn.toLocaleString("en-US")} / {totalTokensOut.toLocaleString("en-US")}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-2">
              <span>هزینهٔ کل</span>
              <span className="font-medium" dir="ltr">
                ${totalUsd.toFixed(4)}
              </span>
            </div>
            {Object.entries(byModel).map(([model, cost]) => (
              <div key={model} className="flex items-center justify-between text-xs text-muted">
                <span dir="ltr">{model}</span>
                <span dir="ltr">${cost.toFixed(4)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold">شروع سریع</h2>
        <ol className="mt-3 list-inside list-decimal space-y-2 text-sm text-muted">
          <li>در «پایگاه دانش» چند سند (PDF/متن/URL) آپلود کنید تا ایندکس شوند.</li>
          <li>در «مدل و Embedding» مدل پاسخ و تنظیمات بازیابی را تنظیم کنید.</li>
          <li>در «پرسونا» لحن و قوانین دستیار را ویرایش کنید.</li>
          <li>
            صفحهٔ چت را در{" "}
            <Link href="/fa/consultant" className="text-brand-blue hover:underline">
              /fa/consultant
            </Link>{" "}
            امتحان کنید.
          </li>
        </ol>
      </div>
    </div>
  );
}
